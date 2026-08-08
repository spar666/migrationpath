import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const pollUntilConfirmed = vi.fn();
vi.mock('@/services/prospectStatusService', () => ({
  prospectStatusService: {
    pollUntilConfirmed: (...args: unknown[]) => pollUntilConfirmed(...args),
  },
  // Mocking a module replaces ALL of its exports, so anything the page imports
  // has to be listed here — a missing one is `undefined` at the call site and
  // throws inside the very error handler it belongs to.
  isUnknownProspect: (error: unknown) =>
    (error as { status?: number })?.status === 404,
}));

const navigate = vi.fn();
vi.mock('react-router-dom', async () => ({
  ...(await vi.importActual<typeof import('react-router-dom')>(
    'react-router-dom',
  )),
  useNavigate: () => navigate,
}));

const clearProspectSession = vi.fn();
vi.mock('@/lib/prospectSession', async () => ({
  ...(await vi.importActual<typeof import('@/lib/prospectSession')>(
    '@/lib/prospectSession',
  )),
  clearProspectSession: () => clearProspectSession(),
}));

const ConsultConfirmed = (await import('./ConsultConfirmed')).default;

/**
 * The page Stripe returns people to.
 *
 * Arriving here proves only that a browser navigated. The booking confirms
 * when Stripe's webhook reaches the backend, which trails the redirect. So the
 * page must never congratulate on arrival, and — much more importantly — must
 * never tell someone their payment failed, because the recovery action they
 * would take is to pay a second time.
 */

function landOn(search: string) {
  window.history.replaceState({}, '', `/consult/confirmed${search}`);
  return render(
    <MemoryRouter>
      <ConsultConfirmed />
    </MemoryRouter>,
  );
}

function status(overrides: Record<string, unknown> = {}) {
  return {
    prospect_id: 'p1',
    human_ref: 'MP-7F3K9A',
    stage: 'booked',
    statutory_eligible: true,
    client_fit: true,
    consult_confirmed: true,
    booking: null,
    ...overrides,
  };
}

beforeEach(() => {
  pollUntilConfirmed.mockReset();
  navigate.mockReset();
});

describe('on arrival', () => {
  it('does NOT announce success before the webhook has landed', async () => {
    // Never-resolving poll: this is the state the page opens in.
    pollUntilConfirmed.mockReturnValue(new Promise(() => {}));
    landOn('?prospect_id=p1&ref=MP-7F3K9A');

    expect(screen.getByText(/confirming your booking/i)).toBeInTheDocument();
    expect(screen.queryByText(/you’re booked in/i)).not.toBeInTheDocument();
  });

  it('reassures that leaving the page is safe', async () => {
    pollUntilConfirmed.mockReturnValue(new Promise(() => {}));
    landOn('?prospect_id=p1&ref=MP-7F3K9A');
    expect(screen.getByText(/you can leave this page/i)).toBeInTheDocument();
  });
});

describe('once confirmed', () => {
  it('reports success and shows the slot', async () => {
    pollUntilConfirmed.mockResolvedValue(
      status({
        booking: {
          id: 'b1',
          status: 'confirmed',
          scheduled_at: '2026-08-01T02:00:00.000Z',
          join_url: 'https://meet.example/abc',
          reschedule_url: 'https://calendly.com/reschedule/abc',
        },
      }),
    );

    landOn('?prospect_id=p1&ref=MP-7F3K9A');

    expect(await screen.findByText(/you’re booked in/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /join link/i })).toHaveAttribute(
      'href',
      'https://meet.example/abc',
    );
    expect(screen.getByRole('link', { name: /reschedule/i })).toBeInTheDocument();
  });

  it('confirms without a slot time rather than rendering "Invalid Date"', async () => {
    // Calendly does not always give us a time on the first webhook.
    pollUntilConfirmed.mockResolvedValue(
      status({ booking: { id: 'b1', status: 'confirmed', scheduled_at: null } }),
    );

    landOn('?prospect_id=p1&ref=MP-7F3K9A');

    expect(await screen.findByText(/you’re booked in/i)).toBeInTheDocument();
    expect(screen.queryByText(/invalid date/i)).not.toBeInTheDocument();
  });

  it('survives a malformed timestamp', async () => {
    pollUntilConfirmed.mockResolvedValue(
      status({ booking: { id: 'b1', status: 'confirmed', scheduled_at: 'garbage' } }),
    );

    landOn('?prospect_id=p1&ref=MP-7F3K9A');

    expect(await screen.findByText(/you’re booked in/i)).toBeInTheDocument();
    expect(screen.queryByText(/invalid date/i)).not.toBeInTheDocument();
  });
});

