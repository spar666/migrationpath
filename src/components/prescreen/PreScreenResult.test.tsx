import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { PreScreenResult as Result } from '@/services/preScreenService';

const navigate = vi.fn();
vi.mock('react-router-dom', async () => ({
  ...(await vi.importActual<typeof import('react-router-dom')>(
    'react-router-dom',
  )),
  useNavigate: () => navigate,
}));

const saveProspectSession = vi.fn();
vi.mock('@/lib/prospectSession', () => ({
  saveProspectSession: (...args: unknown[]) => saveProspectSession(...args),
}));

const { PreScreenResult } = await import('./PreScreenResult');

/**
 * The dual gate, from the visitor's side.
 *
 * The backend returns two independent flags and a `can_book`. The screen's job
 * is to never show a Book button to someone we cannot help — including the
 * awkward case of a person who IS eligible but is not a client for us. Selling
 * that person a consultation is the failure mode these tests exist to prevent.
 */

function result(overrides: Partial<Result> = {}): Result {
  return {
    prospect_id: 'p1',
    human_ref: 'MP-7F3K9A',
    statutory_eligible: true,
    client_fit: true,
    can_book: true,
    reasons: ['Occupation is on the relevant list'],
    blockers: [],
    next_steps: [],
    ...overrides,
  };
}

const bookButton = () => screen.queryByRole('button', { name: /book your consultation/i });

/** The component navigates, so it needs a router around it. */
function renderResult(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

beforeEach(() => {
  navigate.mockReset();
  saveProspectSession.mockReset();
});

describe('eligible and a good fit', () => {
  it('offers the booking button', () => {
    renderResult(<PreScreenResult result={result()} />);
    expect(bookButton()).toBeInTheDocument();
  });

  it('sends the visitor to the calendar we host, not off to Calendly', () => {
    // Off-site, the journey ended on Calendly's own /invitees/<uuid>
    // confirmation page: slot held, fee unpaid, no route back to checkout.
    // The identity goes on the URL because storage is unavailable in private
    // browsing and a forwarded link has nothing else.
    renderResult(
      <PreScreenResult
        result={result()}
        name="Ada Lovelace"
        email="ada@example.com"
      />,
    );
    fireEvent.click(bookButton()!);

    expect(navigate).toHaveBeenCalledWith(
      '/consult/schedule?prospect_id=p1&ref=MP-7F3K9A',
    );
  });

  it('stashes the identity so the Stripe round trip does not lose them', () => {
    renderResult(
      <PreScreenResult
        result={result()}
        name="Ada Lovelace"
        email="ada@example.com"
      />,
    );
    fireEvent.click(bookButton()!);

    expect(saveProspectSession).toHaveBeenCalledWith({
      prospectId: 'p1',
      humanRef: 'MP-7F3K9A',
      name: 'Ada Lovelace',
      email: 'ada@example.com',
    });
  });

  it('tells the visitor payment comes after choosing a time', () => {
    // Book-then-pay is deliberate, and a surprise payment step loses people.
    renderResult(<PreScreenResult result={result()} />);
    expect(screen.getByText(/pick a time first/i)).toBeInTheDocument();
  });
});

describe('eligible but not a client we can take', () => {
  const notAFit = result({
    statutory_eligible: true,
    client_fit: false,
    can_book: false,
  });

  it('does NOT offer the booking button', () => {
    renderResult(<PreScreenResult result={notAFit} />);
    expect(bookButton()).not.toBeInTheDocument();
  });

  it('says so plainly instead of implying they are ineligible', () => {
    renderResult(<PreScreenResult result={notAFit} />);
    expect(screen.getByText(/we’re not the right firm/i)).toBeInTheDocument();
  });
});

describe('not eligible', () => {
  const ineligible = result({
    statutory_eligible: false,
    client_fit: false,
    can_book: false,
    reasons: [],
    blockers: ['Occupation is not on any relevant list'],
    next_steps: ['Consider a skills assessment in a listed occupation'],
  });

  it('does NOT offer the booking button', () => {
    renderResult(<PreScreenResult result={ineligible} />);
    expect(bookButton()).not.toBeInTheDocument();
  });

  it('shows the blockers and what to do about them', () => {
    renderResult(<PreScreenResult result={ineligible} />);
    expect(
      screen.getByText(/occupation is not on any relevant list/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/consider a skills assessment/i),
    ).toBeInTheDocument();
  });

  it('frames it as timing rather than a permanent verdict', () => {
    renderResult(<PreScreenResult result={ineligible} />);
    expect(screen.getByText(/nothing here is a permanent decision/i)).toBeInTheDocument();
  });
});

describe('can_book is authoritative', () => {
  it('withholds the button when both flags pass but can_book is false', () => {
    // The gate belongs to the backend. If the UI re-derived it from the two
    // flags, a policy change server-side would not reach the button.
    renderResult(
      <PreScreenResult
        result={result({ statutory_eligible: true, client_fit: true, can_book: false })}
      />,
    );
    expect(bookButton()).not.toBeInTheDocument();
  });
});

describe('always shown, whatever the outcome', () => {
  it.each([
    ['eligible', result()],
    ['not a fit', result({ client_fit: false, can_book: false })],
    ['ineligible', result({ statutory_eligible: false, can_book: false })],
  ])('shows the reference to a %s visitor', (_label, r) => {
    // An ineligible person who improves their position in six months needs to
    // be able to quote this.
    renderResult(<PreScreenResult result={r} />);
    expect(screen.getByText('MP-7F3K9A')).toBeInTheDocument();
  });

  it.each([
    ['eligible', result()],
    ['ineligible', result({ statutory_eligible: false, can_book: false })],
  ])('carries the not-advice disclaimer for a %s visitor', (_label, r) => {
    // A pre-screen that reads as advice is a regulatory problem, and it is
    // exactly the ineligible screen where someone might act on it.
    renderResult(<PreScreenResult result={r} />);
    expect(screen.getByText(/is not immigration advice/i)).toBeInTheDocument();
  });
});

/**
 * There was a test here for "the scheduler URL is not configured", from when
 * this screen called openScheduler() and that call could throw. It no longer
 * can: this screen only navigates. Everything that can fail about the calendar
 * — an unset URL, a widget that will not load — now belongs to
 * /consult/schedule, which owns its own fallbacks and is covered by the
 * partner-funnel e2e spec.
 */
