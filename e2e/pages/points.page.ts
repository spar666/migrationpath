import type { Page } from '@playwright/test';

/**
 * The structured points calculator.
 *
 * Two things about this screen shape every locator below.
 *
 * First, it has no submit button. The score recalculates from a debounced
 * effect as fields change, so "the user finished entering their profile" is not
 * an event the test can wait on — every assertion has to be written against a
 * value that settles, which is why the score getters return locators rather
 * than strings.
 *
 * Second, the two dropdowns are Radix `Select`s, not native `<select>`s.
 * `selectOption()` does nothing to them. They must be opened and their option
 * clicked, and the options render in a portal at the end of `<body>` rather
 * than inside the trigger — so scoping an option lookup to the form finds
 * nothing.
 */
export class PointsPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('/points-calculator');
  }

  // --- Inputs ---

  ageInput() {
    return this.page.locator('#age');
  }

  overseasWorkInput() {
    return this.page.locator('#os-work');
  }

  australianWorkInput() {
    return this.page.locator('#au-work');
  }

  englishTrigger() {
    return this.page.getByRole('combobox').first();
  }

  qualificationTrigger() {
    return this.page.getByRole('combobox').nth(1);
  }

  /**
   * Picks an option from a Radix Select.
   *
   * The `waitFor` is not defensive padding: the content animates in from a
   * portal, and clicking an option that is attached but still transforming is
   * the classic way this interaction flakes on a loaded CI runner.
   */
  private async chooseFrom(trigger: ReturnType<PointsPage['englishTrigger']>, label: RegExp) {
    await trigger.click();
    const option = this.page.getByRole('option', { name: label });
    await option.waitFor({ state: 'visible' });
    await option.click();
  }

  async selectEnglish(label: RegExp) {
    await this.chooseFrom(this.englishTrigger(), label);
  }

  async selectQualification(label: RegExp) {
    await this.chooseFrom(this.qualificationTrigger(), label);
  }

  /** The Yes/No pair for regional study. Plain buttons, not a Radix control. */
  regionalStudyToggle(answer: 'Yes' | 'No') {
    return this.page.getByRole('button', { name: answer, exact: true });
  }

  /**
   * The minimum needed to make the calculator call the API at all: age is
   * prefilled, so only the two selects are outstanding.
   */
  async completeMinimumProfile() {
    await this.selectEnglish(/proficient english/i);
    await this.selectQualification(/bachelor or masters/i);
  }

  // --- Scorecard ---

  /**
   * The big number. Matched by its own class rather than by role because it is
   * a `motion.span` with no accessible name, and `getByText` on a bare integer
   * matches the breakdown rows too.
   */
  score() {
    return this.page.locator('span.text-6xl');
  }

  passMarkBadge() {
    return this.page.getByText(/pass mark met/i);
  }

  belowPassBadge() {
    return this.page.getByText(/below pass mark/i);
  }

  /** Shown until both selects have a value — the "don't guess" state. */
  prompt() {
    return this.page.getByText(/select your english level and qualification/i);
  }

  breakdownHeading() {
    return this.page.getByRole('heading', { name: /breakdown/i });
  }

  workCapNote() {
    return this.page.getByText(/capped at the legal maximum of 20 points/i);
  }

  errorMessage() {
    return this.page.getByText(/couldn’t calculate your score|couldn't calculate your score/i);
  }

  ineligibilityNotice(text: RegExp) {
    return this.page.getByText(text);
  }
}
