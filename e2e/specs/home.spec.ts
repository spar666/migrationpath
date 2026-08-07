import { expect, test, waitForApp } from '../fixtures/test';
import { OCCUPATION, SKILLED_INTENT, stubApi } from '../fixtures/api-stubs';
import { HomePage } from '../pages/home.page';

/**
 * The landing page hero — the site's front door.
 *
 * Everything else already tested here (points, search, quote, the funnel) is
 * downstream of this screen. A visitor who cannot get out of the hero into the
 * right track never reaches any of it, so a regression here costs more than a
 * regression anywhere else and is the least likely to be noticed: the page
 * still renders, still looks right, and simply sends people nowhere.
 *
 * What makes it worth a browser specifically: three of its four states involve
 * no navigation at all. The hero swaps its own contents between `entry`,
 * `skilled-result`, `fast-audit` and `strategy-preview`, so the URL is
 * identical in most of them and proves nothing. Only rendering the thing can
 * tell you which state a visitor ended up in.
 *
 * The intent classifier is the axis these specs vary. One endpoint —
 * GET /search/intent — decides between four different funnels, and each branch
 * is asserted separately because they fail independently and silently.
 */

test.describe('the two-pronged entry', () => {
  test('offers both tracks on arrival', async ({ page }) => {
    // The product's central claim in one assertion. A hero that renders only
    // the search box has quietly dropped every partner and parent visitor,
    // and nothing about the page looks broken.
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

  test('opens the audit in place, and comes back', async ({ page }) => {
    // Deliberately not a navigation: the fallback card swaps the hero's own
    // contents. A spec asserting a URL here would pass against a hero that
    // renders nothing at all.
    await stubApi(page);
    const home = new HomePage(page);

    await home.goto();
    await waitForApp(page);
    await home.auditCardButton().click();

    await expect(home.auditVisaSubclassField()).toBeVisible();
    await expect(home.familyCtaButton()).toHaveCount(0);
    await expect(page).toHaveURL(/\/$/);

    // And back — a dead end here strands the visitor on a form they opened by
    // accident, with the two tracks no longer on screen.
    await home.auditBackButton().click();
    await expect(home.familyCtaButton()).toBeVisible();
  });
});

test.describe('the smart search', () => {
  test('groups suggestions into occupations and courses', async ({ page }) => {
    await stubApi(page);
    const home = new HomePage(page);

    await home.goto();
    await waitForApp(page);
    await home.searchInput().fill('so');

    // Both groups come from the same typed query against two different
    // endpoints. The hint under the box promises an ANZSCO code, a job title,
    // a degree and a university all work — this is the half of that promise a
    // browser can check.
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

  test('STUDENT navigates to the student pathway carrying the query', async ({
    page,
  }) => {
    // The query has to survive the hop. Landing on a bare course page means
    // re-typing, and this is the point in the funnel where people leave.
    await stubApi(page, { intent: 'student' });
    const home = new HomePage(page);

    await home.goto();
    await waitForApp(page);
    await home.submitFreeText('Master of Nursing');

    await expect(page).toHaveURL(/\/pathways\/student\?q=/, { timeout: 10_000 });
    expect(decodeURIComponent(page.url())).toContain('Master of Nursing');
  });

  test('FAMILY navigates to wherever the classifier points', async ({ page }) => {
    // The destination comes from the response, not from a constant in the
    // frontend — so this asserts the app honours `redirectTo` rather than
    // hard-coding a route that the backend may later change.
    await stubApi(page, {
      intent: 'family',
      intentOverrides: { redirectTo: '/parent-audit' },
    });
    const home = new HomePage(page);

    await home.goto();
    await waitForApp(page);
    await home.submitFreeText('sponsor my mother');

    await expect(page).toHaveURL(/\/parent-audit$/, { timeout: 10_000 });
  });

  test('UNKNOWN falls back to the audit rather than a dead end', async ({ page }) => {
    // The most valuable branch, and the easiest to get wrong: someone whose
    // query could not be classified is still a lead. Showing them nothing is
    // the difference between a fallback and a bounce.
    await stubApi(page, { intent: 'unknown' });
    const home = new HomePage(page);

    await home.goto();
    await waitForApp(page);
    await home.submitFreeText('i have no idea what i qualify for');

    await expect(home.auditVisaSubclassField()).toBeVisible({ timeout: 10_000 });
    await expect(page).toHaveURL(/\/$/);
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
