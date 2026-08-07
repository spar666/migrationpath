import { describe, it, expect } from 'vitest';
import {
  APPLICANT_STEPS,
  BUSINESS_STEPS,
  CONSENT_TEXT,
  stepsForParty,
  toApplicantPayload,
  toBusinessPayload,
  toPayload,
  type Answers,
} from './formDefinition';

/**
 * The answers -> DTO mapping is the highest-risk code in the funnel: it is the
 * only thing standing between what a visitor typed and what the eligibility
 * engine scores them on. A silent mis-map here does not throw, it just produces
 * a confidently wrong verdict — so these tests are mostly about the ways a
 * wrong answer could look like a valid one.
 */

const APPLICANT_BASE: Answers = {
  full_name: 'Ada Lovelace',
  email: 'ada@example.com',
  age: '32',
  onshore: 'Yes',
  occupation_name: 'Software Engineer',
  years_experience: '8',
  has_skills_assessment: 'Yes',
  english_tested: 'Yes',
  english_overall: '7.5',
  english_lowest_band: '7',
  has_employer: 'Yes',
  has_health_or_character_concern: 'No',
};

describe('contact mapping', () => {
  it('always sends consent_given true with the exact notice shown', () => {
    // The backend stores the wording verbatim. If the UI text and the stored
    // text can drift apart, the consent record is worthless as evidence.
    const payload = toApplicantPayload(APPLICANT_BASE);
    expect(payload.contact.consent_given).toBe(true);
    expect(payload.contact.consent_text).toBe(CONSENT_TEXT);
  });

  it('omits an unanswered optional phone rather than sending an empty string', () => {
    const payload = toApplicantPayload({ ...APPLICANT_BASE, phone: '   ' });
    expect(payload.contact.phone).toBeUndefined();
  });
});

describe('tri-state answers', () => {
  it.each([
    ['Yes', true],
    ['No', false],
  ])('maps %s to %s', (answer, expected) => {
    const payload = toApplicantPayload({
      ...APPLICANT_BASE,
      has_skills_assessment: answer,
    });
    expect(payload.applicant?.has_skills_assessment).toBe(expected);
  });

  it('maps "Not sure" to undefined, NOT false', () => {
    // This is the single most important assertion in the file. The engine
    // treats undefined as an open question for the agent and false as a
    // disqualifier. Collapsing them would fail people for not knowing an
    // answer — the exact opposite of what the questionnaire promises.
    const payload = toApplicantPayload({
      ...APPLICANT_BASE,
      has_skills_assessment: 'Not sure',
      has_health_or_character_concern: 'Not sure',
    });
    expect(payload.applicant?.has_skills_assessment).toBeUndefined();
    expect(payload.applicant?.has_health_or_character_concern).toBeUndefined();
  });

  it('maps an entirely unanswered question to undefined', () => {
    const { has_skills_assessment, ...withoutAnswer } = APPLICANT_BASE;
    const payload = toApplicantPayload(withoutAnswer);
    expect(payload.applicant?.has_skills_assessment).toBeUndefined();
  });
});

describe('numeric answers', () => {
  it('parses decimals, which English bands need', () => {
    const payload = toApplicantPayload(APPLICANT_BASE);
    expect(payload.applicant?.english_overall).toBe(7.5);
  });

  it('strips currency formatting people paste in', () => {
    const payload = toApplicantPayload({
      ...APPLICANT_BASE,
      offered_salary: '$95,000',
    });
    expect(payload.offered_role?.annual_salary).toBe(95000);
  });

  it('drops unparseable input instead of sending NaN', () => {
    // NaN survives JSON.stringify as null and would land in the engine as a
    // salary of nothing, which scores very differently from "not told".
    const payload = toApplicantPayload({
      ...APPLICANT_BASE,
      offered_salary: 'about ninety thousand',
    });
    expect(payload.offered_role?.annual_salary).toBeUndefined();
  });

  it('keeps a legitimate zero rather than treating it as absent', () => {
    const payload = toApplicantPayload({
      ...APPLICANT_BASE,
      years_experience: '0',
    });
    expect(payload.applicant?.years_experience).toBe(0);
  });
});

