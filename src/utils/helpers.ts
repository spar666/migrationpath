/**
 * Helper Functions
 */

/**
 * Generate UUID v4
 */
export const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * Deep clone object
 */
export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Check if object is empty
 */
export const isEmpty = (obj: object): boolean => {
  return Object.keys(obj).length === 0;
};

/**
 * Merge objects
 */
export const mergeObjects = <T extends object>(...objects: T[]): T => {
  return objects.reduce((acc, obj) => ({ ...acc, ...obj }), {} as T);
};

/**
 * Sort array of objects by property
 */
export const sortBy = <T extends object>(
  array: T[],
  key: keyof T,
  order: 'asc' | 'desc' = 'asc'
): T[] => {
  const sorted = [...array].sort((a, b) => {
    const aValue = a[key];
    const bValue = b[key];

    if (aValue < bValue) return order === 'asc' ? -1 : 1;
    if (aValue > bValue) return order === 'asc' ? 1 : -1;
    return 0;
  });

  return sorted;
};

/**
 * Group array by property
 */
export const groupBy = <T extends object, K extends keyof T>(
  array: T[],
  key: K
): Record<string, T[]> => {
  return array.reduce(
    (acc, obj) => {
      const groupKey = String(obj[key]);
      if (!acc[groupKey]) {
        acc[groupKey] = [];
      }
      acc[groupKey].push(obj);
      return acc;
    },
    {} as Record<string, T[]>
  );
};

/**
 * Debounce function
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Throttle function
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;

  return function (...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Retry async function
 */
export const retry = async <T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;
    await new Promise((resolve) => setTimeout(resolve, delay));
    return retry(fn, retries - 1, delay * 2);
  }
};

/**
 * Wait for milliseconds
 */
export const wait = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Check if value is in range
 */
export const isInRange = (value: number, min: number, max: number): boolean => {
  return value >= min && value <= max;
};

/**
 * Get unique values from array
 */
export const getUnique = <T>(array: T[]): T[] => {
  return Array.from(new Set(array));
};

/**
 * Flatten nested array
 */
export const flatten = <T>(array: any[]): T[] => {
  return array.reduce((acc: T[], val) => {
    return acc.concat(Array.isArray(val) ? flatten(val) : [val]);
  }, []);
};

/**
 * Check if two arrays are equal
 */
export const arraysEqual = <T>(a: T[], b: T[]): boolean => {
  if (a.length !== b.length) return false;
  return a.every((val, idx) => val === b[idx]);
};

/**
 * Map object values
 */
export const mapValues = <T extends object, R>(
  obj: T,
  fn: (value: T[keyof T]) => R
): Record<keyof T, R> => {
  const result = {} as Record<keyof T, R>;
  for (const key in obj) {
    result[key] = fn(obj[key]);
  }
  return result;
};
