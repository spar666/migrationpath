import { useState, useEffect } from "react";
import { apiClient } from "@/lib/apiClient";
import { MigrationRule, VisaGroup } from "@/types/migrationRules";

/**
 * One selectable points option, as `/points/config` returns it. Named for the
 * concept the wizard deals in; the shape is the migration rule itself.
 */
export type PointsConfigItem = MigrationRule;

export interface PointsConfigByCategory {
  [category: string]: MigrationRule[];
}

export function usePointsConfig(visaGroup?: VisaGroup) {
  const [config, setConfig] = useState<PointsConfigByCategory>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setIsLoading(true);
        // If visaGroup is provided, fetch rules for that group
        const url = visaGroup ? `/points/config?visa_group=${visaGroup}` : '/points/config';
        const data = await apiClient.get<MigrationRule[]>(url);

        // Group by category
        const grouped = (data || []).reduce((acc, item) => {
          const category = item.category;
          if (!acc[category]) {
            acc[category] = [];
          }
          acc[category].push(item);
          return acc;
        }, {} as PointsConfigByCategory);

        setConfig(grouped);
        setError(null);
      } catch (err) {
        console.error("Error fetching points config:", err);
        setError(err instanceof Error ? err.message : "Failed to load config");
      } finally {
        setIsLoading(false);
      }
    };

    fetchConfig();
  }, [visaGroup]);

  return { config, isLoading, error };
}
