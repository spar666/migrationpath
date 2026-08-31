import type { Page } from '@playwright/test';

/**
 * The landing page hero — the top of every funnel on the site.
 *
 * Structurally this is not a page but a two-state machine rendered in place:
 * `entry` → `skilled-result`. That swap involves no navigation at all, which
 * is why the getters below are grouped by state rather than by region of the
 * screen: a spec's real question is almost always "which state am I in now",
 * and asserting the URL cannot answer it.
 *
 * The two tracks are the product's central claim — tell us where you're headed
 * and we route you — so "both are present and each goes somewhere different"
 * is the assertion that matters most here.
 */
export class HomePage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('/');
  }

  // --- Entry state -----------------------------------------------------------

  headline() {
    return this.page.getByRole('heading', { level: 1 });
  }

  workAndStudyHeading() {
    return this.page.getByRole('heading', { name: /work & study track/i });
  }

  familyAndPartnerHeading() {
    return this.page.getByRole('heading', { name: /family & partner track/i });
  }

  familyCtaButton() {
    return this.page.getByRole('button', {
      name: /check family & partner pr eligibility/i,
    });
  }

  /**
   * The dashed fallback card, which now navigates to /get-started.
   *
   * It is a single `<button>` wrapping both lines of copy, so it is addressed
   * by the question it asks rather than by its second line — that line is
   * marketing copy inside the same accessible name, and matching on it would
   * break on the next rewrite.
   */
  auditCardButton() {
    return this.page.getByRole('button', { name: /unsure of your visa standing/i });
  }

  // --- Smart search ----------------------------------------------------------

  searchInput() {
    return this.page.getByPlaceholder(/search an occupation, anzsco code/i);
  }

  /** The grouped suggestion panel's two section headers. */
  occupationsGroup() {
    return this.page.getByRole('listitem').filter({ hasText: /^Occupations$/ });
  }

  suggestion(text: RegExp) {
    return this.page.getByRole('listitem').filter({ hasText: text });
  }

  /** Free-text submit — the path for anything the suggestions do not cover. */
  async submitFreeText(query: string) {
    await this.searchInput().fill(query);
    await this.searchInput().press('Enter');
  }

  // --- Skilled split-screen state -------------------------------------------

  skilledOccupationHeading(title: RegExp) {
    return this.page.getByRole('heading', { name: title });
  }

  pointsTestedCard() {
    return this.page.getByRole('heading', { name: /^points-tested$/i });
  }

  employerSponsoredCard() {
    return this.page.getByRole('heading', { name: /^employer-sponsored$/i });
  }

  /** Rendered in place of a stream's list when it has no eligible visas. */
  noEligibilityNotice() {
    return this.page.getByText(/no direct eligibility via this stream/i);
  }

  visaOption(subclass: string) {
    return this.page.getByText(new RegExp(`Subclass ${subclass}`));
  }

  newSearchButton() {
    return this.page.getByRole('button', { name: /new search/i });
  }
}
