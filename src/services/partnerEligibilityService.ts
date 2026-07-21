import { apiClient } from '@/lib/apiClient';
import type { Answers } from '@/components/partner/eligibility/formDefinition';

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
}

class PartnerEligibilityService {
  async submit(answers: Answers): Promise<PartnerEligibilityResult> {
    const response = await apiClient.post<
      PartnerEligibilityResult | { data: PartnerEligibilityResult }
    >('/partner/eligibility', answers);

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
