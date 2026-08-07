import type { Page } from '@playwright/test';

/**
 * The pricing page and the application dialog it opens.
 *
 * The interesting behaviour here is not the pricing table — it is what happens
 * to a visitor who picks a package while signed out. They are sent to /auth
 * with the package id parked in localStorage, and the page is expected to pick
 * that up and finish the job when they return. That round trip crosses a full
 * navigation and a storage boundary, which is precisely the kind of thing that
 * survives a unit suite and breaks in a browser.
 */
export class QuotePage {
  constructor(private readonly page: Page) {}

  /** The key `pendingQuote.ts` writes. Duplicated here on purpose: a spec that
   * imports the constant from the app cannot notice the app changing it. */
  static readonly PENDING_KEY = 'pendingQuotePackage';

  async goto() {
    await this.page.goto('/quote');
  }

  /**
   * Arrive as someone who selected a package before signing in.
   *
   * `addInitScript` rather than an `evaluate` after load, because the resume
   * effect runs on mount — seeding storage afterwards is too late to be seen.
   */
  async gotoWithPendingPackage(packageId: string, savedAt = Date.now()) {
    await this.page.addInitScript(
      ([key, value]) => localStorage.setItem(key as string, value as string),
      [QuotePage.PENDING_KEY, JSON.stringify({ packageId, savedAt })],
    );
    await this.page.goto('/quote');
  }

  pendingPackage() {
    return this.page.evaluate(
      (key) => localStorage.getItem(key),
      QuotePage.PENDING_KEY,
    );
  }

  // --- Package selection ---

  loadingIndicator() {
    return this.page.getByText(/loading pricing/i);
  }

  categoryHeading(name: RegExp) {
    return this.page.getByRole('heading', { name });
  }

  packageCard(name: RegExp) {
    return this.page.getByText(name);
  }

  emptyState() {
    return this.page.getByText(/no pricing packages available yet/i);
  }

  errorState() {
    return this.page.getByText(/couldn’t load pricing|couldn't load pricing/i);
  }

  resumingBanner() {
    return this.page.getByText(/saving the quote you started earlier/i);
  }

  // --- Summary ---

  /** The placeholder shown before anything is selected. */
  summaryPlaceholder() {
    return this.page.getByRole('heading', { name: /select a visa subclass/i });
  }

  /**
   * The summary's badge, not the card's.
   *
   * Both render the identical string "Subclass 189", so an unqualified
   * `getByText` matches two elements and fails strict mode the moment a
   * package is selected. The summary is the later of the two in DOM order
   * (right column follows left), which is what `.last()` is pinning.
   */
  selectedSubclassBadge(code: string) {
    return this.page.getByText(`Subclass ${code}`, { exact: true }).last();
  }

  startApplicationButton() {
    return this.page.getByRole('button', { name: /start application/i });
  }

  // --- Application dialog ---

  dialog() {
    return this.page.getByRole('dialog');
  }

  nameInput() {
    return this.page.locator('#app-name');
  }

  emailInput() {
    return this.page.locator('#app-email');
  }

  phoneInput() {
    return this.page.locator('#app-phone');
  }

  /**
   * The honeypot. Positioned off-screen rather than hidden, so it is present,
   * fillable and — for a real visitor — never filled.
   */
  honeypotInput() {
    return this.page.locator('#app-website');
  }

  continueToPaymentButton() {
    return this.page.getByRole('button', { name: /continue to payment/i });
  }

  reserveButton() {
    return this.page.getByRole('button', { name: /reserve my application/i });
  }

  amountDueToday() {
    return this.page.getByText(/amount due today/i);
  }

  async fillDetails(name = 'Ada Lovelace', email = 'ada@example.com') {
    await this.nameInput().fill(name);
    await this.emailInput().fill(email);
    await this.continueToPaymentButton().click();
  }
}
