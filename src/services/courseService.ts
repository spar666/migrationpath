// Service layer for course-related API calls

import { apiClient } from '@/lib/apiClient';

export interface Course {
  id: string;
  universityName: string;
  courseTitle: string;
  anzscoCode: string;
  /** Occupation name, denormalised from the master (read-only, display only). */
  anzscoTitle?: string;
  /** Campus postcode — the only input that drives regional classification. */
  campusPostcode?: string | null;
  /** Derived server-side from campusPostcode. Read-only (never sent on create/update). */
  isRegional: boolean;
  /** Derived tier: METRO / CATEGORY_2 / CATEGORY_3 / UNKNOWN. Read-only. */
  regionalCategory?: string | null;
  isActive: boolean;
  /** @deprecated study-side detail; no longer captured or featured. */
  annualFees?: number;
  /** @deprecated study-side detail; no longer captured or featured. */
  duration?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateCourseDto {
  universityName: string;
  courseTitle: string;
  /** Links the course to an occupation in the master (drives occupation name + visas). */
  anzscoCode?: string;
  /**
   * Campus postcode. Regional eligibility is derived from this on the server;
   * `isRegional` is intentionally NOT part of the payload (no manual override).
   */
  campusPostcode?: string;
  isActive?: boolean;
}

export type UpdateCourseDto = Partial<CreateCourseDto>;

interface CoursesApiResponse {
  success: boolean;
  data: Course[];
}

interface CourseApiResponse {
  success: boolean;
  data: Course;
}

class CourseService {
  private baseURL = '/courses';

  /**
   * Get all courses
   */
  async getCourses(): Promise<Course[]> {
    const response = await apiClient.get<CoursesApiResponse>(this.baseURL);
    // Handle both wrapped { success, data } and raw array responses
    if (response && typeof response === 'object' && 'data' in response) {
      return (response as CoursesApiResponse).data || [];
    }
    return Array.isArray(response) ? response : [];
  }

  /**
   * Search courses using advanced criteria
   */
  async searchAdvanced(payload: {
    selectedOccupation?: { occupation: string } | null;
    query?: string;
    isRegional?: boolean | null;
    visaSubclasses?: string[];
  }): Promise<Course[]> {
    const response = await apiClient.post<any>('/search/advanced', payload);
    
    // The response is wrapped in { success, data: { results: [...] } }
    let results: any[] = [];
    if (response && response.success && response.data && Array.isArray(response.data.results)) {
      results = response.data.results;
    } else if (response && response.data && Array.isArray(response.data)) {
      results = response.data;
    } else if (Array.isArray(response)) {
      results = response;
    }

    // Normalize field names: backend uses courseName, university, occupation, isRegional, visaSubclasses
    // frontend expects courseTitle, universityName, anzscoTitle, isRegional, etc.
    return results.map((item: any) => ({
      id: item.id,
      courseTitle: item.courseName || item.courseTitle || '',
      universityName: item.university || item.universityName || '',
      anzscoCode: item.anzscoCode || '',
      anzscoTitle: item.occupation || item.anzscoTitle || '',
      isRegional: item.isRegional ?? false,
      regionalCategory: item.regionalCategory ?? null,
      campusPostcode: item.campusPostcode ?? null,
      isActive: item.isActive ?? true,
      visaSubclasses: item.visaSubclasses || [],
    }));
  }

  /**
   * Get a single course by ID
   */
  async getCourse(id: string): Promise<Course> {
    const response = await apiClient.get<CourseApiResponse>(`${this.baseURL}/${id}`);
    if (response && typeof response === 'object' && 'data' in response) {
      return (response as CourseApiResponse).data;
    }
    return response as unknown as Course;
  }

  /**
   * Lean course detail (the dedicated /pathway endpoint has been removed).
   * Returns the course plus master-derived eligible visas and regional points.
   */
  async getPathwayDetails(id: string): Promise<any> {
    const response = await apiClient.get<any>(`${this.baseURL}/${id}`);
    if (response && typeof response === 'object' && 'data' in response) {
      return response.data;
    }
    return response;
  }

  /**
   * Create a new course
   */
  async createCourse(data: CreateCourseDto): Promise<Course> {
    const response = await apiClient.post<CourseApiResponse>(this.baseURL, data);
    if (response && typeof response === 'object' && 'data' in response) {
      return (response as CourseApiResponse).data;
    }
    return response as unknown as Course;
  }

  /**
   * Update an existing course
   */
  async updateCourse(id: string, data: UpdateCourseDto): Promise<Course> {
    const response = await apiClient.patch<CourseApiResponse>(`${this.baseURL}/${id}`, data);
    if (response && typeof response === 'object' && 'data' in response) {
      return (response as CourseApiResponse).data;
    }
    return response as unknown as Course;
  }

  /**
   * Delete a course
   */
  async deleteCourse(id: string): Promise<void> {
    await apiClient.delete(`${this.baseURL}/${id}`);
  }
}

export const courseService = new CourseService();
