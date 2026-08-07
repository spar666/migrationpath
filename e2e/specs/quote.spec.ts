import { expect, test, waitForApp } from '../fixtures/test';
import {
  INACTIVE_PACKAGE,
  PACKAGE,
  SECOND_PACKAGE,
  stubApi,
} from '../fixtures/api-stubs';
import { QuotePage } from '../pages/quote.page';

/**
 * Pricing, and the application flow that starts from it.
 *
 * Two things here are worth a browser and could not be proven anywhere else.
 *
 * The first is the sign-in round trip. Someone picks a package while signed
 * out, gets sent to /auth, and is expected to come back to a quote that
 * remembers what they chose. The selection survives in localStorage across a
 * full navigation — a boundary that unit tests mock away, and the exact place
 * the previous sessionStorage implementation lost people silently.
 *
 * The second is lead capture. Details are recorded the moment intent is
 * expressed, before payment and before anything can go wrong, because a
 * visitor who abandons at the payment step is still the most valuable thing
 * this page produces.
 */

test.describe('the pricing table', () => {
  test('shows active packages, grouped, and hides retired ones', async ({ page }) => {
    // The filter is one `.filter()` in the page component. Nothing about the
    // rendered result says whether it ran, which is why the fixture ships a
    // retired package that must not appear.
    await stubApi(page);
    const quote = new QuotePage(page);

    await quote.goto();
    await waitForApp(page);

    await expect(quote.packageCard(new RegExp(PACKAGE.package_name))).toBeVisible();
    await expect(
      quote.packageCard(new RegExp(SECOND_PACKAGE.package_name)),
    ).toBeVisible();
    await expect(
      quote.packageCard(new RegExp(INACTIVE_PACKAGE.package_name)),
    ).toHaveCount(0);

    // Grouped by category, not listed flat — the two fixtures are deliberately
    // in different categories so this means something.
    await expect(quote.categoryHeading(/skilled migration/i)).toBeVisible();
    await expect(quote.categoryHeading(/family sponsorship/i)).toBeVisible();
  });

  test('waits to be asked before showing a total', async ({ page }) => {
    await stubApi(page);
    const quote = new QuotePage(page);

    await quote.goto();
    await waitForApp(page);

    await expect(quote.summaryPlaceholder()).toBeVisible();
    await expect(quote.startApplicationButton()).toHaveCount(0);
  });

  test('prices the selected package including the consultation credit', async ({
    page,
  }) => {
    await stubApi(page);
    const quote = new QuotePage(page);

    await quote.goto();
    await waitForApp(page);
    await quote.packageCard(new RegExp(PACKAGE.package_name)).click();

    await expect(quote.selectedSubclassBadge(PACKAGE.visa_subclass)).toBeVisible();

    // 4500 + 4640 + 1200 = 10,340, less the $150 credit. The credit is the
    // page's main commercial promise; a total that quietly stops applying it
    // is a promise broken in the customer's favour-free direction.
    await expect(page.getByText(/10,190|10190/)).toBeVisible();
  });

  test('offers a fallback when there is nothing to sell', async ({ page }) => {
    await stubApi(page, { empty: true });
    const quote = new QuotePage(page);

    await quote.goto();
    await waitForApp(page);

    await expect(quote.emptyState()).toBeVisible();
    await expect(page.getByRole('link', { name: /book a free consultation/i })).toBeVisible();
  });

  test('admits it when pricing cannot be loaded', async ({ page, health }) => {
    health.expectErrors('the pricing endpoint is stubbed to 500');

    await stubApi(page, { failing: ['/pricing/packages'] });
    const quote = new QuotePage(page);

    await quote.goto();
    await waitForApp(page);

    // Not the empty state. "We have no packages" and "we could not reach the
    // server" are different messages, and showing the first for the second
    // tells a paying customer the business has nothing to offer them.
    await expect(quote.errorState()).toBeVisible({ timeout: 15_000 });
    await expect(quote.emptyState()).toHaveCount(0);
  });
});

