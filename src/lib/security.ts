// Security utilities and configurations

export interface SecurityHeaders {
  'Content-Security-Policy': string;
  'X-Content-Type-Options': string;
  'X-Frame-Options': string;
  'X-XSS-Protection': string;
  'Referrer-Policy': string;
  'Permissions-Policy': string;
  'Strict-Transport-Security': string;
}

/**
 * Get security headers configuration
 * Apply these headers in your reverse proxy or backend
 */
export const getSecurityHeaders = (isDev: boolean = false): SecurityHeaders => {
  const cspPolicy = isDev
    ? "default-src 'self' 'unsafe-inline' 'unsafe-eval'; script-src 'self' 'unsafe-inline' 'unsafe-eval'"
    : "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https://api.migrationpath.com.au; frame-src 'none'";

  return {
    'Content-Security-Policy': cspPolicy,
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  };
};

/**
 * Input sanitization
 */
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return '';

  // Remove HTML tags and special characters
  return input
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>]/g, '') // Remove angle brackets
    .trim();
};

/**
 * Validate email format
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 */
export const validatePassword = (password: string): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  if (!/[!@#$%^&*]/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&*)');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Generate CSRF token
 */
export const generateCSRFToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Verify CSRF token
 */
export const verifyCSRFToken = (token: string, storedToken: string): boolean => {
  if (!token || !storedToken) return false;
  // Use timing-safe comparison in production
  return token === storedToken;
};

/**
 * Rate limiting helper
 */
export class RateLimiter {
  private attempts: Map<string, { count: number; resetTime: number }> = new Map();

  constructor(
    private maxAttempts: number = 5,
    private windowMs: number = 60000 // 1 minute
  ) {}

  isAllowed(key: string): boolean {
    const now = Date.now();
    const record = this.attempts.get(key);

    if (!record || now > record.resetTime) {
      // First attempt or window expired
      this.attempts.set(key, { count: 1, resetTime: now + this.windowMs });
      return true;
    }

    if (record.count < this.maxAttempts) {
      record.count++;
      return true;
    }

    return false;
  }

  getRemainingTime(key: string): number {
    const record = this.attempts.get(key);
    if (!record) return 0;

    const remaining = record.resetTime - Date.now();
    return Math.max(0, remaining);
  }

  reset(key: string): void {
    this.attempts.delete(key);
  }
}

/**
 * Log security event
 */
export const logSecurityEvent = (
  event: string,
  details: Record<string, any> = {},
  level: 'info' | 'warn' | 'error' = 'info'
): void => {
  const timestamp = new Date().toISOString();
  const logMessage = {
    timestamp,
    event,
    level,
    details,
  };

  // In production, send to security logging service
  if (import.meta.env.VITE_ENV === 'production') {
    // TODO: Send to centralized logging service
    console.log('[SECURITY]', logMessage);
  } else {
    console[level as any]('[SECURITY]', logMessage);
  }
};

/**
 * Check for suspicious patterns
 */
export const isSuspiciousInput = (input: string): boolean => {
  // Check for SQL injection patterns
  const sqlInjectionPatterns = /('|(--)|;|\/\*|\*\/|xp_|sp_)/gi;
  if (sqlInjectionPatterns.test(input)) return true;

  // Check for script injection patterns
  const scriptPatterns = /<script|javascript:|onerror|onload/gi;
  if (scriptPatterns.test(input)) return true;

  // Check for path traversal
  const pathTraversalPatterns = /\.\.\//g;
  if (pathTraversalPatterns.test(input)) return true;

  return false;
};
