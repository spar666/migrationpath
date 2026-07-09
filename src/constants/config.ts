/**
 * Application Configuration Constants
 */

export const APP_NAME = 'Migration Path';
export const APP_VERSION = '1.0.0';
export const ORGANIZATION_NAME = 'Migration Path Inc.';

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
  PAGE_SIZES: [5, 10, 25, 50] as const,
} as const;

export const FILE_UPLOAD = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_FORMATS: ['pdf', 'doc', 'docx', 'jpg', 'png', 'gif'] as const,
  ALLOWED_MIME_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'image/gif',
  ] as const,
} as const;

export const IMAGE_COMPRESSION = {
  QUALITY: 0.8,
  MAX_WIDTH: 1920,
  MAX_HEIGHT: 1080,
  FORMAT: 'webp',
} as const;

export const CACHE_CONFIG = {
  USER_PROFILE: 5 * 60 * 1000, // 5 minutes
  OCCUPATIONS_LIST: 10 * 60 * 1000, // 10 minutes
  NEWS: 30 * 60 * 1000, // 30 minutes
  POINTS_CONFIG: 24 * 60 * 60 * 1000, // 24 hours
} as const;

export const SESSION_CONFIG = {
  TIMEOUT: 30 * 60 * 1000, // 30 minutes
  WARNING_TIME: 5 * 60 * 1000, // 5 minutes
  REFRESH_INTERVAL: 15 * 60 * 1000, // 15 minutes
} as const;

export const POINTS_THRESHOLDS = {
  MINIMUM_ELIGIBLE: 65,
  PREFERRED_MINIMUM: 75,
  PRIORITY_CUTOFF: 90,
} as const;

export const OCCUPATIONS_CONFIG = {
  MIN_SEARCH_LENGTH: 2,
  MAX_RESULTS: 50,
  SEARCH_DEBOUNCE_MS: 300,
} as const;

export const ENVIRONMENT = {
  DEVELOPMENT: 'development',
  STAGING: 'staging',
  PRODUCTION: 'production',
} as const;

export const CURRENT_ENV = (import.meta.env.MODE || 'development') as keyof typeof ENVIRONMENT;

export const ENABLE_ANALYTICS = import.meta.env.VITE_ENABLE_ANALYTICS === 'true';
export const ENABLE_LOGGING = import.meta.env.VITE_ENABLE_LOGGING === 'true';