describe('when confirmation times out', () => {
  it('never says the payment failed', async () => {
    // The single most damaging sentence this page could produce.
    pollUntilConfirmed.mockResolvedValue(status({ consult_confirmed: false }));
    landOn('?prospect_id=p1&ref=MP-7F3K9A');

    expect(
      await screen.findByText(/taking a little longer than usual/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/failed|declined|unsuccessful/i)).toBeNull();
  });

  it('tells the visitor explicitly not to pay again', async () => {
    pollUntilConfirmed.mockResolvedValue(status({ consult_confirmed: false }));
    landOn('?prospect_id=p1&ref=MP-7F3K9A');
    expect(await screen.findByText(/do not pay again/i)).toBeInTheDocument();
  });

  it('treats a thrown error the same way, not as a failure', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    pollUntilConfirmed.mockRejectedValue(new Error('network'));

    landOn('?prospect_id=p1&ref=MP-7F3K9A');

    expect(
      await screen.findByText(/taking a little longer than usual/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/failed|declined/i)).toBeNull();
  });

  /**
   * A 404 is not a slow webhook, and must not be dressed up as one.
   *
   * The status endpoint is double-keyed, so a 404 means this id and reference
   * are not a pair the server recognises — almost always a localStorage session
   * that outlived the record it pointed at. Telling that visitor their booking
   * "will confirm shortly" is false: nothing is in flight and nothing will be.
   */
  it('says the reference is unknown rather than pretending to wait', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    pollUntilConfirmed.mockRejectedValue(
      Object.assign(new Error('Prospect not found'), { status: 404 }),
    );

    landOn('?prospect_id=p1&ref=MP-STALE');

    await waitFor(() =>
      expect(
        screen.queryByText(/taking a little longer than usual/i),
      ).toBeNull(),
    );
  });

  it('drops the dead session so it stops following them around', async () => {
    // Otherwise the stale reference is presented on every visit for the rest
    // of its seven-day TTL.
    vi.spyOn(console, 'error').mockImplementation(() => {});
    pollUntilConfirmed.mockRejectedValue(
      Object.assign(new Error('Prospect not found'), { status: 404 }),
    );

    landOn('?prospect_id=p1&ref=MP-STALE');

    await waitFor(() => expect(clearProspectSession).toHaveBeenCalled());
  });
});

describe('when the visitor cannot be identified', () => {
  it('points at the confirmation email instead of claiming anything', async () => {
    landOn('');
    expect(
      await screen.findByText(/check your email for confirmation/i),
    ).toBeInTheDocument();
    expect(pollUntilConfirmed).not.toHaveBeenCalled();
  });

  it('does not poll with only half an identity', async () => {
    // The endpoint is double-keyed; calling it with one key just burns the
    // rate limit.
    landOn('?prospect_id=p1');
    await waitFor(() => expect(pollUntilConfirmed).not.toHaveBeenCalled());
  });
});

describe('the reference', () => {
  it('is shown whenever we have one', async () => {
    pollUntilConfirmed.mockResolvedValue(status());
    landOn('?prospect_id=p1&ref=MP-7F3K9A');
    expect(await screen.findByText('MP-7F3K9A')).toBeInTheDocument();
  });
});

describe('returning to the landing page', () => {
  it('sends a confirmed booking home, but not instantly', async () => {
    // The delay is the point. Redirecting the moment the webhook lands would
    // yank the slot, the join link and the reference off the screen before
    // anyone could read them.
    pollUntilConfirmed.mockResolvedValue(
      status({
        booking: {
          id: 'b1',
          status: 'confirmed',
          scheduled_at: '2026-08-01T02:00:00.000Z',
          join_url: 'https://meet.example/abc',
          reschedule_url: null,
        },
      }),
    );

    landOn('?prospect_id=p1&ref=MP-7F3K9A');
    await screen.findByText(/you’re booked in/i);
    expect(navigate).not.toHaveBeenCalled();

    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/', { replace: true }), {
      timeout: 12_000,
    });
  }, 15_000);

  it('leaves an unconfirmed visitor where they are', async () => {
    // 'pending' is the screen that says "contact us and quote your reference".
    // Navigating away from it would take the reference with it.
    pollUntilConfirmed.mockResolvedValue(status({ consult_confirmed: false }));

    landOn('?prospect_id=p1&ref=MP-7F3K9A');
    await screen.findByText(/taking a little longer than usual/i);

    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(navigate).not.toHaveBeenCalled();
  });
});
