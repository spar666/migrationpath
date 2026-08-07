import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const payToConfirmConsultation = vi.fn();
vi.mock('@/lib/booking', () => ({
  payToConfirmConsultation: (...a: unknown[]) => payToConfirmConsultation(...a),
}));

const navigate = vi.fn();
vi.mock('react-router-dom', async () => ({
  ...(await vi.importActual<typeof import('react-router-dom')>(
    'react-router-dom',
  )),
  useNavigate: () => navigate,
}));

const get = vi.fn();
const pollUntilBooked = vi.fn();
vi.mock('@/services/prospectStatusService', () => ({
  prospectStatusService: {
    get: (...a: unknown[]) => get(...a),
    // The page polls for the Calendly webhook to land rather than reading
    // once, so the mock has to answer the poll, not the single read.
    pollUntilBooked: (...a: unknown[]) => pollUntilBooked(...a),
  },
}));

const ConsultBook = (await import('./ConsultBook')).default;

/**
 * The pay-to-confirm step, and Stripe's cancel URL.
 *
 * The awkward visitor here is the one who abandoned checkout and came back.
 * They already hold a slot. What they need is the button they walked away
 * from — not an error, and not a second booking.
 */

function landOn(search: string) {
  window.history.replaceState({}, '', `/consult/book${search}`);
  return render(
    <MemoryRouter>
      <ConsultBook />
    </MemoryRouter>,
  );
}

function status(overrides: Record<string, unknown> = {}) {
  return {
    prospect_id: 'p1',
    human_ref: 'MP-7F3K9A',
    stage: 'pre_screened',
    statutory_eligible: true,
    client_fit: true,
    consult_confirmed: false,
    booking: {
      id: 'b1',
      status: 'pending',
      scheduled_at: '2026-08-01T02:00:00.000Z',
    },
    ...overrides,
  };
}

const payButton = () => screen.queryByRole('button', { name: /pay to confirm/i });

beforeEach(() => {
  localStorage.clear();
  payToConfirmConsultation.mockReset();
  navigate.mockReset();
  get.mockReset();
  // Mirrors the real poll's contract: return the status once a booking
  // appears, and swallow read failures by resolving null. Specs drive it
  // through `get`, so a rejection here means "we never found out" rather
  // than "there is definitively no booking" — a distinction the page acts on.
  pollUntilBooked.mockImplementation(async (...a: unknown[]) => {
    try {
      return await get(...a);
    } catch {
      return null;
    }
  });
});

describe('with a held, unpaid booking', () => {
  it('offers the pay button and shows the slot', async () => {
    get.mockResolvedValue(status());
    landOn('?prospect_id=p1&ref=MP-7F3K9A');

    expect(await screen.findByText(/one step left/i)).toBeInTheDocument();
    expect(payButton()).toBeInTheDocument();
  });

  it('sends the booking id so the payment confirms the right slot', async () => {
    get.mockResolvedValue(status());
    landOn('?prospect_id=p1&ref=MP-7F3K9A');

    fireEvent.click(await screen.findByRole('button', { name: /pay to confirm/i }));
    await waitFor(() =>
      expect(payToConfirmConsultation).toHaveBeenCalledWith('p1', 'b1'),
    );
  });

  it('never sends an amount from the client', async () => {
    // The fee lives in Stripe as a Price id. If the client could name it,
    // anyone could book a consultation for a cent.
    get.mockResolvedValue(status());
    landOn('?prospect_id=p1&ref=MP-7F3K9A');

    fireEvent.click(await screen.findByRole('button', { name: /pay to confirm/i }));
    await waitFor(() => expect(payToConfirmConsultation).toHaveBeenCalled());
    const args = JSON.stringify(payToConfirmConsultation.mock.calls[0]);
    expect(args).not.toMatch(/amount|price|\bfee\b/i);
  });
});

describe('returning from an abandoned checkout', () => {
  it('shows the pay button again rather than an error', async () => {
    // This IS the Stripe cancel URL. Scolding them loses the sale.
    get.mockResolvedValue(status());
    landOn('?prospect_id=p1&ref=MP-7F3K9A');

    expect(await screen.findByText(/one step left/i)).toBeInTheDocument();
    expect(screen.queryByText(/error|failed|cancelled/i)).toBeNull();
  });
});

describe('when the status lookup fails', () => {
  it('still lets the visitor pay', async () => {
    // Not being able to read the booking must not block checkout — the
    // backend resolves the booking server-side anyway, and a visitor who
    // cannot pay is a lost sale.
    vi.spyOn(console, 'error').mockImplementation(() => {});
    get.mockRejectedValue(new Error('boom'));
    landOn('?prospect_id=p1&ref=MP-7F3K9A');

    await waitFor(() => expect(payButton()).toBeInTheDocument());
  });

  it('omits the booking id it could not read', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    get.mockRejectedValue(new Error('boom'));
    landOn('?prospect_id=p1&ref=MP-7F3K9A');

    fireEvent.click(await screen.findByRole('button', { name: /pay to confirm/i }));
    await waitFor(() =>
      expect(payToConfirmConsultation).toHaveBeenCalledWith('p1', undefined),
    );
  });
});

