import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient, unwrapArray } from '@/lib/apiClient';

export interface OccupationSuggestion {
  type: 'occupation';
  anzscoCode: string;
  title: string;
}

export interface CourseSuggestion {
  type: 'course';
  id: string;
  courseName: string;
  university: string;
}

export interface GroupedSuggestions {
  occupations: OccupationSuggestion[];
  courses: CourseSuggestion[];
}

const EMPTY: GroupedSuggestions = { occupations: [], courses: [] };

/**
 * Grouped suggestions for the smart search box. Fetches occupations and courses
 * once (react-query cached), then filters client-side against the debounced
 * query — mirroring the existing useOccupationSearch pattern so behaviour and
 * caching stay consistent across the app.
 */
export function useSmartSuggestions(
  query: string,
  limitPerGroup = 6,
): { suggestions: GroupedSuggestions; isLoading: boolean } {
  const [debounced, setDebounced] = useState(query);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query), 250);
    return () => clearTimeout(timer);
  }, [query]);

  const isDebouncing = query !== debounced && query.length >= 2;

  const { data: occupations, isLoading: loadingOcc } = useQuery({
    queryKey: ['smart-occupations'],
    queryFn: async () => {
      const res = await apiClient.get<any>('/occupations');
      return unwrapArray(res).map((occ: any) => ({
        type: 'occupation' as const,
        anzscoCode: (occ.anzsco_code || '').trim(),
        title: (occ.occupation_name || occ.title || '').trim(),
      }));
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: courses, isLoading: loadingCourses } = useQuery({
    queryKey: ['smart-courses'],
    queryFn: async () => {
      const res = await apiClient.get<any>('/search', {
        params: { data: 'all' },
      });
      return unwrapArray(res).map((course: any) => ({
        type: 'course' as const,
        id: course.id,
        courseName: course.courseName || course.course_title || '',
        university: course.university || course.university_name || '',
      }));
    },
    staleTime: 5 * 60 * 1000,
  });

  const suggestions = useMemo<GroupedSuggestions>(() => {
    const q = debounced.toLowerCase().trim();
    if (q.length < 2) return EMPTY;

    const matchedOccupations = (occupations ?? [])
      .filter(
        (o) =>
          o.title.toLowerCase().includes(q) ||
          o.anzscoCode.toLowerCase().includes(q),
      )
      .slice(0, limitPerGroup);

    const matchedCourses = (courses ?? [])
      .filter(
        (c) =>
          c.courseName.toLowerCase().includes(q) ||
          c.university.toLowerCase().includes(q),
      )
      .slice(0, limitPerGroup);

    return { occupations: matchedOccupations, courses: matchedCourses };
  }, [debounced, occupations, courses, limitPerGroup]);

  return {
    suggestions,
    isLoading: loadingOcc || loadingCourses || isDebouncing,
  };
}
