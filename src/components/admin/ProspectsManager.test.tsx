import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const list = vi.fn();
const getPrepView = vi.fn();
const advanceStage = vi.fn();

vi.mock('@/services/adminProspectService', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@/services/adminProspectService')
  >()),
  adminProspectService: {
    list: (...a: unknown[]) => list(...a),
    getPrepView: (...a: unknown[]) => getPrepView(...a),
    advanceStage: (...a: unknown[]) => advanceStage(...a),
  },
}));
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const { ProspectsManager } = await import('./ProspectsManager');

/**
 * The agent's queue. The thing that matters most here is that the two
 * eligibility flags stay legible as three distinct outcomes — merging
 * "eligible but not a fit" into a plain no is exactly the case an agent needs
 * to triage differently.
 */

function prospect(over: Record<string, unknown> = {}) {
  return {
    id: 'p1',
    human_ref: 'MP-7F3K9A',
    party: 'business',
    full_name: 'Grace Hopper',
    email: 'grace@acme.example',
    stage: 'pre_screened',
    statutory_eligible: true,
    client_fit: true,
    source: 'pre_screen_business',
    consent_given: true,
    created_at: '2026-08-01T00:00:00.000Z',
    updated_at: '2026-08-01T00:00:00.000Z',
    ...over,
  };
}

function page(rows: unknown[]) {
  return { data: rows, total: rows.length, page: 1, limit: 20, totalPages: 1 };
}

describe('ProspectsManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    list.mockResolvedValue(page([prospect()]));
  });

  it('lists prospects with their reference', async () => {
    render(<ProspectsManager />);
    expect(await screen.findByText('MP-7F3K9A')).toBeInTheDocument();
    expect(screen.getByText('Grace Hopper')).toBeInTheDocument();
  });

  it('shows the three eligibility outcomes distinctly', async () => {
    list.mockResolvedValue(
      page([
        prospect({ id: 'a', human_ref: 'MP-A', statutory_eligible: true, client_fit: true }),
        prospect({ id: 'b', human_ref: 'MP-B', statutory_eligible: true, client_fit: false }),
        prospect({ id: 'c', human_ref: 'MP-C', statutory_eligible: false, client_fit: false }),
      ]),
    );
    render(<ProspectsManager />);

    expect(await screen.findByText('Bookable')).toBeInTheDocument();
    expect(screen.getByText('Eligible · not a fit')).toBeInTheDocument();
    expect(screen.getByText('Not eligible')).toBeInTheDocument();
  });

  it('distinguishes an unscreened prospect from an ineligible one', async () => {
    // Null flags mean the engine never ran. Rendering that as "Not eligible"
    // would tell an agent a decision was made that never was.
    list.mockResolvedValue(
      page([prospect({ statutory_eligible: null, client_fit: null })]),
    );
    render(<ProspectsManager />);

    expect(await screen.findByText('Not screened')).toBeInTheDocument();
    expect(screen.queryByText('Not eligible')).toBeNull();
  });

  it('surfaces a failed load instead of showing an empty funnel', async () => {
    list.mockRejectedValue(new Error('Session expired'));
    render(<ProspectsManager />);

    await waitFor(() =>
      expect(screen.getByText('Session expired')).toBeInTheDocument(),
    );
    expect(screen.queryByText('No prospects yet.')).toBeNull();
  });

  it('shows a genuine empty state when there are no prospects', async () => {
    list.mockResolvedValue(page([]));
    render(<ProspectsManager />);
    expect(await screen.findByText('No prospects yet.')).toBeInTheDocument();
  });

  it('opens the prep view for a prospect', async () => {
    getPrepView.mockResolvedValue({
      prospect: prospect(),
      summary: { answers: { legal_name: 'Acme Pty Ltd' } },
    });
    render(<ProspectsManager />);

    fireEvent.click(await screen.findByRole('button', { name: /open/i }));

    await waitFor(() => expect(getPrepView).toHaveBeenCalledWith('p1'));
    expect(await screen.findByText('Their answers')).toBeInTheDocument();
    expect(screen.getByText('Acme Pty Ltd')).toBeInTheDocument();
  });

  it('says search only covers the loaded page', async () => {
    // The endpoint takes no search param, so an empty result must not read as
    // "this person is not in the system".
    render(<ProspectsManager />);
    await screen.findByText('MP-7F3K9A');

    fireEvent.change(screen.getByPlaceholderText(/filter this page/i), {
      target: { value: 'nobody' },
    });

    expect(
      await screen.findByText(/search only covers the rows currently loaded/i),
    ).toBeInTheDocument();
  });
});
