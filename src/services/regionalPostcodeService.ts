import { apiClient } from "@/lib/apiClient";

export type RegionalCategory = "METRO" | "CATEGORY_2" | "CATEGORY_3";

export interface RegionalBand {
  id: string;
  region: string;
  category: RegionalCategory;
  postcodeFrom: number;
  postcodeTo: number;
  isActive: boolean;
  effectiveDate: string | null;
  sourceNote: string | null;
}

export interface CreateRegionalBand {
  region: string;
  category: RegionalCategory;
  postcodeFrom: number;
  postcodeTo: number;
  isActive?: boolean;
  effectiveDate?: string;
  sourceNote?: string;
}

function unwrap<T>(res: any): T {
  if (res && typeof res === "object" && "data" in res && res.data !== undefined)
    return res.data as T;
  return res as T;
}

class RegionalPostcodeService {
  async getAll(): Promise<RegionalBand[]> {
    const res = await apiClient.get<any>("/admin/regional-postcodes");
    return unwrap<RegionalBand[]>(res) ?? [];
  }
  async create(dto: CreateRegionalBand): Promise<RegionalBand> {
    return unwrap(await apiClient.post<any>("/admin/regional-postcodes", dto));
  }
  async update(id: string, dto: Partial<CreateRegionalBand>): Promise<RegionalBand> {
    return unwrap(await apiClient.put<any>(`/admin/regional-postcodes/${id}`, dto));
  }
  async remove(id: string): Promise<void> {
    await apiClient.delete(`/admin/regional-postcodes/${id}`);
  }
  async bulkImport(
    replaceAll: boolean,
    rows: CreateRegionalBand[],
  ): Promise<{ imported: number; deactivated: number }> {
    return unwrap(
      await apiClient.post<any>("/admin/regional-postcodes/bulk-import", {
        replaceAll,
        rows,
      }),
    );
  }
}

export const regionalPostcodeService = new RegionalPostcodeService();
