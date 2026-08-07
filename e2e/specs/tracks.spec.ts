import { test, expect, waitForApp } from '../fixtures/test';
import { stubApi, OCCUPATION, OTHER_OCCUPATION } from '../fixtures/api-stubs';
import { HomePage } from '../pages/home.page';
import {
  AuditPage,
  VISA_OPTIONS,
  EXPERIENCE_OPTIONS,
  RELATIONSHIP_OPTIONS,
  SPONSOR_OPTIONS,
} from '../pages/audit.page';

/**
 * The two home page tracks, driven field by field.
 *
 * The existing home spec covers the entry cards and where each track POINTS.
 * This one covers what happens after: the 60-Second Strategy Audit behind
 * them, every option in every field, and the numbers the strategy preview
 * derives from those answers.
 *
 * Those numbers are the reason this file is worth its length. The preview
 * computes a points total, a PR countdown and a visa pathway entirely on the
 * client, from lookup tables in StrategyPreviewCard — no API involved. A
 * visitor reads "85 / 100, 190 Eligible" as a finding about their case. If a
 * band in that table is edited, nothing fails, nothing logs, and the site
 * quietly starts telling a cohort of people they qualify for a visa they do
 * not. Every band is therefore checked against its expected output.
 *
 * Two findings are pinned rather than endorsed — see `documented quirks` at
 * the bottom. Both are live behaviour worth someone's attention.
 */

/** The audit is reachable directly from the entry card, without searching. */
async function openAudit(page: Parameters<typeof stubApi>[0]) {
  const home = new HomePage(page);
  await home.goto();
  await waitForApp(page);
  await home.auditCardButton().click();
}

