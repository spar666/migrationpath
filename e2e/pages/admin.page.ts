import type { Page } from '@playwright/test';

/**
 * The admin application at /admin/*.
 *
 * The gate is the part that matters. Everything behind it edits live
 * configuration — points tables, policy rules, occupation lists — so "who gets
 * in" is a higher-stakes assertion than any individual screen's behaviour.
 *
 * Worth knowing about `useAdminAuth`: it accepts FOUR different shapes of
 * admin claim (`isAdmin`, `is_admin`, `role === 'admin'`, `roles` containing
 * 'admin'). That breadth is a liability — it means a backend that renames the
 * flag silently keeps working through one alias while another goes dead — so
 * the spec covers each alias rather than trusting one.
 */

export interface AdminScreen {
  path: string;
  name: string;
  /** Something the screen renders that no other screen does. */
  marker: RegExp;
}

/**
 * Every routed admin screen, mirroring the <Route> list in pages/Admin.tsx.
 *
 * Kept here so that adding a route and forgetting to smoke it is a one-line
 * fix rather than a new spec. The markers are deliberately loose — a heading
 * or a section title — because the point of the smoke pass is "this screen
 * mounted and fetched without throwing", not "this screen looks like X".
 */
export const ADMIN_SCREENS: AdminScreen[] = [
  { path: '/admin', name: 'overview', marker: /overview|dashboard/i },
  { path: '/admin/leads', name: 'leads', marker: /leads/i },
  { path: '/admin/site-config', name: 'site config', marker: /site config|configuration/i },
  { path: '/admin/form-logic', name: 'form logic', marker: /form logic/i },
  { path: '/admin/migration-rules', name: 'migration rules', marker: /migration rules/i },
  { path: '/admin/points-config', name: 'points config', marker: /points/i },
  { path: '/admin/policy-config', name: 'policy config', marker: /policy|legislative/i },
  { path: '/admin/regional-postcodes', name: 'regional postcodes', marker: /postcode/i },
  { path: '/admin/occupation-lists', name: 'occupation lists', marker: /occupation/i },
  { path: '/admin/courses', name: 'courses', marker: /course/i },
  { path: '/admin/invitations', name: 'invitations', marker: /invitation/i },
  { path: '/admin/occupation-master', name: 'occupation master', marker: /occupation/i },
  { path: '/admin/news', name: 'news editor', marker: /news/i },
  { path: '/admin/users', name: 'user oversight', marker: /user/i },
  { path: '/admin/settings', name: 'settings', marker: /setting/i },
];

export class AdminPage {
  constructor(private readonly page: Page) {}

  async goto(path = '/admin') {
    await this.page.goto(path);
  }

  // --- Gate ---

  verifying() {
    return this.page.getByText(/verifying admin access/i);
  }

  accessDenied() {
    return this.page.getByText(/access denied/i);
  }

  deniedToast() {
    return this.page.getByText(/you do not have admin privileges/i);
  }

  // --- Shell ---

  sidebar() {
    return this.page.locator('aside, nav').filter({ hasText: /overview/i }).first();
  }

  sidebarLink(name: string | RegExp) {
    return this.page.getByRole('link', { name }).first();
  }

  main() {
    return this.page.locator('main').first();
  }
}
