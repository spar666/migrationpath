import { apiClient } from '@/lib/apiClient';

/** Mirrors the backend EnglishProficiency enum. */
export type EnglishLevel = 'superior' | 'proficient' | 'competent';

/** Mirrors the backend QualificationLevel enum. */
export type QualificationLevel =
  | 'doctorate'
  | 'bachelor_masters'
  | 'diploma_trade'
  | 'other_recognised';

/** Payload for POST /points/calculate/total (matches UserProfileDto). */
export interface UserProfileInput {
  visaGroup?: string;
  age: number;
  englishLevel: EnglishLevel;
  qualification: QualificationLevel;
  overseasWorkYears: number;
  australianWorkYears: number;
  regionalStudy?: boolean;
}

/** Response shape (matches StructuredPointsResultDto). */
export interface StructuredPointsResult {
  totalPoints: number;
  breakdown: Record<string, number>;
  workCapApplied: boolean;
  belowPassMark: boolean;
  ineligibilityReason?: string;
}

class PointsService {
  /**
   * Aggregate a structured points score server-side. Unwraps the API's
   * { success, data } envelope if present.
   */
  async calculateTotal(
    profile: UserProfileInput,
  ): Promise<StructuredPointsResult> {
    const response = await apiClient.post<
      StructuredPointsResult | { data: StructuredPointsResult }
    >('/points/calculate/total', profile);

    if (response && typeof response === 'object') {
      if ('totalPoints' in response) return response as StructuredPointsResult;
      if ('data' in response && response.data) {
        return response.data as StructuredPointsResult;
      }
    }
    return response as unknown as StructuredPointsResult;
  }
}

export const pointsService = new PointsService();
