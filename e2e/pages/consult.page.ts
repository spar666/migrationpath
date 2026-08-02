import type { Page } from '@playwright/test';
import { HUMAN_REF, PROSPECT_ID } from '../fixtures/api-stubs';

/**
 * The two pages either side of Stripe.
 *
 * /consult/book is also Stripe's cancel URL, and /consult/confirmed is its
 * success URL — so both are entered by an external redirect carrying only a
 * query string. That is why every navigation here takes the identity
 * explicitly rather than relying on whatever the browser happens to remember.
 */
export class ConsultPage {
  constructor(private readonly page: Page) {}

  async gotoBook(prospectId = PROSPECT_ID, ref = HUMAN_REF) {
    await this.page.goto(`/consult/book?prospect_id=${prospectId}&ref=${ref}`);
  }

  /** The cold-visitor case: a link that lost its query string. */
  async gotoBookAnonymously() {
    await this.page.goto('/consult/book');
  }

  async gotoConfirmed(prospectId = PROSPECT_ID, ref = HUMAN_REF) {
    await this.page.goto(
      `/consult/confirmed?prospect_id=${prospectId}&ref=${ref}`,
    );
  }

  // --- Book / pay ---

  payButton() {
    return this.page.getByRole('button', { name: /pay to confirm/i });
  }

  chooseTimeButton() {
    return this.page.getByRole('button', { name: /choose a time/i });
  }

  oneStepLeft() {
    return this.page.getByText(/one step left/i);
  }

  /**
   * Blocks until the browser has actually landed on Stripe (the stub).
   *
   * Clicking pay does not navigate synchronously — the app first POSTs for a
   * checkout URL and only then assigns `location`. A spec that clicks and
   * immediately `goto`s the success URL races that assignment, and Playwright
   * aborts the goto with "interrupted by another navigation". Waiting for the
   * handoff to land is also the honest assertion: the visitor reached Stripe.
   */
  async awaitStripeHandoff() {
    await this.page.waitForURL(/checkout\.stripe\.com/, { timeout: 15_000 });
  }

  alreadyConfirmed() {
    return this.page.getByText(/already confirmed/i);
  }

  notFound() {
    return this.page.getByText(/could not find your assessment/i);
  }

  // --- Confirmation ---

  /** The state the page must open in — never "confirmed" on arrival. */
  confirmingSpinner() {
    return this.page.getByText(/confirming your booking/i);
  }

  bookedHeading() {
    return this.page.getByText(/you’re booked in/i);
  }

  /** Shown when the webhook has not landed within the polling budget. */
  stillWaitingHeading() {
    return this.page.getByText(/taking a little longer than usual/i);
  }

  doNotPayAgain() {
    return this.page.getByText(/do not pay again/i);
  }

  joinLink() {
    return this.page.getByRole('link', { name: /join link/i });
  }

  rescheduleLink() {
    return this.page.getByRole('link', { name: /reschedule/i });
  }

  checkEmailHeading() {
    return this.page.getByText(/check your email for confirmation/i);
  }
}
