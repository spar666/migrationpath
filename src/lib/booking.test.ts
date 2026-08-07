import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const post = vi.fn();
vi.mock('@/lib/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: (...args: unknown[]) => post(...args),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

const CALENDLY = 'https://calendly.com/migrationpath/consult';

/**
 * The book-then-pay funnel.
 *
 * Two invariants here are worth more than the rest of this file put together:
 *
 *   1. The prospect id must ride out on `utm_content`. It is the only query
 *      field Calendly echoes back in the invitee webhook, and the webhook is
 *      where a booking gets attached to a person. Drop it and bookings arrive
 *      orphaned — recoverable only by hand, by matching email addresses.
 *   2. No amount may be sent to the checkout endpoint. The consult fee is
 *      fixed server-side from a Stripe Price id; if the client could name a
 *      price, a consult could be bought for a cent.
 *
 * `VITE_CALENDLY_CONSULT_URL` is read once at module load, so each block here
 * stubs the env and then dynamically imports a fresh copy of the module.
 */

async function loadBooking(calendlyUrl: string | undefined) {
  vi.resetModules();
  if (calendlyUrl === undefined) {
    vi.stubEnv('VITE_CALENDLY_CONSULT_URL', '');
  } else {
    vi.stubEnv('VITE_CALENDLY_CONSULT_URL', calendlyUrl);
  }
  return import('./booking');
}

let openSpy: ReturnType<typeof vi.fn>;
let assignSpy: ReturnType<typeof vi.fn>;

beforeEach(() => {
  post.mockReset();
  openSpy = vi.fn();
  assignSpy = vi.fn();
  vi.stubGlobal('open', openSpy);
  Object.defineProperty(window, 'location', {
    configurable: true,
    writable: true,
    value: { assign: assignSpy, search: '', href: 'http://localhost/' },
  });
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

/** The URL passed to window.open, parsed. */
function openedUrl(): URL {
  return new URL(openSpy.mock.calls[0][0] as string);
}

describe('openScheduler', () => {
  it('attaches the prospect id as utm_content', async () => {
    const { openScheduler } = await loadBooking(CALENDLY);

    openScheduler({ prospectId: 'prs_123' });

    expect(openedUrl().searchParams.get('utm_content')).toBe('prs_123');
  });

  it('keeps the configured Calendly origin and path', async () => {
    const { openScheduler } = await loadBooking(CALENDLY);

    openScheduler({ prospectId: 'prs_123' });

    const url = openedUrl();
    expect(url.origin).toBe('https://calendly.com');
    expect(url.pathname).toBe('/migrationpath/consult');
  });

  it('passes the human reference as utm_campaign for reconciliation', async () => {
    const { openScheduler } = await loadBooking(CALENDLY);

    openScheduler({ prospectId: 'prs_123', humanRef: 'MP-7F3K9A' });

    expect(openedUrl().searchParams.get('utm_campaign')).toBe('MP-7F3K9A');
  });

  it('omits utm_campaign when there is no human reference', async () => {
    const { openScheduler } = await loadBooking(CALENDLY);

    openScheduler({ prospectId: 'prs_123' });

    expect(openedUrl().searchParams.has('utm_campaign')).toBe(false);
  });

  it('tags the source and medium so bookings are attributable', async () => {
    const { openScheduler } = await loadBooking(CALENDLY);

    openScheduler({ prospectId: 'prs_123' });

    const url = openedUrl();
    expect(url.searchParams.get('utm_source')).toBe('migrationpath');
    expect(url.searchParams.get('utm_medium')).toBe('pre_screen');
  });

  it('prefills name and email so the invitee record matches the prospect', async () => {
    const { openScheduler } = await loadBooking(CALENDLY);

    openScheduler({
      prospectId: 'prs_123',
      name: 'Mina Rahimi',
      email: 'mina@example.com',
    });

    const url = openedUrl();
    expect(url.searchParams.get('name')).toBe('Mina Rahimi');
    expect(url.searchParams.get('email')).toBe('mina@example.com');
  });

  it('encodes an email with a plus tag rather than corrupting it', async () => {
    const { openScheduler } = await loadBooking(CALENDLY);

    openScheduler({ prospectId: 'prs_123', email: 'mina+visa@example.com' });

    // Round-tripping through URL is what matters: a raw '+' in a query string
    // decodes as a space and the invitee email stops matching.
    expect(openedUrl().searchParams.get('email')).toBe('mina+visa@example.com');
  });

  it('omits name and email when they were not collected', async () => {
    const { openScheduler } = await loadBooking(CALENDLY);

    openScheduler({ prospectId: 'prs_123' });

    const url = openedUrl();
    expect(url.searchParams.has('name')).toBe(false);
    expect(url.searchParams.has('email')).toBe(false);
  });

  it('opens in the same tab by default', async () => {
    const { openScheduler } = await loadBooking(CALENDLY);

    openScheduler({ prospectId: 'prs_123' });

    expect(openSpy.mock.calls[0][1]).toBe('_self');
  });

  it('honours an explicit new-tab target', async () => {
    const { openScheduler } = await loadBooking(CALENDLY);

    openScheduler({ prospectId: 'prs_123', target: '_blank' });

    expect(openSpy.mock.calls[0][1]).toBe('_blank');
  });

  it('preserves query params already present on the configured URL', async () => {
    const { openScheduler } = await loadBooking(`${CALENDLY}?month=2026-02`);

    openScheduler({ prospectId: 'prs_123' });

    const url = openedUrl();
    expect(url.searchParams.get('month')).toBe('2026-02');
    expect(url.searchParams.get('utm_content')).toBe('prs_123');
  });

  it('throws rather than opening an unlinkable booking with no prospect id', async () => {
    const { openScheduler } = await loadBooking(CALENDLY);

    expect(() => openScheduler({ prospectId: '' })).toThrow(/prospect id/i);
    expect(openSpy).not.toHaveBeenCalled();
  });

  it('falls back to the production scheduler when the env var is unset', async () => {
    // An unconfigured env used to throw, which showed the visitor a dead Book
    // button — the most expensive failure in this funnel. It now falls back to
    // the real link, and critically still attaches the prospect id, so the
    // booking is linkable even on a misconfigured deploy.
    const { openScheduler } = await loadBooking(undefined);

    openScheduler({ prospectId: 'prs_123' });

    const url = openedUrl();
    expect(url.hostname).toBe('calendly.com');
    expect(url.searchParams.get('utm_content')).toBe('prs_123');
  });
});

describe('payToConfirmConsultation', () => {
  const SESSION = {
    checkout_url: 'https://checkout.stripe.com/c/pay/cs_test_123',
    payment_id: 'pay_1',
  };

  it('posts to the consultation checkout endpoint', async () => {
    const { payToConfirmConsultation } = await loadBooking(CALENDLY);
    post.mockResolvedValue(SESSION);

    await payToConfirmConsultation('prs_123');

    expect(post.mock.calls[0][0]).toBe('/payments/consultation/checkout');
  });

  it('never sends an amount — the price is fixed server side', async () => {
    const { payToConfirmConsultation } = await loadBooking(CALENDLY);
    post.mockResolvedValue(SESSION);

    await payToConfirmConsultation('prs_123', 'bk_9');

    const body = post.mock.calls[0][1] as Record<string, unknown>;
    expect(body).not.toHaveProperty('amount');
    expect(body).not.toHaveProperty('price');
    expect(body).not.toHaveProperty('currency');
  });

  it('sends the prospect id and purpose', async () => {
    const { payToConfirmConsultation } = await loadBooking(CALENDLY);
    post.mockResolvedValue(SESSION);

    await payToConfirmConsultation('prs_123');

    expect(post.mock.calls[0][1]).toEqual({
      prospect_id: 'prs_123',
      purpose: 'consultation',
    });
  });

  it('includes the booking id when one exists', async () => {
    const { payToConfirmConsultation } = await loadBooking(CALENDLY);
    post.mockResolvedValue(SESSION);

    await payToConfirmConsultation('prs_123', 'bk_9');

    expect(post.mock.calls[0][1]).toEqual({
      prospect_id: 'prs_123',
      booking_id: 'bk_9',
      purpose: 'consultation',
    });
  });

  it('omits booking_id entirely rather than sending undefined', async () => {
    const { payToConfirmConsultation } = await loadBooking(CALENDLY);
    post.mockResolvedValue(SESSION);

    await payToConfirmConsultation('prs_123');

    expect(post.mock.calls[0][1]).not.toHaveProperty('booking_id');
  });

  it('navigates to the hosted checkout URL', async () => {
    const { payToConfirmConsultation } = await loadBooking(CALENDLY);
    post.mockResolvedValue(SESSION);

    await payToConfirmConsultation('prs_123');

    expect(assignSpy).toHaveBeenCalledWith(SESSION.checkout_url);
  });

  it('uses a full navigation, not window.open, so no popup blocker can eat it', async () => {
    const { payToConfirmConsultation } = await loadBooking(CALENDLY);
    post.mockResolvedValue(SESSION);

    await payToConfirmConsultation('prs_123');

    expect(openSpy).not.toHaveBeenCalled();
  });

  it('unwraps a { data } envelope around the session', async () => {
    const { payToConfirmConsultation } = await loadBooking(CALENDLY);
    post.mockResolvedValue({ success: true, data: SESSION });

    await payToConfirmConsultation('prs_123');

    expect(assignSpy).toHaveBeenCalledWith(SESSION.checkout_url);
  });

  it('throws without navigating when no prospect id is given', async () => {
    const { payToConfirmConsultation } = await loadBooking(CALENDLY);

    await expect(payToConfirmConsultation('')).rejects.toThrow(/prospect id/i);
    expect(post).not.toHaveBeenCalled();
  });

  it('throws a retryable message when the session has no checkout URL', async () => {
    const { payToConfirmConsultation } = await loadBooking(CALENDLY);
    post.mockResolvedValue({ payment_id: 'pay_1' });

    await expect(payToConfirmConsultation('prs_123')).rejects.toThrow(
      /try again/i,
    );
    expect(assignSpy).not.toHaveBeenCalled();
  });

  it('throws when the endpoint answers with nothing at all', async () => {
    const { payToConfirmConsultation } = await loadBooking(CALENDLY);
    post.mockResolvedValue(null);

    await expect(payToConfirmConsultation('prs_123')).rejects.toThrow();
    expect(assignSpy).not.toHaveBeenCalled();
  });

  it('does not navigate when the checkout call fails', async () => {
    const { payToConfirmConsultation } = await loadBooking(CALENDLY);
    post.mockRejectedValue(new Error('Server error. Please try again later.'));

    await expect(payToConfirmConsultation('prs_123')).rejects.toThrow(
      /Server error/,
    );
    expect(assignSpy).not.toHaveBeenCalled();
  });
});

describe('getReferenceFromReturnUrl', () => {
  async function withSearch(search: string) {
    const mod = await loadBooking(CALENDLY);
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: { assign: assignSpy, search, href: `http://localhost/${search}` },
    });
    return mod;
  }

  it('reads the ref param from the return URL', async () => {
    const { getReferenceFromReturnUrl } = await withSearch('?ref=MP-7F3K9A');

    expect(getReferenceFromReturnUrl()).toBe('MP-7F3K9A');
  });

  it('returns null when there is no ref', async () => {
    const { getReferenceFromReturnUrl } = await withSearch('?session_id=cs_1');

    expect(getReferenceFromReturnUrl()).toBeNull();
  });

  it('returns null on an empty query string', async () => {
    const { getReferenceFromReturnUrl } = await withSearch('');

    expect(getReferenceFromReturnUrl()).toBeNull();
  });

  it('picks the ref out from among Stripe’s own return params', async () => {
    const { getReferenceFromReturnUrl } = await withSearch(
      '?session_id=cs_test_123&ref=MP-7F3K9A&redirect_status=succeeded',
    );

    expect(getReferenceFromReturnUrl()).toBe('MP-7F3K9A');
  });

  it('decodes a percent-encoded ref', async () => {
    const { getReferenceFromReturnUrl } = await withSearch('?ref=MP%2D7F3K9A');

    expect(getReferenceFromReturnUrl()).toBe('MP-7F3K9A');
  });

  it('returns a ref even when redirect_status suggests failure', async () => {
    // Arriving here is a browser navigation, not proof of payment. The ref is
    // handed back so the page can ask the API what actually happened — which
    // is the whole point of not trusting this URL.
    const { getReferenceFromReturnUrl } = await withSearch(
      '?ref=MP-7F3K9A&redirect_status=failed',
    );

    expect(getReferenceFromReturnUrl()).toBe('MP-7F3K9A');
  });
});
