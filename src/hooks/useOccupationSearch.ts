import { useState, useEffect, useCallback, useMemo } from "react";

import { useQuery } from "@tanstack/react-query";
import { occupationService } from "@/services/occupationService";
import { apiClient } from "@/lib/apiClient";

// Define OccupationRow according to backend response
export type OccupationRow = any;

// export type OccupationRow = ... (define according to backend response)

export interface OccupationSearchResult extends OccupationRow {
  eligibleVisas: VisaEligibility[];
}

export interface VisaEligibility {
  subclass: "189" | "190" | "491";
  name: string;
  color: "green" | "blue" | "yellow";
  eligible: boolean;
}

function getVisaEligibility(occupation: OccupationRow): VisaEligibility[] {
  return [
    {
      subclass: "189",
      name: "Skilled Independent",
      color: "green",
      eligible: occupation.on_mltssl === true,
    },
    {
      subclass: "190",
      name: "State Nominated",
      color: "blue",
      eligible: occupation.on_mltssl === true || occupation.on_stsol === true,
    },
    {
      subclass: "491",
      name: "Regional Skilled",
      color: "yellow",
      eligible:
        occupation.on_mltssl === true ||
        occupation.on_stsol === true ||
        occupation.on_rol === true,
    },
  ];
}

export function useOccupationSearch(query: string, limit: number = 8) {
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const isDebouncing = query !== debouncedQuery && query.length >= 2;

  // Fetch all occupations once (cached)
  const { data: allOccupations, isLoading: isLoadingAll } = useQuery({
    queryKey: ["all-occupations"],
    queryFn: async () => {
      const responseData = await apiClient.get<any>('/occupations');

      // API returns { success, data: [...] }
      let occupations: any[] = [];
      if (Array.isArray(responseData)) {
        occupations = responseData;
      } else if (Array.isArray(responseData?.data)) {
        occupations = responseData.data;
      } else if (responseData?.data?.data && Array.isArray(responseData.data.data)) {
        occupations = responseData.data.data;
      }

      // Normalize field names: backend uses occupation_name, frontend expects title
      return occupations.map((occ: any) => ({
        ...occ,
        title: (occ.occupation_name || occ.title || '').trim(),
        anzsco_code: (occ.anzsco_code || '').trim(),
        eligibleVisas: getVisaEligibility(occ),
      }));
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Filter client-side based on debounced query
  const results = useMemo(() => {
    if (!debouncedQuery || debouncedQuery.length < 2 || !allOccupations) return [];
    const q = debouncedQuery.toLowerCase().trim();
    return allOccupations
      .filter((occ: any) =>
        occ.title.toLowerCase().includes(q) ||
        occ.anzsco_code.toLowerCase().includes(q)
      )
      .slice(0, limit);
  }, [debouncedQuery, allOccupations, limit]);

  return {
    results,
    isLoading: isLoadingAll || isDebouncing,
    error: null,
  };
}

// Hook for the "Real Search" API
export function useRealSearch(query: string) {
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500); // Slightly longer debounce for "real" search
    return () => clearTimeout(timer);
  }, [query]);

  const isDebouncing = query !== debouncedQuery && query.length >= 2;

  const { data, isLoading, error } = useQuery({
    queryKey: ["real-search", debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) {
        return [];
      }

      // 2. Fetch from the "Real Search" endpoint
      const data = await apiClient.get<any>(
        '/search',
        {
          params: {
            data: debouncedQuery.toLowerCase().trim(),
          }
        }
      );

      return data;
    },
    enabled: debouncedQuery.length >= 2,
    staleTime: 60000,
  });

  return {
    results: data || [],
    isLoading: isLoading || isDebouncing,
    error,
  };
}

// TODO: Implement with backend API
export function useOccupationById(id: string | null) {
  return useQuery({
    queryKey: ["occupation", id],
    queryFn: async () => {
      if (!id) return null;
      // Example:
      // const { data } = await api.get(`/api/v1/occupations/${id}`);
      // return { ...data, eligibleVisas: getVisaEligibility(data) };
      return null;
    },
    enabled: !!id,
  });
}

// Hook for admin CRUD operations
// TODO: Implement admin CRUD operations with backend API
export function useOccupationsAdmin() {
  const fetchOccupations = useCallback(async (searchQuery?: string) => {
    try {
      // The backend /occupations endpoint does not support 'q' parameter in findAll
      const response = await apiClient.get<any>('/occupations');
      // Handle both { data: [...] } and [...] formats
      return Array.isArray(response) ? response : (response.data || []);
    } catch (error) {
      console.error('Error fetching occupations:', error);
      return [];
    }
  }, []);

  const updateOccupation = useCallback(
    async (id: string, updates: Partial<OccupationRow>) => {
      try {
        // Map snake_case to camelCase for backend compatibility
        const payload = {
          anzscoCode: updates.anzsco_code ?? updates.anzscoCode,
          title: updates.title,
          skillLevel: updates.skill_level ?? updates.skillLevel,
          assessingAuthority: updates.assessing_authority ?? updates.assessingAuthority,
          onMltssl: updates.on_mltssl ?? updates.onMltssl,
          onStsol: updates.on_stsol ?? updates.onStsol,
          onRol: updates.on_rol ?? updates.onRol,
          isActive: updates.is_active ?? updates.isActive ?? true,
        };
        await apiClient.patch(`/occupations/${id}`, payload);
      } catch (error) {
        console.error('Error updating occupation:', error);
        throw error;
      }
    },
    []
  );

  const createOccupation = useCallback(
    async (occupation: any) => {
      try {
        // Map fields to camelCase as requested by user's CURL example
        const payload = {
          anzscoCode: occupation.anzsco_code || occupation.anzscoCode,
          title: occupation.title,
          skillLevel: occupation.skill_level || occupation.skillLevel,
          assessingAuthority: occupation.assessing_authority || occupation.assessingAuthority,
          onMltssl: occupation.on_mltssl || occupation.onMltssl,
          onStsol: occupation.on_stsol || occupation.onStsol,
          onRol: occupation.on_rol || occupation.onRol,
          isActive: occupation.isActive ?? true,
        };
        await apiClient.post('/occupations', payload);
      } catch (error) {
        console.error('Error creating occupation:', error);
        throw error;
      }
    },
    []
  );

  const deleteOccupation = useCallback(async (id: string) => {
    try {
      await apiClient.delete(`/occupations/${id}`);
    } catch (error) {
      console.error('Error deleting occupation:', error);
      throw error;
    }
  }, []);

  return {
    fetchOccupations,
    updateOccupation,
    createOccupation,
    deleteOccupation,
  };
}
