import { apiClient } from '@/lib/apiClient';

export type ApplicantLocation = 'onshore' | 'offshore';
export type PillarKey = 'financial' | 'household' | 'social' | 'commitment';
export type CommitmentStatus = 'LEGALLY UNLOCKED' | 'STANDARD';

export interface PartnerProfileInput {
  currentLocation: ApplicantLocation;
  jointBankAccounts: boolean;
  jointLeaseOrMortgage: boolean;
  sharedUtilityBills: boolean;
  sharedDomesticBills: boolean;
  jointChildResponsibility: boolean;
  matchingAddressHistory: boolean;
  sharedTravelItineraries: boolean;
  form888Count: number;
  jointSocialInvitations: boolean;
  livedTogether12Months: boolean;
  registeredRelationshipBDM: boolean;
}

export interface PillarResult {
  key: PillarKey;
  label: string;
  score: number;
  percentage: number;
  status: CommitmentStatus;
}

export interface PredictedVisa {
  subclass: '820' | '309';
  name: string;
  location: ApplicantLocation;
}

export interface PartnerAuditResult {
  auditId: string;
  overallReadiness: number;
  pillars: PillarResult[];
  predictedVisa: PredictedVisa;
  legislativeWaiverApplied: boolean;
  commitmentStatus: CommitmentStatus;
  recommendations: string[];
}

class PartnerService {
  async submitAudit(
    profile: PartnerProfileInput,
  ): Promise<PartnerAuditResult> {
    const response = await apiClient.post<
      PartnerAuditResult | { data: PartnerAuditResult }
    >('/partner/audit', profile);

    if (response && typeof response === 'object') {
      if ('overallReadiness' in response) return response as PartnerAuditResult;
      if ('data' in response && response.data) {
        return response.data as PartnerAuditResult;
      }
    }
    return response as unknown as PartnerAuditResult;
  }
}

export const partnerService = new PartnerService();
