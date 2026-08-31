import { test, expect, waitForApp } from '../fixtures/test';
import { stubApi } from '../fixtures/api-stubs';
import { PathwayPage, PATHWAYS } from '../pages/pathways.page';
import { AppPage } from '../pages/app.page';

/**
 * The five public pathway landing pages.
 *
 * These are marketing pages, and testing marketing prose is a trap: the copy
 * is meant to change, so a spec that asserts on paragraphs goes red for
 * healthy reasons and gets muted. Muted specs are worse than absent ones.
 *
 * What IS worth pinning is where the buttons go. These five pages are
 * near-identical and get copy-pasted from each other, so a CTA left pointing
 * at another audience's tool — or at a route that no longer exists — looks
 * completely correct on the page and is wrong for everyone who clicks it.
 *
 * That is the bug this file exists to catch, and it is why the check runs
 * across EVERY primary CTA on the page rather than just the first: these pages
 * repeat the CTA top and bottom, and it is the second one that gets forgotten.
 *
 * The primary CTA is asserted per pathway, not as one shared destination. All
 * three pages previously pointed at /pre-screen, so a partner applicant was
 * sent to the employer-sponsored questionnaire from copy promising to ask
 * about their relationship — the exact defect described above, passing.
 */

test.beforeEach(async ({ page }) => {
  await stubApi(page);
});

for (const pathway of PATHWAYS) {
  test.describe(`the ${pathway.name} pathway`, () => {
    test('renders its own hero rather than a blank shell', async ({ page }) => {
      const pathways = new PathwayPage(page);
      await pathways.goto(pathway.path);
      await waitForApp(page);

      await expect(pathways.hero()).toBeVisible();
      await expect(pathways.hero()).toHaveText(pathway.heading);
    });

    test('sits inside the app shell', async ({ page }) => {
      const app = new AppPage(page);
      const pathways = new PathwayPage(page);
      await pathways.goto(pathway.path);
      await waitForApp(page);

      await expect(app.header()).toBeVisible();
      await expect(app.footer()).toBeVisible();
    });

    test('offers a primary CTA', async ({ page }) => {
      const pathways = new PathwayPage(page);
      await pathways.goto(pathway.path);
      await waitForApp(page);

      expect(await pathways.primaryCtaLinks(pathway.primaryCta).count()).toBeGreaterThan(0);
    });

    test('points its secondary CTA at the right tool', async ({ page }) => {
      const pathways = new PathwayPage(page);
      await pathways.goto(pathway.path);
      await waitForApp(page);

      await expect(pathways.secondaryLinks(pathway.secondaryCta).first()).toBeVisible();
    });

    test('the primary CTA actually reaches its funnel', async ({ page }) => {
      const pathways = new PathwayPage(page);
      await pathways.goto(pathway.path);
      await waitForApp(page);

      await pathways.primaryCtaLinks(pathway.primaryCta).first().click();

      await expect(page).toHaveURL(new RegExp(`${pathway.primaryCta}$`));
    });

    test('the secondary CTA actually reaches its tool', async ({ page }) => {
      const pathways = new PathwayPage(page);
      await pathways.goto(pathway.path);
      await waitForApp(page);

      await pathways.secondaryLinks(pathway.secondaryCta).first().click();

      await expect(page).toHaveURL(new RegExp(`${pathway.secondaryCta}$`));
    });

    test('renders on a phone viewport', async ({ page }) => {
      const pathways = new PathwayPage(page);
      await page.setViewportSize({ width: 390, height: 844 });
      await pathways.goto(pathway.path);
      await waitForApp(page);

      await expect(pathways.hero()).toBeVisible();
      // A CTA that scrolls off the side of a phone is a CTA nobody clicks.
      await expect(pathways.primaryCtaLinks(pathway.primaryCta).first()).toBeVisible();
    });
  });
}

test.describe('across the set', () => {
  test('no pathway page still links to a removed route', async ({ page }) => {
    // /auth, /dashboard and /quote were all removed with the user accounts and
    // the pricing tool. A link left behind on one of these five near-identical
    // pages renders perfectly and drops the visitor on the 404 page — which is
    // exactly the kind of thing nobody clicks in review.
    const pathways = new PathwayPage(page);
    const removed = ['/auth', '/dashboard', '/quote'];

    for (const pathway of PATHWAYS) {
      await pathways.goto(pathway.path);
      await waitForApp(page);

      for (const route of removed) {
        await expect(
          page.locator(`a[href^="${route}"]`),
          `${pathway.name} links to ${route}`,
        ).toHaveCount(0);
      }
    }
  });
});
