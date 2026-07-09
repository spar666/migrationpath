/**
 * Date Manipulation Utilities
 */

/**
 * Format date to readable string
 */
export const formatDate = (date: Date | string, locale: string = 'en-AU'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString(locale);
};

/**
 * Format date and time
 */
export const formatDateTime = (date: Date | string, locale: string = 'en-AU'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleString(locale);
};

/**
 * Get relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

  return formatDate(dateObj);
};

/**
 * Add days to date
 */
export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

/**
 * Add months to date
 */
export const addMonths = (date: Date, months: number): Date => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
};

/**
 * Add years to date
 */
export const addYears = (date: Date, years: number): Date => {
  const result = new Date(date);
  result.setFullYear(result.getFullYear() + years);
  return result;
};

/**
 * Check if date is today
 */
export const isToday = (date: Date | string): boolean => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  return (
    dateObj.getDate() === today.getDate() &&
    dateObj.getMonth() === today.getMonth() &&
    dateObj.getFullYear() === today.getFullYear()
  );
};

/**
 * Check if date is in the past
 */
export const isPast = (date: Date | string): boolean => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj < new Date();
};

/**
 * Check if date is in the future
 */
export const isFuture = (date: Date | string): boolean => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj > new Date();
};

/**
 * Get difference between two dates in days
 */
export const dateDiffDays = (date1: Date | string, date2: Date | string): number => {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
  const diffMs = Math.abs(d2.getTime() - d1.getTime());
  return Math.floor(diffMs / 86400000);
};

/**
 * Convert date to ISO string
 */
export const toISOString = (date: Date): string => {
  return date.toISOString();
};

/**
 * Parse ISO date string
 */
export const parseISODate = (dateStr: string): Date => {
  return new Date(dateStr);
};

/**
 * Get start of day
 */
export const getStartOfDay = (date: Date = new Date()): Date => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

/**
 * Get end of day
 */
export const getEndOfDay = (date: Date = new Date()): Date => {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
};

/**
 * Check if date is valid
 */
export const isValidDate = (date: any): boolean => {
  return date instanceof Date && !isNaN(date.getTime());
};
