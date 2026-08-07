/**
 * Data-driven definition of the employer-sponsored pre-screen.
 *
 * Two branches, because employer-sponsored has two parties with genuinely
 * different qualifying data: a worker wants to know if they can be sponsored,
 * a business wants to know if it can sponsor. The splash forks between them.
 *
 * These questions are typed against `SubmitPreScreenPayload` and mapped to it
 * explicitly in `toApplicantPayload` / `toBusinessPayload` below. The mapping
 * is deliberately hand-written rather than clever: the eligibility engine reads
 * specific fields, and a generic answers-to-DTO transform would silently stop
 * feeding the engine the day someone renames a question.
 *
 * Every mapped field is OPTIONAL on the backend. The engine treats a missing
 * answer as an open question for the agent rather than as a "no", so it is
 * better to send a partial questionnaire than to force a guess — which is why
 * most questions here carry `required: false` and a "Not sure" option.
 */

import type {
  PreScreenApplicant,
  PreScreenBusiness,
  PreScreenNomination,
  PreScreenSponsor,
  ProspectParty,
  SubmitPreScreenPayload,
} from '@/services/preScreenService';

export type AnswerValue = string | string[];
export type Answers = Record<string, AnswerValue | undefined>;

export type FieldType =
  | 'radio'
  | 'select'
  | 'text'
  | 'number'
  | 'email'
  | 'tel'
  /** Async picker over the occupations catalogue. Resolves an ANZSCO code. */
  | 'occupation';

/**
 * The occupation picker writes these alongside its own field, so the ANZSCO
 * code sent to the engine always came from the catalogue rather than a
 * free-text guess.
 */
export const OCCUPATION_CODE_FIELD = 'occupation_code';
export const OCCUPATION_LIST_FIELD = 'occupation_list';

export interface FieldDef {
  id: string;
  type: FieldType;
  label: string;
  /** Muted helper line under the label. */
  hint?: string;
  options?: string[];
  placeholder?: string;
  /** Defaults to true. */
  required?: boolean;
  maxLength?: number;
  /** Number fields only. */
  min?: number;
  max?: number;
  showWhen?: (a: Answers) => boolean;
}

export interface StepDef {
  id: string;
  /** Short name shown in the progress line. */
  name: string;
  title?: string;
  intro?: string;
  fields: FieldDef[];
}

// ---------------------------------------------------------------------------
// Shared option sets
// ---------------------------------------------------------------------------

export const AU_STATES = [
  'Australian Capital Territory',
  'New South Wales',
  'Northern Territory',
  'Queensland',
  'South Australia',
  'Tasmania',
  'Victoria',
  'Western Australia',
];

/**
 * Mapped to the engine's `state` field. The engine expects the short code, so
 * the label the user reads and the value we send are not the same string.
 */
export const STATE_CODES: Record<string, string> = {
  'Australian Capital Territory': 'ACT',
  'New South Wales': 'NSW',
  'Northern Territory': 'NT',
  Queensland: 'QLD',
  'South Australia': 'SA',
  Tasmania: 'TAS',
  Victoria: 'VIC',
  'Western Australia': 'WA',
};

const YES_NO_UNSURE = ['Yes', 'No', 'Not sure'];

/**
 * Strict yes/no, used by the business branch.
 *
 * The applicant branch offers "Not sure" because an individual genuinely may
 * not know their own English band or skills-assessment status. A business
 * answering about its own trading history does know, and an opt-out there just
 * produces blanks the agent has to chase.
 */
const YES_NO = ['Yes', 'No'];

/**
 * ⚠️ Display only — the authoritative figure lives in the backend config
 * (CORE_SKILLS_INCOME_THRESHOLD). Repeated here because the salary question is
 * meaningless without telling people what they are being measured against.
 * Keep the two in step; it is indexed annually.
 */
export const CORE_SKILLS_INCOME_THRESHOLD = 73_150;

function fmtAud(value: number): string {
  return value.toLocaleString('en-AU');
}

/**
 * Banded answers.
 *
 * Bands beat a free-text figure here: businesses give a range far more readily
 * than an exact number, and the engine only ever compares against thresholds.
 *
 * Each band maps to its LOWER bound for the engine. That is the conservative
 * reading — a business in the "$70,000 - $80,000" band straddles the income
 * threshold, and assuming the top of the band would hand out an "eligible"
 * that the payroll might not support. The band label is stored verbatim too,
 * so the agent sees the range the business actually chose.
 */
