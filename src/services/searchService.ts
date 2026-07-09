import { apiClient } from '@/lib/apiClient';

export type MigrationIntent = 'SKILLED' | 'STUDENT' | 'FAMILY' | 'UNKNOWN';

export interface EligibleVisa {
  id: string;
  subclassNumber: string;
  streamTitle: string;
  residencyType: 'permanent' | 'provisional' | 'temporary';
  name: string | null;
  caveats: Record<string, unknown> | null;
}

export interface SkilledIntentResult {
  intent: 'SKILLED';
  query: string;
  occupation: {
    anzscoCode: string;
    title: string;
    primaryList: string | null;
    assessingAuthority: string | null;
  };
  pointsTested: EligibleVisa[];
  employerSponsored: EligibleVisa[];
}

export interface StudentCourse {
  id: string;
  courseName: string;
  university: string;
  isRegional: boolean;
  anzscoCode: string | null;
  occupation: string | null;
}

export interface StudentIntentResult {
  intent: 'STUDENT';
  query: string;
  courses: StudentCourse[];
}

export interface FamilyIntentResult {
  intent: 'FAMILY';
  query: string;
  matchedKeyword: string;
  redirectTo: string;
}

export interface UnknownIntentResult {
  intent: 'UNKNOWN';
  query: string;
  suggestAudit: true;
  redirectTo: string;
}

export type IntentResult =
  | SkilledIntentResult
  | StudentIntentResult
  | FamilyIntentResult
  | UnknownIntentResult;

class SearchService {
  /**
   * Classify a raw query into a migration intent and return the matching
   * funnel payload. Unwraps the backend's { success, data } envelope if present.
   */
  async resolveIntent(query: string): Promise<IntentResult> {
    const response = await apiClient.get<IntentResult | { data: IntentResult }>(
      '/search/intent',
      { params: { q: query } },
    );

    if (response && typeof response === 'object') {
      if ('intent' in response) return response as IntentResult;
      if ('data' in response && response.data) {
        return response.data as IntentResult;
      }
    }
    return response as unknown as IntentResult;
  }
}

export const searchService = new SearchService();
