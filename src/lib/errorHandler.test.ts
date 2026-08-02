import { describe, it, expect } from 'vitest';
import {
  AppError,
  ErrorCodes,
  createApiError,
  getErrorCode,
  getErrorMessage,
} from './errorHandler';

/**
 * getErrorMessage sits between every failed request and what the user reads.
 *
 * The interesting cases are the shapes it must NOT mangle: Nest returns
 * validation failures as `message: string[]`, and a naive handler renders that
 * as "[object Object]" or drops it for a generic apology — which is how a
 * fixable "email is already registered" turns into "something went wrong".
 */

describe('getErrorMessage', () => {
  it('reads an Error', () => {
    expect(getErrorMessage(new Error('boom'))).toBe('boom');
  });

  it('reads an AppError', () => {
    expect(getErrorMessage(new AppError('nope', ErrorCodes.FORBIDDEN, 403))).toBe(
      'nope',
    );
  });

  it('passes a bare string through', () => {
    expect(getErrorMessage('plain message')).toBe('plain message');
  });

  it('reads a Nest error body', () => {
    expect(getErrorMessage({ message: 'Email already registered' })).toBe(
      'Email already registered',
    );
  });

  it('joins the array Nest sends for validation failures', () => {
    // The case that most often regresses into "[object Object]".
    expect(
      getErrorMessage({ message: ['email must be an email', 'password too short'] }),
    ).toBe('email must be an email. password too short');
  });

  it('reads a nested error.message body', () => {
    expect(getErrorMessage({ error: { message: 'Upstream failed' } })).toBe(
      'Upstream failed',
    );
  });

  it('falls back for shapes it cannot read', () => {
    expect(getErrorMessage(null)).toBe('An unexpected error occurred');
    expect(getErrorMessage(undefined)).toBe('An unexpected error occurred');
    expect(getErrorMessage({})).toBe('An unexpected error occurred');
    expect(getErrorMessage(42)).toBe('An unexpected error occurred');
  });

  it('falls back rather than showing an empty or whitespace message', () => {
    // An empty string would render as a blank error box, which reads as a
    // broken page rather than a failed action.
    expect(getErrorMessage({ message: '   ' })).toBe('An unexpected error occurred');
    expect(getErrorMessage({ message: [] })).toBe('An unexpected error occurred');
  });
});

describe('getErrorCode', () => {
  it('reads the code off an AppError', () => {
    expect(getErrorCode(new AppError('x', ErrorCodes.SESSION_EXPIRED, 401))).toBe(
      ErrorCodes.SESSION_EXPIRED,
    );
  });

  it('returns UNKNOWN_ERROR for anything else', () => {
    expect(getErrorCode(new Error('x'))).toBe(ErrorCodes.UNKNOWN_ERROR);
    expect(getErrorCode('x')).toBe(ErrorCodes.UNKNOWN_ERROR);
  });
});

describe('AppError', () => {
  it('defaults to a 500 unknown error', () => {
    const error = new AppError('boom');
    expect(error.status).toBe(500);
    expect(error.code).toBe(ErrorCodes.UNKNOWN_ERROR);
  });

  it('is still an Error, so existing catch blocks keep working', () => {
    const error = new AppError('boom');
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('AppError');
  });
});

describe('createApiError', () => {
  it('stamps a timestamp and defaults the code', () => {
    const error = createApiError('failed', 502);
    expect(error.code).toBe(ErrorCodes.API_ERROR);
    expect(error.status).toBe(502);
    expect(Date.parse(error.timestamp)).not.toBeNaN();
  });
});