const SALARY_BANDS = [
  'Less than $70,000',
  '$70,000 - $80,000',
  '$80,000 - $100,000',
  '$100,000 - $120,000',
  '$120,000 - $140,000',
  'More than $140,000',
];

const SALARY_BAND_FLOOR: Record<string, number> = {
  'Less than $70,000': 0,
  '$70,000 - $80,000': 70_000,
  '$80,000 - $100,000': 80_000,
  '$100,000 - $120,000': 100_000,
  '$120,000 - $140,000': 120_000,
  'More than $140,000': 140_000,
};

const CURRENT_PAY_BANDS = [...SALARY_BANDS, "I don't know"];

const REVENUE_BANDS = [
  'Less than $500,000',
  '$500,000 - $1M',
  '$1M - $5M',
  '$5M - $10M',
  '$10M - $15M',
  '$15M or more',
];

const YEARS_OPERATING_BANDS = [
  'Less than 1 year',
  '1 - 2 years',
  '2 - 3 years',
  '3 - 4 years',
  '4 years or more',
  'It does not operate in Australia',
];

const YEARS_OPERATING_FLOOR: Record<string, number> = {
  'Less than 1 year': 0,
  '1 - 2 years': 1,
  '2 - 3 years': 2,
  '3 - 4 years': 3,
  '4 years or more': 4,
  'It does not operate in Australia': 0,
};

const HEADCOUNT_BANDS = ['Less than 5', '5 - 10', '10 - 20', '21 or more'];

const HEADCOUNT_FLOOR: Record<string, number> = {
  'Less than 5': 0,
  '5 - 10': 5,
  '10 - 20': 10,
  '21 or more': 21,
};

const REFERRAL_SOURCES = [
  'Google',
  'ChatGPT (or equivalent)',
  'LinkedIn',
  'Facebook',
  'Instagram',
  'TikTok',
  'Referral',
  'Other',
];

/**
 * The employer-sponsored subclasses this funnel screens for. Labels carry the
 * number because that is what people search for and what agents say.
 */
const SUBCLASS_OPTIONS = [
  'Skills in Demand (subclass 482)',
  'Employer Nomination Scheme (subclass 186)',
  'Skilled Employer Sponsored Regional (subclass 494)',
  'Not sure — recommend one for me',
];

const SUBCLASS_CODES: Record<string, string> = {
  'Skills in Demand (subclass 482)': '482',
  'Employer Nomination Scheme (subclass 186)': '186',
  'Skilled Employer Sponsored Regional (subclass 494)': '494',
};

const SPONSORSHIP_STATUS_OPTIONS = [
  'Not yet — we would be applying for the first time',
  'Yes — we are an approved sponsor',
  'We were approved, but it has lapsed',
  'We applied and were refused',
  'Not sure',
];

const SPONSORSHIP_STATUS_VALUES: Record<
  string,
  NonNullable<PreScreenSponsor['sponsorship_status']>
> = {
  'Not yet — we would be applying for the first time': 'prospective',
  'Yes — we are an approved sponsor': 'approved',
  'We were approved, but it has lapsed': 'lapsed',
  'We applied and were refused': 'refused',
  'Not sure': 'unknown',
};

// ---------------------------------------------------------------------------
// Answer readers
//
// The form stores everything as strings (that is what the controls produce).
// These turn a stored answer back into the type the DTO wants, and return
// undefined for "unanswered" or "Not sure" so an unknown stays unknown rather
// than becoming a confident false.
// ---------------------------------------------------------------------------

