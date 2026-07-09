import { apiClient } from '@/lib/apiClient';
import { API_ENDPOINTS } from '@/constants/api';

export interface PlatformStats {
  courses: number;
  occupations: number;
  universities: number;
}

interface StatsApiResponse {
  success: boolean;
  data: PlatformStats;
}

class StatsService {
  private endpoint = API_ENDPOINTS.STATS;

  async getStats(): Promise<PlatformStats> {
    const response = await apiClient.get<StatsApiResponse>(this.endpoint);
    if (response && typeof response === 'object' && 'data' in response) {
      return (response as StatsApiResponse).data;
    }
    return response as unknown as PlatformStats;
  }
}

export const statsService = new StatsService();
