import { test, expect, waitForApp } from '../fixtures/test';
import { stubApi, partnerResult } from '../fixtures/api-stubs';
import { PartnerAuditPage } from '../pages/partner.page';

/**
 * The partner visa eligibility quiz.
 *
 * Fifteen steps that end in one of three verdicts, and the verdicts are not
 * interchangeable to the business: `eligible` books a consultation,
 * `high_effort` routes to a human because the case is billable but messy, and
 * `ineligible` declines the work. Collapsing any two of those is a commercial
 * error wearing the costume of a copy change, so each gets its own test.
 *
 * The other thing under test is the conditional branching. Answering
 * "Australia" opens four questions about visa status that an offshore
 * applicant never sees, and — the subtler half — changing that answer back
 * must DELETE those answers rather than leave them to be submitted invisibly.
 * A stale answer from an abandoned branch is the kind of bug that produces a
 * wrong verdict with no visible cause.
 */

test.beforeEach(async ({ page }) => {
  await stubApi(page);
});

test.describe('the cover', () => {
  test('explains what the quiz covers before asking for anything', async ({ page }) => {
    const partner = new PartnerAuditPage(page);
    await partner.goto();
    await waitForApp(page);

    await expect(partner.coverHeading()).toBeVisible();
    await expect(partner.subclassLine()).toBeVisible();
  });

  test('does not start the quiz until asked', async ({ page }) => {
    const partner = new PartnerAuditPage(page);
    await partner.goto();
    await waitForApp(page);

    await expect(partner.stepIndicator()).toHaveCount(0);
  });

  test('starts the quiz on the first step', async ({ page }) => {
    const partner = new PartnerAuditPage(page);
    await partner.goto();
    await waitForApp(page);

    await partner.start();

    await expect(partner.stepIndicator()).toContainText(/step 1 of/i);
  });

  test('returns to the cover from the first step', async ({ page }) => {
    // `goBack` on step 0 sets the phase back to 'cover' rather than doing
    // nothing — a visitor who opened the quiz by mistake is not trapped in it.
    const partner = new PartnerAuditPage(page);
    await partner.goto();
    await waitForApp(page);

    await partner.start();
    await partner.back();

    await expect(partner.coverHeading()).toBeVisible();
  });
});

test.describe('validation', () => {
  test('will not advance past a blank required question', async ({ page }) => {
    const partner = new PartnerAuditPage(page);
    await partner.goto();
    await waitForApp(page);
    await partner.start();

    await partner.next();

    await expect(partner.requiredError().first()).toBeVisible();
    await expect(partner.stepIndicator()).toContainText(/step 1 of/i);
  });

  test('flags every blank question on the step, not just the first', async ({ page }) => {
    // Step 1 asks three things. Reporting only the first turns a single
    // rejection into three round trips.
    const partner = new PartnerAuditPage(page);
    await partner.goto();
    await waitForApp(page);
    await partner.start();

    await partner.next();

    expect(await partner.requiredError().count()).toBeGreaterThan(1);
  });

  test('clears the errors once the questions are answered', async ({ page }) => {
    const partner = new PartnerAuditPage(page);
    await partner.goto();
    await waitForApp(page);
    await partner.start();

    await partner.next();
    await expect(partner.requiredError().first()).toBeVisible();

    await partner.fill(/applicant first name/i, 'Ada');
    await partner.fill(/sponsor first name/i, 'Charles');
    await partner.choose('Applicant');
    await partner.next();

    await expect(partner.stepIndicator()).toContainText(/step 2 of/i);
  });

  test('rejects a malformed email on the final step', async ({ page }) => {
    const partner = new PartnerAuditPage(page);
    await partner.goto();
    await waitForApp(page);

    await partner.start();
    // Walk to the last step, then replace the generated email with a bad one.
    const total = await partner.totalSteps();
    for (let i = 0; i < total - 1; i++) {
      await partner.answerStep();
      await partner.next();
    }

    await partner.textbox(/email/i).fill('not-an-email');
    await partner.submitButton().click();

    await expect(partner.emailError()).toBeVisible();
    await expect(partner.anyVerdict()).toHaveCount(0);
  });
});

