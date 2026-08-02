import { expect, test, waitForApp } from '../fixtures/test';
import { HUMAN_REF, PROSPECT_ID, stubApi } from '../fixtures/api-stubs';
import { PreScreenPage } from '../pages/prescreen.page';
import { ConsultPage } from '../pages/consult.page';

/**
 * The lead-gen funnel, end to end in a real browser.
 *
 * What this suite is for: the journey, and specifically the parts of it that
 * leave our origin. Between the questionnaire and the confirmation page the
 * visitor visits Calendly and Stripe, and every piece of in-memory state is
 * gone by the time they come back. Nothing but a browser test can prove that
 * still works.
 *
 * The branching inside each screen is already covered by the unit suites.
 * Repeating it here would be slow and would fail for reasons unrelated to the
 * journey.
 */

test.describe('the happy path', () => {
  test('pre-screen through to a confirmed booking', async ({ page }) => {
    // Six questionnaire steps, three navigations and a poll cycle. Fits in 30s
    // locally and does not on a cold CI runner — which is how a sound suite
    // gets a reputation for flake.
    test.setTimeout(90_000);

    const api = await stubApi(page, { confirmAfter: 2 });
    const preScreen = new PreScreenPage(page);
    const consult = new ConsultPage(page);

    // --- Questionnaire ---
    await preScreen.goto();
    await waitForApp(page);
    await preScreen.completeApplicantQuestionnaire();

    await expect(preScreen.eligibleHeading()).toBeVisible();
    await expect(page.getByText(HUMAN_REF)).toBeVisible();

    // The submission carried consent and the raw answers. Both are contractual:
    // the backend rejects a submission without consent, and raw_answers is the
    // only way to re-score someone if the rules change.
    const submitted = api.preScreenPayload();
    expect(submitted).toMatchObject({
      party: 'applicant',
      contact: { consent_given: true, email: 'ada@example.com' },
    });
    expect(submitted?.raw_answers).toBeTruthy();

    // --- Handoff to Calendly ---
    await preScreen.bookButton().click();

    // The prospect id rides on utm_content — the one field Calendly reliably
    // echoes back in the invitee webhook. If it stops being sent, bookings
    // arrive unlinked and nobody can be prepped or charged, so it is asserted
    // explicitly rather than implied.
    await expect.poll(() => api.calendlyUrl()).toContain('utm_content=');
    const calendly = new URL(api.calendlyUrl()!);
    expect(calendly.searchParams.get('utm_content')).toBe(PROSPECT_ID);
    expect(calendly.searchParams.get('email')).toBe('ada@example.com');

    // --- Back from Calendly to pay ---
    await consult.gotoBook();
    await waitForApp(page);
    await expect(consult.oneStepLeft()).toBeVisible();

    await consult.payButton().click();

    // Polled, not read straight after the click: the request is async, and a
    // synchronous read would usually pass locally, fail under CI load, and
    // leave the "no price" assertion below passing vacuously against null.
    await expect.poll(() => api.checkoutPayload()).toMatchObject({
      prospect_id: PROSPECT_ID,
    });
    expect(JSON.stringify(api.checkoutPayload())).not.toMatch(/amount|price/i);

    // The visitor actually leaves for Stripe. Waiting for it is not politeness:
    // the redirect is assigned after the POST resolves, so navigating onward
    // without it aborts the next goto mid-flight.
    await consult.awaitStripeHandoff();

    // --- Back from Stripe ---
    //
    // /consult/book polled status while the visitor was on it, which has
    // already used up the `confirmAfter: 2` budget. Without this reset the
    // confirmation page's first poll returns "booked", it renders success on
    // its first frame, and the assertion below that it must NOT do that
    // passes for the wrong reason — the exact failure this spec exists to catch.
    api.resetStatusPolls();

    await consult.gotoConfirmed();
    await waitForApp(page);

    // Opens on "confirming", never on success: arriving here is a browser
    // navigation, not proof of payment.
    await expect(consult.confirmingSpinner()).toBeVisible();

    // ...then resolves once the stubbed webhook has landed.
    await expect(consult.bookedHeading()).toBeVisible({ timeout: 20_000 });
    await expect(consult.joinLink()).toBeVisible();
  });
});

