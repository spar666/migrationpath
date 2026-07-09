import { apiClient } from "@/lib/apiClient";

export interface PolicyConfigItem {
  id: string;
  configKey: string;
  numericValue: number;
  label: string;
  description: string | null;
  category: string;
  unit: string | null;
  sourceNote: string | null;
  effectiveDate: string | null;
  updated_at?: string;
}

export interface UpdatePolicyConfigDto {
  numericValue?: number;
  sourceNote?: string;
  effectiveDate?: string;
}

function unwrap<T>(res: any): T {
  if (res && typeof res === "object" && "data" in res && res.data !== undefined) {
    return res.data as T;
  }
  return res as T;
}

class PolicyConfigService {
  async getAll(): Promise<PolicyConfigItem[]> {
    const res = await apiClient.get<any>("/admin/policy-config");
    return unwrap<PolicyConfigItem[]>(res) ?? [];
  }

  async update(
    key: string,
    dto: UpdatePolicyConfigDto,
  ): Promise<PolicyConfigItem> {
    const res = await apiClient.put<any>(`/admin/policy-config/${key}`, dto);
    return unwrap<PolicyConfigItem>(res);
  }
}

export const policyConfigService = new PolicyConfigService();
