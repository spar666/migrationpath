import { apiClient } from "@/lib/apiClient";
import type { FreshnessStatus } from "@/components/common/FreshnessBadge";

export interface FreshnessRow {
  domain: string;
  label: string;
  adminRoute: string | null;
  status: FreshnessStatus;
  lastVerifiedAt: string | null;
  reviewIntervalDays: number;
  daysSinceVerified: number | null;
  sourceUrl: string | null;
  notes: string | null;
}

function unwrap<T>(res: any): T {
  if (res && typeof res === "object" && "data" in res && res.data !== undefined)
    return res.data as T;
  return res as T;
}

class DataFreshnessService {
  async getAll(): Promise<FreshnessRow[]> {
    const res = await apiClient.get<any>("/admin/data-freshness");
    return unwrap<FreshnessRow[]>(res) ?? [];
  }

  async verify(domain: string): Promise<FreshnessRow> {
    const res = await apiClient.post<any>(
      `/admin/data-freshness/${domain}/verify`,
    );
    return unwrap<FreshnessRow>(res);
  }
}

export const dataFreshnessService = new DataFreshnessService();
