import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const payToConfirmConsultation = vi.fn();
const openScheduler = vi.fn();
vi.mock('@/lib/booking', () => ({
  payToConfirmConsultation: (...a: unknown[]) => payToConfirmConsultation(...a),
  openScheduler: (...a: unknown[]) => openScheduler(...a),
}));

const get = vi.fn();
vi.mock('@/services/prospectStatusService', () => ({
  prospectStatusService: { get: (...a: unknown[]) => get(...a) },
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
  openScheduler.mockReset();
  get.mockReset();
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

  it('passes the identity through to the scheduler', async () => {
    get.mockResolvedValue(status({ booking: null }));
    landOn('?prospect_id=p1&ref=MP-7F3K9A');

    fireEvent.click(await screen.findByRole('button', { name: /choose a time/i }));
    expect(openScheduler).toHaveBeenCalledWith(
      expect.objectContaining({ prospectId: 'p1', humanRef: 'MP-7F3K9A' }),
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
