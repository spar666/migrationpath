/**
 * Selector contract for `e2e/pages/consult.page.ts`.
 *
 * Companion to e2eSelectors.test.tsx, which covers the pre-screen. Same
 * reasoning: the Playwright suite addresses these pages by their copy, and copy
 * changes. When it does, this suite goes red in 300ms and names the string,
 * instead of the browser suite going red twenty minutes later with "timeout
 * waiting for locator".
 *
 * Every locator asserted here has a twin in the page object. If you change one,
 * change both — that is the cost of the fast feedback, and it is worth paying
 * for a handful of strings that gate the payment flow.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const get = vi.fn();
const pollUntilBooked = vi.fn();
const pollUntilConfirmed = vi.fn();
vi.mock('@/services/prospectStatusService', () => ({
  prospectStatusService: {
    get: (...a: unknown[]) => get(...a),
    // The page polls for the Calendly webhook to land rather than reading
    // once, so the mock has to answer the poll, not the single read.
    pollUntilBooked: (...a: unknown[]) => pollUntilBooked(...a),
    pollUntilConfirmed: (...a: unknown[]) => pollUntilConfirmed(...a),
  },
}));
vi.mock('@/lib/booking', () => ({
  openScheduler: vi.fn(),
  payToConfirmConsultation: vi.fn(),
}));

const ConsultBook = (await import('./pages/ConsultBook')).default;
const ConsultConfirmed = (await import('./pages/ConsultConfirmed')).default;

const PROSPECT_ID = '4f1a5c2e-0000-4000-8000-000000000000';
const HUMAN_REF = 'MP-7F3K9A';

function status(overrides: Record<string, unknown> = {}) {
  return {
    prospect_id: PROSPECT_ID,
    human_ref: HUMAN_REF,
    stage: 'pre_screened',
    statutory_eligible: true,
    client_fit: true,
    consult_confirmed: false,
    booking: {
      id: 'booking-1',
      status: 'pending',
      scheduled_at: '2026-08-01T02:00:00.000Z',
      join_url: null,
      reschedule_url: null,
    },
    ...overrides,
  };
}

function renderAt(Component: () => JSX.Element, search: string) {
  window.history.replaceState({}, '', `/consult${search}`);
  return render(
    <MemoryRouter>
      <Component />
    </MemoryRouter>,
  );
}

beforeEach(() => {
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
  pollUntilConfirmed.mockReset();
  localStorage.clear();
});

describe('ConsultPage.payButton / oneStepLeft', () => {
  it('resolve on a held, unpaid booking', async () => {
    get.mockResolvedValue(status());
    renderAt(ConsultBook, `/book?prospect_id=${PROSPECT_ID}&ref=${HUMAN_REF}`);

    expect(await screen.findByText(/one step left/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /pay to confirm/i }),
    ).toBeInTheDocument();
  });
});

describe('ConsultPage.chooseTimeButton', () => {
  it('resolves when no slot is held', async () => {
    get.mockResolvedValue(status({ booking: null }));
    renderAt(ConsultBook, `/book?prospect_id=${PROSPECT_ID}&ref=${HUMAN_REF}`);

    expect(
      await screen.findByRole('button', { name: /choose a time/i }),
    ).toBeInTheDocument();
  });
});

describe('ConsultPage.alreadyConfirmed', () => {
  it('resolves once the consult is paid for', async () => {
    get.mockResolvedValue(status({ consult_confirmed: true, stage: 'booked' }));
    renderAt(ConsultBook, `/book?prospect_id=${PROSPECT_ID}&ref=${HUMAN_REF}`);

    expect(await screen.findByText(/already confirmed/i)).toBeInTheDocument();
  });
});

describe('ConsultPage.notFound', () => {
  it('resolves for a visitor with no identity', async () => {
    renderAt(ConsultBook, '/book');
    expect(
      await screen.findByText(/could not find your assessment/i),
    ).toBeInTheDocument();
  });
});

describe('ConsultPage.confirmingSpinner', () => {
  it('resolves on arrival, before the webhook lands', async () => {
    pollUntilConfirmed.mockReturnValue(new Promise(() => {}));
    renderAt(
      ConsultConfirmed,
      `/confirmed?prospect_id=${PROSPECT_ID}&ref=${HUMAN_REF}`,
    );

    expect(screen.getByText(/confirming your booking/i)).toBeInTheDocument();
  });
});

describe('ConsultPage.bookedHeading / joinLink / rescheduleLink', () => {
  it('resolve once confirmed', async () => {
    pollUntilConfirmed.mockResolvedValue(
      status({
        consult_confirmed: true,
        stage: 'booked',
        booking: {
          id: 'booking-1',
          status: 'confirmed',
          scheduled_at: '2026-08-01T02:00:00.000Z',
          join_url: 'https://meet.example/abc',
          reschedule_url: 'https://calendly.com/reschedule/abc',
        },
      }),
    );

    renderAt(
      ConsultConfirmed,
      `/confirmed?prospect_id=${PROSPECT_ID}&ref=${HUMAN_REF}`,
    );

    expect(await screen.findByText(/you’re booked in/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /join link/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /reschedule/i })).toBeInTheDocument();
  });
});

describe('ConsultPage.stillWaitingHeading / doNotPayAgain', () => {
  it('resolve when the webhook has not landed in time', async () => {
    pollUntilConfirmed.mockResolvedValue(status({ consult_confirmed: false }));
    renderAt(
      ConsultConfirmed,
      `/confirmed?prospect_id=${PROSPECT_ID}&ref=${HUMAN_REF}`,
    );

    expect(
      await screen.findByText(/taking a little longer than usual/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/do not pay again/i)).toBeInTheDocument();
  });
});

describe('ConsultPage.checkEmailHeading', () => {
  it('resolves for an unidentifiable visitor on the confirmation page', async () => {
    renderAt(ConsultConfirmed, '/confirmed');
    expect(
      await screen.findByText(/check your email for confirmation/i),
    ).toBeInTheDocument();
    await waitFor(() => expect(pollUntilConfirmed).not.toHaveBeenCalled());
  });
});
