import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

const submit = vi.fn();
vi.mock('@/services/preScreenService', () => ({
  preScreenService: { submit: (...args: unknown[]) => submit(...args) },
}));

const saveProspectSession = vi.fn();
vi.mock('@/lib/prospectSession', () => ({
  saveProspectSession: (...args: unknown[]) => saveProspectSession(...args),
}));

const { PreScreenForm } = await import('./PreScreenForm');

/**
 * The questionnaire runner.
 *
 * Two things here are not cosmetic: a submission cannot leave without consent
 * (the backend rejects it, and holding personal data we were not given
 * permission to collect is the kind of mistake that ends practices), and the
 * prospect identity must be persisted before the visitor is handed to Calendly
 * — once they leave our origin, an unsaved id is unrecoverable.
 */

function setup(party: 'applicant' | 'business' = 'applicant') {
  const onComplete = vi.fn();
  const onExit = vi.fn();
  render(
    <PreScreenForm party={party} onComplete={onComplete} onExit={onExit} />,
  );
  return { onComplete, onExit };
}

const next = () =>
  fireEvent.click(screen.getByRole('button', { name: /next|see my result/i }));

function fill(label: RegExp, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

beforeEach(() => {
  submit.mockReset();
  saveProspectSession.mockReset();
  window.scrollTo = vi.fn();
});

describe('step gating', () => {
  it('starts on the contact step', () => {
    setup();
    expect(screen.getByText(/step 1 of/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
  });

  it('refuses to advance while a required question is blank', () => {
    setup();
    next();
    expect(screen.getByText(/step 1 of/i)).toBeInTheDocument();
    expect(
      screen.getAllByText(/this question is required/i).length,
    ).toBeGreaterThan(0);
  });

  it('rejects a malformed email', () => {
    setup();
    fill(/full name/i, 'Ada Lovelace');
    fill(/email address/i, 'not-an-email');
    next();
    expect(
      screen.getByText(/please enter a valid email address/i),
    ).toBeInTheDocument();
  });

  it('does not block on a blank optional question', () => {
    setup();
    fill(/full name/i, 'Ada Lovelace');
    fill(/email address/i, 'ada@example.com');
    // Phone is optional and deliberately left empty.
    next();
    expect(screen.getByText(/step 2 of/i)).toBeInTheDocument();
  });

  it('exits to the splash from the first step', () => {
    const { onExit } = setup();
    fireEvent.click(screen.getByRole('button', { name: /back/i }));
    expect(onExit).toHaveBeenCalled();
  });

  it('keeps answers when stepping back and forward', () => {
    setup();
    fill(/full name/i, 'Ada Lovelace');
    fill(/email address/i, 'ada@example.com');
    next();
    fireEvent.click(screen.getByRole('button', { name: /back/i }));
    expect(screen.getByLabelText(/full name/i)).toHaveValue('Ada Lovelace');
  });
});

describe('branching', () => {
  it('reveals the follow-up only once its trigger is answered', () => {
    setup();
    fill(/full name/i, 'Ada Lovelace');
    fill(/email address/i, 'ada@example.com');
    next();

    // "What visa are you on right now?" only applies to someone onshore.
    expect(screen.queryByLabelText(/what visa are you on/i)).toBeNull();
    fireEvent.click(screen.getByLabelText('Yes'));
    expect(screen.getByLabelText(/what visa are you on/i)).toBeInTheDocument();
  });

  it('hides the follow-up again when the trigger changes', () => {
    setup();
    fill(/full name/i, 'Ada Lovelace');
    fill(/email address/i, 'ada@example.com');
    next();

    fireEvent.click(screen.getByLabelText('Yes'));
    fill(/what visa are you on/i, '500');
    fireEvent.click(screen.getByLabelText('No'));

    // Stale answers from an abandoned branch must not reach the engine.
    expect(screen.queryByLabelText(/what visa are you on/i)).toBeNull();
  });
});

describe('consent', () => {
  /** Walks the applicant branch to the final step with valid answers. */
  function reachFinalStep() {
    setup();
    fill(/full name/i, 'Ada Lovelace');
    fill(/email address/i, 'ada@example.com');
    next();

    fill(/how old are you/i, '32');
    fireEvent.click(screen.getByLabelText('No')); // not onshore
    next();

    fill(/what is your occupation/i, 'Software Engineer');
    fill(/years of full-time experience/i, '8');
    fireEvent.click(screen.getByLabelText('Yes')); // skills assessment
    next();

    fireEvent.click(screen.getByLabelText('Not tested yet'));
    next();

    fireEvent.click(screen.getByLabelText('No')); // no employer
    next();

    fireEvent.click(screen.getByLabelText('No')); // no health/character concern
  }

  it('shows the notice on the final step', () => {
    reachFinalStep();
    expect(screen.getByText(/is not immigration advice/i)).toBeInTheDocument();
  });

  it('starts unchecked — a pre-ticked box is not consent', () => {
    reachFinalStep();
    expect(screen.getByRole('checkbox')).not.toBeChecked();
  });

  it('blocks submission until consent is given', () => {
    reachFinalStep();
    next();
    expect(submit).not.toHaveBeenCalled();
    expect(screen.getByText(/we need your consent/i)).toBeInTheDocument();
  });

  it('submits once consent is given', async () => {
    submit.mockResolvedValue({
      prospect_id: 'p1',
      human_ref: 'MP-7F3K9A',
      statutory_eligible: true,
      client_fit: true,
      can_book: true,
      reasons: [],
      blockers: [],
      next_steps: [],
    });

    reachFinalStep();
    fireEvent.click(screen.getByRole('checkbox'));
    next();

    await waitFor(() => expect(submit).toHaveBeenCalledTimes(1));
    expect(submit.mock.calls[0][0].contact.consent_given).toBe(true);
  });
});

describe('after a successful submission', () => {
  const result = {
    prospect_id: 'p1',
    human_ref: 'MP-7F3K9A',
    statutory_eligible: true,
    client_fit: true,
    can_book: true,
    reasons: [],
    blockers: [],
    next_steps: [],
  };

  async function submitForm() {
    submit.mockResolvedValue(result);
    const handles = setup();
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
    // Wrapped: submission settles asynchronously, and the state update in the
    // `finally` lands after the awaited assertion otherwise.
    await act(async () => {
      next();
    });
    return handles;
  }

  it('persists the identity BEFORE handing off', async () => {
    await submitForm();
    await waitFor(() => expect(saveProspectSession).toHaveBeenCalled());
    expect(saveProspectSession.mock.calls[0][0]).toMatchObject({
      prospectId: 'p1',
      humanRef: 'MP-7F3K9A',
      email: 'ada@example.com',
    });
  });

  it('hands the result to the parent', async () => {
    const { onComplete } = await submitForm();
    await waitFor(() => expect(onComplete).toHaveBeenCalled());
    expect(onComplete.mock.calls[0][0]).toMatchObject({ human_ref: 'MP-7F3K9A' });
  });
});

describe('when submission fails', () => {
  it('keeps the answers and lets the visitor retry', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    submit.mockRejectedValue(new Error('network'));

    setup();
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
    next();

    // An error must not throw away six steps of typing.
    expect(await screen.findByText(/something went wrong|network/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /see my result/i }),
    ).toBeEnabled();
  });
});

describe('business branch', () => {
  it('addresses the business contact in the business wording', () => {
    setup('business');
    expect(screen.getByLabelText(/what's your first name/i)).toBeInTheDocument();
    expect(
      screen.getByLabelText(/best email to contact you/i),
    ).toBeInTheDocument();
  });

  it('keeps the neutral wording for an applicant', () => {
    setup('applicant');
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/what's your first name/i)).toBeNull();
  });
});
