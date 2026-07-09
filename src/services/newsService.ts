import { apiClient, setSuppressAuthRedirect } from '@/lib/apiClient';
import type { NewsArticle, StrapiNewsArticle, StrapiPaginatedResponse } from '@/types/news';

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  timestamp: string;
  path: string;
  requestId: string;
}

const PERSONA_MAP: Record<string, string> = {
  'Skilled': 'For Onshore Skilled',
  'Student': 'For Students',
  'Graduate': 'For Graduates',
};

function calculateReadTime(content: string): string {
  const wordsPerMinute = 200;
  const words = content.split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  return `${minutes} min read`;
}

function transformArticle(strapiArticle: StrapiNewsArticle): NewsArticle {
  return {
    id: strapiArticle.documentId,
    documentId: strapiArticle.documentId,
    title: strapiArticle.title,
    slug: strapiArticle.slug,
    content: strapiArticle.content,
    excerpt: strapiArticle.content.slice(0, 200).replace(/#{1,6}\s/g, '').trim(),
    category: strapiArticle.category,
    tags: [],
    featured: strapiArticle.is_breaking,
    date: strapiArticle.publishedAt || strapiArticle.createdAt,
    publishedAt: strapiArticle.publishedAt || strapiArticle.createdAt,
    updatedAt: strapiArticle.updatedAt,
    readTime: calculateReadTime(strapiArticle.content),
    personaTag: PERSONA_MAP[strapiArticle.target_persona] || strapiArticle.target_persona,
    is_breaking: strapiArticle.is_breaking,
  };
}

class NewsService {
  private baseURL = '/cms/news-articles';

  async getNewsArticles(page = 1, pageSize = 25, filters?: Record<string, string>): Promise<{ articles: NewsArticle[]; total: number }> {
    const params: Record<string, any> = {
      'pagination[page]': page,
      'pagination[pageSize]': pageSize,
    };
    if (filters?.category) params['filters[category][$eq]'] = filters.category;

    setSuppressAuthRedirect(true);
    try {
      const envelope = await apiClient.get<ApiEnvelope<StrapiPaginatedResponse<StrapiNewsArticle>>>(this.baseURL, { params });
      const strapiResponse = envelope.data;
      const articles = (strapiResponse.data || []).map(transformArticle);
      return {
        articles,
        total: strapiResponse.meta?.pagination?.total ?? articles.length,
      };
    } finally {
      setSuppressAuthRedirect(false);
    }
  }

  async getNewsArticleBySlug(slug: string): Promise<NewsArticle | null> {
    setSuppressAuthRedirect(true);
    try {
      const envelope = await apiClient.get<ApiEnvelope<{ data: StrapiNewsArticle; meta: any }>>(
        `${this.baseURL}/slug/${slug}`
      );
      const strapiArticle = envelope.data?.data;
      if (!strapiArticle) return null;
      return transformArticle(strapiArticle);
    } catch (error) {
      return null;
    } finally {
      setSuppressAuthRedirect(false);
    }
  }
}

export const newsService = new NewsService();
