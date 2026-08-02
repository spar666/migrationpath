import type { Page } from '@playwright/test';

/**
 * The pre-screen funnel: splash -> questionnaire -> result.
 *
 * Selectors live here rather than in the specs because the questionnaire's
 * wording will change — it is marketing copy attached to a legislative
 * questionnaire, so it changes more often than the flow does. One file to
 * update when it does.
 *
 * Every selector below is mirrored by an assertion in
 * `src/e2eSelectors.test.tsx`, which runs in jsdom in milliseconds. If a label
 * changes, that suite goes red first and says exactly which one — rather than
 * this suite going red twenty minutes later saying "timeout waiting for
 * locator".
 */
export class PreScreenPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('/pre-screen');
  }

  // --- Splash ---

  applicantCard() {
    // getByRole, not getByText: the cards are buttons whose text also lives in
    // nested spans, and Playwright's strict mode fails a locator resolving to
    // more than one node.
    return this.page.getByRole('button', { name: /looking to be sponsored/i });
  }

  businessCard() {
    return this.page.getByRole('button', { name: /business looking to sponsor/i });
  }

  async startAsApplicant() {
    await this.applicantCard().click();
  }

  async startAsBusiness() {
    await this.businessCard().click();
  }

  // --- Questionnaire ---

  nextButton() {
    return this.page.getByRole('button', { name: /next|see my result/i });
  }

  /**
   * The same button, but also matched while it is mid-submit.
   *
   * On submit the label becomes "Checking…", which `nextButton()` does not
   * match. That is fine for driving the form and a trap for any spec that
   * wants to touch the button DURING a submission: `nextButton().click()`
   * would wait for a label that does not come back — the form is replaced by
   * the result screen — and quietly burn the entire test timeout before
   * failing somewhere else entirely.
   */
  forwardButton() {
    return this.page.getByRole('button', {
      name: /next|see my result|checking/i,
    });
  }

  backButton() {
    return this.page.getByRole('button', { name: /back/i });
  }

  consentCheckbox() {
    return this.page.getByRole('checkbox');
  }

  stepIndicator() {
    return this.page.getByText(/step \d+ of \d+/i);
  }

  validationError() {
    return this.page.getByText(/this question is required/i);
  }

  /**
   * The banner shown when the submission itself fails, as distinct from
   * `validationError()` — the visitor answered correctly and the server broke.
   *
   * The wording comes from the axios interceptor in `src/lib/apiClient.ts`,
   * not from this page, so it is matched loosely: what the spec is entitled to
   * assert is that a failed submit says something, not which of the
   * interceptor's messages it picked.
   */
  submissionError() {
    return this.page
      .getByText(/server error|something went wrong|please try again/i)
      .first();
  }

  async fill(label: RegExp, value: string) {
    await this.page.getByLabel(label).fill(value);
  }

  async choose(option: string) {
    await this.page.getByLabel(option, { exact: true }).click();
  }

  async next() {
    await this.nextButton().click();
  }

  /**
   * Walks the applicant branch with answers that pass validation.
   *
   * Deliberately not parameterised beyond the contact details: the point of
   * this helper is to get a spec to the result screen cheaply. A spec that
   * cares about specific answers should drive the steps itself.
   */
  async completeApplicantQuestionnaire(
    contact: { name?: string; email?: string } = {},
  ) {
    await this.startAsApplicant();

    await this.fill(/full name/i, contact.name ?? 'Ada Lovelace');
    await this.fill(/email address/i, contact.email ?? 'ada@example.com');
    await this.next();

    await this.fill(/how old are you/i, '32');
    await this.choose('No'); // not currently in Australia
    await this.next();

    await this.fill(/what is your occupation/i, 'Software Engineer');
    await this.fill(/years of full-time experience/i, '8');
    await this.choose('Yes'); // has a skills assessment
    await this.next();

    await this.choose('Not tested yet'); // English
    await this.next();

    await this.choose('No'); // no employer lined up
    await this.next();

    await this.choose('No'); // no health or character concern
    await this.consentCheckbox().click();
    await this.next();
  }

  // --- Result ---

  bookButton() {
    return this.page.getByRole('button', { name: /book your consultation/i });
  }

  reference() {
    return this.page.getByText(/^MP-[A-Z2-9]{6}$/);
  }

  eligibleHeading() {
    return this.page.getByText(/you look eligible/i);
  }

  notAFitHeading() {
    return this.page.getByText(/we’re not the right firm/i);
  }

  ineligibleHeading() {
    return this.page.getByText(/here’s what’s in the way/i);
  }

  disclaimer() {
    return this.page.getByText(/is not immigration advice/i);
  }
}
