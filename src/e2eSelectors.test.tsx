/**
 * Selector contract for the Playwright suite.
 *
 * The E2E specs address the UI by role and label. Those selectors live in a
 * suite that needs a browser, so they break slowly and expensively: someone
 * relabels a field, CI goes red twenty minutes later, and the failure reads as
 * "the funnel is broken" rather than "a label changed".
 *
 * These run in jsdom in milliseconds and fail with the actual reason. If one
 * goes red, fix the Playwright selector too — they are the same strings.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const submit = vi.fn();
vi.mock('@/services/preScreenService', () => ({
  preScreenService: { submit: (...a: unknown[]) => submit(...a) },
}));
// PreScreenResult navigates to /consult/schedule, so the tree needs a router.
const renderPreScreen = () =>
  render(
    <MemoryRouter>
      <PreScreen />
    </MemoryRouter>,
  );

const PreScreen = (await import('./pages/PreScreen')).default;

beforeEach(() => {
  submit.mockReset();
  localStorage.clear();
  window.scrollTo = vi.fn();
  document.head.querySelectorAll('meta[name="robots"]').forEach((m) => m.remove());
});

function startApplicant() {
  renderPreScreen();
  fireEvent.click(
    screen.getByRole('button', { name: /looking to be sponsored/i }),
  );
}

function fillContact() {
  fireEvent.change(screen.getByLabelText(/full name/i), {
    target: { value: 'Ada Lovelace' },
  });
  fireEvent.change(screen.getByLabelText(/email address/i), {
    target: { value: 'ada@example.com' },
  });
  fireEvent.click(screen.getByRole('button', { name: /next/i }));
}

describe('splash selectors used by the page objects', () => {
  it('resolves each party card as exactly one button', () => {
    // getByRole throws on multiple matches, which mirrors Playwright's strict
    // mode — the reason the E2E uses getByRole here rather than getByText.
    renderPreScreen();

    expect(
      screen.getByRole('button', { name: /looking to be sponsored/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /business looking to sponsor/i }),
    ).toBeInTheDocument();
  });

  it('keeps the two card names mutually exclusive', () => {
    // If "business looking to sponsor" also matched the applicant regex, the
    // E2E would click the wrong branch and fail somewhere far from the cause.
    renderPreScreen();
    expect(
      screen.getAllByRole('button', { name: /looking to be sponsored/i }),
    ).toHaveLength(1);
  });
});

describe('questionnaire selectors used by completeApplicantQuestionnaire()', () => {
  it('labels the contact fields the way the walker expects', () => {
    startApplicant();
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
  });

  it('associates radio options with their labels', () => {
    // The one most likely to break silently: options are Radix buttons with
    // role="radio", and getByLabel only finds them because FieldControl gives
    // each option an id that its <label for> points at. Remove that wiring and
    // both suites lose the ability to click a radio.
    startApplicant();
    fillContact();

    expect(screen.getByLabelText('Yes')).toBeInTheDocument();
    expect(screen.getByLabelText('No')).toBeInTheDocument();
  });

  it('keeps a single "No" per step, so an exact match is unambiguous', () => {
    // The E2E clicks getByLabel('No', { exact: true }). A second "No" on the
    // same step would turn that into a strict-mode failure.
    startApplicant();
    fillContact();

    expect(screen.getAllByLabelText('No')).toHaveLength(1);
  });

  it('exposes the English step option the walker clicks', () => {
    startApplicant();
    fillContact();

    fireEvent.change(screen.getByLabelText(/how old are you/i), {
      target: { value: '32' },
    });
    fireEvent.click(screen.getByLabelText('No'));
    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    fireEvent.change(screen.getByLabelText(/what is your occupation/i), {
      target: { value: 'Software Engineer' },
    });
    fireEvent.change(screen.getByLabelText(/years of full-time experience/i), {
      target: { value: '8' },
    });
    fireEvent.click(screen.getByLabelText('Yes'));
    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    expect(screen.getByLabelText(/not tested yet/i)).toBeInTheDocument();
  });
});

/**
 * Walks the applicant branch to the last step, leaving it one click from
 * submitting. Mirrors `PreScreenPage.completeApplicantQuestionnaire()` up to
 * but not including the final click, so the tests below can observe what the
 * form looks like mid-submit and after a failure.
 */
