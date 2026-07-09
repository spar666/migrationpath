import { apiClient } from '@/lib/apiClient';
import { API_ENDPOINTS } from '@/constants/api';

export interface SuccessStory {
  id: number;
  name: string;
  country?: string;
  visaSubclass?: string;
  quote: string;
  featured: boolean;
}

interface StrapiSuccessStory {
  id: number;
  documentId: string;
  name: string;
  country?: string;
  visa_subclass?: string;
  quote: string;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

interface StrapiPaginated<T> {
  data: T[];
  meta?: unknown;
}

function transform(story: StrapiSuccessStory): SuccessStory {
  return {
    id: story.id,
    name: story.name,
    country: story.country,
    visaSubclass: story.visa_subclass,
    quote: story.quote,
    featured: story.featured,
  };
}

class SuccessStoryService {
  async getFeatured(limit = 3): Promise<SuccessStory[]> {
    const response = await apiClient.get<
      ApiEnvelope<StrapiPaginated<StrapiSuccessStory>> | StrapiPaginated<StrapiSuccessStory>
    >(API_ENDPOINTS.GET_SUCCESS_STORIES);

    const payload = 'data' in response && 'success' in response ? response.data : response;
    const stories = Array.isArray(payload) ? payload : payload?.data ?? [];

    return stories
      .filter((s) => s.featured)
      .slice(0, limit)
      .map(transform);
  }
}

export const successStoryService = new SuccessStoryService();
