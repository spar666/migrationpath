/**
 * API and Response Types
 */

export interface ApiResponse<T> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasNextPage: boolean;
}
