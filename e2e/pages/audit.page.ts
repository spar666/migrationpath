import type { Page } from '@playwright/test';

/**
 * The 60-Second Strategy Audit — the form behind both home page tracks.
 *
 * Three states rendered in place, no navigation between them:
 *
 *   goal ──▶ skilled ──▶ strategy preview     (Work & Study)
 *        ├─▶ family  ──▶ /pathways/partner    (Family & Partner)
 *        └─▶ (student navigates immediately, no fields at all)
 *
 * Every field is a shadcn `Select`, which renders as a combobox BUTTON rather
 * than a native `<select>`. `selectByLabel` opens it and picks from the popup
 * listbox; `fill()` and `selectOption()` do nothing useful against these.
 *
 * The two branches have different completion rules — skilled needs three of
 * three, family needs two of two — and both keep the submit button disabled
 * until met, so "is the button enabled" is the assertion for partial input.
 */

/** The visa options, exactly as the form offers them. */
export const VISA_OPTIONS = [
  { value: '482', label: '482 - Temporary Skill Shortage' },
  { value: '485', label: '485 - Temporary Graduate' },
  { value: 'sid', label: 'Skills in Demand (SID)' },
  { value: '407', label: '407 - Training Visa' },
  { value: 'other', label: 'Other Work Visa' },
];

/**
 * Experience bands, with what the strategy preview derives from each.
 *
 * `points` and `boost` come straight from StrategyPreviewCard:
 * `totalPoints = 65 + points`, `boost = max(0, 90 - totalPoints)`, and the
 * pathway flips to 190 at 85 points — which only the top band reaches.
 */
export const EXPERIENCE_OPTIONS = [
  { value: '0-1', label: 'Less than 1 year', points: 0, total: 65, boost: 25, visa: '491' },
  { value: '1-2', label: '1-2 years', points: 5, total: 70, boost: 20, visa: '491' },
  { value: '2-3', label: '2-3 years', points: 10, total: 75, boost: 15, visa: '491' },
  { value: '3-5', label: '3-5 years', points: 15, total: 80, boost: 10, visa: '491' },
  { value: '5+', label: '5+ years', points: 20, total: 85, boost: 5, visa: '190' },
];

export const RELATIONSHIP_OPTIONS = [
  'Married',
  'De facto partner',
  'Engaged / prospective marriage',
  'Parent of an Australian',
];

export const SPONSOR_OPTIONS = [
  'Australian citizen',
  'Permanent resident',
  'Eligible New Zealand citizen',
  'Not sure yet',
];

export class AuditPage {
  constructor(private readonly page: Page) {}

  // --- Goal step ---

  goalHeading() {
    return this.page.getByRole('heading', { name: /primary goal for migrating/i });
  }

  goalCard(name: RegExp) {
    return this.page.getByRole('button', { name });
  }

  skilledGoal() {
    return this.goalCard(/skilled \/ employer/i);
  }

  studentGoal() {
    return this.goalCard(/^student/i);
  }

  familyGoal() {
    return this.goalCard(/partner \/ parent/i);
  }

  changeGoalLink() {
    return this.page.getByRole('button', { name: /change goal/i });
  }

  // --- Skilled branch ---

  skilledHeading() {
    return this.page.getByText(/skilled & employer pathway/i);
  }

  /** "2 to go" / "Ready!" — the live completion counter. */
  remainingCounter() {
    return this.page.getByText(/^\d+ to go$|^ready!$/i);
  }

  progressBar() {
    return this.page.getByRole('progressbar');
  }

  /**
   * A Select, addressed by the label above it.
   *
   * The label is not wired to the button with `htmlFor`, so `getByLabel` does
   * not find it — the combobox is located by its placeholder text instead,
   * which is unique per field.
   */
  visaSelect() {
    return this.page.getByRole('combobox').filter({ hasText: /visa subclass|482|485|Skills in Demand|407|Other Work/i });
  }

  occupationSelect() {
    return this.page
      .getByRole('combobox')
      .filter({ hasText: /select your occupation|loading occupations/i });
  }

  experienceSelect() {
    return this.page
      .getByRole('combobox')
      .filter({ hasText: /years of experience|year|years/i });
  }

  /** All comboboxes on the step, in DOM order. */
  selectAt(index: number) {
    return this.page.getByRole('combobox').nth(index);
  }

  /** Opens the combobox at `index` and picks the option named `label`. */
  async choose(index: number, label: string | RegExp) {
    await this.selectAt(index).click();
    const option = this.page.getByRole('option', { name: label }).first();
    await option.waitFor();
    await option.click();
  }

  occupationLoadingPlaceholder() {
    return this.page.getByText(/loading occupations/i);
  }

  strategyButton() {
    return this.page.getByRole('button', { name: /get my strategy|analyzing/i });
  }

  analyzingLabel() {
    return this.page.getByText(/analyzing your profile/i);
  }

  /** Fills all three skilled fields. Indices are DOM order on the step. */
  async fillSkilled(options: { visa?: string; occupation?: string; experience?: string } = {}) {
    await this.choose(0, options.visa ?? '482 - Temporary Skill Shortage');
    await this.choose(1, options.occupation ?? 'Software Engineer');
    await this.choose(2, options.experience ?? '5+ years');
  }

  // --- Family branch ---

  familyHeading() {
    return this.page.getByText(/family & partner pathway/i);
  }

  noWorkDetailsNote() {
    return this.page.getByText(/no work or occupation details needed/i);
  }

  familyButton() {
    return this.page.getByRole('button', {
      name: /continue to family eligibility|preparing your check/i,
    });
  }

  preparingLabel() {
    return this.page.getByText(/preparing your check/i);
  }

  async fillFamily(options: { relationship?: string; sponsor?: string } = {}) {
    await this.choose(0, options.relationship ?? 'Married');
    await this.choose(1, options.sponsor ?? 'Australian citizen');
  }

  // --- Strategy preview ---

  previewHeading() {
    return this.page.getByRole('heading', { name: /your strategy preview/i });
  }

  previewSubtitle() {
    return this.page.getByText(/based on your .* visa and .* role/i);
  }

  /** The big number. Scoped tightly — "65" also appears inside "/ 100". */
  pointsTotal() {
    return this.page.locator('span').filter({ hasText: /^\d{2}$/ }).first();
  }

  pointsOutOf() {
    return this.page.getByText('/ 100');
  }

  pathwayBadge() {
    return this.page.getByText(/^(190|491) Eligible$/);
  }

  prioritySectorBadge() {
    return this.page.getByText(/priority sector/i);
  }

  prCountdown() {
    return this.page.getByText(/months<\/span> away|186-PR Countdown/i).first();
  }

  prCountdownValue() {
    return this.page.getByText(/^\d+ months$/);
  }

  pointsBoost() {
    return this.page.getByText(/\+\d+ potential points/);
  }

  pointsBoostSection() {
    return this.page.getByText(/points boost available/i);
  }

  stateNomination() {
    return this.page.getByText(/state nomination ready/i);
  }

  stateNominationDetail() {
    return this.page.getByText(/qualifies for nomination in|check state nomination lists/i);
  }

  saveStrategyButton() {
    return this.page.getByRole('button', { name: /save strategy & open my tracker/i });
  }

  startOverButton() {
    return this.page.getByRole('button', { name: /start over/i });
  }
}
