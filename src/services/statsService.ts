import { apiClient } from '@/lib/apiClient';
import { API_ENDPOINTS } from '@/constants/api';

/**
 * `/stats` still returns `courses` and `universities`. Neither is read: both
 * were counts over the course catalogue, which is gone, so one would advertise
 * a catalogue the site no longer has and the other would count the
 * universities that used to teach it.
 *
 * The occupation count is the only figure here backed by data the site still
 * holds. See usePlatformStats for why it is shown without a fallback.
 */
export interface PlatformStats {
  occupations: number;
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