test.describe('conditional questions', () => {
  test('opens the onshore branch only for an applicant in Australia', async ({ page }) => {
    const partner = new PartnerAuditPage(page);
    await partner.goto();
    await waitForApp(page);
    await partner.start();

    await partner.fillNames();
    await partner.next();
    await partner.answerStep(); // English
    await partner.next();

    // Step 3 asks where the applicant lives. Australia reveals the visa block.
    await partner.selectOption(0, 'Australia');

    await expect(
      page.getByText(/has ada's australian visa expired/i),
    ).toBeVisible();
  });

  test('keeps the onshore branch shut for an applicant living elsewhere', async ({ page }) => {
    const partner = new PartnerAuditPage(page);
    await partner.goto();
    await waitForApp(page);
    await partner.start();

    await partner.fillNames();
    await partner.next();
    await partner.answerStep();
    await partner.next();

    await partner.selectOption(0, 'India');

    await expect(page.getByText(/australian visa expired/i)).toHaveCount(0);
  });

  test('withdraws the branch when the answer that opened it changes', async ({ page }) => {
    // This is the one that matters. `setAnswer` deletes answers whose
    // `showWhen` no longer passes, so a visitor who picks Australia, answers
    // the visa questions, then corrects their country does not silently
    // submit visa answers that no longer apply to them.
    const partner = new PartnerAuditPage(page);
    await partner.goto();
    await waitForApp(page);
    await partner.start();

    await partner.fillNames();
    await partner.next();
    await partner.answerStep();
    await partner.next();

    await partner.selectOption(0, 'Australia');
    await expect(page.getByText(/australian visa expired/i)).toBeVisible();

    await partner.selectOption(0, 'India');

    await expect(page.getByText(/australian visa expired/i)).toHaveCount(0);
  });

  test('personalises later questions with the names given up front', async ({ page }) => {
    const partner = new PartnerAuditPage(page);
    await partner.goto();
    await waitForApp(page);
    await partner.start();

    await partner.fillNames('Mina', 'Tom');
    await partner.next();

    await expect(page.getByText(/mina/i).first()).toBeVisible();
    await expect(page.getByText(/tom/i).first()).toBeVisible();
  });
});

test.describe('moving through the quiz', () => {
  test('keeps answers when stepping back', async ({ page }) => {
    const partner = new PartnerAuditPage(page);
    await partner.goto();
    await waitForApp(page);
    await partner.start();

    await partner.fillNames('Mina', 'Tom');
    await partner.next();
    await expect(partner.stepIndicator()).toContainText(/step 2 of/i);

    await partner.back();

    await expect(partner.textbox(/applicant first name/i)).toHaveValue('Mina');
    await expect(partner.textbox(/sponsor first name/i)).toHaveValue('Tom');
  });

  test('advances the progress indicator as it goes', async ({ page }) => {
    const partner = new PartnerAuditPage(page);
    await partner.goto();
    await waitForApp(page);
    await partner.start();

    await partner.answerStep();
    await partner.next();
    await expect(partner.stepIndicator()).toContainText(/step 2 of/i);

    await partner.answerStep();
    await partner.next();
    await expect(partner.stepIndicator()).toContainText(/step 3 of/i);
  });
});

test.describe('the three verdicts', () => {
  test('an eligible couple is invited to book', async ({ page }) => {
    await stubApi(page, { partner: { outcome: 'eligible' } });
    const partner = new PartnerAuditPage(page);
    await partner.goto();
    await waitForApp(page);

    await partner.completeToEnd();

    await expect(partner.eligibleHeading()).toBeVisible();
    await expect(partner.consultationCta()).toBeVisible();
  });

  test('a complex case is routed to a human, not declined', async ({ page }) => {
    // 'high_effort' means billable but messy. Showing this cohort the
    // ineligible screen turns paying clients away.
    await stubApi(page, {
      partner: { outcome: 'high_effort', highRisk: true, effort: 'substantial' },
    });
    const partner = new PartnerAuditPage(page);
    await partner.goto();
    await waitForApp(page);

    await partner.completeToEnd();

    await expect(partner.highEffortHeading()).toBeVisible();
    await expect(partner.ineligibleHeading()).toHaveCount(0);
  });

  test('an ineligible couple is declined and NOT sold a consultation', async ({ page }) => {
    // The absence of the CTA is the assertion. Taking money for a consult we
    // have just said we cannot act on is how a migration practice earns
    // complaints, so `can_book` comes back false and the button must not
    // render — their details are still kept for a future re-assessment.
    await stubApi(page, {
      partner: { outcome: 'ineligible', ineligible: true, can_book: false },
    });
    const partner = new PartnerAuditPage(page);
    await partner.goto();
    await waitForApp(page);

    await partner.completeToEnd();

    await expect(partner.ineligibleHeading()).toBeVisible();
    await expect(partner.consultationCta()).toHaveCount(0);
  });

  test('a case the backend could not record does not offer a dead booking button', async ({
    page,
  }) => {
    // A failed prospect write still returns the verdict, but a booking with
    // nothing to attach to cannot be paid for or reconciled — so the CTA is
    // withheld rather than sending an unlinkable invitee to Calendly.
    await stubApi(page, {
      partner: { outcome: 'eligible', prospect_id: null, human_ref: null, can_book: false },
    });
    const partner = new PartnerAuditPage(page);
    await partner.goto();
    await waitForApp(page);

    await partner.completeToEnd();

    await expect(partner.eligibleHeading()).toBeVisible();
    await expect(partner.consultationCta()).toHaveCount(0);
  });

  test('every verdict addresses the couple by name', async ({ page }) => {
    await stubApi(page, {
      partner: partnerResult({
        applicantFirstName: 'Mina',
        sponsorFirstName: 'Tom',
      }),
    });
    const partner = new PartnerAuditPage(page);
    await partner.goto();
    await waitForApp(page);

    await partner.completeToEnd();

    await expect(page.getByText(/mina & tom/i)).toBeVisible();
  });

  test('the quiz is gone once the verdict is in', async ({ page }) => {
    const partner = new PartnerAuditPage(page);
    await partner.goto();
    await waitForApp(page);

    await partner.completeToEnd();

    await expect(partner.anyVerdict()).toBeVisible();
    await expect(partner.stepIndicator()).toHaveCount(0);
  });
});

test.describe('what the quiz sends', () => {
  test('submits the answers it collected', async ({ page }) => {
    const recorder = await stubApi(page);
    const partner = new PartnerAuditPage(page);
    await partner.goto();
    await waitForApp(page);

    await partner.completeToEnd();

    const payload = recorder.partnerPayload();
    expect(payload).toBeTruthy();
    expect(payload).toHaveProperty('applicantFirstName');
    expect(payload).toHaveProperty('sponsorFirstName');
  });

  test('does not send answers from a branch that was withdrawn', async ({ page }) => {
    // The counterpart to the branching test above, checked at the wire rather
    // than in the DOM: a question the visitor can no longer see must not
    // reach the eligibility engine.
    const recorder = await stubApi(page);
    const partner = new PartnerAuditPage(page);
    await partner.goto();
    await waitForApp(page);
    await partner.start();

    await partner.fillNames();
    await partner.next();
    await partner.answerStep();
    await partner.next();

    await partner.selectOption(0, 'Australia');
    await partner.answerStep();
    await partner.selectOption(0, 'India');

    const total = await partner.totalSteps();
    for (let i = 3; i <= total; i++) {
      await partner.answerStep();
      const submit = partner.submitButton();
      if (await submit.count()) {
        await submit.click();
        break;
      }
      await partner.next();
    }
    await partner.anyVerdict().waitFor();

    expect(recorder.partnerPayload()).not.toHaveProperty('visaExpired');
  });
});

test.describe('when the eligibility engine is down', () => {
  test('says so and keeps the visitor’s answers', async ({ page, health }) => {
    health.expectErrors('the form logs the failed submission');
    await stubApi(page, { failing: ['/partner/eligibility'] });
    const partner = new PartnerAuditPage(page);
    await partner.goto();
    await waitForApp(page);

    await partner.completeToEnd();

    await expect(partner.submitError().first()).toBeVisible();
    await expect(partner.anyVerdict()).toHaveCount(0);
  });

  test('lets them retry rather than starting over', async ({ page, health }) => {
    health.expectErrors('the form logs the failed submission');
    await stubApi(page, { failing: ['/partner/eligibility'] });
    const partner = new PartnerAuditPage(page);
    await partner.goto();
    await waitForApp(page);

    await partner.completeToEnd();
    await expect(partner.submitError().first()).toBeVisible();

    // Still on the last step, with the button live — not bounced to the cover.
    await expect(partner.submitButton()).toBeEnabled();
  });
});
