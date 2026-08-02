import { describe, it, expect, beforeEach, vi } from 'vitest';

const get = vi.fn();
vi.mock('@/lib/apiClient', () => ({
  apiClient: {
    get: (...args: unknown[]) => get(...args),
  },
}));

const { prospectStatusService } = await import('./prospectStatusService');

/**
 * The polling contract behind /consult/confirmed.
 *
 * The stakes are asymmetric. Saying "confirmed" too early is a lie the visitor
 * discovers later; saying "failed" when the card was charged sends them to
 * pay twice. The second is much worse, and these tests are mostly about
 * pinning that down.
 */

function status(overrides: Record<string, unknown> = {}) {
  return {
    prospect_id: 'p1',
    human_ref: 'MP-7F3K9A',
    stage: 'pre_screened',
    statutory_eligible: true,
    client_fit: true,
    consult_confirmed: false,
    booking: null,
    ...overrides,
  };
}

beforeEach(() => {
  get.mockReset();
  vi.useRealTimers();
});

describe('get', () => {
  it('sends the reference as the second key', () => {
    get.mockResolvedValue(status());
    return prospectStatusService.get('p1', 'MP-7F3K9A').then(() => {
      expect(get).toHaveBeenCalledWith('/prospects/p1/status', {
        params: { ref: 'MP-7F3K9A' },
      });
    });
  });

  it('url-encodes the id so a malformed one cannot alter the path', () => {
    get.mockResolvedValue(status());
    return prospectStatusService.get('p1/../admin', 'MP-1').then(() => {
      expect(get.mock.calls[0][0]).toBe('/prospects/p1%2F..%2Fadmin/status');
    });
  });

  it('unwraps the { data } envelope the API uses', async () => {
    get.mockResolvedValue({ data: status({ stage: 'booked' }) });
    const result = await prospectStatusService.get('p1', 'MP-1');
    expect(result.stage).toBe('booked');
  });
});

describe('pollUntilConfirmed', () => {
  it('stops on the first attempt when already confirmed', async () => {
    get.mockResolvedValue(status({ consult_confirmed: true }));
    const result = await prospectStatusService.pollUntilConfirmed('p1', 'MP-1');
    expect(result?.consult_confirmed).toBe(true);
    expect(get).toHaveBeenCalledTimes(1);
  });

  it('keeps polling while pending, then resolves once the webhook lands', async () => {
    vi.useFakeTimers();
    get
      .mockResolvedValueOnce(status())
      .mockResolvedValueOnce(status())
      .mockResolvedValueOnce(status({ consult_confirmed: true, stage: 'booked' }));

    const promise = prospectStatusService.pollUntilConfirmed('p1', 'MP-1');
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(get).toHaveBeenCalledTimes(3);
    expect(result?.consult_confirmed).toBe(true);
  });

  it('also accepts a confirmed booking as confirmation', async () => {
    // Two independent signals for the same fact. Trusting only one would
    // leave the page spinning if the other arrived first.
    get.mockResolvedValue(
      status({ booking: { id: 'b1', status: 'confirmed' } }),
    );
    const result = await prospectStatusService.pollUntilConfirmed('p1', 'MP-1');
    expect(result?.booking?.status).toBe('confirmed');
    expect(get).toHaveBeenCalledTimes(1);
  });

  it('gives up after the attempt budget without throwing', async () => {
    // A timeout is NOT a failed payment. The caller must be able to tell the
    // difference, so this resolves rather than rejects.
    vi.useFakeTimers();
    get.mockResolvedValue(status());

    const promise = prospectStatusService.pollUntilConfirmed('p1', 'MP-1', {
      attempts: 3,
    });
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(get).toHaveBeenCalledTimes(3);
    expect(result?.consult_confirmed).toBe(false);
  });

  it('reports each intermediate status to the caller', async () => {
    vi.useFakeTimers();
    const onUpdate = vi.fn();
    get
      .mockResolvedValueOnce(status())
      .mockResolvedValueOnce(status({ consult_confirmed: true }));

    const promise = prospectStatusService.pollUntilConfirmed('p1', 'MP-1', {
      onUpdate,
    });
    await vi.runAllTimersAsync();
    await promise;

    expect(onUpdate).toHaveBeenCalledTimes(2);
  });

  it('rides out a transient error and still confirms', async () => {
    // A 404 on the first attempt is usually the record not being visible yet,
    // not a wrong reference. Surfacing it immediately would tell someone their
    // booking failed when it did not.
    vi.useFakeTimers();
    get
      .mockRejectedValueOnce(new Error('404'))
      .mockResolvedValueOnce(status({ consult_confirmed: true }));

    const promise = prospectStatusService.pollUntilConfirmed('p1', 'MP-1');
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result?.consult_confirmed).toBe(true);
  });

  it('throws only if the very last attempt also fails', async () => {
    vi.useFakeTimers();
    get.mockRejectedValue(new Error('boom'));

    const promise = prospectStatusService.pollUntilConfirmed('p1', 'MP-1', {
      attempts: 2,
    });
    const assertion = expect(promise).rejects.toThrow('boom');
    await vi.runAllTimersAsync();
    await assertion;
  });

  it('backs off instead of hammering a rate-limited endpoint', async () => {
    vi.useFakeTimers();
    get.mockResolvedValue(status());
    const promise = prospectStatusService.pollUntilConfirmed('p1', 'MP-1', {
      attempts: 3,
    });

    // First call is immediate.
    await vi.advanceTimersByTimeAsync(0);
    expect(get).toHaveBeenCalledTimes(1);

    // Second waits ~1s, not zero. A tight loop would lock the visitor out of
    // their own status page via the endpoint's throttle.
    await vi.advanceTimersByTimeAsync(999);
    expect(get).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(2);
    expect(get).toHaveBeenCalledTimes(2);

    await vi.runAllTimersAsync();
    await promise;
  });

  it('does not sleep after the final attempt', async () => {
    // Regression: the loop used to run its backoff after the last check too,
    // leaving the visitor on a spinner for several seconds with nothing left
    // to wait for.
    vi.useFakeTimers();
    get.mockResolvedValue(status());

    const promise = prospectStatusService.pollUntilConfirmed('p1', 'MP-1', {
      attempts: 2,
    });

    // Attempt 1, one 1s backoff, attempt 2 — and then it should be done,
    // without burning the second backoff.
    await vi.advanceTimersByTimeAsync(1001);
    expect(get).toHaveBeenCalledTimes(2);

    await expect(promise).resolves.not.toBeUndefined();
  });

  it('stops early when the caller aborts', async () => {
    vi.useFakeTimers();
    const controller = new AbortController();
    get.mockImplementation(async () => {
      controller.abort();
      return status();
    });

    const promise = prospectStatusService.pollUntilConfirmed('p1', 'MP-1', {
      signal: controller.signal,
    });
    await vi.runAllTimersAsync();
    await promise;

    // Unmounting the page must not leave a poll loop running behind it.
    expect(get).toHaveBeenCalledTimes(1);
  });
});
