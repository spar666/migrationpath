import { expect, test, waitForApp } from '../fixtures/test';
import { HUMAN_REF, PROSPECT_ID, stubApi } from '../fixtures/api-stubs';
import { PartnerAuditPage } from '../pages/partner.page';
import { ConsultPage } from '../pages/consult.page';

/**
 * The partner-visa quiz, end to end through Calendly and Stripe.
 *
 * This exists because the partner audit used to stop at its own result screen:
 * the CTA routed to /consultation, which opened a second questionnaire, and
 * nothing the visitor did there ever produced a booking or a payment. It now
 * runs the same book-then-pay funnel as the employer-sponsored pre-screen, and
 * the two hops that leave our origin are exactly the part no unit test can
 * prove still works.
 *
 * `funnel.spec.ts` covers the same journey from the pre-screen questionnaire.
 * Duplicating it here is deliberate rather than lazy — the two entry points
 * build the scheduler URL from different result payloads, and a partner
 * submission that quietly stopped sending its prospect id would leave that
 * suite entirely green.
 */

test.describe('the partner audit funnel', () => {
  test('quiz through to a confirmed booking', async ({ page }) => {
    // Fifteen quiz steps, two external round trips and a poll cycle.
    test.setTimeout(120_000);

    const api = await stubApi(page, { confirmAfter: 2 });
    const partner = new PartnerAuditPage(page);
    const consult = new ConsultPage(page);

    // --- The quiz ---
    await partner.goto();
    await waitForApp(page);
    await partner.completeToEnd();

    await expect(partner.eligibleHeading()).toBeVisible();

    // The reference is shown on the result screen. Someone who closes the tab
    // between picking a time and paying has nothing else to quote.
    await expect(page.getByText(HUMAN_REF)).toBeVisible();

    // --- Pick a time, on our own page ---
    await partner.consultationCta().click();
    await page.waitForURL(/\/consult\/schedule/);

    // utm_content is the one query field Calendly reliably echoes back in the
    // invitee webhook, and the webhook is where the pending booking gets
    // attached to a person. If this stops being sent, partner bookings arrive
    // unlinked — payable by nobody and preppable by nobody.
    await expect.poll(() => api.calendlyUrl()).toContain('utm_content=');
    const calendly = new URL(api.calendlyUrl()!);
    expect(calendly.searchParams.get('utm_content')).toBe(PROSPECT_ID);

    // --- The hand-back that used to be missing ---
    //
    // This is the whole reason the calendar is embedded. Linked out, the
    // visitor stopped on Calendly's confirmation screen holding an unpaid slot
    // and nothing brought them back. Taking a slot must land them on payment
    // with no further action.
    await consult.pickSlot();

    // The browser records the booking itself. Without this the row exists only
    // if Calendly's invitee webhook has already landed — a server-to-server
    // call that is late under load, silent when misconfigured, and impossible
    // in local development — and checkout rejects the visitor over a slot they
    // just watched themselves book.
    await expect.poll(() => api.reportedBooking()).toBeTruthy();

    await page.waitForURL(/\/consult\/book/, { timeout: 15_000 });
    await waitForApp(page);

    await expect(consult.oneStepLeft()).toBeVisible();

    await consult.payButton().click();

    // Polled rather than read straight after the click: the checkout POST is
    // async, so a synchronous read would leave the "no price" assertion below
    // passing vacuously against null.
    await expect.poll(() => api.checkoutPayload()).toMatchObject({
      prospect_id: PROSPECT_ID,
    });
    // The client must never name an amount. If it could, a consult could be
    // bought for a cent.
    expect(JSON.stringify(api.checkoutPayload())).not.toMatch(/amount|price/i);

    await consult.awaitStripeHandoff();

    // --- Back from Stripe ---
    // /consult/book polled status while the visitor sat on it, using up the
    // confirmAfter budget. Without this reset the confirmation page resolves on
    // its first frame and the assertion that it must not do that passes for the
    // wrong reason.
    api.resetStatusPolls();

    await consult.gotoConfirmed();
    await waitForApp(page);

    // Landing on the success URL is a browser navigation, not proof of
    // payment — so the page opens on "confirming", never on success.
    await expect(consult.confirmingSpinner()).toBeVisible();
    await expect(consult.bookedHeading()).toBeVisible({ timeout: 20_000 });
  });

  test('carries the consent the backend refuses to store a prospect without', async ({
    page,
  }) => {
    const api = await stubApi(page);
    const partner = new PartnerAuditPage(page);

    await partner.goto();
    await waitForApp(page);
    await partner.completeToEnd();

    // The notice text travels with the boolean. Storing "they agreed" without
    // storing what they agreed to is not a record of consent, and the wording
    // changes over time.
    const submitted = api.partnerPayload();
    expect(submitted?.consent_given).toBe(true);
    expect(String(submitted?.consent_text ?? '')).toMatch(
      /may store the answers/i,
    );
  });

  test('does not hand off to Calendly without a prospect to attach', async ({
    page,
  }) => {
    // A failed prospect write server side still returns the verdict. The CTA is
    // withheld rather than opening a scheduler whose booking could never be
    // reconciled — see can_book in partner-eligibility.service.ts.
    const api = await stubApi(page, {
      partner: { prospect_id: null, human_ref: null, can_book: false },
    });
    const partner = new PartnerAuditPage(page);

    await partner.goto();
    await waitForApp(page);
    await partner.completeToEnd();

    await expect(partner.eligibleHeading()).toBeVisible();
    await expect(partner.consultationCta()).toHaveCount(0);
    expect(api.calendlyUrl()).toBeNull();
  });

  test('reaches payment even when the Calendly webhook never arrives', async ({
    page,
  }) => {
    // The failure this whole path exists to prevent, and the one the developer
    // hits every time: on localhost Calendly has no public URL to deliver to,
    // so invitee.created never fires, no booking row is created, and checkout
    // rejects with "we have no record of the time you picked".
    //
    // `status` is pinned to no booking, so the ONLY thing that can produce one
    // is the browser's own report.
    const api = await stubApi(page, { status: { booking: null } });
    const consult = new ConsultPage(page);

    await consult.gotoSchedule();
    await waitForApp(page);
    await consult.pickSlot();

    const reported = await expect
      .poll(() => api.reportedBooking())
      .toBeTruthy()
      .then(() => api.reportedBooking()!);

    // The invitee URI is what lets the webhook recognise this row as its own
    // booking later, instead of creating a duplicate for the same slot.
    expect(reported).toHaveProperty('invitee_uri');

    await page.waitForURL(/\/consult\/book/, { timeout: 15_000 });
  });

  test('pay goes straight to Stripe', async ({ page }) => {
    const api = await stubApi(page);
    const consult = new ConsultPage(page);

    await consult.gotoBook();
    await waitForApp(page);
    await consult.payButton().click();

    await expect.poll(() => api.checkoutPayload()).toMatchObject({
      prospect_id: PROSPECT_ID,
    });
    await consult.awaitStripeHandoff();
  });

  test('a cold visitor to the calendar is sent back rather than shown an unusable one', async ({
    page,
  }) => {
    // /consult/schedule is reachable directly, and the identity may be missing
    // — a cleared browser, or a link that lost its query string. A calendar
    // with no prospect behind it produces a booking nobody can pay for, so the
    // page must refuse to render one.
    const consult = new ConsultPage(page);

    await stubApi(page);
    await page.goto('/consult/schedule');
    await waitForApp(page);

    await expect(page.getByText(/could not find your assessment/i)).toBeVisible();
    await expect(consult.calendarFrame()).toHaveCount(0);
  });
});
