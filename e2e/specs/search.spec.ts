import { expect, test, waitForApp } from '../fixtures/test';
import { OCCUPATION, OTHER_OCCUPATION, stubApi } from '../fixtures/api-stubs';
import { SearchPage } from '../pages/search.page';

/**
 * Occupation search and the eligibility card it produces.
 *
 * The card is the closest thing on the site to advice: it tells someone which
 * skilled visas their occupation opens. Getting it wrong in the optimistic
 * direction — showing a 189 to someone whose occupation is not on the MLTSSL —
 * sends them down a pathway they cannot finish, so the eligibility mapping is
 * asserted against both an on-list and an off-list occupation rather than just
 * the happy one.
 *
 * Note that filtering happens in the browser against a list fetched once. The
 * typed query never reaches the server for the Occupations section, so these
 * specs stub the full list and let the component do the work — which is what
 * production does too.
 */

test.describe('the search box', () => {
  test('stays quiet until there is enough to search on', async ({ page }) => {
    await stubApi(page);
    const search = new SearchPage(page);

    await search.goto();
    await waitForApp(page);

    await search.input().fill('s');
    // Deliberately a fixed wait: the assertion is that nothing appears, and
    // there is no positive signal to poll for. Longer than both debounces.
    await page.waitForTimeout(900);

    await expect(search.dropdown()).toHaveCount(0);
  });

  test('narrows the list to what was typed', async ({ page }) => {
    await stubApi(page);
    const search = new SearchPage(page);

    await search.goto();
    await waitForApp(page);
    await search.input().fill('software');

    await expect(search.suggestion(/Software Engineer/i).first()).toBeVisible({
      timeout: 10_000,
    });

    // The real assertion. Both occupations are in the fetched list, so a
    // component that stopped filtering would still look correct on the row
    // above — and only this line would notice.
    await expect(search.suggestion(/Registered Nurse/i)).toHaveCount(0);
  });

  test('matches on ANZSCO code as well as title', async ({ page }) => {
    // People arrive with a code from a skills assessment far more often than
    // with the exact ANZSCO wording of their job.
    await stubApi(page);
    const search = new SearchPage(page);

    await search.goto();
    await waitForApp(page);
    await search.input().fill(OTHER_OCCUPATION.anzsco_code);

    await expect(search.suggestion(/Registered Nurse/i).first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test('keeps general results in their own section', async ({ page }) => {
    await stubApi(page);
    const search = new SearchPage(page);

    await search.goto();
    await waitForApp(page);
    await search.input().fill('engineer');

    await expect(search.occupationsSection()).toBeVisible({ timeout: 10_000 });
    // Backed by a different endpoint with a longer debounce, so it arrives
    // second and needs its own wait rather than riding on the one above.
    await expect(search.generalResultsSection()).toBeVisible({ timeout: 10_000 });
  });

  /**
   * Currently unreachable, and this test is the record of why.
   *
   * The dropdown only renders when there are results or a request is in
   * flight; the "no matches" message inside it only renders when there are no
   * results and nothing is in flight. The two conditions cannot both hold, so
   * a search that matches nothing shows nothing at all — the panel simply
   * disappears, which reads to a visitor as a broken control rather than an
   * answer.
   *
   * Un-skip once OccupationSearchTool's render condition admits the empty
   * case. The assertion below is what it should do.
   */
  test.fixme('tells the visitor when nothing matched', async ({ page }) => {
    await stubApi(page, { empty: true });
    const search = new SearchPage(page);

    await search.goto();
    await waitForApp(page);
    await search.input().fill('zzzznotanoccupation');

    await expect(search.noMatches()).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('the eligibility card', () => {
  test('opens every pathway for an occupation on the MLTSSL', async ({ page }) => {
    await stubApi(page);
    const search = new SearchPage(page);

    await search.goto();
    await waitForApp(page);
    await search.input().fill('software');
    await search.suggestion(/Software Engineer/i).first().click();

    await expect(search.eligibilityCard()).toBeVisible();

    // MLTSSL qualifies for all three, so anything less than three is a
    // regression in the mapping rather than in the data.
    await expect(search.visaCount()).toHaveText(/3 Visas Available/);
    await expect(search.visaRow('189')).toBeVisible();
    await expect(search.visaRow('190')).toBeVisible();
    await expect(search.visaRow('491')).toBeVisible();

    // The assessing authority is the single most consequential field on this
    // card — it decides who the visitor pays and how long they wait.
    await expect(
      search.assessingAuthority(new RegExp(OCCUPATION.assessing_authority)),
    ).toBeVisible();

    await expect(search.listBadge('MLTSSL')).toBeVisible();
  });

  test('does not offer a 189 to an occupation that is only on the STSOL', async ({
    page,
  }) => {
    // The commercially tempting mistake, and the expensive one: a 189 is the
    // pathway people want, and telling an STSOL-only occupation they have it
    // costs them a skills assessment and months before anyone corrects it.
    await stubApi(page);
    const search = new SearchPage(page);

    await search.goto();
    await waitForApp(page);
    await search.input().fill('nurse');
    await search.suggestion(/Registered Nurse/i).first().click();

    await expect(search.eligibilityCard()).toBeVisible();
    await expect(search.visaCount()).toHaveText(/2 Visas Available/);
    await expect(search.listBadge('STSOL')).toBeVisible();
  });

  test('sends an interested visitor into the funnel', async ({ page }) => {
    await stubApi(page);
    const search = new SearchPage(page);

    await search.goto();
    await waitForApp(page);
    await search.input().fill('software');
    await search.suggestion(/Software Engineer/i).first().click();

    await search.startAssessmentButton().click();
    await expect(page).toHaveURL(/\/consultation$/);
  });
});

test.describe('when the occupation list cannot be loaded', () => {
  test('the page still works instead of white-screening', async ({ page, health }) => {
    health.expectErrors('the occupations endpoint is stubbed to 500');

    await stubApi(page, { failing: ['/occupations'] });
    const search = new SearchPage(page);

    await search.goto();
    await waitForApp(page);

    // The page's own content is still there — the search box is a component
    // on it, not the whole thing, and a failed fetch should cost the visitor
    // the suggestions and nothing else.
    await expect(search.input()).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});