describe('applicant branch', () => {
  it('never claims the occupation is on the list', () => {
    // occupation_listed is a fact the backend looks up. Taking a claimant's
    // word for it is how an ineligible person gets told they qualify.
    const payload = toApplicantPayload(APPLICANT_BASE);
    expect(payload.applicant).not.toHaveProperty('occupation_listed');
  });

  it('sends employer and role blocks when a sponsor is lined up', () => {
    const payload = toApplicantPayload({
      ...APPLICANT_BASE,
      has_employer: 'Yes',
      employer_name: 'Acme Pty Ltd',
      employer_state: 'Victoria',
      offered_salary: '120000',
    });
    expect(payload.sponsoring_employer?.legal_name).toBe('Acme Pty Ltd');
    expect(payload.sponsoring_employer?.state).toBe('VIC');
    expect(payload.offered_role?.annual_salary).toBe(120000);
  });

  it('omits employer and role blocks when there is no sponsor', () => {
    const payload = toApplicantPayload({
      ...APPLICANT_BASE,
      has_employer: 'No',
      employer_name: 'Stale Value From A Back Button',
    });
    expect(payload.sponsoring_employer).toBeUndefined();
    expect(payload.offered_role).toBeUndefined();
  });

  it('treats "In discussion" as having an employer', () => {
    const payload = toApplicantPayload({
      ...APPLICANT_BASE,
      has_employer: 'In discussion',
      employer_name: 'Acme Pty Ltd',
    });
    expect(payload.sponsoring_employer?.legal_name).toBe('Acme Pty Ltd');
  });

  it('sends the subclass code, not the label the user read', () => {
    const payload = toApplicantPayload({
      ...APPLICANT_BASE,
      preferred_subclass: 'Skills in Demand (subclass 482)',
    });
    expect(payload.applicant?.preferred_subclass).toBe('482');
  });

  it('sends no subclass when the user asked us to recommend one', () => {
    const payload = toApplicantPayload({
      ...APPLICANT_BASE,
      preferred_subclass: 'Not sure — recommend one for me',
    });
    expect(payload.applicant?.preferred_subclass).toBeUndefined();
  });
});

const BUSINESS_BASE: Answers = {
  full_name: 'Grace Hopper',
  email: 'grace@acme.example',
  trading_name: 'Acme',
  legal_name: 'Acme Pty Ltd',
  business_address: '1 Acme Way, Sydney NSW',
  years_operating_band: '4 years or more',
  annual_revenue_band: '$1M - $5M',
  employee_count_band: '10 - 20',
  operates_only_in_australia: 'Yes',
  has_temporary_visa_employees: 'No',
  sponsored_last_5_years: 'Yes',
  is_standard_business_sponsor: 'Yes',
  position_title: 'Head Chef',
  occupation_name: 'Chef',
  occupation_code: '351311',
  salary_band: '$80,000 - $100,000',
  work_state: 'New South Wales',
  lmt_completed: 'No',
  has_candidate: 'No — we need to find someone',
};

describe('business branch', () => {
  it('derives approved sponsorship status from the SBS answer', () => {
    const payload = toBusinessPayload(BUSINESS_BASE);
    expect(payload.business?.sponsor?.is_standard_business_sponsor).toBe(true);
    expect(payload.business?.sponsor?.sponsorship_status).toBe('approved');
  });

  it('derives lapsed status when a past sponsor no longer holds an SBS', () => {
    const payload = toBusinessPayload({
      ...BUSINESS_BASE,
      is_standard_business_sponsor: 'No',
    });
    expect(payload.business?.sponsor?.sponsorship_status).toBe('lapsed');
  });

  it('leaves sponsorship status unset when the SBS question was never asked', () => {
    // A business that has not sponsored in five years never sees the SBS
    // question. "We did not ask" must not be recorded as a checked answer.
    const { is_standard_business_sponsor, ...rest } = BUSINESS_BASE;
    void is_standard_business_sponsor;
    const payload = toBusinessPayload({
      ...rest,
      sponsored_last_5_years: 'No',
    });
    expect(payload.business?.sponsor?.sponsorship_status).toBeUndefined();
    expect(
      payload.business?.sponsor?.is_standard_business_sponsor,
    ).toBeUndefined();
  });

  it('keeps trading name and legal name separate', () => {
    const payload = toBusinessPayload(BUSINESS_BASE);
    expect(payload.business?.sponsor?.trading_name).toBe('Acme');
    expect(payload.business?.sponsor?.legal_name).toBe('Acme Pty Ltd');
  });

  it('never asserts regionality from the form', () => {
    // People routinely believe their city is regional. The postcode goes up,
    // the verdict comes back.
    const payload = toBusinessPayload({
      ...BUSINESS_BASE,
      work_postcode: '2000',
    });
    expect(payload.business?.nomination).not.toHaveProperty('is_regional');
    expect(payload.business?.nomination?.work_postcode).toBe('2000');
  });

  it('omits the candidate block when no one is identified', () => {
    const payload = toBusinessPayload(BUSINESS_BASE);
    expect(payload.business?.candidate).toBeUndefined();
  });

  it('includes the candidate block when someone is identified', () => {
    const payload = toBusinessPayload({
      ...BUSINESS_BASE,
      has_candidate: 'Yes',
      candidate_age: '29',
      candidate_onshore: 'Not sure',
      candidate_english_overall: '6.5',
    });
    expect(payload.business?.candidate?.age).toBe(29);
    expect(payload.business?.candidate?.english_overall).toBe(6.5);
    // "Not sure" stays unknown here too.
    expect(payload.business?.candidate?.onshore).toBeUndefined();
  });

  it('keeps the position title separate from the nominated occupation', () => {
    // The ANZSCO occupation decides eligibility; the employer's own title is
    // what appears on the contract. Collapsing them loses one or the other.
    const payload = toBusinessPayload(BUSINESS_BASE);
    expect(payload.business?.nomination?.position_title).toBe('Head Chef');
    expect(payload.business?.nomination?.occupation_name).toBe('Chef');
    expect(payload.business?.nomination?.occupation_code).toBe('351311');
  });
});

