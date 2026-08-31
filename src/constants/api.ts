/**
 * API Configuration Constants
 */

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

export const API_ENDPOINTS = {
  // Auth is staff-only and its two paths (/auth/signin, /auth/me) live in
  // authService, which is their only caller.

  // User
  GET_PROFILE: '/user/profile',
  UPDATE_PROFILE: '/user/profile',
  GET_PREFERENCES: '/user/preferences',
  UPDATE_PREFERENCES: '/user/preferences',

  // Occupations
  SEARCH_OCCUPATIONS: '/occupations/search',
  GET_OCCUPATION: '/occupations/:id',
  LIST_OCCUPATIONS: '/occupations',
  GET_OCCUPATION_THRESHOLD: '/occupations/:id/threshold',

  // Points
  CALCULATE_POINTS: '/points/calculate',
  GET_POINTS_CONFIG: '/points/config',
  GET_USER_POINTS: '/points/user',

  // CMS
  GET_NEWS: '/cms/news-articles',
  GET_NEWS_ARTICLE: '/cms/news-articles/:id',
  GET_NEWS_ARTICLE_BY_SLUG: '/cms/news-articles/slug/:slug',
  GET_SUCCESS_STORIES: '/cms/success-stories',

  // Leads
  CREATE_LEAD: '/leads',

  // Stats
  STATS: '/stats',

  // Admin
  ADMIN_USERS: '/admin/users',
  ADMIN_STATISTICS: '/admin/statistics',
} as const;

export const API_TIMEOUTS = {
  DEFAULT: 30000,
  UPLOAD: 60000,
  LONG_RUNNING: 120000,
} as const;

export const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  BACKOFF_MULTIPLIER: 2,
} as const;