describe('when checkout cannot start', () => {
  it('surfaces the reason and re-enables the button', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    get.mockResolvedValue(status());
    payToConfirmConsultation.mockRejectedValue(new Error('stripe down'));

    landOn('?prospect_id=p1&ref=MP-7F3K9A');
    fireEvent.click(await screen.findByRole('button', { name: /pay to confirm/i }));

    expect(await screen.findByText(/stripe down|could not start the payment/i)).toBeInTheDocument();
    await waitFor(() => expect(payButton()).toBeEnabled());
  });
});

describe('when the consultation is already paid for', () => {
  it('does not offer to charge again', async () => {
    // Double-charging is the worst outcome available on this page.
    get.mockResolvedValue(status({ consult_confirmed: true, stage: 'booked' }));
    landOn('?prospect_id=p1&ref=MP-7F3K9A');

    expect(await screen.findByText(/already confirmed/i)).toBeInTheDocument();
    expect(payButton()).not.toBeInTheDocument();
  });

  it('treats a confirmed booking as paid even if the stage lags', async () => {
    get.mockResolvedValue(
      status({ booking: { id: 'b1', status: 'confirmed', scheduled_at: null } }),
    );
    landOn('?prospect_id=p1&ref=MP-7F3K9A');

    expect(await screen.findByText(/already confirmed/i)).toBeInTheDocument();
    expect(payButton()).not.toBeInTheDocument();
  });
});

describe('with no slot booked yet', () => {
  it('offers the scheduler instead of only a pay button', async () => {
    get.mockResolvedValue(status({ booking: null }));
    landOn('?prospect_id=p1&ref=MP-7F3K9A');

    expect(
      await screen.findByRole('button', { name: /choose a time/i }),
    ).toBeInTheDocument();
  });

  it('does not offer to pay for a slot that does not exist', async () => {
    // Checkout needs a booking to attach the payment to and rejects the
    // request without one, so a pay button here has exactly one outcome: an
    // error. Withholding it is the honest version of the same information.
    get.mockResolvedValue(status({ booking: null }));
    landOn('?prospect_id=p1&ref=MP-7F3K9A');

    await screen.findByRole('button', { name: /choose a time/i });
    expect(payButton()).not.toBeInTheDocument();
  });

  it('waits for the webhook before concluding there is no booking', async () => {
    // The booking row is written by Calendly's invitee webhook, which races the
    // visitor's browser. Someone who books and immediately pays can arrive
    // first, and treating that as "no booking" is how they end up being told to
    // choose a time they have already chosen.
    get
      .mockResolvedValueOnce(status({ booking: null }))
      .mockResolvedValue(status());
    pollUntilBooked.mockImplementation(async () => {
      // Two reads: the webhook lands between them.
      await get();
      return get();
    });
    landOn('?prospect_id=p1&ref=MP-7F3K9A');

    expect(await screen.findByText(/one step left/i)).toBeInTheDocument();
    expect(payButton()).toBeInTheDocument();
  });

  it('lets them re-check rather than only start over', async () => {
    get.mockResolvedValue(status({ booking: null }));
    landOn('?prospect_id=p1&ref=MP-7F3K9A');

    const recheck = await screen.findByRole('button', { name: /check again/i });
    get.mockResolvedValue(status());
    fireEvent.click(recheck);

    expect(await screen.findByText(/one step left/i)).toBeInTheDocument();
  });

  it('sends them to the calendar we host, carrying the identity', async () => {
    // Not to calendly.com. Off-site the visitor ends on Calendly's own
    // /invitees/<uuid> confirmation page — slot held, fee unpaid, and no route
    // back to this screen, which is the entire point of it.
    get.mockResolvedValue(status({ booking: null }));
    landOn('?prospect_id=p1&ref=MP-7F3K9A');

    fireEvent.click(await screen.findByRole('button', { name: /choose a time/i }));
    expect(navigate).toHaveBeenCalledWith(
      '/consult/schedule?prospect_id=p1&ref=MP-7F3K9A',
    );
  });
});

describe('when the visitor cannot be identified', () => {
  it('sends them back to the start instead of showing a dead pay button', async () => {
    landOn('');
    expect(
      await screen.findByText(/could not find your assessment/i),
    ).toBeInTheDocument();
    expect(payButton()).not.toBeInTheDocument();
    expect(get).not.toHaveBeenCalled();
  });
});

describe('the reference', () => {
  it('is always on screen for someone about to phone about a payment', async () => {
    get.mockResolvedValue(status());
    landOn('?prospect_id=p1&ref=MP-7F3K9A');
    expect(await screen.findByText('MP-7F3K9A')).toBeInTheDocument();
  });
});