test.describe('starting an application', () => {
  test('captures the lead before asking for anything else', async ({ page }) => {
    const api = await stubApi(page);
    const quote = new QuotePage(page);

    await quote.goto();
    await waitForApp(page);
    await quote.packageCard(new RegExp(PACKAGE.package_name)).click();
    await quote.startApplicationButton().click();

    await expect(quote.dialog()).toBeVisible();
    await quote.phoneInput().fill('+61 400 000 000');
    await quote.fillDetails();

    await expect
      .poll(() => api.leadPayload(), { timeout: 10_000 })
      .toMatchObject({
        full_name: 'Ada Lovelace',
        email: 'ada@example.com',
        phone: '+61 400 000 000',
        visa_type: PACKAGE.visa_subclass,
        package_id: PACKAGE.id,
        source: 'quote_page',
      });

    // The honeypot must go out empty for a real visitor. If this ever carries
    // a value, the field has stopped being hidden and every genuine submission
    // is about to be scored as a bot.
    expect(api.leadPayload()?.website).toBeUndefined();
  });

  test('advances even if lead capture fails', async ({ page, health }) => {
    // Deliberate: the lead is a safety net for the business, not a gate for
    // the customer. Blocking someone's application because a CRM write failed
    // is the wrong trade.
    health.expectErrors('the leads endpoint is stubbed to 500');

    await stubApi(page, { failing: ['/leads'] });
    const quote = new QuotePage(page);

    await quote.goto();
    await waitForApp(page);
    await quote.packageCard(new RegExp(PACKAGE.package_name)).click();
    await quote.startApplicationButton().click();
    await quote.fillDetails();

    await expect(quote.reserveButton()).toBeVisible();
  });

  test('will not reserve without a name and email', async ({ page }) => {
    const api = await stubApi(page);
    const quote = new QuotePage(page);

    await quote.goto();
    await waitForApp(page);
    await quote.packageCard(new RegExp(PACKAGE.package_name)).click();
    await quote.startApplicationButton().click();
    await quote.continueToPaymentButton().click();

    await expect(quote.reserveButton()).toHaveCount(0);
    expect(api.leadPayload()).toBeNull();
  });

  test('reserves the application for someone signed in', async ({ page }) => {
    const api = await stubApi(page, { authenticated: true });
    const quote = new QuotePage(page);

    await quote.goto();
    await waitForApp(page);
    await quote.packageCard(new RegExp(PACKAGE.package_name)).click();
    await quote.startApplicationButton().click();
    await quote.fillDetails();

    await expect(quote.amountDueToday()).toBeVisible();
    await quote.reserveButton().click();

    await expect.poll(() => api.quotePayload(), { timeout: 10_000 }).toMatchObject({
      package_id: PACKAGE.id,
    });
    await expect(page).toHaveURL(/\/dashboard$/);
  });
});

test.describe('the sign-in round trip', () => {
  test('parks the selection and sends a signed-out visitor to sign in', async ({
    page,
  }) => {
    await stubApi(page);
    const quote = new QuotePage(page);

    await quote.goto();
    await waitForApp(page);
    await quote.packageCard(new RegExp(PACKAGE.package_name)).click();
    await quote.startApplicationButton().click();
    await quote.fillDetails();
    await quote.reserveButton().click();

    // returnTo is what brings them back here rather than to a dashboard that
    // has forgotten the whole conversation.
    await expect(page).toHaveURL(/\/auth\?returnTo=%2Fquote|\/auth\?returnTo=\/quote/);

    const parked = await quote.pendingPackage();
    expect(parked).toContain(PACKAGE.id);
  });

  test('finishes the job when they come back', async ({ page }) => {
    const api = await stubApi(page, { authenticated: true });
    const quote = new QuotePage(page);

    await quote.gotoWithPendingPackage(PACKAGE.id);
    await waitForApp(page);

    await expect.poll(() => api.quotePayload(), { timeout: 15_000 }).toMatchObject({
      package_id: PACKAGE.id,
    });
    await expect(page).toHaveURL(/\/dashboard$/);

    // Cleared, or the next visit to /quote silently creates a second quote for
    // a package they already bought.
    expect(await quote.pendingPackage()).toBeNull();
  });

  test('ignores a selection parked too long ago', async ({ page }) => {
    // 24-hour TTL. Resurrecting a day-old choice and quoting on it without
    // asking is worse than forgetting it.
    const api = await stubApi(page, { authenticated: true });
    const quote = new QuotePage(page);

    const twoDaysAgo = Date.now() - 48 * 60 * 60 * 1000;
    await quote.gotoWithPendingPackage(PACKAGE.id, twoDaysAgo);
    await waitForApp(page);

    await expect(quote.packageCard(new RegExp(PACKAGE.package_name))).toBeVisible();
    await page.waitForTimeout(1_000);

    expect(api.quotePayload()).toBeNull();
    await expect(page).toHaveURL(/\/quote$/);
  });

  test('does not resume for someone who is still signed out', async ({ page }) => {
    const api = await stubApi(page);
    const quote = new QuotePage(page);

    await quote.gotoWithPendingPackage(PACKAGE.id);
    await waitForApp(page);
    await page.waitForTimeout(1_000);

    expect(api.quotePayload()).toBeNull();

    // And the selection is still parked — they have not finished signing in,
    // so it must survive for the attempt that does.
    expect(await quote.pendingPackage()).toContain(PACKAGE.id);
  });

  test('leaves the visitor able to retry if resuming fails', async ({ page, health }) => {
    health.expectErrors('the quote endpoint is stubbed to 500');

    const api = await stubApi(page, {
      authenticated: true,
      failing: ['/pricing/quotes'],
    });
    const quote = new QuotePage(page);

    await quote.gotoWithPendingPackage(PACKAGE.id);
    await waitForApp(page);

    // Falls back to preselecting the package rather than stranding them on a
    // page that lost their choice.
    await expect(quote.selectedSubclassBadge(PACKAGE.visa_subclass)).toBeVisible({
      timeout: 15_000,
    });
    await expect(page).toHaveURL(/\/quote$/);
    expect(api.quotePayload()).toBeNull();
  });
});
