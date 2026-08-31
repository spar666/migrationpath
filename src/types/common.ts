/**
 * Common and Utility Types
 */

export interface ApiError {
  code: string;
  message: string;
  statusCode: number;
  timestamp: string;
  details?: Record<string, any>;
}

export interface SecurityHeaders {
  'Content-Security-Policy': string;
  'X-Content-Type-Options': string;
  'X-Frame-Options': string;
  'X-XSS-Protection': string;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}
