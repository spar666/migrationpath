import type { Page } from '@playwright/test';

/**
 * /consultation — a landing page whose real content is a modal.
 *
 * The page opens the pre-session questionnaire automatically on mount
 * (`useEffect` sets `showQuestionnaire` true), so a visitor never sees the
 * card underneath until they close or finish it. Specs that want the card have
 * to dismiss the dialog first, which is what `closeQuestionnaire()` is for.
 *
 * The questionnaire is three steps and gates on two fields: occupation and
 * date of birth on step 1, marital status on step 2. Step 3 gates on nothing.
 */
export class ConsultationPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('/consultation');
  }

  // --- The page behind the dialog ---

  heading() {
    return this.page.getByRole('heading', {
      name: /speak with a migration expert/i,
    });
  }

  readyCard() {
    return this.page.getByRole('heading', { name: /ready to get started/i });
  }

  allSetCard() {
    return this.page.getByRole('heading', { name: /you're all set/i });
  }

  startButton() {
    return this.page.getByRole('button', { name: /start questionnaire/i });
  }

  bookAnotherButton() {
    return this.page.getByRole('button', { name: /book another consultation/i });
  }

  // --- The questionnaire dialog ---

  dialog() {
    return this.page.getByRole('dialog');
  }

  dialogTitle() {
    return this.page.getByRole('heading', { name: /pre-session intake/i });
  }

  async closeQuestionnaire() {
    await this.page.keyboard.press('Escape');
    await this.dialog().waitFor({ state: 'hidden' });
  }

  stepLabel(name: RegExp) {
    return this.dialog().getByText(name);
  }

  occupationInput() {
    return this.page.getByLabel(/current or target occupation/i);
  }

  dobInput() {
    return this.page.getByLabel(/date of birth/i);
  }

  nextButton() {
    return this.dialog().getByRole('button', { name: /continue|next/i });
  }

  backButton() {
    return this.dialog().getByRole('button', { name: /^back$/i });
  }

  submitButton() {
    return this.dialog().getByRole('button', {
      name: /complete|submit|finish/i,
    });
  }

  /** Any forward-moving button in the dialog, including mid-submit. */
  forwardButton() {
    return this.dialog()
      .getByRole('button', { name: /continue|next|complete|submit|finish|submitting/i })
      .first();
  }

  /** A shadcn Select inside the dialog. */
  combobox(index = 0) {
    return this.dialog().getByRole('combobox').nth(index);
  }

  async selectOption(index: number, label: string | RegExp) {
    await this.combobox(index).click();
    await this.page.getByRole('option', { name: label }).first().click();
  }

  // --- Confirmation dialog ---

  confirmationTitle() {
    return this.page.getByRole('heading', { name: /assessment complete/i });
  }

  errorToast() {
    return this.page.getByText(/failed to submit/i);
  }

  loginToast() {
    return this.page.getByText(/please log in to continue/i);
  }
}
