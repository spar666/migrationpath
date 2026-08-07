import type { Page } from '@playwright/test';

/**
 * Every route in the application, and the shell that wraps them.
 *
 * The route list is the spine of the smoke suite. Keeping it here rather than
 * inline in the spec means adding a route to App.tsx and forgetting to smoke
 * it is a one-line fix rather than a copy-paste.
 */

export interface RouteUnderTest {
  path: string;
  name: string;
  /** Routes that redirect an anonymous visitor somewhere else. */
  redirectsWhenAnonymous?: string;
  /** Entered by external redirect, so needs a query string to be meaningful. */
  needsQuery?: boolean;
}

export const ROUTES: RouteUnderTest[] = [
  { path: '/', name: 'home' },
  { path: '/auth', name: 'auth' },
  { path: '/auth?intent=login', name: 'auth (login intent)' },
  { path: '/points-calculator', name: 'points calculator' },
  { path: '/occupation-search', name: 'occupation search' },
  { path: '/consultation', name: 'consultation' },
  { path: '/partner-audit', name: 'partner audit' },
  { path: '/parent-audit', name: 'parent audit' },
  { path: '/quote', name: 'quote' },
  { path: '/news', name: 'news' },
  { path: '/news/example-update', name: 'news article' },
  { path: '/pre-screen', name: 'pre-screen' },
  { path: '/pathways/student', name: 'student pathway' },
  { path: '/pathways/skilled', name: 'skilled pathway' },
  { path: '/pathways/partner', name: 'partner pathway' },
  { path: '/pathways/onshore', name: 'onshore pathway' },
  { path: '/pathways/employer', name: 'employer pathway' },
  {
    path: '/dashboard',
    name: 'dashboard',
    redirectsWhenAnonymous: '/auth',
  },
  // The admin app gates on an admin claim, so an anonymous visitor is sent to
  // sign in rather than shown a 404. Listed here so the smoke suite notices if
  // that gate ever stops redirecting — see admin.spec.ts for the real checks.
  {
    path: '/admin',
    name: 'admin',
    redirectsWhenAnonymous: '/auth',
  },
  { path: '/consult/book', name: 'consult book', needsQuery: true },
  { path: '/consult/confirmed', name: 'consult confirmed', needsQuery: true },
];

export class AppPage {
  constructor(private readonly page: Page) {}

  /**
   * The app's own content — the cheapest proof React rendered a page rather
   * than unmounting to a blank div.
   *
   * The `:not()`s are load-bearing. App.tsx mounts two toast viewports
   * (shadcn's `<Toaster>` and sonner) as siblings of the routed page, and both
   * are always in the DOM whether or not a toast is showing. A bare
   * `#root > *` therefore matches three elements and fails Playwright's strict
   * mode on every single page — and the two it matches first are the empty
   * announcer regions, so even `.first()` would assert on the wrong thing.
   *
   * Matching on the ARIA attributes rather than the class names keeps this
   * from breaking the next time either toast library restyles its viewport.
   */
  root() {
    return this.page
      .locator('#root > *:not([role="region"]):not([aria-live])')
      .first();
  }

  header() {
    return this.page.locator('header').first();
  }

  footer() {
    return this.page.locator('footer').first();
  }

  /** Collapses the header on narrow viewports. Absent at desktop widths. */
  menuToggle() {
    return this.page.getByRole('button', { name: /toggle menu/i });
  }

  /**
   * Opens the mobile nav drawer, if this viewport has one. No-op on desktop.
   *
   * The header renders both navs at every width and hides one with
   * `md:` classes, so the links a phone user cannot reach are still in the DOM.
   * Any spec that clicks a nav link needs this first, or it passes on desktop
   * and times out on the mobile project against an element that is present,
   * matched, and invisible.
   */
  async revealNav() {
    const toggle = this.menuToggle();
    if (!(await toggle.isVisible())) return;
    await toggle.click();
    // The Sheet animates in — its contents are attached before they are
    // clickable, which is its own small source of flake.
    await this.page.getByRole('dialog').waitFor({ state: 'visible' });
  }

  /**
   * `filter({ visible: true })` for the same reason: both copies of the link
   * exist, and the hidden one sorts first in DOM order — so a bare `.first()`
   * hands back the desktop link on a phone.
   */
  loginLink() {
    return this.page
      .getByRole('link', { name: /log in/i })
      .filter({ visible: true })
      .first();
  }

  notFoundHeading() {
    return this.page.getByText(/page not found/i);
  }

  errorBoundary() {
    return this.page.getByText(/something went wrong/i);
  }

  /** Any visible h1 — the cheapest proof a page rendered its own content. */
  heading() {
    return this.page.locator('h1').first();
  }
}
