import { expect, test, waitForApp } from '../fixtures/test';
import { OCCUPATION, SKILLED_INTENT, stubApi } from '../fixtures/api-stubs';
import { HomePage } from '../pages/home.page';

/**
 * The landing page hero — the site's front door.
 *
 * Everything else already tested here (points, search, the funnel) is
 * downstream of this screen. A visitor who cannot get out of the hero into the
 * right track never reaches any of it, so a regression here costs more than a
 * regression anywhere else and is the least likely to be noticed: the page
 * still renders, still looks right, and simply sends people nowhere.
 *
 * What makes it worth a browser specifically: the SKILLED result involves no
 * navigation at all. The hero swaps its own contents between `entry` and
 * `skilled-result`, so the URL is identical in both and proves nothing. Only
 * rendering the thing can tell you which state a visitor ended up in.
 *
 * The intent classifier is the axis these specs vary. One endpoint —
 * GET /search/intent — decides between four different funnels, and each branch
 * is asserted separately because they fail independently and silently.
 */

test.describe('the two-pronged entry', () => {
  test('offers both tracks on arrival', async ({ page }) => {
    // The product's central claim in one assertion. A hero that renders only
    // the search box has quietly dropped every partner visitor, and nothing
    // about the page looks broken.
    await stubApi(page);
    const home = new HomePage(page);

    await home.goto();
    await waitForApp(page);

    await expect(home.headline()).toBeVisible();
    await expect(home.workAndStudyHeading()).toBeVisible();
    await expect(home.searchInput()).toBeVisible();
    await expect(home.familyAndPartnerHeading()).toBeVisible();
    await expect(home.familyCtaButton()).toBeVisible();
    await expect(home.auditCardButton()).toBeVisible();
  });

  test('sends the family track straight to the partner audit', async ({ page }) => {
    // "Skip the career tools" is the promise this button makes. Routing it
    // through the search or the generic funnel would break the one thing the
    // second column exists to do.
    await stubApi(page);
    const home = new HomePage(page);

    await home.goto();
    await waitForApp(page);
    await home.familyCtaButton().click();

    await expect(page).toHaveURL(/\/partner-audit$/);
  });

  test('sends an unsure visitor to the get-started splitter', async ({ page }) => {
    // This card used to open a five-question onshore audit inside the hero.
    // The audit is gone; the card now navigates, and where it navigates is the
    // whole assertion — a visitor who says "I don't know" is still a lead, and
    // dropping them is the difference between a fallback and a bounce.
    await stubApi(page);
    const home = new HomePage(page);

    await home.goto();
    await waitForApp(page);
    await home.auditCardButton().click();

    await expect(page).toHaveURL(/\/get-started$/);
  });
});

test.describe('the smart search', () => {
  test('groups suggestions under an occupations heading', async ({ page }) => {
    await stubApi(page);
    const home = new HomePage(page);

    await home.goto();
    await waitForApp(page);
    await home.searchInput().fill('so');

    // Occupations are the only group now — the "Courses / Degrees" group went
    // with the course module. The labelled heading is still asserted because
    // the panel renders it separately from the rows, and a heading that stops
    // rendering leaves an unlabelled list rather than an error.
    await expect(home.occupationsGroup()).toBeVisible({ timeout: 10_000 });
    await expect(home.suggestion(/Software Engineer/)).toBeVisible();
  });

  test('resolves a chosen occupation by its ANZSCO code, not its title', async ({
    page,
  }) => {
    // The subtle contract in SmartSearch.commit(): the box DISPLAYS the title
    // and RESOLVES the code. A code classifies to exactly one occupation; a
    // title is ambiguous and can classify as UNKNOWN, which would drop a
    // perfectly good skilled lead into the generic audit.
    const api = await stubApi(page);
    const home = new HomePage(page);

    await home.goto();
    await waitForApp(page);
    await home.searchInput().fill('software');
    await home.suggestion(/Software Engineer/).first().click();

    await expect.poll(() => api.intentQuery(), { timeout: 10_000 }).toBe(
      OCCUPATION.anzsco_code,
    );

    // The visitor still sees the human-readable title in the box.
    await expect(home.searchInput()).toHaveValue('Software Engineer');
  });

  test('accepts free text on Enter', async ({ page }) => {
    // The escape hatch for everything the suggestion list does not contain,
    // which on a list of a few hundred occupations is most real queries.
    const api = await stubApi(page);
    const home = new HomePage(page);

    await home.goto();
    await waitForApp(page);
    await home.submitFreeText('aged care worker');

    await expect.poll(() => api.intentQuery(), { timeout: 10_000 }).toBe(
      'aged care worker',
    );
  });

  test('ignores an empty submit', async ({ page }) => {
    const api = await stubApi(page);
    const home = new HomePage(page);

    await home.goto();
    await waitForApp(page);
    await home.searchInput().press('Enter');
    await page.waitForTimeout(500);

    expect(api.intentQuery()).toBeNull();
    await expect(home.workAndStudyHeading()).toBeVisible();
  });
});

