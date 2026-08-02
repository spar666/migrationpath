import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import type { PreScreenResult as Result } from '@/services/preScreenService';

const openScheduler = vi.fn();
vi.mock('@/lib/booking', () => ({
  openScheduler: (...args: unknown[]) => openScheduler(...args),
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

beforeEach(() => {
  openScheduler.mockReset();
});

describe('eligible and a good fit', () => {
  it('offers the booking button', () => {
    render(<PreScreenResult result={result()} />);
    expect(bookButton()).toBeInTheDocument();
  });

  it('passes the identity Calendly needs to link the booking back', async () => {
    render(
      <PreScreenResult
        result={result()}
        name="Ada Lovelace"
        email="ada@example.com"
      />,
    );
    fireEvent.click(bookButton()!);

    expect(openScheduler).toHaveBeenCalledWith({
      prospectId: 'p1',
      humanRef: 'MP-7F3K9A',
      name: 'Ada Lovelace',
      email: 'ada@example.com',
    });
  });

  it('tells the visitor payment comes after choosing a time', () => {
    // Book-then-pay is deliberate, and a surprise payment step loses people.
    render(<PreScreenResult result={result()} />);
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
    render(<PreScreenResult result={notAFit} />);
    expect(bookButton()).not.toBeInTheDocument();
  });

  it('says so plainly instead of implying they are ineligible', () => {
    render(<PreScreenResult result={notAFit} />);
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
    render(<PreScreenResult result={ineligible} />);
    expect(bookButton()).not.toBeInTheDocument();
  });

  it('shows the blockers and what to do about them', () => {
    render(<PreScreenResult result={ineligible} />);
    expect(
      screen.getByText(/occupation is not on any relevant list/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/consider a skills assessment/i),
    ).toBeInTheDocument();
  });

  it('frames it as timing rather than a permanent verdict', () => {
    render(<PreScreenResult result={ineligible} />);
    expect(screen.getByText(/nothing here is a permanent decision/i)).toBeInTheDocument();
  });
});

describe('can_book is authoritative', () => {
  it('withholds the button when both flags pass but can_book is false', () => {
    // The gate belongs to the backend. If the UI re-derived it from the two
    // flags, a policy change server-side would not reach the button.
    render(
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
    render(<PreScreenResult result={r} />);
    expect(screen.getByText('MP-7F3K9A')).toBeInTheDocument();
  });

  it.each([
    ['eligible', result()],
    ['ineligible', result({ statutory_eligible: false, can_book: false })],
  ])('carries the not-advice disclaimer for a %s visitor', (_label, r) => {
    // A pre-screen that reads as advice is a regulatory problem, and it is
    // exactly the ineligible screen where someone might act on it.
    render(<PreScreenResult result={r} />);
    expect(screen.getByText(/is not immigration advice/i)).toBeInTheDocument();
  });
});

describe('when scheduling is not configured', () => {
  it('tells the visitor how to proceed instead of failing silently', async () => {
    // openScheduler throws when VITE_CALENDLY_CONSULT_URL is unset. A dead
    // Book button is the most expensive failure in the funnel.
    openScheduler.mockImplementation(() => {
      throw new Error('Scheduling is not configured.');
    });
    vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<PreScreenResult result={result()} />);
    fireEvent.click(bookButton()!);

    expect(await screen.findByText(/contact us and quote your reference/i)).toBeInTheDocument();
  });
});