function walkToSubmit() {
  startApplicant();

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

  return { submitButton: () => screen.getByRole('button', { name: /see my result/i }) };
}

describe('in-flight selectors used by PreScreenPage.forwardButton()', () => {
  it('relabels the submit button to "Checking…" while the request is open', async () => {
    // The reason forwardButton() exists. nextButton()'s /next|see my result/
    // stops matching the instant the click lands, and on success the form is
    // replaced by the result screen — so a Playwright click issued during the
    // submission waits for an element that never returns and consumes the
    // whole test timeout before failing somewhere unrelated.
    let release!: (value: unknown) => void;
    submit.mockReturnValue(new Promise((resolve) => { release = resolve; }));

    walkToSubmit();
    fireEvent.click(screen.getByRole('button', { name: /see my result/i }));

    // Mid-flight: the old name is gone, the new one is there and disabled.
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /see my result/i })).toBeNull();
    });
    const inFlight = screen.getByRole('button', { name: /checking/i });
    expect(inFlight).toBeDisabled();
    // ...and forwardButton()'s regex still resolves it, which is the contract.
    expect(
      screen.getByRole('button', { name: /next|see my result|checking/i }),
    ).toBe(inFlight);

    await act(async () => {
      release({
        prospect_id: 'p1',
        human_ref: 'MP-7F3K9A',
        statutory_eligible: true,
        client_fit: true,
        can_book: true,
        reasons: [],
        blockers: [],
        next_steps: [],
      });
    });
  });

  it('disables the button during the request, which is the double-submit guard', async () => {
    let release!: (value: unknown) => void;
    submit.mockReturnValue(new Promise((resolve) => { release = resolve; }));

    walkToSubmit();
    fireEvent.click(screen.getByRole('button', { name: /see my result/i }));

    const inFlight = await screen.findByRole('button', { name: /checking/i });
    fireEvent.click(inFlight);
    fireEvent.click(inFlight);
    expect(submit).toHaveBeenCalledTimes(1);

    await act(async () => {
      release({
        prospect_id: 'p1',
        human_ref: 'MP-7F3K9A',
        statutory_eligible: true,
        client_fit: true,
        can_book: true,
        reasons: [],
        blockers: [],
        next_steps: [],
      });
    });
  });
});

describe('failure selector used by PreScreenPage.submissionError()', () => {
  it('matches the message a 500 produces', async () => {
    // The wording comes from the axios interceptor in src/lib/apiClient.ts,
    // which is why the page object matches loosely. This pins that the two
    // still overlap — if the interceptor is reworded to something outside the
    // regex, the E2E resilience spec goes red for no visible reason.
    const submissionError = /server error|something went wrong|please try again/i;

    submit.mockRejectedValue(new Error('Server error. Please try again later.'));
    vi.spyOn(console, 'error').mockImplementation(() => {});

    walkToSubmit();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /see my result/i }));
    });

    expect(screen.getByText(submissionError)).toBeInTheDocument();
    // And the visitor is still on step 6 with their answers, not bounced back.
    expect(screen.getByText(/step 6 of 6/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /see my result/i })).toBeEnabled();
  });
});

describe('business branch selector', () => {
  it('exposes the business contact fields on the first step', () => {
    renderPreScreen();
    fireEvent.click(
      screen.getByRole('button', { name: /business looking to sponsor/i }),
    );
    expect(screen.getByLabelText(/what's your first name/i)).toBeInTheDocument();
  });
});

describe('noindex assertion used by the e2e suite', () => {
  it('sets the meta tag the spec looks for', () => {
    renderPreScreen();
    expect(
      document.head.querySelector('meta[name="robots"]')?.getAttribute('content'),
    ).toMatch(/noindex/);
  });
});
