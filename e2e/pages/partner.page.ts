import type { Locator, Page } from '@playwright/test';

/**
 * The partner visa eligibility quiz at /partner-audit.
 *
 * Fifteen steps, and the interesting part is that most of them are
 * conditional: whole questions appear and disappear based on earlier answers
 * (`showWhen` in formDefinition.ts). Answering "Australia" opens an entire
 * onshore visa-status branch that does not exist for an offshore applicant.
 *
 * That branching is why `completeToEnd()` below is a DOM-driven walker rather
 * than a hardcoded list of answers. A hardcoded walk encodes today's question
 * order into a helper that every spec depends on, and goes red on a copy
 * change that broke nothing. The walker answers whatever the step actually
 * renders, re-running after each answer because answering can reveal more
 * fields on the same step.
 *
 * Specs that care about a SPECIFIC branch drive it themselves — that is the
 * point of a branch, and a generic walker cannot assert on one.
 */
export class PartnerAuditPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('/partner-audit');
  }

  // --- Cover ---

  coverHeading() {
    return this.page.getByRole('heading', {
      name: /check your eligibility for a partner visa/i,
    });
  }

  /** The subclasses the quiz claims to cover — a promise worth pinning. */
  subclassLine() {
    return this.page.getByText(/820, 801, 309, 100, 300/);
  }

  startButton() {
    return this.page.getByRole('button', { name: /check your eligibility/i });
  }

  async start() {
    await this.startButton().click();
    await this.stepIndicator().waitFor();
  }

  // --- Quiz chrome ---

  stepIndicator() {
    return this.page.getByText(/step \d+ of \d+/i);
  }

  /** The 1-based index of the step now showing. */
  async currentStep(): Promise<number> {
    const text = (await this.stepIndicator().textContent()) ?? '';
    return Number(/step (\d+) of/i.exec(text)?.[1] ?? 0);
  }

  async totalSteps(): Promise<number> {
    const text = (await this.stepIndicator().textContent()) ?? '';
    return Number(/of (\d+)/i.exec(text)?.[1] ?? 0);
  }

  nextButton() {
    return this.page.getByRole('button', { name: /^next$/i });
  }

  /**
   * The last step's button. Distinct from `nextButton()` because the label
   * changes on the final step — a spec that clicks "Next" there waits out its
   * whole timeout against a button that no longer exists.
   */
  submitButton() {
    return this.page.getByRole('button', { name: /see my results/i });
  }

  /** Whichever forward button this step has, including mid-submit. */
  forwardButton() {
    return this.page.getByRole('button', {
      name: /^next$|see my results|checking/i,
    });
  }

  backButton() {
    return this.page.getByRole('button', { name: /^back$/i });
  }

  async next() {
    await this.forwardButton().click();
  }

  async back() {
    await this.backButton().click();
  }

  // --- Fields ---

  /** Radix renders each radio as a <button role="radio"> named by its label. */
  option(label: string) {
    return this.page.getByRole('radio', { name: label, exact: true });
  }

  async choose(label: string) {
    await this.option(label).click();
  }

  checkboxOption(label: string) {
    return this.page.getByRole('checkbox', { name: label, exact: true });
  }

  textbox(label: RegExp) {
    return this.page.getByLabel(label);
  }

  async fill(label: RegExp, value: string) {
    await this.textbox(label).fill(value);
  }

  /**
   * Answers the whole of step 1: both first names and who is filling the quiz.
   *
   * Every branch spec starts here, because the names are what later questions
   * are personalised with — a spec that skips this step cannot advance past it,
   * and the failure surfaces several steps later as a missing question rather
   * than as "step 1 was never answered".
   */
  async fillNames(applicant = 'Ada', sponsor = 'Charles') {
    await this.fill(/applicant first name/i, applicant);
    await this.fill(/sponsor first name/i, sponsor);
    await this.choose('Applicant');
  }

  /** A shadcn Select is a combobox button, not a native <select>. */
  selectTrigger(index = 0) {
    return this.page.getByRole('combobox').nth(index);
  }

  async selectOption(triggerIndex: number, optionLabel: string) {
    await this.selectTrigger(triggerIndex).click();
    await this.page
      .getByRole('option', { name: optionLabel, exact: true })
      .click();
  }

  // --- Validation ---

  requiredError() {
    return this.page.getByText(/this question is required/i);
  }

  emailError() {
    return this.page.getByText(/please enter a valid email address/i);
  }

  futureDateError() {
    return this.page.getByText(/can't be in the future/i);
  }

  pastDateError() {
    return this.page.getByText(/can't be in the past/i);
  }

  /** Any field-level validation message. */
  anyError() {
    return this.page.getByRole('alert');
  }

  submitError() {
    return this.page.getByText(
      /something went wrong while submitting|server error|please try again/i,
    );
  }

  // --- Result ---

  eligibleHeading() {
    return this.page.getByRole('heading', { name: /great news/i });
  }

  highEffortHeading() {
    return this.page.getByRole('heading', {
      name: /needs specialist attention/i,
    });
  }

  ineligibleHeading() {
    return this.page.getByRole('heading', {
      name: /won.t be able to help/i,
    });
  }

  /** Any of the three verdicts — for specs that only need one to have landed. */
  anyVerdict() {
    return this.page.getByRole('heading', {
      name: /great news|specialist attention|won.t be able to help/i,
    });
  }

  /**
   * The booking CTA. A button, not a link: clicking it saves the prospect
   * session and hands off to the scheduler with the prospect id attached,
   * rather than navigating to a static href.
   */
  consultationCta() {
    return this.page
      .getByRole('button', { name: /book|talk to our team/i })
      .first();
  }

  // --- The walker ---

  /**
   * Fills one control with something valid for its type.
   *
   * Dates read their own direction off the DOM: FieldControl sets `min` for a
   * future-only date and `max` for a past-only one, so the input already knows
   * which way is legal and this does not have to duplicate that rule.
   */
  private async answerControl(control: Locator): Promise<void> {
    const type = await control.getAttribute('type');

    if (type === 'date') {
      const hasMin = (await control.getAttribute('min')) !== null;
      await control.fill(hasMin ? '2030-06-01' : '2020-06-01');
      return;
    }
    if (type === 'email') {
      await control.fill('ada@example.com');
      return;
    }
    await control.fill('E2E answer');
  }

  /**
   * Answers every unanswered visible question on the current step.
   *
   * Loops because answering can reveal new questions on the SAME step — the
   * onshore branch is four questions deep — and a single pass would leave the
   * newly revealed ones blank and the step unable to advance.
   */
  async answerStep(): Promise<void> {
    for (let pass = 0; pass < 6; pass++) {
      let answeredSomething = false;

      // Radios: one per group, only if the group has no selection yet.
      const groups = this.page.getByRole('radiogroup');
      for (let i = 0; i < (await groups.count()); i++) {
        const group = groups.nth(i);
        if (await group.getByRole('radio', { checked: true }).count()) continue;
        const first = group.getByRole('radio').first();
        if (await first.count()) {
          await first.click();
          answeredSomething = true;
        }
      }

      // Selects: open and take the first option.
      const combos = this.page.getByRole('combobox');
      for (let i = 0; i < (await combos.count()); i++) {
        const combo = combos.nth(i);
        const value = (await combo.textContent())?.trim() ?? '';
        if (value && !/select an option/i.test(value)) continue;
        await combo.click();
        const option = this.page.getByRole('option').first();
        await option.waitFor();
        await option.click();
        answeredSomething = true;
      }

      // Text, email, date and textarea.
      const boxes = this.page.getByRole('textbox');
      for (let i = 0; i < (await boxes.count()); i++) {
        const box = boxes.nth(i);
        if ((await box.inputValue()) !== '') continue;
        await this.answerControl(box);
        answeredSomething = true;
      }

      // Checkbox groups have no "unanswered" signal, so tick the first of any
      // group that is entirely unticked.
      const boxesChecked = this.page.getByRole('checkbox', { checked: true });
      const allBoxes = this.page.getByRole('checkbox');
      if ((await allBoxes.count()) > 0 && (await boxesChecked.count()) === 0) {
        await allBoxes.first().click();
        answeredSomething = true;
      }

      if (!answeredSomething) return;
    }
  }

  /**
   * Walks from the cover to the verdict, answering every step generically.
   *
   * Returns without asserting — the caller decides what the verdict should be.
   */
  async completeToEnd(): Promise<void> {
    await this.start();

    const total = await this.totalSteps();
    for (let i = 0; i < total + 2; i++) {
      if (await this.anyVerdict().count()) return;

      await this.answerStep();

      const submit = this.submitButton();
      if (await submit.count()) {
        await submit.click();
        await this.anyVerdict().waitFor({ timeout: 15_000 });
        return;
      }

      const before = await this.currentStep();
      await this.next();
      // Wait for the step to actually change rather than sleeping: a step that
      // refuses to advance is a validation bug, and this surfaces it as a
      // timeout on the step counter instead of a confusing later failure.
      await this.page
        .getByText(new RegExp(`step ${before + 1} of`, 'i'))
        .waitFor({ timeout: 10_000 });
    }
  }
}
