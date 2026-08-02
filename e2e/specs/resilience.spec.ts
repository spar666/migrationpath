import { expect, test, waitForApp } from '../fixtures/test';
import { stubApi } from '../fixtures/api-stubs';
import { AppPage } from '../pages/app.page';
import { PreScreenPage } from '../pages/prescreen.page';
import { ConsultPage } from '../pages/consult.page';

/**
 * What the application does when the API misbehaves.
 *
 * Almost every test suite exercises the happy path, so the degraded paths are
 * where the untested code lives — and they are the ones a user meets on a bad
 * day. The bar here is not "handles it gracefully" in the abstract; it is
 * specific: the page must still render, and it must not claim something untrue.
 *
 * These tests opt out of the automatic console-error check, because provoking
 * a failed request legitimately logs one. The assertion is on what the user
 * sees instead.
 */

test.describe('when an endpoint fails', () => {
  test('the home page still renders', async ({ page, health }) => {
    health.expectErrors('a failing endpoint logs a console error by design');
    await stubApi(page, { failing: ['/occupations', '/cms', '/courses'] });
    const app = new AppPage(page);

    await page.goto('/');
    await waitForApp(page);

    await expect(app.root()).toBeVisible();
    await expect(app.errorBoundary()).toHaveCount(0);
  });

  test('a content page degrades instead of white-screening', async ({
    page,
    health,
  }) => {
    health.expectErrors('deliberate 500');
    await stubApi(page, { failing: ['/cms'] });
    const app = new AppPage(page);

    await page.goto('/news');
    await waitForApp(page);

    await expect(app.root()).toBeVisible();
    await expect(app.errorBoundary()).toHaveCount(0);
  });

  test('the pre-screen keeps the visitor’s answers when submission fails', async ({
    page,
    health,
  }) => {
    // Six steps of typing thrown away by one 500 is the difference between a
    // retry and a lost lead.
    health.expectErrors('deliberate 500 on submit');
    await stubApi(page, { failing: ['/pre-screen'] });
    const preScreen = new PreScreenPage(page);

    await preScreen.goto();
    await waitForApp(page);
    await preScreen.completeApplicantQuestionnaire();

    // Still on the questionnaire, with an error and a working retry.
    await expect(preScreen.submissionError()).toBeVisible();
    await expect(preScreen.nextButton()).toBeEnabled();
    // And the answers survived — the whole point. Step 6 of 6 means the walker
    // was not bounced back to the splash screen.
    await expect(preScreen.stepIndicator()).toContainText(/step 6 of 6/i);
  });

  test('the pay page still offers checkout when status cannot be read', async ({
    page,
    health,
  }) => {
    // The backend resolves the booking server-side anyway. A visitor who
    // cannot pay is a lost sale, so a failed status lookup must not block it.
    health.expectErrors('deliberate 500 on status');
    await stubApi(page, { failing: ['/status'] });
    const consult = new ConsultPage(page);

    await consult.gotoBook();
    await waitForApp(page);

    await expect(consult.payButton()).toBeVisible();
  });

  test('the confirmation page never blames the visitor’s card', async ({
    page,
    health,
  }) => {
    // The single most damaging thing this page could say. A failed status
    // lookup says nothing about whether the payment succeeded.
    health.expectErrors('deliberate 500 on status');
    await stubApi(page, { failing: ['/status'] });
    const consult = new ConsultPage(page);

    await consult.gotoConfirmed();
    await waitForApp(page);

    await expect(consult.stillWaitingHeading()).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(/failed|declined|unsuccessful/i)).toHaveCount(0);
  });
});

test.describe('when the API returns nothing', () => {
  test('list pages render an empty state rather than breaking', async ({ page }) => {
    // Empty collections are the state on a fresh environment, and the one
    // most likely to hit a `.map` on undefined.
    await stubApi(page, { empty: true });
    const app = new AppPage(page);

    for (const path of ['/news', '/occupation-search', '/quote']) {
      await page.goto(path);
      await waitForApp(page);
      await expect(app.root(), `empty state at ${path}`).toBeVisible();
      await expect(app.errorBoundary(), `error boundary at ${path}`).toHaveCount(0);
    }
  });
});

test.describe('when the network is slow', () => {
  test('the pre-screen does not double-submit on an impatient double click', async ({
    page,
  }) => {
    // Two prospects, two references, and an agent with a duplicate to reconcile.
    //
    // Six questionnaire steps plus a deliberately slow submit does not fit in
    // the 30s default — and a timeout here would read as "the app double-
    // submitted", which is not what happened.
    test.setTimeout(60_000);

    await stubApi(page);
    await page.route('**/api/v1/pre-screen', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          prospect_id: 'p1',
          human_ref: 'MP-7F3K9A',
          statutory_eligible: true,
          client_fit: true,
          can_book: true,
          reasons: [],
          blockers: [],
          next_steps: [],
        }),
      });
    });

    let submissions = 0;
    page.on('request', (request) => {
      if (request.url().includes('/pre-screen') && request.method() === 'POST') {
        submissions += 1;
      }
    });

    const preScreen = new PreScreenPage(page);
    await preScreen.goto();
    await waitForApp(page);
    await preScreen.completeApplicantQuestionnaire();

    // The walker already clicked once; click again while it is in flight.
    //
    // `force` bypasses the actionability check so the click is dispatched at a
    // button the app has disabled — which is precisely the guard under test.
    // The short timeout is not tuning: without it a miss waits out the whole
    // test budget and reports as "the result never rendered".
    await preScreen
      .forwardButton()
      .click({ force: true, timeout: 2_000 })
      .catch(() => {
        // Expected when the button is already disabled — which is the point.
      });

    await expect(preScreen.eligibleHeading()).toBeVisible({ timeout: 20_000 });
    expect(submissions, 'the form submitted more than once').toBe(1);
  });
});
