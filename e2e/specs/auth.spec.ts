import { expect, test, waitForApp } from '../fixtures/test';
import { PROGRESS_RECORD, USER, stubApi } from '../fixtures/api-stubs';
import { AuthPage, DashboardPage } from '../pages/auth.page';

/**
 * Sign-in, sign-up, and where each of them lands.
 *
 * The routing decisions after a successful credential check are the part worth
 * a browser: they depend on a token in localStorage, a query parameter that
 * survived a redirect, and an admin flag that the app looks for in three
 * different places. None of that is observable from a unit test of the form.
 *
 * The admin fallback chain deserves a note, because it looks like paranoia and
 * is not: the app checks the login response, then /auth/me, then decodes the
 * JWT. Any one of those disagreeing sends a person to the wrong application.
 */

test.describe('signing in', () => {
  test('sends credentials and lands on the dashboard', async ({ page }) => {
    const api = await stubApi(page);
    const auth = new AuthPage(page);
    const dashboard = new DashboardPage(page);

    await auth.gotoLogin();
    await waitForApp(page);
    await auth.signIn();

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(dashboard.welcomeHeading()).toBeVisible();

    expect(api.signinPayload()).toMatchObject({
      email: 'ada@example.com',
      password: 'correct-horse',
    });
  });

  test('returns the visitor to where they were headed', async ({ page }) => {
    // The whole point of returnTo. Someone bounced off /quote mid-decision and
    // dropped on a generic dashboard has to find their way back and re-pick a
    // package, and most will not.
    await stubApi(page);
    const auth = new AuthPage(page);

    await auth.gotoLoginWithReturn('/quote');
    await waitForApp(page);
    await auth.signIn();

    await expect(page).toHaveURL(/\/quote$/);
  });

  test('routes an admin to the admin app', async ({ page }) => {
    await stubApi(page, { admin: true });
    const auth = new AuthPage(page);

    await auth.gotoLogin();
    await waitForApp(page);
    await auth.signIn();

    await expect(page).toHaveURL(/\/admin/);
  });

  test('keeps a rejected sign-in on the form', async ({ page, health }) => {
    // The app logs the failure, which is correct behaviour and would otherwise
    // trip the health check.
    health.expectErrors('sign-in is stubbed to 401');

    await stubApi(page, {
      httpErrors: { '/auth/signin': 401 },
      errorBody: { success: false, statusCode: 401, message: 'Invalid credentials' },
    });
    const auth = new AuthPage(page);

    await auth.gotoLogin();
    await waitForApp(page);
    await auth.signIn('ada@example.com', 'wrong');

    await expect(auth.toast(/authentication failed/i)).toBeVisible();

    // Still on /auth. A failed sign-in that navigates anyway is how someone
    // ends up on a dashboard rendering another session's cached data.
    await expect(page).toHaveURL(/\/auth/);
    await expect(auth.submitButton()).toBeVisible();
  });
});

