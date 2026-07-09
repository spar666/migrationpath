import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  pointsService,
  type UserProfileInput,
  type StructuredPointsResult,
} from '@/services/pointsService';

/**
 * Recomputes the structured points score whenever the profile changes.
 *
 * The profile is debounced so rapid slider/select/number changes don't spam the
 * endpoint, and the query only runs once the required fields are present. Uses
 * React Query so the last successful result stays on screen (keepPreviousData)
 * while a new calculation is in flight — which is what makes the total transition
 * smoothly instead of flashing empty.
 */
export function useStructuredPoints(profile: UserProfileInput): {
  result: StructuredPointsResult | undefined;
  isCalculating: boolean;
  error: string | null;
} {
  const [debounced, setDebounced] = useState(profile);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(profile), 300);
    return () => clearTimeout(timer);
  }, [profile]);

  const ready =
    Number.isFinite(debounced.age) &&
    debounced.age >= 18 &&
    !!debounced.englishLevel &&
    !!debounced.qualification;

  const { data, isFetching, error } = useQuery({
    queryKey: ['structured-points', debounced],
    queryFn: () => pointsService.calculateTotal(debounced),
    enabled: ready,
    placeholderData: (previous) => previous, // keep last result while refetching
    staleTime: 30_000,
  });

  return {
    result: data,
    isCalculating: isFetching,
    error: error ? (error as Error).message : null,
  };
}
