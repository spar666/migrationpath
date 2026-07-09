import { apiClient } from '@/lib/apiClient';

export type SponsorStatus =
  | 'citizen'
  | 'permanent_resident'
  | 'eligible_nz'
  | 'none';

export type ParentStatus = 'LEGALLY_ELIGIBLE' | 'LEGALLY_INELIGIBLE';

export interface ParentProfileInput {
  sponsorStatus: SponsorStatus;
  sponsorMonthsInAustralia: number;
  totalChildren: number;
  childrenInAustralia: number;
  childrenInLargestOtherCountry: number;
  sponsorTaxableIncome: number;
  parentAge: number;
}

export interface BalanceOfFamilyResult {
  childrenInAustralia: number;
  totalChildren: number;
  percentage: number;
  pass: boolean;
  alternativeLimbPass: boolean;
  reason?: string;
}

export interface AosResult {
  sponsorTaxableIncome: number;
  benchmark: number;
  meetsBenchmark: boolean;
  requiresCoAssurer: boolean;
  warning?: string;
}

export interface ParentAuditResult {
  auditId: string;
  isEligible: boolean;
  status: ParentStatus;
  balanceOfFamily: BalanceOfFamilyResult;
  sponsorCheck: { pass: boolean; reason?: string };
  aos: AosResult;
  predictedVisa: {
    subclass: string;
    name: string;
    track: 'aged_parent' | 'contributory_parent';
  };
  recommendations: string[];
}

class ParentService {
  async submitAudit(profile: ParentProfileInput): Promise<ParentAuditResult> {
    const response = await apiClient.post<
      ParentAuditResult | { data: ParentAuditResult }
    >('/parent/audit', profile);

    if (response && typeof response === 'object') {
      if ('isEligible' in response) return response as ParentAuditResult;
      if ('data' in response && response.data) {
        return response.data as ParentAuditResult;
      }
    }
    return response as unknown as ParentAuditResult;
  }
}

export const parentService = new ParentService();
