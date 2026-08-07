import { apiClient } from '@/lib/apiClient';
import {
  CONSENT_NOTICE,
  type Answers,
} from '@/components/partner/eligibility/formDefinition';

export type EligibilityOutcome = 'eligible' | 'high_effort' | 'ineligible';

export interface PartnerEligibilityResult {
  id: string;
  applicantFirstName: string;
  sponsorFirstName: string;
  outcome: EligibilityOutcome;
  summary: string;
  effort: string;
  highRisk: boolean;
  becomingEligible: boolean;
  ineligible: boolean;
  /**
   * The prospect this submission created. Every downstream step is keyed on
   * it: the Calendly link carries it, the invitee webhook creates the pending
   * booking against it, and Stripe confirms that booking. Null if the prospect
   * write failed server side.
   */
  prospect_id: string | null;
  human_ref: string | null;
  /**
   * Whether to show the booking CTA. False for an ineligible result — we do
   * not sell a paid consult to someone we have just told we cannot help — and
   * false whenever prospect_id is null, because a booking with nothing to
   * attach to cannot be paid for or reconciled.
   */
  can_book: boolean;
}

class PartnerEligibilityService {
  async submit(answers: Answers): Promise<PartnerEligibilityResult> {
    const response = await apiClient.post<
      PartnerEligibilityResult | { data: PartnerEligibilityResult }
    >('/partner/eligibility', {
      ...answers,
      // The form stores consent as the notice text so that what was displayed
      // and what is stored cannot drift. The API wants the boolean and the
      // text separately.
      consent: undefined,
      consent_given: answers.consent === CONSENT_NOTICE,
      consent_text:
        answers.consent === CONSENT_NOTICE ? CONSENT_NOTICE : undefined,
    });

    if (response && typeof response === 'object') {
      if ('outcome' in response) return response as PartnerEligibilityResult;
      if ('data' in response && response.data) {
        return response.data as PartnerEligibilityResult;
      }
    }
    return response as unknown as PartnerEligibilityResult;
  }
}

export const partnerEligibilityService = new PartnerEligibilityService();
