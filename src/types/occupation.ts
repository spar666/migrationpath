/**
 * Occupation and Job Market Types
 */

export interface Occupation {
  id: string;
  title: string;
  description: string;
  anzscoCode: string;
  demandLevel: 'high' | 'medium' | 'low';
  skillLevel: string;
  minSalary?: number;
  maxSalary?: number;
}

export interface OccupationData {
  id: string;
  code: string;
  title: string;
  description: string;
  minSalary?: number;
  maxSalary?: number;
  demandLevel: string;
}

export interface OccupationSearchParams {
  q: string;
  type?: string;
  state_code?: string;
  is_available?: boolean;
  page?: number;
  limit?: number;
}

export interface OccupationSearchResponse {
  results: OccupationData[];
  total: number;
  page: number;
  hasMore: boolean;
}

export interface OccupationRow {
  id: string;
  code: string;
  title: string;
  [key: string]: any;
}

export interface OccupationSearchResult extends OccupationRow {
  matchScore?: number;
}

export interface VisaEligibility {
  occupationId: string;
  visaCode: string;
  eligible: boolean;
  requirements?: string[];
}

export interface OccupationThreshold {
  occupationId: string;
  minimumPoints: number;
  yearsOfExperience: number;
  educationLevel: string;
}
