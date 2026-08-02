import { expect, test, waitForApp } from '../fixtures/test';
import { stubApi } from '../fixtures/api-stubs';
import { AppPage, ROUTES } from '../pages/app.page';

/**
 * Every route renders.
 *
 * The cheapest high-value suite in the project. It asserts almost nothing about
 * what a page says — only that it is alive: React mounted, no uncaught
 * exception, no console error, no error boundary, and some content of its own.
 *
 * That sounds weak and is not. The failures it catches are the ones that take a
 * whole route down and are invisible to targeted assertions: a bad import after
 * a refactor, a null-deref on a field the API stopped sending, a hook order
 * violation, a context provider removed from the tree. Those ship green through
 * a unit suite and white-screen in production.
 *
 * The health assertions come from the `health` fixture and run automatically
 * after every test, so they are not visible in the bodies below.
 */

test.describe('route smoke', () => {
  for (const route of ROUTES) {
    test(`${route.name} renders`, async ({ page, health }) => {
      await stubApi(page);
      const app = new AppPage(page);

      await page.goto(route.path);
      await waitForApp(page);

      // Something of the app's own, not just the shell.
      await expect(app.root()).toBeVisible();
      await expect(app.errorBoundary()).toHaveCount(0);

      // A route that fell through to the 404 is a routing regression, and the
      // symptom otherwise looks identical to a working page.
      if (!route.needsQuery) {
        await expect(app.notFoundHeading()).toHaveCount(0);
      }

      expect(health.crashes(), 'uncaught exceptions').toEqual([]);
    });
  }
});

test.describe('the 404', () => {
  test('is reached by an unknown path, and only by one', async ({ page }) => {
    await stubApi(page);
    const app = new AppPage(page);

    await page.goto('/definitely-not-a-route');
    await waitForApp(page);

    await expect(app.notFoundHeading()).toBeVisible();
  });

  test('does not swallow a nested known route', async ({ page }) => {
    // /pathways/skilled is two segments; a greedy catch-all would eat it.
    await stubApi(page);
    const app = new AppPage(page);

    await page.goto('/pathways/skilled');
    await waitForApp(page);

    await expect(app.notFoundHeading()).toHaveCount(0);
  });
});

test.describe('the app shell', () => {
  test('puts a header and footer on a content page', async ({ page }) => {
    await stubApi(page);
    const app = new AppPage(page);

    await page.goto('/');
    await waitForApp(page);

    await expect(app.header()).toBeVisible();
    await expect(app.footer()).toBeVisible();
  });

  test('leaves them OFF the funnel entry, which is deliberate', async ({ page }) => {
    // Every link out of the pre-screen is a lead that does not finish it. The
    // page is chrome-free on purpose, so this asserts the absence.
    await stubApi(page);
    const app = new AppPage(page);

    await page.goto('/pre-screen');
    await waitForApp(page);

    await expect(app.header()).toHaveCount(0);
    await expect(app.footer()).toHaveCount(0);
  });

  test('excludes the funnel entry from search indexes', async ({ page }) => {
    await stubApi(page);
    await page.goto('/pre-screen');
    await waitForApp(page);

    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      'content',
      /noindex/,
    );
  });

  test('does NOT leave that robots tag behind on the next page', async ({ page }) => {
    // This is an SPA: a tag left in <head> would follow the visitor around and
    // silently deindex the marketing site. The unit suite covers the unmount
    // path; this proves it across a real navigation.
    await stubApi(page);

    await page.goto('/pre-screen');
    await waitForApp(page);
    await expect(page.locator('meta[name="robots"]')).toHaveCount(1);

    await page.goto('/');
    await waitForApp(page);
    await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
  });
});

test.describe('authenticated routes', () => {
  test('sends an anonymous visitor away from the dashboard', async ({ page }) => {
    await stubApi(page);

    await page.goto('/dashboard');
    await waitForApp(page);

    await expect(page).toHaveURL(/\/auth/);
  });

  test('lets a signed-in visitor reach it', async ({ page }) => {
    await stubApi(page, { authenticated: true });

    await page.goto('/dashboard');
    await waitForApp(page);

    await expect(page).not.toHaveURL(/\/auth/);
  });
});
