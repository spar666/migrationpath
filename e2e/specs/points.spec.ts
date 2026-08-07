import { expect, test, waitForApp } from '../fixtures/test';
import { stubApi } from '../fixtures/api-stubs';
import { PointsPage } from '../pages/points.page';

/**
 * The points calculator.
 *
 * This is the most-used tool on the site and the one whose output people quote
 * back at an agent, so the things worth testing are not "does it add up" — the
 * arithmetic is the backend's, and it has its own tests. What a browser can
 * prove, and only a browser can prove, is:
 *
 *   1. that the screen refuses to show a number it has not earned,
 *   2. that typing does not fire a request per keystroke, and
 *   3. that the profile the app sends matches what the backend's DTO expects.
 *
 * (3) is the one that fails silently. A renamed field arrives as `undefined`,
 * the engine scores it as absent, and the visitor gets a confidently wrong
 * total — which is worse than an error, because they act on it.
 */

test.describe('before the profile is complete', () => {
  test('shows a prompt rather than a score', async ({ page }) => {
    const api = await stubApi(page);
    const points = new PointsPage(page);

    await points.goto();
    await waitForApp(page);

    // Age is prefilled, so this is the state of a visitor who has done nothing.
    await expect(points.prompt()).toBeVisible();
    await expect(points.score()).toHaveText('—');
    await expect(points.breakdownHeading()).toHaveCount(0);

    // And crucially: nothing was asked of the server. A calculator that posts a
    // half-filled profile gets back a number for a person who does not exist.
    expect(api.pointsCallCount()).toBe(0);
  });

  test('one selection is not enough', async ({ page }) => {
    const api = await stubApi(page);
    const points = new PointsPage(page);

    await points.goto();
    await waitForApp(page);
    await points.selectEnglish(/superior english/i);

    await expect(points.prompt()).toBeVisible();
    await expect(points.score()).toHaveText('—');
    expect(api.pointsCallCount()).toBe(0);
  });
});

test.describe('once the profile is complete', () => {
  test('scores the profile and shows the breakdown', async ({ page }) => {
    const api = await stubApi(page);
    const points = new PointsPage(page);

    await points.goto();
    await waitForApp(page);
    await points.completeMinimumProfile();

    await expect(points.score()).toHaveText('75', { timeout: 10_000 });
    await expect(points.breakdownHeading()).toBeVisible();
    await expect(points.passMarkBadge()).toBeVisible();

    // The contract with the points engine. Every key here is one the backend
    // DTO names exactly; a rename on either side lands as a wrong score rather
    // than an error, which is why this is asserted field by field.
    expect(api.pointsPayload()).toMatchObject({
      visaGroup: 'GSM',
      age: 29,
      englishLevel: 'proficient',
      qualification: 'bachelor_masters',
      overseasWorkYears: 0,
      australianWorkYears: 0,
      regionalStudy: false,
    });
  });

  test('sends the work-experience years it was given', async ({ page }) => {
    const api = await stubApi(page);
    const points = new PointsPage(page);

    await points.goto();
    await waitForApp(page);
    await points.completeMinimumProfile();
    await expect(points.score()).toHaveText('75', { timeout: 10_000 });

    await points.overseasWorkInput().fill('8');
    await points.australianWorkInput().fill('3');
    await points.regionalStudyToggle('Yes').click();

    await expect
      .poll(() => api.pointsPayload(), { timeout: 10_000 })
      .toMatchObject({
        overseasWorkYears: 8,
        australianWorkYears: 3,
        regionalStudy: true,
      });
  });

  test('does not fire a request per keystroke', async ({ page }) => {
    const api = await stubApi(page);
    const points = new PointsPage(page);

    await points.goto();
    await waitForApp(page);
    await points.completeMinimumProfile();
    await expect(points.score()).toHaveText('75', { timeout: 10_000 });

    const before = api.pointsCallCount();

    // Six edits inside the 300ms debounce window. `pressSequentially` with a
    // short delay is the honest simulation — `fill()` sets the value in one go
    // and would pass against a component with no debouncing at all.
    await points.ageInput().click();
    await points.ageInput().press('Control+a');
    await points.ageInput().pressSequentially('313233', { delay: 30 });

    await expect
      .poll(() => api.pointsCallCount(), { timeout: 10_000 })
      .toBeGreaterThan(before);

    // Six keystrokes, and the debounce should have collapsed them. Two allows
    // for one in-flight request that was already committed when typing began;
    // six would mean the debounce is gone.
    expect(api.pointsCallCount() - before).toBeLessThanOrEqual(2);
  });

  test('flags a score below the pass mark', async ({ page }) => {
    await stubApi(page, {
      points: { totalPoints: 55, belowPassMark: true },
    });
    const points = new PointsPage(page);

    await points.goto();
    await waitForApp(page);
    await points.completeMinimumProfile();

    await expect(points.score()).toHaveText('55', { timeout: 10_000 });
    await expect(points.belowPassBadge()).toBeVisible();
    await expect(points.passMarkBadge()).toHaveCount(0);
  });

  test('surfaces the work-experience cap when the engine applies it', async ({
    page,
  }) => {
    // The cap is a legal maximum, and someone who cannot see it was applied
    // will read their total as understated and go looking for the missing
    // points. Saying so is the whole feature.
    await stubApi(page, {
      points: {
        totalPoints: 85,
        workCapApplied: true,
        breakdown: {
          AGE: 30,
          ENGLISH: 20,
          QUALIFICATIONS: 15,
          WORK_EXPERIENCE_COMBINED: 20,
          REGIONAL_STUDY: 0,
        },
      },
    });
    const points = new PointsPage(page);

    await points.goto();
    await waitForApp(page);
    await points.completeMinimumProfile();

    await expect(points.score()).toHaveText('85', { timeout: 10_000 });
    await expect(points.workCapNote()).toBeVisible();
  });

  test('shows the engine’s own reason when someone is ineligible', async ({
    page,
  }) => {
    // An age-based knockout is not "0 points" — it is a different answer, and
    // showing a total instead would tell someone to keep optimising a score
    // that cannot help them.
    await stubApi(page, {
      points: {
        totalPoints: 0,
        belowPassMark: true,
        ineligibilityReason: 'Applicants aged 45 or over are not eligible',
      },
    });
    const points = new PointsPage(page);

    await points.goto();
    await waitForApp(page);
    await points.ageInput().fill('46');
    await points.completeMinimumProfile();

    await expect(
      points.ineligibilityNotice(/aged 45 or over are not eligible/i),
    ).toBeVisible({ timeout: 10_000 });
    await expect(points.belowPassBadge()).toHaveCount(0);
  });
});

test.describe('when the points engine is down', () => {
  test('says so instead of showing a stale or invented number', async ({
    page,
    health,
  }) => {
    // React Query logs the rejection, so the health check has to be told this
    // is deliberate — otherwise the test fails for the noise rather than the
    // behaviour.
    health.expectErrors('the points endpoint is stubbed to 500');

    await stubApi(page, { failing: ['/points'] });
    const points = new PointsPage(page);

    await points.goto();
    await waitForApp(page);
    await points.completeMinimumProfile();

    await expect(points.errorMessage()).toBeVisible({ timeout: 15_000 });

    // The score must not be presented as real. Zero would be read as a result.
    await expect(points.score()).not.toHaveText('75');
  });
});