test.describe('where each intent sends the visitor', () => {
  test('SKILLED renders the split-screen without leaving the page', async ({
    page,
  }) => {
    const api = await stubApi(page, { intent: 'skilled' });
    const home = new HomePage(page);

    await home.goto();
    await waitForApp(page);
    await home.submitFreeText('261313');

    await expect(
      home.skilledOccupationHeading(new RegExp(SKILLED_INTENT.occupation.title)),
    ).toBeVisible({ timeout: 10_000 });

    // Both streams are always rendered, including the empty one. Hiding a
    // stream with no options would let someone conclude it was never assessed.
    await expect(home.pointsTestedCard()).toBeVisible();
    await expect(home.employerSponsoredCard()).toBeVisible();
    await expect(home.visaOption('189')).toBeVisible();
    await expect(home.noEligibilityNotice()).toBeVisible();

    // Still on the home route, and the entry state is gone.
    await expect(page).toHaveURL(/\/$/);
    await expect(home.familyCtaButton()).toHaveCount(0);

    expect(api.intentQuery()).toBe('261313');
  });

  test('a new search returns to the two tracks', async ({ page }) => {
    await stubApi(page, { intent: 'skilled' });
    const home = new HomePage(page);

    await home.goto();
    await waitForApp(page);
    await home.submitFreeText('261313');
    await expect(home.pointsTestedCard()).toBeVisible({ timeout: 10_000 });

    await home.newSearchButton().click();

    await expect(home.workAndStudyHeading()).toBeVisible();
    await expect(home.familyCtaButton()).toBeVisible();
    // The box is cleared too — a stale query behind a fresh entry screen is
    // how a second search silently re-runs the first.
    await expect(home.searchInput()).toHaveValue('');
  });

  test('STUDENT falls through to the splitter, not a deleted page', async ({
    page,
  }) => {
    // The classifier still answers STUDENT — it does not know the student
    // pathway page and the course module are gone. Following it would 404, so
    // a student query is routed like an unclassified one. The stub returns the
    // old STUDENT payload on purpose; the app must not act on it.
    await stubApi(page, { intent: 'student' });
    const home = new HomePage(page);

    await home.goto();
    await waitForApp(page);
    await home.submitFreeText('Master of Nursing');

    await expect(page).toHaveURL(/\/get-started$/, { timeout: 10_000 });
  });

  test('FAMILY goes to the partner audit, ignoring a stale redirectTo', async ({
    page,
  }) => {
    // The app used to follow the classifier's `redirectTo`. It cannot any
    // more: the backend still answers a parent-visa query with /parent-audit,
    // and that route was deleted with the parent funnel. Honouring it would
    // 404 the visitor at the exact moment they told us what they wanted, so
    // the stub returns the stale route on purpose and the app must not follow.
    await stubApi(page, {
      intent: 'family',
      intentOverrides: { redirectTo: '/parent-audit' },
    });
    const home = new HomePage(page);

    await home.goto();
    await waitForApp(page);
    await home.submitFreeText('sponsor my mother');

    await expect(page).toHaveURL(/\/partner-audit$/, { timeout: 10_000 });
  });

  test('UNKNOWN falls back to the splitter rather than a dead end', async ({ page }) => {
    // The most valuable branch, and the easiest to get wrong: someone whose
    // query could not be classified is still a lead. Showing them nothing is
    // the difference between a fallback and a bounce.
    await stubApi(page, { intent: 'unknown' });
    const home = new HomePage(page);

    await home.goto();
    await waitForApp(page);
    await home.submitFreeText('i have no idea what i qualify for');

    await expect(page).toHaveURL(/\/get-started$/, { timeout: 10_000 });
  });
});

test.describe('when the classifier is down', () => {
  test('leaves the visitor on the tracks instead of a blank hero', async ({
    page,
    health,
  }) => {
    health.expectErrors('the intent endpoint is stubbed to 500');

    await stubApi(page, { failing: ['/search/intent'] });
    const home = new HomePage(page);

    await home.goto();
    await waitForApp(page);
    await home.submitFreeText('261313');

    // The hook swallows the failure into `error` and leaves flowState at
    // `entry`. That is the right behaviour, but it means the only visible
    // outcome is "nothing happened" — so what must hold is that the entry
    // state is still intact and the other track still works.
    await expect(home.workAndStudyHeading()).toBeVisible();
    await expect(home.familyCtaButton()).toBeVisible();

    await home.familyCtaButton().click();
    await expect(page).toHaveURL(/\/partner-audit$/);
  });
});
