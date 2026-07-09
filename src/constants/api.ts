/**
 * API Configuration Constants
 */

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  LOGOUT: '/auth/logout',
  REFRESH_TOKEN: '/auth/refresh',
  RESET_PASSWORD: '/auth/reset-password',

  // User
  GET_PROFILE: '/user/profile',
  UPDATE_PROFILE: '/user/profile',
  GET_PREFERENCES: '/user/preferences',
  UPDATE_PREFERENCES: '/user/preferences',
  USER_PROGRESS: '/users/me/progress',

  // Documents
  UPLOAD_DOCUMENT: '/documents/upload',
  GET_DOCUMENTS: '/documents',
  DELETE_DOCUMENT: '/documents/:id',
  GET_DOCUMENT: '/documents/:id',

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

  // Migration Rules
  MIGRATION_RULES: '/migration/rules',

  // Pricing
  GET_PRICING_PACKAGES: '/pricing/packages',
  CREATE_QUOTE: '/pricing/quotes',

  // Leads
  CREATE_LEAD: '/leads',

  // Stats
  STATS: '/stats',

  // Admin
  ADMIN_USERS: '/admin/users',
  ADMIN_DOCUMENTS: '/admin/documents',
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
