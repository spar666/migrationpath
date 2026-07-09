import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

export interface OccupationThreshold {
  id: string;
  anzsco_code: string;
  min_legal_points: number | null;
  high_probability_points: number | null;
  last_invite_date: string | null;
  trend_status: string | null;
  updated_at: string | null;
}

export function useOccupationThreshold(anzscoCode: string | null | undefined) {
  return useQuery({
    queryKey: ["occupation-threshold", anzscoCode],
    queryFn: async () => {
      if (!anzscoCode) return null;
      return apiClient.get<OccupationThreshold | null>(`/occupations/${anzscoCode}/threshold`);
    },
    enabled: !!anzscoCode,
    staleTime: 60000, // 1 minute
  });
}

export function useAllOccupationThresholds() {
  return useQuery({
    queryKey: ["occupation-thresholds-all"],
    queryFn: async () => {
      return apiClient.get<OccupationThreshold[]>('/occupations/thresholds');
    },
    staleTime: 30000,
  });
}

export async function upsertOccupationThreshold(
  threshold: Partial<OccupationThreshold> & { anzsco_code: string }
) {
  await apiClient.put(`/occupations/${threshold.anzsco_code}/threshold`, threshold);
}

export async function deleteOccupationThreshold(id: string) {
  await apiClient.delete(`/occupations/thresholds/${id}`);
}
