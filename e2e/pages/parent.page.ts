import type { Page } from '@playwright/test';

/**
 * The parent visa gateway at /parent-audit.
 *
 * Three steps — sponsor, balance of family, finances — and then a verdict
 * dashboard. Two of its controls are unusual enough to be worth naming here:
 *
 *   - The child counts are +/- steppers, not inputs. There is nothing to type
 *     into, so every count is reached by clicking. `setStepper` does that.
 *   - "Children in Australia" is capped at the worldwide total, and lowering
 *     the total drags it down with it. That coupling is a real rule (you
 *     cannot have 3 of 2 children in Australia) and specs assert on it.
 */
export class ParentAuditPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('/parent-audit');
  }

  // --- Chrome ---

  title() {
    return this.page.getByText(/parent visa eligibility gateway/i);
  }

  stepIndicator() {
    return this.page.getByText(/step \d+ of \d+/i);
  }

  async currentStep(): Promise<number> {
    const text = (await this.stepIndicator().textContent()) ?? '';
    return Number(/step (\d+) of/i.exec(text)?.[1] ?? 0);
  }

  continueButton() {
    return this.page.getByRole('button', { name: /continue/i });
  }

  submitButton() {
    return this.page.getByRole('button', { name: /see my results/i });
  }

  /** Whichever forward button this step has, including mid-submit. */
  forwardButton() {
    return this.page.getByRole('button', { name: /continue|see my results|scoring/i });
  }

  backButton() {
    return this.page.getByRole('button', { name: /^back$/i });
  }

  // --- Step 0: sponsor ---

  sponsorHeading() {
    return this.page.getByRole('heading', { name: /your sponsoring child/i });
  }

  sponsorStatusTrigger() {
    return this.page.getByRole('combobox');
  }

  async chooseSponsorStatus(label: string) {
    await this.sponsorStatusTrigger().click();
    await this.page.getByRole('option', { name: label, exact: true }).click();
  }

  monthsInput() {
    return this.page.getByLabel(/months lawfully residing/i);
  }

  // --- Step 1: balance of family ---

  balanceHeading() {
    return this.page.getByRole('heading', { name: /balance of family/i });
  }

  /**
   * A stepper's current value.
   *
   * The number sits in a sibling span with no label of its own, so it is
   * reached through the row that contains the labelled +/- buttons.
   */
  private stepperRow(label: string) {
    return this.page
      .locator('div')
      .filter({ has: this.page.getByRole('button', { name: `Increase ${label}` }) })
      .last();
  }

  increase(label: string) {
    return this.page.getByRole('button', { name: `Increase ${label}` });
  }

  decrease(label: string) {
    return this.page.getByRole('button', { name: `Decrease ${label}` });
  }

  async stepperValue(label: string): Promise<number> {
    const text = (await this.stepperRow(label).innerText()) ?? '';
    const match = /(\d+)\s*$/m.exec(text.trim());
    return Number(match?.[1] ?? NaN);
  }

  /** Clicks + or - until the stepper reads `target`. */
  async setStepper(label: string, target: number): Promise<void> {
    for (let i = 0; i < 60; i++) {
      const current = await this.stepperValue(label);
      if (current === target) return;
      await (current < target ? this.increase(label) : this.decrease(label)).click();
    }
    throw new Error(`Could not drive the "${label}" stepper to ${target}.`);
  }

  totalChildren() {
    return 'Total children (worldwide)';
  }

  childrenInAustralia() {
    return 'Children in Australia';
  }

  childrenElsewhere() {
    return 'Children in the largest other country';
  }

  // --- Step 2: finances ---

  financeHeading() {
    return this.page.getByRole('heading', { name: /sponsor income/i });
  }

  incomeInput() {
    return this.page.getByLabel(/income/i);
  }

  ageInput() {
    return this.page.getByLabel(/age/i);
  }

  // --- Result ---

  eligibleBadge() {
    return this.page.getByRole('heading', { name: /legally eligible/i });
  }

  ineligibleBadge() {
    return this.page.getByRole('heading', { name: /legally ineligible/i });
  }

  anyVerdict() {
    return this.page.getByRole('heading', { name: /legally (in)?eligible/i });
  }

  likelyPath() {
    return this.page.getByText(/likely path:/i);
  }

  balanceOfFamilyCard() {
    return this.page.getByRole('heading', { name: /balance of family test/i });
  }

  childrenSummary() {
    return this.page.getByText(/\d+ out of \d+ children in\s+australia/i);
  }

  coAssurerWarning() {
    return this.page.getByText(/co-assurer likely required/i);
  }

  disclaimer() {
    return this.page.getByText(/indicative only/i);
  }

  restartButton() {
    return this.page.getByRole('button', { name: /start over|restart|again/i });
  }

  errorToast() {
    return this.page.getByText(/couldn.t assess your eligibility/i);
  }

  /**
   * Fills all three steps with a profile that passes, then submits.
   *
   * Defaults describe a clean case: citizen sponsor, well past the residence
   * requirement, most children in Australia, income above the benchmark.
   */
  async complete(
    options: {
      sponsorStatus?: string;
      months?: string;
      total?: number;
      inAustralia?: number;
      elsewhere?: number;
      income?: string;
      age?: string;
    } = {},
  ): Promise<void> {
    await this.chooseSponsorStatus(options.sponsorStatus ?? 'Australian citizen');
    await this.monthsInput().fill(options.months ?? '36');
    await this.continueButton().click();

    await this.balanceHeading().waitFor();
    await this.setStepper(this.totalChildren(), options.total ?? 3);
    await this.setStepper(this.childrenInAustralia(), options.inAustralia ?? 2);
    await this.setStepper(this.childrenElsewhere(), options.elsewhere ?? 1);
    await this.continueButton().click();

    await this.financeHeading().waitFor();
    await this.incomeInput().fill(options.income ?? '95000');
    await this.ageInput().fill(options.age ?? '67');
    await this.submitButton().click();
  }
}
