import { test, expect, waitForApp } from '../fixtures/test';
import { stubApi, USER } from '../fixtures/api-stubs';
import { AdminPage, ADMIN_SCREENS } from '../pages/admin.page';

/**
 * The admin application.
 *
 * The gate is the point of this file. Everything behind /admin edits live
 * configuration — points tables, policy rules, occupation lists, pricing — so
 * "who gets in" is a higher-stakes question than how any individual screen
 * behaves. A regression that lets a signed-in non-admin through is not a bug
 * report, it is an incident.
 *
 * `useAdminAuth` accepts FOUR different shapes of admin claim: `isAdmin`,
 * `is_admin`, `role === 'admin'`, and an array `roles` containing 'admin'.
 * That breadth is a liability rather than a feature — it means the backend can
 * rename the flag and the app keeps working through one alias while another
 * quietly goes dead, so nobody notices until the dead one is the only one
 * left. Each alias is tested separately below for that reason: if one stops
 * working, this suite names which.
 *
 * The per-screen pass is deliberately shallow. It proves each route mounts and
 * survives its data fetch, which is what catches a broken import or a
 * component that throws on an empty list. Asserting on admin CRUD widgets
 * would couple this suite to the most frequently redesigned part of the app
 * for very little added signal.
 */

test.describe('the gate', () => {
  test('sends an anonymous visitor to sign in', async ({ page }) => {
    await stubApi(page);
    const admin = new AdminPage(page);
    await admin.goto();
    await waitForApp(page);

    await expect(page).toHaveURL(/\/auth/);
  });

  test('does not render the admin shell to an anonymous visitor', async ({ page }) => {
    // The redirect is not enough on its own — a flash of the admin UI before
    // it fires still leaks the shape of the thing.
    await stubApi(page);
    const admin = new AdminPage(page);
    await admin.goto();
    await waitForApp(page);

    await expect(admin.sidebar()).toHaveCount(0);
  });

  test('turns away a signed-in visitor who is not an admin', async ({ page, health }) => {
    health.expectErrors('useAdminAuth warns on a denied access attempt');
    await stubApi(page, { authenticated: true });
    const admin = new AdminPage(page);
    await admin.goto();
    await waitForApp(page);

    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('tells a non-admin why they were turned away', async ({ page, health }) => {
    health.expectErrors('useAdminAuth warns on a denied access attempt');
    await stubApi(page, { authenticated: true });
    const admin = new AdminPage(page);
    await admin.goto();
    await waitForApp(page);

    await expect(admin.deniedToast()).toBeVisible();
  });

  test('lets an admin in', async ({ page }) => {
    await stubApi(page, { admin: true });
    const admin = new AdminPage(page);
    await admin.goto();
    await waitForApp(page);

    await expect(page).toHaveURL(/\/admin/);
    await expect(admin.main()).toBeVisible();
  });

  test('turns away a visitor whose profile cannot be read', async ({ page, health }) => {
    // A failing /auth/me must fail CLOSED. Failing open here would hand the
    // admin app to anyone who can make the profile endpoint error.
    health.expectErrors('useAdminAuth logs the failed profile fetch');
    await stubApi(page, { authenticated: true, failing: ['/auth/me'] });
    const admin = new AdminPage(page);
    await admin.goto();
    await waitForApp(page);

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(admin.sidebar()).toHaveCount(0);
  });
});

test.describe('which admin claim is honoured', () => {
  /** Signs in with a profile carrying exactly one shape of admin claim. */
  async function signInWithClaim(
    page: Parameters<typeof stubApi>[0],
    claim: Record<string, unknown>,
  ) {
    await stubApi(page, { authenticated: true });
    // Registered last, so it wins over the stub's own /auth/me.
    await page.route('**/api/v1/auth/me', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { ...USER, isAdmin: false, ...claim },
        }),
      }),
    );
  }

  test('accepts the camelCase isAdmin flag', async ({ page }) => {
    await signInWithClaim(page, { isAdmin: true });
    const admin = new AdminPage(page);
    await admin.goto();
    await waitForApp(page);

    await expect(page).toHaveURL(/\/admin/);
  });

  test('accepts the snake_case is_admin flag', async ({ page }) => {
    await signInWithClaim(page, { is_admin: true });
    const admin = new AdminPage(page);
    await admin.goto();
    await waitForApp(page);

    await expect(page).toHaveURL(/\/admin/);
  });

  test('accepts a role of admin', async ({ page }) => {
    await signInWithClaim(page, { role: 'admin' });
    const admin = new AdminPage(page);
    await admin.goto();
    await waitForApp(page);

    await expect(page).toHaveURL(/\/admin/);
  });

  test('accepts an admin entry in a roles array', async ({ page }) => {
    await signInWithClaim(page, { roles: ['user', 'admin'] });
    const admin = new AdminPage(page);
    await admin.goto();
    await waitForApp(page);

    await expect(page).toHaveURL(/\/admin/);
  });

  test('rejects a roles array without admin in it', async ({ page, health }) => {
    // The negative case for the same code path — an over-eager check that
    // treated a non-empty roles array as sufficient would pass every test
    // above and fail only this one.
    health.expectErrors('useAdminAuth warns on a denied access attempt');
    await signInWithClaim(page, { roles: ['user', 'editor'] });
    const admin = new AdminPage(page);
    await admin.goto();
    await waitForApp(page);

    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('rejects a role that merely contains the word admin', async ({ page, health }) => {
    health.expectErrors('useAdminAuth warns on a denied access attempt');
    await signInWithClaim(page, { role: 'not-admin' });
    const admin = new AdminPage(page);
    await admin.goto();
    await waitForApp(page);

    await expect(page).toHaveURL(/\/dashboard/);
  });
});

test.describe('the shell', () => {
  test.beforeEach(async ({ page }) => {
    await stubApi(page, { admin: true });
  });

  test('shows the navigation sidebar', async ({ page }) => {
    const admin = new AdminPage(page);
    await admin.goto();
    await waitForApp(page);

    await expect(admin.sidebar()).toBeVisible();
  });

  test('redirects an unknown admin path back to the overview', async ({ page }) => {
    // `<Route path="*" element={<Navigate to="/admin" replace />} />` — a
    // mistyped admin URL must not fall through to the app's global 404.
    const admin = new AdminPage(page);
    await admin.goto('/admin/no-such-screen');
    await waitForApp(page);

    await expect(page).toHaveURL(/\/admin$/);
  });

  test('redirects the legacy occupations path to the master screen', async ({ page }) => {
    const admin = new AdminPage(page);
    await admin.goto('/admin/occupations');
    await waitForApp(page);

    await expect(page).toHaveURL(/\/admin\/occupation-master$/);
  });
});

test.describe('every admin screen mounts', () => {
  for (const screen of ADMIN_SCREENS) {
    test(`${screen.name} renders without crashing`, async ({ page }) => {
      await stubApi(page, { admin: true });
      const admin = new AdminPage(page);
      await admin.goto(screen.path);
      await waitForApp(page);

      // The health fixture catches a render crash; this catches the quieter
      // failure of a screen that mounts to nothing at all.
      await expect(admin.main()).toBeVisible();
      await expect(admin.main()).not.toBeEmpty();
    });

    test(`${screen.name} survives its data being empty`, async ({ page }) => {
      // Admin screens are list-heavy, and "renders fine with rows, throws on
      // an empty array" is the single most common bug in a table component.
      await stubApi(page, { admin: true, empty: true });
      const admin = new AdminPage(page);
      await admin.goto(screen.path);
      await waitForApp(page);

      await expect(admin.main()).toBeVisible();
    });
  }
});
