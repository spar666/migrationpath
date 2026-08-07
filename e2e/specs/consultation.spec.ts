import { test, expect, waitForApp } from '../fixtures/test';
import { stubApi } from '../fixtures/api-stubs';
import { ConsultationPage } from '../pages/consultation.page';

/**
 * /consultation — the pre-session intake.
 *
 * An unusual page: it opens its questionnaire dialog automatically on mount,
 * so the card underneath is something a visitor only sees by dismissing the
 * modal or finishing it. That auto-open is easy to break with a refactor and
 * invisible in code review, so it is asserted directly.
 *
 * The intake gates in two places — occupation and date of birth on step 1,
 * marital status on step 2 — and gates nothing on step 3. Those gates exist
 * because the answers feed a points estimate; a submission missing them
 * produces a confident score built on blanks.
 *
 * Worth naming: submission calls `authService.me()` FIRST and bails with
 * "Please log in to continue" if there is no session. An anonymous visitor can
 * therefore fill in the entire questionnaire before being told it will not be
 * accepted. The spec pins that behaviour rather than endorsing it — see the
 * anonymous test below.
 */

test.describe('the page', () => {
  test.beforeEach(async ({ page }) => {
    await stubApi(page, { authenticated: true });
  });

  test('opens the questionnaire without being asked', async ({ page }) => {
    const consult = new ConsultationPage(page);
    await consult.goto();
    await waitForApp(page);

    await expect(consult.dialog()).toBeVisible();
    await expect(consult.dialogTitle()).toBeVisible();
  });

  test('shows the landing page behind it once dismissed', async ({ page }) => {
    const consult = new ConsultationPage(page);
    await consult.goto();
    await waitForApp(page);

    await consult.closeQuestionnaire();

    await expect(consult.heading()).toBeVisible();
    await expect(consult.readyCard()).toBeVisible();
  });

  test('offers to reopen the questionnaire after dismissing it', async ({ page }) => {
    // Closing the modal by accident must not strand the visitor on a page
    // whose only purpose is the modal.
    const consult = new ConsultationPage(page);
    await consult.goto();
    await waitForApp(page);

    await consult.closeQuestionnaire();
    await consult.startButton().click();

    await expect(consult.dialog()).toBeVisible();
  });
});

test.describe('the intake gates', () => {
  test.beforeEach(async ({ page }) => {
    await stubApi(page, { authenticated: true });
  });

  test('will not advance from step 1 with nothing filled in', async ({ page }) => {
    const consult = new ConsultationPage(page);
    await consult.goto();
    await waitForApp(page);

    await expect(consult.forwardButton()).toBeDisabled();
  });

  test('still will not advance with only an occupation', async ({ page }) => {
    // Both fields gate, not either — a date of birth is what makes the age
    // points computable, and an intake without one is not usable.
    const consult = new ConsultationPage(page);
    await consult.goto();
    await waitForApp(page);

    await consult.occupationInput().fill('Software Engineer');

    await expect(consult.forwardButton()).toBeDisabled();
  });

  test('advances once occupation and date of birth are both present', async ({ page }) => {
    const consult = new ConsultationPage(page);
    await consult.goto();
    await waitForApp(page);

    await consult.occupationInput().fill('Software Engineer');
    await consult.dobInput().fill('1992-04-17');

    await expect(consult.forwardButton()).toBeEnabled();
  });

  test('keeps the answers when stepping back', async ({ page }) => {
    const consult = new ConsultationPage(page);
    await consult.goto();
    await waitForApp(page);

    await consult.occupationInput().fill('Registered Nurse');
    await consult.dobInput().fill('1992-04-17');
    await consult.forwardButton().click();

    await consult.backButton().click();

    await expect(consult.occupationInput()).toHaveValue('Registered Nurse');
    await expect(consult.dobInput()).toHaveValue('1992-04-17');
  });

  test('has no way back from the first step', async ({ page }) => {
    const consult = new ConsultationPage(page);
    await consult.goto();
    await waitForApp(page);

    await expect(consult.backButton()).toBeDisabled();
  });
});

test.describe('completing the intake', () => {
  /** Drives all three steps and submits. */
  async function complete(consult: ConsultationPage) {
    await consult.occupationInput().fill('Software Engineer');
    await consult.dobInput().fill('1992-04-17');
    await consult.forwardButton().click();

    // Step 2 gates on marital status.
    await consult.selectOption(0, /married/i);
    await consult.forwardButton().click();

    // Step 3 gates on nothing.
    await consult.submitButton().click();
  }

  test('submits the answers and confirms', async ({ page }) => {
    await stubApi(page, { authenticated: true });
    const consult = new ConsultationPage(page);
    await consult.goto();
    await waitForApp(page);

    await complete(consult);

    await expect(consult.confirmationTitle()).toBeVisible();
  });

  test('sends the answers it collected, under `responses`', async ({ page }) => {
    const recorder = await stubApi(page, { authenticated: true });
    const consult = new ConsultationPage(page);
    await consult.goto();
    await waitForApp(page);

    await complete(consult);
    await consult.confirmationTitle().waitFor();

    const payload = recorder.questionnairePayload();
    expect(payload).toHaveProperty('responses');
    expect((payload as { responses: Record<string, unknown> }).responses).toMatchObject({
      current_occupation: 'Software Engineer',
      date_of_birth: '1992-04-17',
    });
  });

  test('marks the page complete once the intake is done', async ({ page }) => {
    await stubApi(page, { authenticated: true });
    const consult = new ConsultationPage(page);
    await consult.goto();
    await waitForApp(page);

    await complete(consult);
    await consult.confirmationTitle().waitFor();
    await page.keyboard.press('Escape');

    await expect(consult.allSetCard()).toBeVisible();
    await expect(consult.bookAnotherButton()).toBeVisible();
  });
});

test.describe('when submission fails', () => {
  test('says so rather than falsely confirming', async ({ page, health }) => {
    health.expectErrors('the dialog logs the failed submission');
    await stubApi(page, {
      authenticated: true,
      failing: ['/consultation/questionnaire'],
    });
    const consult = new ConsultationPage(page);
    await consult.goto();
    await waitForApp(page);

    await consult.occupationInput().fill('Software Engineer');
    await consult.dobInput().fill('1992-04-17');
    await consult.forwardButton().click();
    await consult.selectOption(0, /married/i);
    await consult.forwardButton().click();
    await consult.submitButton().click();

    await expect(consult.errorToast()).toBeVisible();
    await expect(consult.confirmationTitle()).toHaveCount(0);
  });

  test('turns an anonymous visitor away rather than dropping the intake', async ({
    page,
  }) => {
    // Documenting current behaviour, not endorsing it: the session check runs
    // at SUBMIT, so an anonymous visitor answers everything before being told.
    // If this ever moves earlier, this test should be the thing that notices.
    await stubApi(page, { httpErrors: { '/auth/me': 401 } });
    const consult = new ConsultationPage(page);
    await consult.goto();
    await waitForApp(page);

    await consult.occupationInput().fill('Software Engineer');
    await consult.dobInput().fill('1992-04-17');
    await consult.forwardButton().click();
    await consult.selectOption(0, /married/i);
    await consult.forwardButton().click();
    await consult.submitButton().click();

    await expect(consult.confirmationTitle()).toHaveCount(0);
  });
});
