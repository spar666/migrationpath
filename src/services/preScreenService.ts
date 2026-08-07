import { apiClient } from '@/lib/apiClient';

/**
 * The employer-sponsored pre-screen.
 *
 * This is NOT a third-party form. The questions are authored in
 * FormLogicEditor and rendered by our own components; the answers post here
 * and the eligibility engine runs on our backend. A rented form tool cannot do
 * that, which is why there isn't one.
 */

export type ProspectParty = 'applicant' | 'business';

export interface PreScreenContact {
  full_name: string;
  email: string;
  phone?: string;
  /**
   * Must be tied to a VISIBLE collection notice — a pre-ticked box or an
   * invisible consent is not consent.
   */
  consent_given: boolean;
  /** The exact notice text shown. Stored verbatim against the record. */
  consent_text?: string;
}

/**
 * Every field is optional. The engine treats a missing answer as an open
 * question for the agent rather than as a "no", so it is better to send a
 * partial questionnaire than to force a guess.
 */
export interface PreScreenApplicant {
  age?: number;
  occupation_code?: string;
  occupation_name?: string;
  occupation_listed?: boolean;
  years_experience?: number;
  english_overall?: number;
  english_lowest_band?: number;
  has_skills_assessment?: boolean;
  onshore?: boolean;
  current_visa?: string;
  has_health_or_character_concern?: boolean;
  preferred_subclass?: string;
}

export interface PreScreenSponsor {
  legal_name?: string;
  trading_name?: string;
  abn?: string;
  industry?: string;
  employee_count?: number;
  years_trading?: number;
  state?: string;
  postcode?: string;
  business_address?: string;
  sponsored_last_5_years?: boolean;
  /** Approved Standard Business Sponsorship, as declared. */
  is_standard_business_sponsor?: boolean;
  /**
   * Banded answers are sent as the chosen label AND as a derived floor on the
   * numeric field above, so the agent sees the range and the engine gets a
   * figure to test.
   */
  annual_revenue_band?: string;
  years_operating_band?: string;
  employee_count_band?: string;
  operates_only_in_australia?: boolean;
  has_temporary_visa_employees?: boolean;
  referral_source?: string;
  sponsorship_status?:
    | 'prospective'
    | 'approved'
    | 'lapsed'
    | 'refused'
    | 'unknown';
  has_adverse_information?: boolean;
  meets_training_obligations?: boolean;
}

export interface PreScreenNomination {
  occupation_code?: string;
  occupation_name?: string;
  position_title?: string;
  subclass?: string;
  annual_salary?: number;
  salary_band?: string;
  candidate_current_pay_band?: string;
  work_state?: string;
  work_postcode?: string;
  is_regional?: boolean;
  lmt_completed?: boolean;
}

export interface PreScreenBusiness {
  sponsor?: PreScreenSponsor;
  nomination?: PreScreenNomination;
  /** If the business already has someone in mind. */
  candidate?: PreScreenApplicant;
}

export interface SubmitPreScreenPayload {
  party: ProspectParty;
  contact: PreScreenContact;
  /** Required when party === 'applicant'. */
  applicant?: PreScreenApplicant;
  /** Required when party === 'business'. */
  business?: PreScreenBusiness;
  /** An applicant may name the employer sponsoring them. */
  sponsoring_employer?: PreScreenSponsor;
  offered_role?: PreScreenNomination;
  /**
   * The complete raw answer set from FormLogicEditor, including questions the
   * engine does not read. Always send this — it is what the agent reads on the
   * call, and the only way to re-score the submission if the rules change.
   */
  raw_answers?: Record<string, unknown>;
  source?: string;
}

export interface PreScreenResult {
  prospect_id: string;
  /** Short reference to SHOW THE USER (e.g. MP-7F3K9A). */
  human_ref: string;
  /** Meets the DHA rules as the engine understands them. */
  statutory_eligible: boolean;
  /** Worth taking on as a client. Commercial, not legal. */
  client_fit: boolean;
  /** Gate the Book button on this, not on statutory_eligible alone. */
  can_book: boolean;
  recommended_subclass?: string;
  recommended_label?: string;
  reasons: string[];
  blockers: string[];
  next_steps: string[];
}

/** The API wraps successful responses in { success, data, ... }. */
function unwrap<T>(response: T | { data: T }): T {
  if (response && typeof response === 'object' && 'data' in response) {
    return (response as { data: T }).data;
  }
  return response as T;
}

class PreScreenService {
  /**
   * Submits the questionnaire and returns the live eligibility result.
   *
   * The backend writes the prospect record regardless of the outcome — an
   * ineligible person is still a lead worth keeping — so `prospect_id` and
   * `human_ref` always come back. Hold on to both: the booking flow needs the
   * id, and the user needs the reference.
   */
  async submit(payload: SubmitPreScreenPayload): Promise<PreScreenResult> {
    const response = await apiClient.post<
      PreScreenResult | { data: PreScreenResult }
    >('/pre-screen', payload);
    return unwrap(response);
  }
}

export const preScreenService = new PreScreenService();
