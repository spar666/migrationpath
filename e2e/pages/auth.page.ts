import type { Page } from '@playwright/test';

/**
 * The sign-in / sign-up screen, and the dashboard it hands off to.
 *
 * One page component serves both modes, toggled by `?intent=` and by an
 * in-page link. That is why `submitButton()` matches either verb — a locator
 * pinned to "Sign In" silently starts matching nothing the moment a spec
 * switches to the signup form, and an absent button reads as a passing
 * `toHaveCount(0)` somewhere further down.
 */
export class AuthPage {
  constructor(private readonly page: Page) {}

  async gotoLogin() {
    await this.page.goto('/auth?intent=login');
  }

  async gotoSignup() {
    await this.page.goto('/auth?intent=signup');
  }

  /** Entered when a signed-out visitor is bounced off a gated page. */
  async gotoLoginWithReturn(returnTo: string) {
    await this.page.goto(`/auth?intent=login&returnTo=${encodeURIComponent(returnTo)}`);
  }

  // --- Fields ---

  emailInput() {
    return this.page.locator('#email');
  }

  passwordInput() {
    return this.page.locator('#password');
  }

  confirmPasswordInput() {
    return this.page.locator('#confirmPassword');
  }

  fullNameInput() {
    return this.page.locator('#fullName');
  }

  /** Signup only. The ids are the persona slugs, e.g. `skilled`. */
  personaOption(id: string) {
    return this.page.locator(`#${id}`);
  }

  /**
   * Pinned to `type=submit` rather than to its label.
   *
   * On the signup form the submit reads "Create Account" while the toggle
   * beneath it reads "Sign in" — so a name-based locator covering both modes
   * matches two buttons there and fails strict mode. The form has exactly one
   * submit in either mode, which is the stable fact.
   */
  submitButton() {
    return this.page.locator('button[type="submit"]');
  }

  toggleToSignup() {
    return this.page.getByRole('button', { name: /^sign up$/i });
  }

  async signIn(email = 'ada@example.com', password = 'correct-horse') {
    await this.emailInput().fill(email);
    await this.passwordInput().fill(password);
    await this.submitButton().click();
  }

  // --- Feedback ---
  //
  // Toasts, which are portalled to a viewport outside the routed page.

  toast(text: RegExp) {
    return this.page.getByText(text);
  }
}

/**
 * The signed-in landing page.
 *
 * Its numbers come from two sources that can disagree — the profile carries a
 * points score and so does the most recent saved pathway — so the getters here
 * are deliberately narrow enough to tell which one won.
 */
export class DashboardPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('/dashboard');
  }

  welcomeHeading() {
    return this.page.getByRole('heading', { name: /welcome back|your migration strategy/i });
  }

  savedPathwaysHeading() {
    return this.page.getByText('Saved Pathways', { exact: true });
  }

  savedPathwayRow(title: RegExp) {
    return this.page.getByText(title);
  }

  emptyPathwaysMessage() {
    return this.page.getByText(/no saved pathways yet/i);
  }

  browseCoursesButton() {
    return this.page.getByRole('button', { name: /browse courses/i });
  }

  /** The right-hand "Quick Stats" points figure, not the gauge. */
  quickStatsPoints() {
    return this.page
      .locator('div')
      .filter({ hasText: /^Points Score/ })
      .locator('span.tabular-nums');
  }

  savedItemsCount() {
    return this.page
      .locator('div')
      .filter({ hasText: /^Saved Items/ })
      .locator('span.font-semibold');
  }

  /** Appears on row hover; forced clicks are fine since it is always in the DOM. */
  dismissPathwayButton() {
    return this.page.getByRole('button').filter({ has: this.page.locator('svg.lucide-x') });
  }

  profileError() {
    return this.page.getByText(/profile not found/i);
  }
}
