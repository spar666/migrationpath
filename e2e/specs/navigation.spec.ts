import { expect, test, waitForApp } from '../fixtures/test';
import { stubApi } from '../fixtures/api-stubs';
import { AppPage } from '../pages/app.page';

/**
 * Getting around the application.
 *
 * Client-side routing fails in ways server-rendered sites do not: a link that
 * triggers a full page reload instead of a route change, a deep link that 404s
 * because the dev server rewrite is missing, back-button state that does not
 * restore. None of these show up in a unit test, and all of them are obvious
 * to a user.
 */

test.describe('client-side routing', () => {
  test('navigates without a full page reload', async ({ page }) => {
    // The tell: a marker set on window survives a route change and does not
    // survive a reload. If this fails, react-router is being bypassed
    // somewhere — usually a raw <a href> where a <Link> belongs.
    await stubApi(page);
    const app = new AppPage(page);

    await page.goto('/');
    await waitForApp(page);
    await page.evaluate(() => {
      (window as unknown as { __spaMarker?: boolean }).__spaMarker = true;
    });

    await app.revealNav();
    await app.loginLink().click();
    await expect(page).toHaveURL(/\/auth/);

    const survived = await page.evaluate(
      () => (window as unknown as { __spaMarker?: boolean }).__spaMarker === true,
    );
    expect(survived, 'navigation caused a full page reload').toBe(true);
  });

  test('supports deep links to any route', async ({ page }) => {
    // Every one of these is a URL someone will paste into Slack.
    await stubApi(page);
    const app = new AppPage(page);

    for (const path of ['/points-calculator', '/news', '/pathways/skilled', '/quote']) {
      await page.goto(path);
      await waitForApp(page);
      await expect(app.notFoundHeading(), `deep link ${path}`).toHaveCount(0);
    }
  });

  test('restores the previous route on back', async ({ page }) => {
    await stubApi(page);

    await page.goto('/');
    await waitForApp(page);
    await page.goto('/news');
    await waitForApp(page);

    await page.goBack();
    await expect(page).toHaveURL(/\/$/);
  });

  test('survives a reload on a deep route', async ({ page }) => {
    // Catches a missing SPA fallback rewrite — the classic "works until you
    // press F5" deployment bug.
    await stubApi(page);
    const app = new AppPage(page);

    await page.goto('/pathways/employer');
    await waitForApp(page);
    await page.reload();
    await waitForApp(page);

    await expect(app.notFoundHeading()).toHaveCount(0);
  });
});

test.describe('the header', () => {
  test('offers a route home', async ({ page }) => {
    await stubApi(page);

    await page.goto('/news');
    await waitForApp(page);

    await page.locator('header').getByRole('link').first().click();
    await expect(page).toHaveURL(/\/$/);
  });

  test('shows a login link to an anonymous visitor', async ({ page }) => {
    await stubApi(page);
    const app = new AppPage(page);

    await page.goto('/');
    await waitForApp(page);

    // On a phone this lives behind the hamburger, so reaching it is part of
    // the claim: "an anonymous visitor can find the way in" is not satisfied by
    // a link that exists in the DOM and cannot be got at.
    await app.revealNav();
    await expect(app.loginLink()).toBeVisible();
  });
});

test.describe('responsive', () => {
  test('renders the home page on a phone viewport', async ({ page }) => {
    // Most of this funnel's traffic will be phones, and a layout that only
    // works at desktop width is invisible to every other test here.
    await stubApi(page);
    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto('/');
    await waitForApp(page);

    await expect(new AppPage(page).root()).toBeVisible();
    // Nothing should overflow horizontally — the usual symptom of a fixed
    // width sneaking in.
    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    );
    expect(overflows, 'page scrolls horizontally on mobile').toBe(false);
  });

  test('renders the questionnaire on a phone viewport', async ({ page }) => {
    await stubApi(page);
    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto('/pre-screen');
    await waitForApp(page);

    await expect(
      page.getByRole('button', { name: /looking to be sponsored/i }),
    ).toBeVisible();
  });
});
