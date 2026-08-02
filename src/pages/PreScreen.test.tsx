import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';

const submit = vi.fn();
vi.mock('@/services/preScreenService', () => ({
  preScreenService: { submit: (...a: unknown[]) => submit(...a) },
}));
vi.mock('@/lib/booking', () => ({ openScheduler: vi.fn() }));

const PreScreen = (await import('./PreScreen')).default;

/**
 * The funnel entry page: splash -> questionnaire -> result.
 *
 * The party fork is the first click because employer-sponsored has two sides
 * that need different questions. The page is also deliberately chrome-free —
 * every link out of it is a lead that does not finish.
 */

const robotsTag = () =>
  document.head.querySelector('meta[name="robots"]')?.getAttribute('content');

beforeEach(() => {
  submit.mockReset();
  localStorage.clear();
  window.scrollTo = vi.fn();
  document.head.querySelectorAll('meta[name="robots"]').forEach((m) => m.remove());
});

describe('the splash', () => {
  it('offers both parties', () => {
    render(<PreScreen />);
    expect(screen.getByText(/looking to be sponsored/i)).toBeInTheDocument();
    expect(screen.getByText(/business looking to sponsor/i)).toBeInTheDocument();
  });

  it('does not start the questionnaire until a party is chosen', () => {
    render(<PreScreen />);
    expect(screen.queryByText(/step 1 of/i)).toBeNull();
  });

  it('stays distraction-free — no site nav to leak clicks', () => {
    render(<PreScreen />);
    expect(screen.queryByRole('navigation')).toBeNull();
  });

  it('warns that this is not advice before anything is collected', () => {
    render(<PreScreen />);
    expect(screen.getByText(/not immigration advice/i)).toBeInTheDocument();
  });
});

describe('the party fork', () => {
  it('starts the applicant branch', () => {
    render(<PreScreen />);
    fireEvent.click(screen.getByText(/looking to be sponsored/i));
    expect(screen.getByText(/step 1 of/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/business name/i)).toBeNull();
  });

  it('starts the business branch', () => {
    render(<PreScreen />);
    fireEvent.click(screen.getByText(/business looking to sponsor/i));
    expect(screen.getByLabelText(/business name/i)).toBeInTheDocument();
  });

  it('lets someone who picked wrong go back and switch', () => {
    render(<PreScreen />);
    fireEvent.click(screen.getByText(/business looking to sponsor/i));
    fireEvent.click(screen.getByRole('button', { name: /back/i }));

    expect(screen.getByText(/looking to be sponsored/i)).toBeInTheDocument();
    fireEvent.click(screen.getByText(/looking to be sponsored/i));
    expect(screen.queryByLabelText(/business name/i)).toBeNull();
  });
});

describe('search engine exclusion', () => {
  it('marks the funnel entry noindex', () => {
    render(<PreScreen />);
    expect(robotsTag()).toBe('noindex, nofollow');
  });

  it('removes the tag on unmount', () => {
    // This is an SPA. A robots tag left in <head> would follow the visitor to
    // every page they navigate to next and silently deindex the site.
    const { unmount } = render(<PreScreen />);
    unmount();
    expect(document.head.querySelector('meta[name="robots"]')).toBeNull();
  });

  it('survives a remount without stacking duplicate tags', () => {
    const first = render(<PreScreen />);
    first.unmount();
    const second = render(<PreScreen />);
    expect(document.head.querySelectorAll('meta[name="robots"]')).toHaveLength(1);
    second.unmount();
  });

  it('restores the previous document title on unmount', () => {
    document.title = 'MigrationPath';
    const { unmount } = render(<PreScreen />);
    expect(document.title).toMatch(/eligibility/i);
    unmount();
    expect(document.title).toBe('MigrationPath');
  });
});

describe('reaching the result', () => {
  it('renders the verdict returned by the backend', async () => {
    submit.mockResolvedValue({
      prospect_id: 'p1',
      human_ref: 'MP-7F3K9A',
      statutory_eligible: true,
      client_fit: true,
      can_book: true,
      reasons: ['Occupation is on the relevant list'],
      blockers: [],
      next_steps: [],
    });

    render(<PreScreen />);
    fireEvent.click(screen.getByText(/looking to be sponsored/i));

    const fill = (label: RegExp, value: string) =>
      fireEvent.change(screen.getByLabelText(label), { target: { value } });
    const next = () =>
      fireEvent.click(screen.getByRole('button', { name: /next|see my result/i }));

    fill(/full name/i, 'Ada Lovelace');
    fill(/email address/i, 'ada@example.com');
    next();
    fill(/how old are you/i, '32');
    fireEvent.click(screen.getByLabelText('No'));
    next();
    fill(/what is your occupation/i, 'Software Engineer');
    fill(/years of full-time experience/i, '8');
    fireEvent.click(screen.getByLabelText('Yes'));
    next();
    fireEvent.click(screen.getByLabelText('Not tested yet'));
    next();
    fireEvent.click(screen.getByLabelText('No'));
    next();
    fireEvent.click(screen.getByLabelText('No'));
    fireEvent.click(screen.getByRole('checkbox'));
    await act(async () => {
      next();
    });

    expect(await screen.findByText(/you look eligible/i)).toBeInTheDocument();
    expect(screen.getByText('MP-7F3K9A')).toBeInTheDocument();
  });
});
