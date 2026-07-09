// Service layer for occupation-related API calls

import { apiClient } from '@/lib/apiClient';
import type { OccupationData, OccupationSearchParams, OccupationSearchResponse } from '@/types/occupation';

class OccupationService {
  private baseURL = '/occupations';
  private searchURL = '/occupations/search';

  /**
   * Search occupations by name or code
   */
  async searchOccupations(params: OccupationSearchParams): Promise<any> {
    try {
      // Endpoint: GET /api/v1/occupations/search?q=...&state_code=NSW&is_available=true&page=1&limit=10
      return await apiClient.get<any>(
        this.searchURL,
        { params }
      );
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get occupation details by ID
   */
  async getOccupation(id: string): Promise<OccupationData> {
    return apiClient.get<OccupationData>(`${this.baseURL}/${id}`);
  }

  /**
   * Get all occupations with pagination
   */
  async listOccupations(page: number = 1, pageSize: number = 20): Promise<OccupationSearchResponse> {
    return apiClient.get<OccupationSearchResponse>(
      this.baseURL,
      { params: { page, limit: pageSize } }
    );
  }

  /**
   * Get occupations by state nomination
   */
  async getOccupationsByState(state: string): Promise<OccupationData[]> {
    return apiClient.get<OccupationData[]>(
      `${this.baseURL}/state/${state}`
    );
  }

  /**
   * Get occupations by demand level
   */
  async getOccupationsByDemand(demandLevel: 'high' | 'medium' | 'low'): Promise<OccupationData[]> {
    return apiClient.get<OccupationData[]>(
      `${this.baseURL}/demand/${demandLevel}`
    );
  }
}

export const occupationService = new OccupationService();
