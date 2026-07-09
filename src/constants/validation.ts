/**
 * Validation Rules and Patterns
 */

export const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  PHONE: /^[\d\s+\-().]+$/,
  URL: /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
  ALPHANUMERIC: /^[a-zA-Z0-9]*$/,
  NUMERIC: /^\d+$/,
  ANZSCO_CODE: /^\d{6}$/,
} as const;

export const VALIDATION_MESSAGES = {
  REQUIRED: 'This field is required',
  EMAIL_INVALID: 'Please enter a valid email address',
  PASSWORD_WEAK: 'Password must contain at least 8 characters, including uppercase, lowercase, number and special character',
  CONFIRM_PASSWORD_MISMATCH: 'Passwords do not match',
  MIN_LENGTH: (length: number) => `Must be at least ${length} characters`,
  MAX_LENGTH: (length: number) => `Must not exceed ${length} characters`,
  INVALID_FORMAT: 'Invalid format',
  FILE_TOO_LARGE: 'File is too large',
  INVALID_FILE_TYPE: 'File type not supported',
  CUSTOM: (message: string) => message,
} as const;

export const FIELD_LENGTH_LIMITS = {
  FIRST_NAME: { MIN: 2, MAX: 50 },
  LAST_NAME: { MIN: 2, MAX: 50 },
  EMAIL: { MIN: 5, MAX: 255 },
  PASSWORD: { MIN: 8, MAX: 128 },
  PHONE: { MIN: 10, MAX: 20 },
  OCCUPATION_SEARCH: { MIN: 2, MAX: 100 },
  DOCUMENT_DESCRIPTION: { MIN: 0, MAX: 500 },
} as const;

export const AGE_LIMITS = {
  MINIMUM: 18,
  MAXIMUM: 100,
} as const;

export const EXPERIENCE_LIMITS = {
  MINIMUM_YEARS: 0,
  MAXIMUM_YEARS: 60,
} as const;