test.describe('the dual gate', () => {
  test('eligible but not a fit is told so, and cannot book', async ({ page }) => {
    // The commercially awkward outcome. Selling this person a consultation we
    // cannot act on is how a migration practice earns complaints.
    await stubApi(page, {
      preScreen: { client_fit: false, can_book: false, next_steps: [] },
    });
    const preScreen = new PreScreenPage(page);

    await preScreen.goto();
    await waitForApp(page);
    await preScreen.completeApplicantQuestionnaire();

    await expect(preScreen.notAFitHeading()).toBeVisible();
    await expect(preScreen.bookButton()).toHaveCount(0);
    // Their reference is still theirs to quote.
    await expect(page.getByText(HUMAN_REF)).toBeVisible();
  });

  test('ineligible sees blockers, and cannot book', async ({ page }) => {
    await stubApi(page, {
      preScreen: {
        statutory_eligible: false,
        client_fit: false,
        can_book: false,
        reasons: [],
        blockers: ['Occupation is not on any relevant list'],
        next_steps: ['Consider a skills assessment in a listed occupation'],
      },
    });
    const preScreen = new PreScreenPage(page);

    await preScreen.goto();
    await waitForApp(page);
    await preScreen.completeApplicantQuestionnaire();

    await expect(preScreen.ineligibleHeading()).toBeVisible();
    await expect(
      page.getByText(/occupation is not on any relevant list/i),
    ).toBeVisible();
    await expect(preScreen.bookButton()).toHaveCount(0);
  });

  test('every outcome carries the not-advice disclaimer', async ({ page }) => {
    // A pre-screen that reads as advice is a regulatory problem, and the
    // ineligible screen is exactly where someone might act on it.
    await stubApi(page, {
      preScreen: { statutory_eligible: false, can_book: false },
    });
    const preScreen = new PreScreenPage(page);

    await preScreen.goto();
    await waitForApp(page);
    await preScreen.completeApplicantQuestionnaire();

    await expect(preScreen.disclaimer()).toBeVisible();
  });
});

test.describe('the questionnaire', () => {
  test('will not advance past a blank required question', async ({ page }) => {
    await stubApi(page);
    const preScreen = new PreScreenPage(page);

    await preScreen.goto();
    await waitForApp(page);
    await preScreen.startAsApplicant();
    await preScreen.next();

    await expect(preScreen.validationError().first()).toBeVisible();
    await expect(page.getByText(/step 1 of/i)).toBeVisible();
  });

  test('forks to the business branch', async ({ page }) => {
    await stubApi(page);
    const preScreen = new PreScreenPage(page);

    await preScreen.goto();
    await waitForApp(page);
    await preScreen.startAsBusiness();

    await expect(page.getByLabel(/business name/i)).toBeVisible();
  });

  test('lets someone who picked the wrong party go back and switch', async ({
    page,
  }) => {
    await stubApi(page);
    const preScreen = new PreScreenPage(page);

    await preScreen.goto();
    await waitForApp(page);
    await preScreen.startAsBusiness();
    await preScreen.backButton().click();

    await expect(preScreen.applicantCard()).toBeVisible();
    await preScreen.startAsApplicant();
    await expect(page.getByLabel(/business name/i)).toHaveCount(0);
  });

  test('keeps answers when stepping back', async ({ page }) => {
    await stubApi(page);
    const preScreen = new PreScreenPage(page);

    await preScreen.goto();
    await waitForApp(page);
    await preScreen.startAsApplicant();

    await preScreen.fill(/full name/i, 'Ada Lovelace');
    await preScreen.fill(/email address/i, 'ada@example.com');
    await preScreen.next();
    await preScreen.backButton().click();

    await expect(page.getByLabel(/full name/i)).toHaveValue('Ada Lovelace');
  });
});

test.describe('payment edge cases', () => {
  test('an already-paid consult is not offered again', async ({ page }) => {
    // Double-charging is the worst outcome available in this flow.
    await stubApi(page, {
      status: {
        stage: 'booked',
        consult_confirmed: true,
        booking: { id: 'booking-1', status: 'confirmed', scheduled_at: null },
      },
    });
    const consult = new ConsultPage(page);

    await consult.gotoBook();
    await waitForApp(page);

    await expect(consult.alreadyConfirmed()).toBeVisible();
    await expect(consult.payButton()).toHaveCount(0);
  });

  test('a slow webhook never reads as a failed payment', async ({ page }) => {
    // The page polls ~15s before giving up. Deliberate behaviour, but it does
    // not fit inside Playwright's 30s default once page load is added.
    test.setTimeout(60_000);

    await stubApi(page, { confirmAfter: 999 });
    const consult = new ConsultPage(page);

    await consult.gotoConfirmed();
    await waitForApp(page);

    await expect(consult.stillWaitingHeading()).toBeVisible({ timeout: 30_000 });
    await expect(consult.doNotPayAgain()).toBeVisible();
    // Telling someone their payment failed when the card was charged sends
    // them to pay a second time.
    await expect(page.getByText(/failed|declined/i)).toHaveCount(0);
  });

  test('an unidentifiable visitor is not shown a dead pay button', async ({
    page,
  }) => {
    await stubApi(page);
    const consult = new ConsultPage(page);

    await consult.gotoBookAnonymously();
    await waitForApp(page);

    await expect(consult.notFound()).toBeVisible();
    await expect(consult.payButton()).toHaveCount(0);
  });

  test('a confirmation link opened in a fresh browser points at the email', async ({
    page,
  }) => {
    // No query string and no localStorage — someone forwarded the link, or
    // opened it on another device.
    await stubApi(page);
    const consult = new ConsultPage(page);

    await page.goto('/consult/confirmed');
    await waitForApp(page);

    await expect(consult.checkEmailHeading()).toBeVisible();
  });
});