function str(a: Answers, id: string): string | undefined {
  const v = a[id];
  if (typeof v !== 'string') return undefined;
  const trimmed = v.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function num(a: Answers, id: string): number | undefined {
  const raw = str(a, id);
  if (raw === undefined) return undefined;
  const parsed = Number(raw.replace(/[,$\s]/g, ''));
  return Number.isFinite(parsed) ? parsed : undefined;
}

/** Yes/No/Not sure -> true/false/undefined. "Not sure" must NOT become false. */
function bool(a: Answers, id: string): boolean | undefined {
  const raw = str(a, id);
  if (raw === 'Yes') return true;
  if (raw === 'No') return false;
  return undefined;
}

/**
 * A band label -> the numeric floor the engine tests against. Returns
 * undefined for "I don't know" and anything unmapped, so an evasion stays an
 * open question rather than becoming a confident zero.
 */
function bandFloor(
  a: Answers,
  id: string,
  floors: Record<string, number>,
): number | undefined {
  const raw = str(a, id);
  return raw ? floors[raw] : undefined;
}

function stateCode(a: Answers, id: string): string | undefined {
  const raw = str(a, id);
  return raw ? (STATE_CODES[raw] ?? raw) : undefined;
}

function subclass(a: Answers, id: string): string | undefined {
  const raw = str(a, id);
  return raw ? SUBCLASS_CODES[raw] : undefined;
}

// ---------------------------------------------------------------------------
// Contact step — identical for both parties, asked FIRST
//
// Contact details come before the questionnaire, not after it. Someone who
// abandons at question nine is still a lead worth having, and the backend
// writes the prospect regardless of the verdict.
// ---------------------------------------------------------------------------

export const CONSENT_TEXT =
  'I agree that MigrationPath may collect and use the details above to assess ' +
  'my enquiry and contact me about it, as described in the Privacy Policy. ' +
  'This assessment is a preliminary indication only and is not immigration advice.';

function contactStep(party: ProspectParty): StepDef {
  const business = party === 'business';
  return {
    id: 'contact',
    name: 'Your details',
    title: business ? 'Who should we speak to?' : 'First, how do we reach you?',
    intro:
      'We use these to send your assessment and, if you go ahead, to set up ' +
      'your consultation.',
    fields: [
      {
        id: 'full_name',
        type: 'text',
        label: business ? "What's your first name?" : 'Full name',
        hint: business
          ? 'We need the first name as contact for the business'
          : undefined,
        maxLength: 120,
      },
      {
        id: 'email',
        type: 'email',
        label: business
          ? 'What is the best email to contact you?'
          : 'Email address',
        hint: business
          ? "We'll send a copy of the business' eligibility results to your email."
          : undefined,
        placeholder: 'you@example.com',
      },
      {
        id: 'phone',
        type: 'tel',
        label: business ? "What's your contact number?" : 'Phone number',
        hint: 'Optional, but it is the fastest way for an agent to reach you.',
        required: false,
        maxLength: 32,
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// Applicant branch
// ---------------------------------------------------------------------------

export const APPLICANT_STEPS: StepDef[] = [
  contactStep('applicant'),
  {
    id: 'about_you',
    name: 'About you',
    title: 'A few things about you',
    fields: [
      {
        id: 'age',
        type: 'number',
        label: 'How old are you?',
        hint: 'Age limits apply to some employer-sponsored visas.',
        min: 15,
        max: 99,
      },
      {
        id: 'onshore',
        type: 'radio',
        label: 'Are you currently in Australia?',
        options: YES_NO_UNSURE,
      },
      {
        id: 'current_visa',
        type: 'text',
        label: 'What visa are you on right now?',
        hint: 'A subclass number is ideal (e.g. 500, 485). "Bridging" is fine too.',
        required: false,
        maxLength: 60,
        showWhen: (a) => a.onshore === 'Yes',
      },
    ],
  },
  {
    id: 'occupation',
    name: 'Occupation',
    title: 'Your occupation',
    intro:
      'Employer-sponsored visas are occupation-driven — this is the single ' +
      'biggest factor in the result.',
    fields: [
      {
        id: 'occupation_name',
        type: 'text',
        label: 'What is your occupation?',
        hint: 'The job title you would be sponsored for, not necessarily your current one.',
        maxLength: 120,
      },
      {
        id: 'occupation_code',
        type: 'text',
        label: 'ANZSCO code, if you know it',
        hint: 'A six-digit code, e.g. 261313. Leave blank if you are not sure.',
        required: false,
        maxLength: 12,
      },
      {
        id: 'years_experience',
        type: 'number',
        label: 'Years of full-time experience in that occupation',
        min: 0,
        max: 60,
      },
      {
        id: 'has_skills_assessment',
        type: 'radio',
        label: 'Do you have a positive skills assessment for it?',
        hint: 'Not required for every subclass — we ask because it changes which ones are open to you.',
        options: YES_NO_UNSURE,
      },
    ],
  },
  {
    id: 'english',
    name: 'English',
    title: 'Your English',
    intro:
      'If you have not tested yet, choose "Not tested yet" — a missing score ' +
      'is treated as an open question, not a fail.',
    fields: [
      {
        id: 'english_tested',
        type: 'radio',
        label: 'Have you sat an English test?',
        options: ['Yes', 'Not tested yet'],
      },
      {
        id: 'english_overall',
        type: 'number',
        label: 'Overall score (IELTS equivalent)',
        hint: 'Give the IELTS-equivalent band, e.g. 6.5. We convert other tests on the call.',
        min: 0,
        max: 9,
        showWhen: (a) => a.english_tested === 'Yes',
      },
      {
        id: 'english_lowest_band',
        type: 'number',
        label: 'Lowest individual band',
        hint: 'The weakest of your four components — this is usually what decides eligibility.',
        min: 0,
        max: 9,
        showWhen: (a) => a.english_tested === 'Yes',
      },
    ],
  },
  {
    id: 'employer',
    name: 'Employer',
    title: 'Do you already have an employer?',
    intro:
      'Having a sponsor lined up changes the advice substantially, so it is ' +
      'worth telling us either way.',
    fields: [
      {
        id: 'has_employer',
        type: 'radio',
        label: 'Has an Australian employer offered to sponsor you?',
        options: ['Yes', 'No', 'In discussion'],
      },
      {
        id: 'employer_name',
        type: 'text',
        label: 'Employer name',
        required: false,
        maxLength: 160,
        showWhen: (a) => a.has_employer !== 'No',
      },
      {
        id: 'employer_state',
        type: 'select',
        label: 'Where is the role based?',
        options: AU_STATES,
        required: false,
        showWhen: (a) => a.has_employer !== 'No',
      },
      {
        id: 'offered_salary',
        type: 'number',
        label: 'Annual salary offered (AUD)',
        hint: 'Base salary excluding super. Employer-sponsored visas have an income floor.',
        required: false,
        min: 0,
        showWhen: (a) => a.has_employer !== 'No',
      },
      {
        id: 'preferred_subclass',
        type: 'radio',
        label: 'Is there a particular visa you are aiming for?',
        options: SUBCLASS_OPTIONS,
        required: false,
      },
    ],
  },
  {
    id: 'history',
    name: 'History',
    title: 'Anything we should know?',
    intro:
      'These do not necessarily stop an application, but they change how it ' +
      'is prepared — and finding out late is what causes refusals.',
    fields: [
      {
        id: 'has_health_or_character_concern',
        type: 'radio',
        label:
          'Do you have any health condition, criminal record, or previous visa refusal or cancellation?',
        hint: 'A yes here is common and usually manageable. We just need to plan for it.',
        options: YES_NO_UNSURE,
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Business branch
// ---------------------------------------------------------------------------

export const BUSINESS_STEPS: StepDef[] = [
  contactStep('business'),
  {
    id: 'business',
    name: 'The business',
    title: "Let's get started",
    fields: [
      {
        id: 'legal_name',
        type: 'text',
        label: 'What is the name of the business?',
        hint: 'Make sure this is the business entity that is employing the applicant.',
        maxLength: 200,
      },
      {
        id: 'abn',
        type: 'text',
        label: 'What is the ABN of the business?',
        hint: 'Make sure this is the business entity that is employing the applicant.',
        maxLength: 20,
        placeholder: '11 222 333 444',
      },
      {
        id: 'business_address',
        type: 'text',
        label: 'What is the business address?',
        maxLength: 300,
      },
    ],
  },
  {
    id: 'sponsorship',
    name: 'Sponsorship',
    title: 'Your sponsorship position',
    fields: [
      {
        id: 'sponsored_last_5_years',
        type: 'radio',
        label: 'Has the business sponsored an employee in the last 5 years?',
        options: YES_NO,
      },
      {
        // Only worth asking of a business that has sponsored before — asking
        // everyone produces a guess from people who have never heard the term.
        id: 'is_standard_business_sponsor',
        type: 'radio',
        label: 'Is the business a Standard Business Sponsor (SBS)?',
        hint: 'A Standard Business Sponsor (SBS) is an Australian or overseas business approved by the Department of Home Affairs to nominate skilled foreign workers for visas. It is granted for 5 years.',
        options: YES_NO,
        showWhen: (a) => a.sponsored_last_5_years === 'Yes',
      },
    ],
  },
  {
    id: 'role',
    name: 'The role',
    title: 'The role you want to fill',
    fields: [
      {
        id: 'has_candidate',
        type: 'radio',
        label:
          'Does the business have a candidate you wish to sponsor for an Australian visa?',
        hint: 'The candidate may be a current employee or a person that the business would like to employ in the future.',
        options: YES_NO,
      },
      {
        id: 'position_title',
        type: 'text',
        label:
          'What is the position title of the role that the business plans to nominate for?',
        hint: 'This may be current role title of the candidate if they are an existing employee.',
        maxLength: 200,
        required: false,
      },
      {
        id: 'occupation_name',
        type: 'occupation',
        label:
          'Select the most relevant occupation from the Core Skills Occupation List',
        hint: "Start typing the occupation into the text box. The Core Skills Occupation List is the Government's list of occupations that a business can nominate under.",
      },
      {
        id: 'salary_band',
        type: 'select',
        label: 'What is the salary for the role?',
        hint: `The current Core Skills Income Threshold is $${fmtAud(
          CORE_SKILLS_INCOME_THRESHOLD,
        )}. This is the minimum salary that a sponsored candidate can be paid under a 482 visa. This threshold does not include super.`,
        options: SALARY_BANDS,
      },
      {
        id: 'candidate_current_pay_band',
        type: 'select',
        label: 'What is the applicant or employee currently paid?',
        hint: "If you are unsure, choose 'I don't know'",
        options: CURRENT_PAY_BANDS,
        required: false,
        showWhen: (a) => a.has_candidate === 'Yes',
      },
    ],
  },
  {
    id: 'trading',
    name: 'Trading',
    title: 'About the business',
    fields: [
      {
        id: 'annual_revenue_band',
        type: 'select',
        label:
          'What was the annual revenue of the business last financial year?',
        hint: 'Select the most accurate.',
        options: REVENUE_BANDS,
      },
      {
        id: 'years_operating_band',
        type: 'select',
        label: 'How long has the business been operating for in Australia?',
        hint: 'Choose the most accurate.',
        options: YEARS_OPERATING_BANDS,
      },
      {
        id: 'operates_only_in_australia',
        type: 'radio',
        label: 'Does the business operate only in Australia?',
        options: YES_NO,
        required: false,
      },
    ],
  },
  {
    id: 'employees',
    name: 'Employees',
    title: 'Your team',
    fields: [
      {
        id: 'employee_count_band',
        type: 'select',
        label:
          'How many employees are currently employed full time by the business are based in Australia?',
        hint: 'Choose the most accurate',
        options: HEADCOUNT_BANDS,
      },
      {
        id: 'has_temporary_visa_employees',
        type: 'radio',
        label:
          'Are any of the current employees on a temporary visa in Australia?',
        options: YES_NO,
        required: false,
      },
      {
        id: 'referral_source',
        type: 'select',
        label: 'How did you hear about us?',
        options: REFERRAL_SOURCES,
        required: false,
      },
    ],
  },
];

export function stepsForParty(party: ProspectParty): StepDef[] {
  return party === 'business' ? BUSINESS_STEPS : APPLICANT_STEPS;
}

// ---------------------------------------------------------------------------
// Answers -> DTO
// ---------------------------------------------------------------------------

function contactFrom(a: Answers) {
  return {
    full_name: str(a, 'full_name') ?? '',
    email: str(a, 'email') ?? '',
    phone: str(a, 'phone'),
    consent_given: true,
    consent_text: CONSENT_TEXT,
  };
}

function applicantFrom(a: Answers): PreScreenApplicant {
  return {
    age: num(a, 'age'),
    occupation_code: str(a, 'occupation_code'),
    occupation_name: str(a, 'occupation_name'),
    years_experience: num(a, 'years_experience'),
    english_overall: num(a, 'english_overall'),
    english_lowest_band: num(a, 'english_lowest_band'),
    has_skills_assessment: bool(a, 'has_skills_assessment'),
    onshore: bool(a, 'onshore'),
    current_visa: str(a, 'current_visa'),
    has_health_or_character_concern: bool(a, 'has_health_or_character_concern'),
    preferred_subclass: subclass(a, 'preferred_subclass'),
    // occupation_listed is deliberately NOT sent. Whether an occupation is on
    // the list is a fact the backend looks up, not something to take a
    // claimant's word for.
  };
}

export function toApplicantPayload(a: Answers): SubmitPreScreenPayload {
  const hasEmployer = str(a, 'has_employer') !== 'No';

  const sponsoringEmployer: PreScreenSponsor | undefined = hasEmployer
    ? {
        legal_name: str(a, 'employer_name'),
        state: stateCode(a, 'employer_state'),
      }
    : undefined;

  const offeredRole: PreScreenNomination | undefined = hasEmployer
    ? {
        occupation_code: str(a, 'occupation_code'),
        occupation_name: str(a, 'occupation_name'),
        subclass: subclass(a, 'preferred_subclass'),
        annual_salary: num(a, 'offered_salary'),
        work_state: stateCode(a, 'employer_state'),
      }
    : undefined;

  return {
    party: 'applicant',
    contact: contactFrom(a),
    applicant: applicantFrom(a),
    sponsoring_employer: sponsoringEmployer,
    offered_role: offeredRole,
    raw_answers: a as Record<string, unknown>,
    source: 'pre_screen_applicant',
  };
}

/**
 * The questionnaire asks about Standard Business Sponsorship in the plain terms
 * a business recognises; the engine wants the sponsorship_status enum. Derive
 * one from the other rather than asking twice.
 *
 * A business that has not sponsored in five years is never asked the SBS
 * question at all, and stays `undefined` — "we did not ask" is not the same
 * fact as "they are not a sponsor", and only the enum's 'prospective' would
 * imply we had checked.
 */
function sponsorshipStatusFrom(
  a: Answers,
): PreScreenSponsor['sponsorship_status'] {
  const sbs = bool(a, 'is_standard_business_sponsor');
  if (sbs === true) return 'approved';
  if (sbs === false) return 'lapsed';
  return undefined;
}

export function toBusinessPayload(a: Answers): SubmitPreScreenPayload {
  const sponsor: PreScreenSponsor = {
    legal_name: str(a, 'legal_name'),
    trading_name: str(a, 'trading_name'),
    abn: str(a, 'abn'),
    industry: str(a, 'industry'),
    business_address: str(a, 'business_address'),
    is_standard_business_sponsor: bool(a, 'is_standard_business_sponsor'),
    // The banded answers carry both forms: the label the business chose, and
    // its floor for the engine's numeric tests.
    employee_count: bandFloor(a, 'employee_count_band', HEADCOUNT_FLOOR),
    employee_count_band: str(a, 'employee_count_band'),
    years_trading: bandFloor(a, 'years_operating_band', YEARS_OPERATING_FLOOR),
    years_operating_band: str(a, 'years_operating_band'),
    annual_revenue_band: str(a, 'annual_revenue_band'),
    operates_only_in_australia: bool(a, 'operates_only_in_australia'),
    has_temporary_visa_employees: bool(a, 'has_temporary_visa_employees'),
    sponsored_last_5_years: bool(a, 'sponsored_last_5_years'),
    referral_source: str(a, 'referral_source'),
    state: stateCode(a, 'state'),
    postcode: str(a, 'postcode'),
    sponsorship_status: sponsorshipStatusFrom(a),
    has_adverse_information: bool(a, 'has_adverse_information'),
    meets_training_obligations: bool(a, 'meets_training_obligations'),
  };

  const nomination: PreScreenNomination = {
    occupation_code: str(a, OCCUPATION_CODE_FIELD),
    occupation_name: str(a, 'occupation_name'),
    position_title: str(a, 'position_title'),
    subclass: subclass(a, 'subclass'),
    annual_salary: bandFloor(a, 'salary_band', SALARY_BAND_FLOOR),
    salary_band: str(a, 'salary_band'),
    candidate_current_pay_band: str(a, 'candidate_current_pay_band'),
    work_state: stateCode(a, 'work_state'),
    work_postcode: str(a, 'work_postcode'),
    lmt_completed: bool(a, 'lmt_completed'),
    // is_regional is decided by the backend from the postcode, not asked —
    // people routinely believe their city counts as regional when it does not.
  };

  const business: PreScreenBusiness = {
    sponsor,
    nomination,
    candidate:
      str(a, 'has_candidate') === 'Yes'
        ? {
            age: num(a, 'candidate_age'),
            onshore: bool(a, 'candidate_onshore'),
            years_experience: num(a, 'candidate_years_experience'),
            english_overall: num(a, 'candidate_english_overall'),
            occupation_code: str(a, OCCUPATION_CODE_FIELD),
            occupation_name: str(a, 'occupation_name'),
          }
        : undefined,
  };

  return {
    party: 'business',
    contact: contactFrom(a),
    business,
    raw_answers: a as Record<string, unknown>,
    source: 'pre_screen_business',
  };
}

export function toPayload(
  party: ProspectParty,
  answers: Answers,
): SubmitPreScreenPayload {
  return party === 'business'
    ? toBusinessPayload(answers)
    : toApplicantPayload(answers);
}