test.describe('signing up', () => {
  test('will not submit without a migration goal', async ({ page }) => {
    // The persona drives every downstream personalisation. An account created
    // without one gets a dashboard for a pathway it guessed.
    const api = await stubApi(page);
    const auth = new AuthPage(page);

    await auth.gotoSignup();
    await waitForApp(page);

    await auth.fullNameInput().fill('Ada Lovelace');
    await auth.emailInput().fill('ada@example.com');
    await auth.passwordInput().fill('correct-horse');
    await auth.confirmPasswordInput().fill('correct-horse');
    await auth.submitButton().click();

    await expect(auth.toast(/select your migration goal/i)).toBeVisible();
    expect(api.signupPayload()).toBeNull();
  });

  test('will not submit mismatched passwords', async ({ page }) => {
    const api = await stubApi(page);
    const auth = new AuthPage(page);

    await auth.gotoSignup();
    await waitForApp(page);

    await auth.personaOption('skilled').click();
    await auth.fullNameInput().fill('Ada Lovelace');
    await auth.emailInput().fill('ada@example.com');
    await auth.passwordInput().fill('correct-horse');
    await auth.confirmPasswordInput().fill('correct-hor');
    await auth.submitButton().click();

    await expect(auth.toast(/passwords don’t match|passwords don't match/i)).toBeVisible();
    expect(api.signupPayload()).toBeNull();
  });

  test('splits the full name the way the backend expects', async ({ page }) => {
    // The form takes one name field and the API takes two. The split is done
    // in the page, silently, and a double-barrelled surname is the case that
    // exposes a naive implementation.
    const api = await stubApi(page);
    const auth = new AuthPage(page);

    await auth.gotoSignup();
    await waitForApp(page);

    await auth.personaOption('skilled').click();
    await auth.fullNameInput().fill('Ada King Lovelace');
    await auth.emailInput().fill('ada@example.com');
    await auth.passwordInput().fill('correct-horse');
    await auth.confirmPasswordInput().fill('correct-horse');
    await auth.submitButton().click();

    await expect
      .poll(() => api.signupPayload(), { timeout: 10_000 })
      .toMatchObject({
        email: 'ada@example.com',
        firstName: 'Ada',
        lastName: 'King Lovelace',
        personaType: 'skilled',
      });
  });
});

test.describe('the dashboard', () => {
  test('turns away a visitor with no session', async ({ page }) => {
    await stubApi(page);
    const dashboard = new DashboardPage(page);

    await dashboard.goto();
    await waitForApp(page);

    await expect(page).toHaveURL(/\/auth\?intent=login/);
  });

  test('prefers the saved pathway’s score over the profile’s', async ({ page }) => {
    // Two sources disagree by design: the profile carries a score from signup,
    // the saved pathway carries the one actually calculated. Showing the stale
    // profile figure is the failure this asserts against, and it is invisible
    // unless the two differ.
    expect(PROGRESS_RECORD.calculated_points).not.toBe(USER.pointsScore);

    await stubApi(page, { authenticated: true });
    const dashboard = new DashboardPage(page);

    await dashboard.goto();
    await waitForApp(page);

    await expect(dashboard.welcomeHeading()).toBeVisible();
    await expect(dashboard.quickStatsPoints()).toHaveText(
      String(PROGRESS_RECORD.calculated_points),
    );
  });

  test('lists saved pathways', async ({ page }) => {
    await stubApi(page, { authenticated: true });
    const dashboard = new DashboardPage(page);

    await dashboard.goto();
    await waitForApp(page);

    await expect(dashboard.savedPathwaysHeading()).toBeVisible();
    await expect(dashboard.savedPathwayRow(/Software Engineer — 189/)).toBeVisible();
    await expect(dashboard.savedItemsCount()).toHaveText('1');
  });

  test('offers a way out of the empty state', async ({ page }) => {
    // A new account lands here, and an empty dashboard with no next action is
    // where a signup goes to die.
    await stubApi(page, { authenticated: true, progress: [] });
    const dashboard = new DashboardPage(page);

    await dashboard.goto();
    await waitForApp(page);

    await expect(dashboard.emptyPathwaysMessage()).toBeVisible();
    await dashboard.browseCoursesButton().click();
    await expect(page).toHaveURL(/\/occupation-search$/);
  });

  test('removes a dismissed pathway and tells the server', async ({ page }) => {
    const api = await stubApi(page, { authenticated: true });
    const dashboard = new DashboardPage(page);

    await dashboard.goto();
    await waitForApp(page);
    await expect(dashboard.savedPathwayRow(/Software Engineer — 189/)).toBeVisible();

    // The control only becomes opaque on hover, so it is clicked with force —
    // it is present and hit-testable throughout, just styled to 0 opacity.
    await dashboard.dismissPathwayButton().first().click({ force: true });

    await expect(dashboard.emptyPathwaysMessage()).toBeVisible();

    // The row disappearing is optimistic. Without this the UI would look
    // identical whether or not the deletion was ever persisted, and the
    // pathway would be back on the next visit.
    await expect
      .poll(() => api.deletedProgressIds())
      .toContain(PROGRESS_RECORD.id);
  });

  test('says so when the profile cannot be loaded', async ({ page, health }) => {
    health.expectErrors('/auth/me is stubbed to 500');

    await stubApi(page, { authenticated: true, failing: ['/auth/me'] });
    const dashboard = new DashboardPage(page);

    await dashboard.goto();
    await waitForApp(page);

    // An empty dashboard and a broken dashboard look the same to a visitor
    // unless one of them says which it is.
    await expect(dashboard.profileError()).toBeVisible({ timeout: 15_000 });
  });
});
