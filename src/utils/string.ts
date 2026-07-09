/**
 * String Manipulation Utilities
 */

/**
 * Convert to kebab-case
 */
export const toKebabCase = (str: string): string => {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
};

/**
 * Convert to snake_case
 */
export const toSnakeCase = (str: string): string => {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();
};

/**
 * Convert to camelCase
 */
export const toCamelCase = (str: string): string => {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, (match, index) => {
      if (+match === 0) return '';
      return index === 0 ? match.toLowerCase() : match.toUpperCase();
    });
};

/**
 * Remove all whitespace
 */
export const removeWhitespace = (str: string): string => {
  return str.replace(/\s+/g, '');
};

/**
 * Remove special characters
 */
export const removeSpecialCharacters = (str: string): string => {
  return str.replace(/[^a-zA-Z0-9]/g, '');
};

/**
 * Reverse string
 */
export const reverseString = (str: string): string => {
  return str.split('').reverse().join('');
};

/**
 * Check if string is palindrome
 */
export const isPalindrome = (str: string): boolean => {
  const cleaned = str.toLowerCase().replace(/[^a-z0-9]/g, '');
  return cleaned === reverseString(cleaned);
};

/**
 * Repeat string
 */
export const repeatString = (str: string, times: number): string => {
  return str.repeat(times);
};

/**
 * Pad string with character
 */
export const padString = (str: string, length: number, padChar: string = ' '): string => {
  return str.padEnd(length, padChar);
};

/**
 * Split string and trim each part
 */
export const splitAndTrim = (str: string, separator: string = ','): string[] => {
  return str.split(separator).map((s) => s.trim());
};

/**
 * Check if string is empty or whitespace only
 */
export const isBlank = (str: string): boolean => {
  return str.trim().length === 0;
};

/**
 * Convert string to boolean
 */
export const toBoolean = (str: string): boolean => {
  return ['true', 'yes', '1', 'on'].includes(str.toLowerCase());
};

/**
 * Escape HTML special characters
 */
export const escapeHtml = (str: string): string => {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return str.replace(/[&<>"']/g, (char) => map[char]);
};

/**
 * Unescape HTML entities
 */
export const unescapeHtml = (str: string): string => {
  const map: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#039;': "'",
  };
  return str.replace(/&[^;]+;/g, (entity) => map[entity] || entity);
};

/**
 * Remove leading and trailing quotes
 */
export const removeQuotes = (str: string): string => {
  return str.replace(/^["']|["']$/g, '');
};

/**
 * Replace all occurrences of a substring
 */
export const replaceAll = (str: string, search: string, replace: string): string => {
  return str.split(search).join(replace);
};

/**
 * Count occurrences of substring
 */
export const countOccurrences = (str: string, search: string): number => {
  return str.split(search).length - 1;
};
