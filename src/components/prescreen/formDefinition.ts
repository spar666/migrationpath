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
  | 'tel';

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
  return {
    id: 'contact',
    name: 'Your details',
    title:
      party === 'business'
        ? 'Who should we speak to?'
        : 'First, how do we reach you?',
    intro:
      'We use these to send your assessment and, if you go ahead, to set up ' +
      'your consultation.',
    fields: [
      {
        id: 'full_name',
        type: 'text',
        label: 'Full name',
        maxLength: 120,
      },
      {
        id: 'email',
        type: 'email',
        label: 'Email address',
        placeholder: 'you@example.com',
      },
      {
        id: 'phone',
        type: 'tel',
        label: 'Phone number',
        hint: 'Optional, but it is the fastest way for an agent to reach you.',
        required: false,
        maxLength: 32,
      },
      ...(party === 'business'
        ? [
            {
              id: 'trading_name',
              type: 'text' as const,
              label: 'Business name',
              hint: 'The name you trade under. We ask for the registered legal name separately, in case they differ.',
              maxLength: 160,
            },
          ]
        : []),
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
    name: 'Your business',
    title: 'About the business',
    fields: [
      {
        id: 'legal_name',
        type: 'text',
        label: 'Registered legal name',
        hint: 'As it appears on the ABN register, if that differs from your trading name.',
        maxLength: 160,
      },
      {
        id: 'abn',
        type: 'text',
        label: 'ABN',
        required: false,
        maxLength: 20,
        placeholder: '11 222 333 444',
      },
      {
        id: 'industry',
        type: 'text',
        label: 'Industry',
        required: false,
        maxLength: 120,
      },
      {
        id: 'years_trading',
        type: 'number',
        label: 'How many years has the business been trading?',
        hint: 'A lawfully operating business is a sponsorship requirement, and new businesses are assessed more closely.',
        min: 0,
        max: 200,
      },
      {
        id: 'employee_count',
        type: 'number',
        label: 'How many people do you employ?',
        required: false,
        min: 0,
      },
      {
        id: 'state',
        type: 'select',
        label: 'Which state or territory is the business based in?',
        options: AU_STATES,
      },
      {
        id: 'postcode',
        type: 'text',
        label: 'Business postcode',
        hint: 'Regional postcodes open up options that metropolitan ones do not.',
        required: false,
        maxLength: 4,
      },
    ],
  },
  {
    id: 'sponsorship',
    name: 'Sponsorship',
    title: 'Your sponsorship position',
    fields: [
      {
        id: 'sponsorship_status',
        type: 'radio',
        label: 'Are you already an approved sponsor?',
        options: SPONSORSHIP_STATUS_OPTIONS,
      },
      {
        id: 'meets_training_obligations',
        type: 'radio',
        label: 'Are your Skilling Australians Fund contributions up to date?',
        hint: 'If you have never sponsored before, answer "Not sure" — it will not count against you.',
        options: YES_NO_UNSURE,
      },
      {
        id: 'has_adverse_information',
        type: 'radio',
        label:
          'Has the business had any adverse findings — underpayment, sanctions, or a failed monitoring visit?',
        hint: 'Adverse information is assessed, not automatically fatal. We plan around it.',
        options: YES_NO_UNSURE,
      },
    ],
  },
  {
    id: 'role',
    name: 'The role',
    title: 'The role you want to fill',
    intro: 'One role for now — we can add others on the call.',
    fields: [
      {
        id: 'occupation_name',
        type: 'text',
        label: 'Job title',
        maxLength: 120,
      },
      {
        id: 'occupation_code',
        type: 'text',
        label: 'ANZSCO code, if you know it',
        hint: 'Six digits, e.g. 261313. Leave blank if unsure — we confirm it anyway.',
        required: false,
        maxLength: 12,
      },
      {
        id: 'annual_salary',
        type: 'number',
        label: 'Annual salary for the role (AUD)',
        hint: 'Base salary excluding super. This must clear the income threshold and the market rate for the job.',
        min: 0,
      },
      {
        id: 'work_state',
        type: 'select',
        label: 'Where will the person work?',
        options: AU_STATES,
      },
      {
        id: 'work_postcode',
        type: 'text',
        label: 'Work postcode',
        required: false,
        maxLength: 4,
      },
      {
        id: 'subclass',
        type: 'radio',
        label: 'Which visa were you thinking of?',
        options: SUBCLASS_OPTIONS,
        required: false,
      },
      {
        id: 'lmt_completed',
        type: 'radio',
        label: 'Have you advertised the role locally yet?',
        hint: 'Labour market testing. There is a required form and timing, so tell us before you advertise if you have not.',
        options: YES_NO_UNSURE,
      },
    ],
  },
  {
    id: 'candidate',
    name: 'Candidate',
    title: 'Do you have someone in mind?',
    fields: [
      {
        id: 'has_candidate',
        type: 'radio',
        label: 'Have you identified the person you want to sponsor?',
        options: ['Yes', 'No — we need to find someone'],
      },
      {
        id: 'candidate_age',
        type: 'number',
        label: 'Their age',
        required: false,
        min: 15,
        max: 99,
        showWhen: (a) => a.has_candidate === 'Yes',
      },
      {
        id: 'candidate_onshore',
        type: 'radio',
        label: 'Are they already in Australia?',
        options: YES_NO_UNSURE,
        required: false,
        showWhen: (a) => a.has_candidate === 'Yes',
      },
      {
        id: 'candidate_years_experience',
        type: 'number',
        label: 'Years of experience in the role',
        required: false,
        min: 0,
        max: 60,
        showWhen: (a) => a.has_candidate === 'Yes',
      },
      {
        id: 'candidate_english_overall',
        type: 'number',
        label: 'Their overall English score (IELTS equivalent)',
        hint: 'Leave blank if they have not tested.',
        required: false,
        min: 0,
        max: 9,
        showWhen: (a) => a.has_candidate === 'Yes',
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

export function toBusinessPayload(a: Answers): SubmitPreScreenPayload {
  const sponsorshipLabel = str(a, 'sponsorship_status');

  const sponsor: PreScreenSponsor = {
    legal_name: str(a, 'legal_name'),
    trading_name: str(a, 'trading_name'),
    abn: str(a, 'abn'),
    industry: str(a, 'industry'),
    employee_count: num(a, 'employee_count'),
    years_trading: num(a, 'years_trading'),
    state: stateCode(a, 'state'),
    postcode: str(a, 'postcode'),
    sponsorship_status: sponsorshipLabel
      ? SPONSORSHIP_STATUS_VALUES[sponsorshipLabel]
      : undefined,
    has_adverse_information: bool(a, 'has_adverse_information'),
    meets_training_obligations: bool(a, 'meets_training_obligations'),
  };

  const nomination: PreScreenNomination = {
    occupation_code: str(a, 'occupation_code'),
    occupation_name: str(a, 'occupation_name'),
    subclass: subclass(a, 'subclass'),
    annual_salary: num(a, 'annual_salary'),
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
            occupation_code: str(a, 'occupation_code'),
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
