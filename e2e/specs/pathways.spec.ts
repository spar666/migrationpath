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
 * What IS worth pinning is the part a copy edit can break invisibly — the
 * `persona` query parameter on every signup CTA. It decides which funnel a new
 * account lands in, it is not rendered anywhere a human would notice, and
 * these five pages are near-identical, so they get copy-pasted from each
 * other. A partner page whose CTA says `persona=skilled` looks completely
 * correct and routes every partner signup into the wrong journey.
 *
 * That is the bug this file exists to catch, and it is why the persona check
 * runs across EVERY signup link on the page rather than just the first: these
 * pages repeat the CTA top and bottom, and it is the second one that gets
 * forgotten.
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

    test('offers a signup CTA', async ({ page }) => {
      const pathways = new PathwayPage(page);
      await pathways.goto(pathway.path);
      await waitForApp(page);

      expect(await pathways.signupLinks().count()).toBeGreaterThan(0);
    });

    test(`tags every signup CTA with persona=${pathway.persona}`, async ({ page }) => {
      const pathways = new PathwayPage(page);
      await pathways.goto(pathway.path);
      await waitForApp(page);

      const all = pathways.signupLinks();
      const count = await all.count();
      expect(count).toBeGreaterThan(0);

      for (let i = 0; i < count; i++) {
        await expect(all.nth(i)).toHaveAttribute(
          'href',
          new RegExp(`persona=${pathway.persona}(\\b|$|&)`),
        );
      }
    });

    test('points its secondary CTA at the right tool', async ({ page }) => {
      const pathways = new PathwayPage(page);
      await pathways.goto(pathway.path);
      await waitForApp(page);

      await expect(pathways.secondaryLinks(pathway.secondaryCta).first()).toBeVisible();
    });

    test('the signup CTA actually reaches the auth page', async ({ page }) => {
      const pathways = new PathwayPage(page);
      await pathways.goto(pathway.path);
      await waitForApp(page);

      await pathways.signupLinks().first().click();

      await expect(page).toHaveURL(/\/auth\?/);
      await expect(page).toHaveURL(new RegExp(`persona=${pathway.persona}`));
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
      await expect(pathways.signupLinks().first()).toBeVisible();
    });
  });
}

test.describe('across the set', () => {
  test('no two pathways share a persona', async ({ page }) => {
    // The copy-paste failure, checked once at the top rather than five times.
    // If two pages claim the same persona, one of them is wrong.
    const personas = PATHWAYS.map((p) => p.persona);

    expect(new Set(personas).size).toBe(personas.length);
    void page;
  });

  test('each page claims only its own persona', async ({ page }) => {
    const pathways = new PathwayPage(page);

    for (const pathway of PATHWAYS) {
      await pathways.goto(pathway.path);
      await waitForApp(page);

      for (const other of PATHWAYS) {
        if (other.persona === pathway.persona) continue;
        // `onshore-skilled` contains `skilled`, so match the full parameter.
        await expect(
          page.locator(`a[href*="persona=${other.persona}&"], a[href$="persona=${other.persona}"]`),
        ).toHaveCount(0);
      }
    }
  });
});
