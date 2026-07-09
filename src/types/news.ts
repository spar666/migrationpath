export interface NewsArticle {
  id: string;
  documentId: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  category: string;
  tags: string[];
  featured: boolean;
  date: string;
  publishedAt: string;
  updatedAt: string;
  readTime: string;
  personaTag: string;
  is_breaking: boolean;
}

export interface StrapiNewsArticle {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  content: string;
  category: string;
  target_persona: string;
  is_breaking: boolean;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface StrapiPaginatedResponse<T> {
  data: T[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}