test.describe('reaching the audit', () => {
  test.beforeEach(async ({ page }) => {
    await stubApi(page);
  });

  test('opens from the fallback card without leaving the page', async ({ page }) => {
    const home = new HomePage(page);
    const audit = new AuditPage(page);
    await home.goto();
    await waitForApp(page);

    await home.auditCardButton().click();

    await expect(audit.goalHeading()).toBeVisible();
    await expect(page).toHaveURL(/\/$/);
  });

  test('opens when the classifier cannot place the query', async ({ page }) => {
    // UNKNOWN intent falls back to the audit rather than a dead end — the hero
    // overrides the router's default redirect to do this in place.
    await stubApi(page, { intent: 'unknown' });
    const home = new HomePage(page);
    const audit = new AuditPage(page);
    await home.goto();
    await waitForApp(page);

    await home.submitFreeText('help me i have no idea');

    await expect(audit.goalHeading()).toBeVisible();
  });

  test('offers all three goals', async ({ page }) => {
    const audit = new AuditPage(page);
    await openAudit(page);

    await expect(audit.skilledGoal()).toBeVisible();
    await expect(audit.studentGoal()).toBeVisible();
    await expect(audit.familyGoal()).toBeVisible();
  });

  test('returns to the entry state from the goal step', async ({ page }) => {
    // The goal step's "← Back" is the hero's own `onBack`, which restores the
    // two-track entry rather than stepping within the form.
    const home = new HomePage(page);
    await openAudit(page);

    await home.auditBackButton().click();

    await expect(home.workAndStudyHeading()).toBeVisible();
    await expect(home.familyAndPartnerHeading()).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Work & Study Track — the skilled branch
// ---------------------------------------------------------------------------

test.describe('Work & Study Track: the fields', () => {
  test.beforeEach(async ({ page }) => {
    await stubApi(page);
  });

  test('opens the skilled branch with nothing filled in', async ({ page }) => {
    const audit = new AuditPage(page);
    await openAudit(page);

    await audit.skilledGoal().click();

    await expect(audit.skilledHeading()).toBeVisible();
    await expect(audit.remainingCounter()).toHaveText('3 to go');
  });

  test('keeps the submit disabled until all three are answered', async ({ page }) => {
    const audit = new AuditPage(page);
    await openAudit(page);
    await audit.skilledGoal().click();

    await expect(audit.strategyButton()).toBeDisabled();

    await audit.choose(0, '482 - Temporary Skill Shortage');
    await expect(audit.strategyButton()).toBeDisabled();
    await expect(audit.remainingCounter()).toHaveText('2 to go');

    await audit.choose(1, 'Software Engineer');
    await expect(audit.strategyButton()).toBeDisabled();
    await expect(audit.remainingCounter()).toHaveText('1 to go');

    await audit.choose(2, '5+ years');
    await expect(audit.remainingCounter()).toHaveText('Ready!');
    await expect(audit.strategyButton()).toBeEnabled();
  });

  test('loads the occupation list from the API rather than hardcoding it', async ({ page }) => {
    const audit = new AuditPage(page);
    await openAudit(page);
    await audit.skilledGoal().click();

    await audit.selectAt(1).click();

    await expect(page.getByRole('option', { name: OCCUPATION.title })).toBeVisible();
    await expect(
      page.getByRole('option', { name: OTHER_OCCUPATION.title }),
    ).toBeVisible();
  });

  test('fetches occupations only when the skilled branch is reached', async ({ page }) => {
    // The fetch is lazy — a visitor who picks the family branch should never
    // pay for the occupation list.
    const recorder = await stubApi(page);
    const audit = new AuditPage(page);
    await openAudit(page);

    expect(recorder.requests().filter((r) => r === '/occupations')).toHaveLength(0);

    await audit.skilledGoal().click();
    await audit.selectAt(1).click();

    await expect
      .poll(() => recorder.requests().filter((r) => r === '/occupations').length)
      .toBeGreaterThan(0);
  });

  test('survives the occupation list failing to load', async ({ page, health }) => {
    // `.catch(() => setOccupationOptions([]))` — the branch must stay usable
    // enough to show that it is broken, rather than white-screening.
    health.expectErrors('the occupation fetch fails');
    await stubApi(page, { failing: ['/occupations'] });
    const audit = new AuditPage(page);
    await openAudit(page);

    await audit.skilledGoal().click();

    await expect(audit.skilledHeading()).toBeVisible();
    await expect(audit.strategyButton()).toBeDisabled();
  });

  for (const visa of VISA_OPTIONS) {
    test(`accepts the "${visa.label}" visa option`, async ({ page }) => {
      const audit = new AuditPage(page);
      await openAudit(page);
      await audit.skilledGoal().click();

      await audit.choose(0, visa.label);

      await expect(audit.selectAt(0)).toContainText(visa.label);
      await expect(audit.remainingCounter()).toHaveText('2 to go');
    });
  }

  for (const exp of EXPERIENCE_OPTIONS) {
    test(`accepts the "${exp.label}" experience band`, async ({ page }) => {
      const audit = new AuditPage(page);
      await openAudit(page);
      await audit.skilledGoal().click();

      await audit.choose(2, exp.label);

      await expect(audit.selectAt(2)).toContainText(exp.label);
    });
  }

  test('lets a visitor change their mind about an answer', async ({ page }) => {
    const audit = new AuditPage(page);
    await openAudit(page);
    await audit.skilledGoal().click();

    await audit.choose(0, '482 - Temporary Skill Shortage');
    await audit.choose(0, '485 - Temporary Graduate');

    await expect(audit.selectAt(0)).toContainText('485');
    // Re-answering must not double-count towards completion.
    await expect(audit.remainingCounter()).toHaveText('2 to go');
  });

  test('goes back to the goal step and forgets nothing it should not', async ({ page }) => {
    const audit = new AuditPage(page);
    await openAudit(page);
    await audit.skilledGoal().click();
    await audit.choose(0, '482 - Temporary Skill Shortage');

    await audit.changeGoalLink().click();

    await expect(audit.goalHeading()).toBeVisible();
  });
});

test.describe('Work & Study Track: submitting', () => {
  test('shows a working state while analysing', async ({ page }) => {
    // There is a deliberate 700ms pause before the preview. Without a visible
    // working state that reads as a dead button and gets clicked again.
    await stubApi(page);
    const audit = new AuditPage(page);
    await openAudit(page);
    await audit.skilledGoal().click();
    await audit.fillSkilled();

    await audit.strategyButton().click();

    await expect(audit.analyzingLabel()).toBeVisible();
  });

  test('disables the button while analysing, so it cannot be double-submitted', async ({
    page,
  }) => {
    await stubApi(page);
    const audit = new AuditPage(page);
    await openAudit(page);
    await audit.skilledGoal().click();
    await audit.fillSkilled();

    await audit.strategyButton().click();

    await expect(audit.strategyButton()).toBeDisabled();
  });

  test('lands on the strategy preview', async ({ page }) => {
    await stubApi(page);
    const audit = new AuditPage(page);
    await openAudit(page);
    await audit.skilledGoal().click();
    await audit.fillSkilled();
    await audit.strategyButton().click();

    await expect(audit.previewHeading()).toBeVisible({ timeout: 15_000 });
  });

  test('never navigates away from the home page to do it', async ({ page }) => {
    await stubApi(page);
    const audit = new AuditPage(page);
    await openAudit(page);
    await audit.skilledGoal().click();
    await audit.fillSkilled();
    await audit.strategyButton().click();
    await audit.previewHeading().waitFor({ timeout: 15_000 });

    await expect(page).toHaveURL(/\/$/);
  });
});

test.describe('Work & Study Track: what the preview computes', () => {
  /** Runs the skilled branch end to end with a given visa and experience. */
  async function preview(
    page: Parameters<typeof stubApi>[0],
    opts: { visa?: string; experience?: string } = {},
  ) {
    const audit = new AuditPage(page);
    await openAudit(page);
    await audit.skilledGoal().click();
    await audit.fillSkilled(opts);
    await audit.strategyButton().click();
    await audit.previewHeading().waitFor({ timeout: 15_000 });
    return audit;
  }

  for (const exp of EXPERIENCE_OPTIONS) {
    test(`"${exp.label}" scores ${exp.total} and offers a ${exp.visa}`, async ({ page }) => {
      // The whole table, band by band. These numbers are computed on the
      // client from a lookup nobody re-reads; if a row is edited, this is the
      // only thing that notices.
      await stubApi(page);
      const audit = await preview(page, { experience: exp.label });

      await expect(audit.pointsOutOf()).toBeVisible();
      await expect(page.getByText(String(exp.total), { exact: true }).first()).toBeVisible();
      await expect(audit.pathwayBadge()).toHaveText(`${exp.visa} Eligible`);
    });

    test(`"${exp.label}" offers +${exp.boost} points of upside`, async ({ page }) => {
      await stubApi(page);
      const audit = await preview(page, { experience: exp.label });

      await expect(audit.pointsBoost()).toContainText(`+${exp.boost} potential points`);
    });
  }

  test('only the top band unlocks the 190', async ({ page }) => {
    // The pathway flips at 85 points, which exactly one band reaches. Getting
    // this boundary wrong tells a large cohort they qualify for a state
    // nomination stream they do not.
    await stubApi(page);
    const audit = await preview(page, { experience: '3-5 years' });

    await expect(audit.pathwayBadge()).toHaveText('491 Eligible');
    await expect(audit.pathwayBadge()).not.toHaveText('190 Eligible');
  });

  test('a 482 holder’s PR countdown shortens with experience', async ({ page }) => {
    await stubApi(page);
    const audit = await preview(page, {
      visa: '482 - Temporary Skill Shortage',
      experience: 'Less than 1 year',
    });

    // 36 months minus 6 for the shortest band.
    await expect(audit.prCountdownValue()).toHaveText('30 months');
  });

  test('a 482 holder past the threshold is not shown a negative countdown', async ({
    page,
  }) => {
    // The arithmetic goes negative for the top bands and is clamped to zero.
    // An unclamped "-36 months away from PR" would be nonsense on the page.
    await stubApi(page);
    const audit = await preview(page, {
      visa: '482 - Temporary Skill Shortage',
      experience: '5+ years',
    });

    await expect(audit.prCountdownValue()).toHaveText('0 months');
  });

  test('a non-482 visa gets the flat 24-month countdown', async ({ page }) => {
    await stubApi(page);
    const audit = await preview(page, {
      visa: '485 - Temporary Graduate',
      experience: 'Less than 1 year',
    });

    await expect(audit.prCountdownValue()).toHaveText('24 months');
  });

  test('names the states the occupation is actually open in', async ({ page }) => {
    await stubApi(page);
    const audit = await preview(page);

    await expect(audit.stateNominationDetail()).toContainText(/NSW/);
  });

  test('leaves out a state that is flagged unavailable', async ({ page }) => {
    // `thresholds.filter(t => t.is_available !== false)` — listing a closed
    // state as open is worse than listing none.
    await stubApi(page);
    const audit = await preview(page);

    await expect(audit.stateNominationDetail()).not.toContainText(/TAS/);
  });

  test('falls back to generic advice when there are no thresholds', async ({ page }) => {
    await stubApi(page, { occupationDetail: { thresholds: [] } });
    const audit = await preview(page);

    await expect(audit.stateNominationDetail()).toContainText(
      /check state nomination lists/i,
    );
  });

  test('flags a high-priority occupation', async ({ page }) => {
    await stubApi(page, { occupationDetail: { is_high_priority: true } });
    const audit = await preview(page);

    await expect(audit.prioritySectorBadge()).toBeVisible();
  });

  test('also honours the fast-track priority flag', async ({ page }) => {
    // Two independent flags mean the same thing here. A spec that only knew
    // about one would pass while the other silently stopped working.
    await stubApi(page, {
      occupationDetail: { is_high_priority: false, priority_status: 'fast-track' },
    });
    const audit = await preview(page);

    await expect(audit.prioritySectorBadge()).toBeVisible();
  });

  test('does not flag an ordinary occupation as priority', async ({ page }) => {
    await stubApi(page);
    const audit = await preview(page);

    await expect(audit.prioritySectorBadge()).toHaveCount(0);
  });

  test('still renders when the occupation lookup fails', async ({ page, health }) => {
    health.expectErrors('the occupation detail fetch fails');
    await stubApi(page, { failing: ['/occupations/'] });
    const audit = await preview(page);

    await expect(audit.previewHeading()).toBeVisible();
    await expect(audit.stateNominationDetail()).toContainText(
      /check state nomination lists/i,
    );
  });

  test('saves the strategy and opens the tracker', async ({ page }) => {
    await stubApi(page, { authenticated: true });
    const audit = await preview(page);

    await audit.saveStrategyButton().click();

    await expect(page).toHaveURL(/\/dashboard\?pathway=onshore-skilled/);
  });

  test('carries the audit into session storage for the tracker to read', async ({
    page,
  }) => {
    // The dashboard is a full navigation away, so the numbers have to survive
    // the trip somewhere. If this key stops being written the tracker opens
    // empty and nothing errors.
    await stubApi(page, { authenticated: true });
    const audit = await preview(page, { experience: '5+ years' });

    await audit.saveStrategyButton().click();
    await expect(page).toHaveURL(/\/dashboard/);

    const saved = await page.evaluate(() =>
      JSON.parse(sessionStorage.getItem('onshoreAuditData') ?? 'null'),
    );
    expect(saved).toMatchObject({
      goal: 'skilled',
      totalPoints: 85,
      pathwayVisa: '190',
    });
  });

  test('starts over back at the goal step', async ({ page }) => {
    await stubApi(page);
    const audit = await preview(page);

    await audit.startOverButton().click();

    await expect(audit.goalHeading()).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Family & Partner Track
// ---------------------------------------------------------------------------

test.describe('Family & Partner Track: the entry card', () => {
  test.beforeEach(async ({ page }) => {
    await stubApi(page);
  });

  test('sends the hero CTA straight to the partner audit', async ({ page }) => {
    const home = new HomePage(page);
    await home.goto();
    await waitForApp(page);

    await home.familyCtaButton().click();

    await expect(page).toHaveURL(/\/partner-audit$/);
  });
});

test.describe('Family & Partner Track: the fields', () => {
  test.beforeEach(async ({ page }) => {
    await stubApi(page);
  });

  test('opens the family branch and says what it will not ask for', async ({ page }) => {
    const audit = new AuditPage(page);
    await openAudit(page);

    await audit.familyGoal().click();

    await expect(audit.familyHeading()).toBeVisible();
    await expect(audit.noWorkDetailsNote()).toBeVisible();
  });

  test('asks for no occupation or visa details', async ({ page }) => {
    // The branch exists precisely so a partner applicant is not asked about
    // ANZSCO codes. Two selects, not five.
    const audit = new AuditPage(page);
    await openAudit(page);
    await audit.familyGoal().click();

    await expect(page.getByRole('combobox')).toHaveCount(2);
  });

  test('keeps the submit disabled until both fields are answered', async ({ page }) => {
    const audit = new AuditPage(page);
    await openAudit(page);
    await audit.familyGoal().click();

    await expect(audit.familyButton()).toBeDisabled();

    await audit.choose(0, 'Married');
    await expect(audit.familyButton()).toBeDisabled();

    await audit.choose(1, 'Australian citizen');
    await expect(audit.familyButton()).toBeEnabled();
  });

  test('will not accept a sponsor without a relationship', async ({ page }) => {
    const audit = new AuditPage(page);
    await openAudit(page);
    await audit.familyGoal().click();

    await audit.choose(1, 'Australian citizen');

    await expect(audit.familyButton()).toBeDisabled();
  });

  for (const relationship of RELATIONSHIP_OPTIONS) {
    test(`accepts the "${relationship}" relationship`, async ({ page }) => {
      const audit = new AuditPage(page);
      await openAudit(page);
      await audit.familyGoal().click();

      await audit.choose(0, relationship);

      await expect(audit.selectAt(0)).toContainText(relationship);
    });
  }

  for (const sponsor of SPONSOR_OPTIONS) {
    test(`accepts the "${sponsor}" sponsor status`, async ({ page }) => {
      const audit = new AuditPage(page);
      await openAudit(page);
      await audit.familyGoal().click();

      await audit.choose(1, sponsor);

      await expect(audit.selectAt(1)).toContainText(sponsor);
    });
  }

  test('lets an unsure visitor through rather than blocking them', async ({ page }) => {
    // "Not sure yet" must be a complete answer. Someone who does not know
    // their sponsor's status is exactly who this funnel is for.
    const audit = new AuditPage(page);
    await openAudit(page);
    await audit.familyGoal().click();

    await audit.fillFamily({ sponsor: 'Not sure yet' });

    await expect(audit.familyButton()).toBeEnabled();
  });

  test('goes back to the goal step', async ({ page }) => {
    const audit = new AuditPage(page);
    await openAudit(page);
    await audit.familyGoal().click();

    await audit.changeGoalLink().click();

    await expect(audit.goalHeading()).toBeVisible();
  });
});

test.describe('Family & Partner Track: submitting', () => {
  test('shows a working state while preparing', async ({ page }) => {
    await stubApi(page);
    const audit = new AuditPage(page);
    await openAudit(page);
    await audit.familyGoal().click();
    await audit.fillFamily();

    await audit.familyButton().click();

    await expect(audit.preparingLabel()).toBeVisible();
  });

  test('hands off to the partner pathway page', async ({ page }) => {
    await stubApi(page);
    const audit = new AuditPage(page);
    await openAudit(page);
    await audit.familyGoal().click();
    await audit.fillFamily();

    await audit.familyButton().click();

    await expect(page).toHaveURL(/\/pathways\/partner$/, { timeout: 15_000 });
  });

  test('arrives at a page that actually rendered', async ({ page }) => {
    // A handoff to a route that then white-screens is worse than no handoff:
    // the visitor has answered questions and been sent nowhere.
    await stubApi(page);
    const audit = new AuditPage(page);
    await openAudit(page);
    await audit.familyGoal().click();
    await audit.fillFamily();
    await audit.familyButton().click();
    await expect(page).toHaveURL(/\/pathways\/partner$/, { timeout: 15_000 });
    await waitForApp(page);

    await expect(page.locator('h1').first()).toBeVisible();
  });
});

test.describe('the student goal', () => {
  test('skips the questions entirely', async ({ page }) => {
    // Student is a routing decision, not a branch — there are no fields to
    // fill. Worth pinning because it is the one goal that navigates on click.
    await stubApi(page);
    const audit = new AuditPage(page);
    await openAudit(page);

    await audit.studentGoal().click();

    await expect(page).toHaveURL(/\/pathways\/student$/);
  });
});

// ---------------------------------------------------------------------------
// Findings
// ---------------------------------------------------------------------------

test.describe('documented quirks', () => {
  test('the family branch discards the answers it collected', async ({ page }) => {
    // FINDING, not an endorsement. `submitFamily` navigates and never calls
    // `onComplete`, so relationship status and sponsor status are asked for,
    // validated, gated on — and then dropped. Nothing is posted, nothing is
    // stored, and /pathways/partner asks again.
    //
    // Pinned so that if someone wires it up properly, this test fails and
    // tells them the behaviour changed on purpose.
    const recorder = await stubApi(page);
    const audit = new AuditPage(page);
    await openAudit(page);
    await audit.familyGoal().click();
    await audit.fillFamily();
    await audit.familyButton().click();
    await expect(page).toHaveURL(/\/pathways\/partner$/, { timeout: 15_000 });

    const posted = recorder
      .requests()
      .filter((r) => /prospect|lead|partner|parent/.test(r));
    expect(posted).toHaveLength(0);

    const stored = await page.evaluate(() => ({
      session: sessionStorage.getItem('onshoreAuditData'),
      local: localStorage.getItem('familyAuditData'),
    }));
    expect(stored.session).toBeNull();
    expect(stored.local).toBeNull();
  });

  test('the two family entry points lead to different places', async ({ page }) => {
    // FINDING. The hero's "Family & Partner Track" CTA goes to /partner-audit
    // (the 15-step eligibility quiz). The audit's family branch goes to
    // /pathways/partner (a marketing page). Both are reached by a visitor
    // saying "I am here about a partner visa", and they get different
    // products depending on which control they clicked.
    await stubApi(page);
    const home = new HomePage(page);
    const audit = new AuditPage(page);

    await home.goto();
    await waitForApp(page);
    await home.familyCtaButton().click();
    await expect(page).toHaveURL(/\/partner-audit$/);

    await home.goto();
    await waitForApp(page);
    await home.auditCardButton().click();
    await audit.familyGoal().click();
    await audit.fillFamily();
    await audit.familyButton().click();

    await expect(page).toHaveURL(/\/pathways\/partner$/, { timeout: 15_000 });
  });
});