describe('banded answers', () => {
  it('sends both the chosen label and its numeric floor', () => {
    const payload = toBusinessPayload(BUSINESS_BASE);
    const sponsor = payload.business?.sponsor;

    expect(payload.business?.nomination?.salary_band).toBe('$80,000 - $100,000');
    expect(payload.business?.nomination?.annual_salary).toBe(80_000);
    expect(sponsor?.employee_count_band).toBe('10 - 20');
    expect(sponsor?.employee_count).toBe(10);
    expect(sponsor?.years_operating_band).toBe('4 years or more');
    expect(sponsor?.years_trading).toBe(4);
  });

  it('takes the floor of a band, never the top', () => {
    // A band straddling the income threshold must not be read optimistically —
    // assuming the top would hand out an "eligible" the payroll may not support.
    const payload = toBusinessPayload({
      ...BUSINESS_BASE,
      salary_band: '$70,000 - $80,000',
    });
    expect(payload.business?.nomination?.annual_salary).toBe(70_000);
  });

  it('leaves the salary unknown when the band is not a figure at all', () => {
    const payload = toBusinessPayload({
      ...BUSINESS_BASE,
      candidate_current_pay_band: "I don't know",
      has_candidate: 'Yes',
    });
    // "I don't know" is recorded verbatim but must not become a confident zero.
    expect(payload.business?.nomination?.candidate_current_pay_band).toBe(
      "I don't know",
    );
  });

  it('carries revenue as a label only — there is no numeric field for it', () => {
    const payload = toBusinessPayload(BUSINESS_BASE);
    expect(payload.business?.sponsor?.annual_revenue_band).toBe('$1M - $5M');
  });
});

describe('payload envelope', () => {
  it('routes by party and tags the source', () => {
    expect(toPayload('applicant', APPLICANT_BASE).party).toBe('applicant');
    expect(toPayload('applicant', APPLICANT_BASE).source).toBe(
      'pre_screen_applicant',
    );
    expect(toPayload('business', BUSINESS_BASE).party).toBe('business');
    expect(toPayload('business', BUSINESS_BASE).source).toBe(
      'pre_screen_business',
    );
  });

  it('always forwards the complete raw answer set', () => {
    // raw_answers is what the agent reads on the call and the only way to
    // re-score a submission if the rules change. Losing it is unrecoverable.
    const payload = toApplicantPayload(APPLICANT_BASE);
    expect(payload.raw_answers).toMatchObject(APPLICANT_BASE);
  });
});

describe('question definitions', () => {
  it('exposes the right branch per party', () => {
    expect(stepsForParty('applicant')).toBe(APPLICANT_STEPS);
    expect(stepsForParty('business')).toBe(BUSINESS_STEPS);
  });

  it('has no duplicate field ids within a branch', () => {
    // Answers are keyed by field id across all steps, so a duplicate id means
    // two questions silently overwrite each other.
    for (const steps of [APPLICANT_STEPS, BUSINESS_STEPS]) {
      const ids = steps.flatMap((s) => s.fields.map((f) => f.id));
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('gives every choice question options to choose from', () => {
    for (const steps of [APPLICANT_STEPS, BUSINESS_STEPS]) {
      for (const step of steps) {
        for (const field of step.fields) {
          if (field.type === 'radio' || field.type === 'select') {
            expect(field.options?.length ?? 0).toBeGreaterThan(0);
          }
        }
      }
    }
  });

  it('collects contact details on the first step of both branches', () => {
    // Contact before questionnaire is deliberate: someone who abandons at
    // question nine is still a lead.
    for (const steps of [APPLICANT_STEPS, BUSINESS_STEPS]) {
      const ids = steps[0].fields.map((f) => f.id);
      expect(ids).toContain('full_name');
      expect(ids).toContain('email');
    }
  });
});
