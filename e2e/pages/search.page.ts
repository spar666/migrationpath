import type { Page } from '@playwright/test';

/**
 * The ANZSCO occupation search and the eligibility card it reveals.
 *
 * Worth knowing before reading the locators: the occupation list is fetched
 * once in full and filtered in the browser. The typed query never reaches the
 * server for that section — so a spec asserting "searching narrows the list"
 * is testing client-side filtering, and a spec that stubs a filtered response
 * would be asserting nothing at all.
 *
 * The separate `/search` endpoint backs the "General Results" section only,
 * and it is the one that does go over the wire.
 */
export class SearchPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('/occupation-search');
  }

  input() {
    return this.page.getByPlaceholder(/search by occupation or anzsco code/i);
  }

  /**
   * The suggestions panel. Two independent debounces feed it (300ms for the
   * cached occupation list, 500ms for the general search), so anything that
   * waits on this needs to outlast the slower of the two.
   */
  dropdown() {
    return this.page.getByText('Search Results', { exact: true });
  }

  /**
   * The dropdown's own section header.
   *
   * `getByText('Occupations')` is not usable here: the page's stats strip
   * carries the same word in a `<span>`, so the unqualified locator matches
   * twice and fails strict mode. The section header is a `<div>`, and
   * `:text-is()` pins it to that element exactly.
   */
  occupationsSection() {
    return this.page.locator('div:text-is("Occupations")');
  }

  generalResultsSection() {
    return this.page.getByText('General Results', { exact: true });
  }

  /** A suggestion row, addressed by the occupation title it shows. */
  suggestion(title: RegExp) {
    return this.page.getByRole('listitem').filter({ hasText: title });
  }

  noMatches() {
    return this.page.getByText(/no matches found for/i);
  }

  // --- Eligibility card ---

  /** Only rendered once a suggestion is chosen. */
  eligibilityCard() {
    return this.page.getByText('Visa Eligibility', { exact: true });
  }

  visaCount() {
    return this.page.getByText(/\d+ Visas? Available/);
  }

  /**
   * A row of the eligibility matrix, located by its one-line description
   * rather than by the subclass number.
   *
   * The number is unusable as a locator: "189" also appears in the three
   * explainer cards lower down the page, and would appear in any ANZSCO code
   * containing it. The descriptions are unique to the card.
   */
  visaRow(subclass: '189' | '190' | '491') {
    const description = {
      '189': /No sponsorship required/i,
      '190': /Requires state\/territory nomination/i,
      '491': /Provisional regional visa/i,
    }[subclass];
    return this.page.getByText(description);
  }

  assessingAuthority(name: RegExp) {
    return this.page.getByText(name);
  }

  /** The MLTSSL / STSOL / ROL pills, which carry a ✓ or ✗ prefix. */
  listBadge(list: 'MLTSSL' | 'STSOL' | 'ROL') {
    return this.page.getByText(new RegExp(`[✓✗]\\s*${list}`));
  }

  startAssessmentButton() {
    return this.page.getByRole('button', { name: /start assessment/i });
  }
}
