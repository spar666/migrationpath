// Error handling utilities for production

export interface ApiError {
  code: string;
  message: string;
  status: number;
  details?: unknown;
  timestamp: string;
}

export class AppError extends Error {
  code: string;
  status: number;
  details?: unknown;

  constructor(message: string, code: string = 'UNKNOWN_ERROR', status: number = 500, details?: unknown) {
    super(message);
    this.code = code;
    this.status = status;
    this.details = details;
    this.name = 'AppError';
  }
}

export const ErrorCodes = {
  // Auth errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  SESSION_EXPIRED: 'SESSION_EXPIRED',

  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',

  // API errors
  API_ERROR: 'API_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  NOT_FOUND: 'NOT_FOUND',

  // Server errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',

  // Application errors
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  OPERATION_FAILED: 'OPERATION_FAILED',
} as const;

export const getErrorMessage = (error: unknown): string => {
  if (error instanceof AppError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unexpected error occurred';
};

export const getErrorCode = (error: unknown): string => {
  if (error instanceof AppError) {
    return error.code;
  }
  return ErrorCodes.UNKNOWN_ERROR;
};

export const createApiError = (message: string, status: number, code?: string, details?: unknown): ApiError => {
  return {
    code: code || ErrorCodes.API_ERROR,
    message,
    status,
    details,
    timestamp: new Date().toISOString(),
  };
};
