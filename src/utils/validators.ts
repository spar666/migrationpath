/**
 * Validation Utilities
 */

import { VALIDATION_PATTERNS, FIELD_LENGTH_LIMITS, AGE_LIMITS, EXPERIENCE_LIMITS } from '@/constants/validation';

/**
 * Validate email format
 */
export const validateEmail = (email: string): boolean => {
  return VALIDATION_PATTERNS.EMAIL.test(email);
};

/**
 * Validate password strength
 */
export const validatePassword = (password: string): boolean => {
  return VALIDATION_PATTERNS.PASSWORD.test(password);
};

/**
 * Validate phone number
 */
export const validatePhone = (phone: string): boolean => {
  return VALIDATION_PATTERNS.PHONE.test(phone);
};

/**
 * Validate URL format
 */
export const validateUrl = (url: string): boolean => {
  return VALIDATION_PATTERNS.URL.test(url);
};

/**
 * Validate ANZSCO code
 */
export const validateAnzscoCode = (code: string): boolean => {
  return VALIDATION_PATTERNS.ANZSCO_CODE.test(code);
};

/**
 * Validate string length
 */
export const validateLength = (str: string, min: number, max: number): boolean => {
  return str.length >= min && str.length <= max;
};

/**
 * Validate age
 */
export const validateAge = (age: number): boolean => {
  return age >= AGE_LIMITS.MINIMUM && age <= AGE_LIMITS.MAXIMUM;
};

/**
 * Validate years of experience
 */
export const validateExperience = (years: number): boolean => {
  return years >= EXPERIENCE_LIMITS.MINIMUM_YEARS && years <= EXPERIENCE_LIMITS.MAXIMUM_YEARS;
};

/**
 * Validate file size
 */
export const validateFileSize = (fileSizeInBytes: number, maxSizeInBytes: number): boolean => {
  return fileSizeInBytes <= maxSizeInBytes;
};

/**
 * Validate file type
 */
export const validateFileType = (mimeType: string, allowedMimeTypes: readonly string[]): boolean => {
  return allowedMimeTypes.includes(mimeType);
};

/**
 * Validate dates (ISO format)
 */
export const validateDateFormat = (dateStr: string): boolean => {
  const date = new Date(dateStr);
  return date instanceof Date && !isNaN(date.getTime());
};

/**
 * Validate passwords match
 */
export const validatePasswordsMatch = (password: string, confirmPassword: string): boolean => {
  return password === confirmPassword && password.length > 0;
};

/**
 * Generic field validator
 */
export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  customValidator?: (value: any) => boolean;
  customMessage?: string;
}

export const validateField = (value: any, rules: ValidationRule): { valid: boolean; message?: string } => {
  // Check required
  if (rules.required && !value) {
    return { valid: false, message: 'This field is required' };
  }

  // Check min length
  if (rules.minLength && value && value.length < rules.minLength) {
    return { valid: false, message: `Must be at least ${rules.minLength} characters` };
  }

  // Check max length
  if (rules.maxLength && value && value.length > rules.maxLength) {
    return { valid: false, message: `Must not exceed ${rules.maxLength} characters` };
  }

  // Check pattern
  if (rules.pattern && value && !rules.pattern.test(value)) {
    return { valid: false, message: rules.customMessage || 'Invalid format' };
  }

  // Custom validator
  if (rules.customValidator && !rules.customValidator(value)) {
    return { valid: false, message: rules.customMessage || 'Invalid value' };
  }

  return { valid: true };
};
