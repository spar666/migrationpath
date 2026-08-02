import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  RateLimiter,
  generateCSRFToken,
  isSuspiciousInput,
  sanitizeInput,
  validateEmail,
  validatePassword,
  verifyCSRFToken,
} from './security';

/**
 * ⚠️ Note for whoever reads this next: at the time of writing, NOTHING in the
 * app calls sanitizeInput, isSuspiciousInput, or RateLimiter. They are
 * exported and untested, which is the worst combination — they read like
 * protection that is in force, and none of it is.
 *
 * These tests describe what the helpers actually do, so that whoever wires
 * them up can see the sharp edges first. The `isSuspiciousInput` apostrophe
 * case below is the one to read before putting it in front of a name field.
 */

describe('validateEmail', () => {
  it.each(['ada@example.com', 'a.b+tag@sub.example.co.uk'])(
    'accepts %s',
    (email) => expect(validateEmail(email)).toBe(true),
  );

  it.each(['', 'no-at-sign', 'a@b', 'a b@example.com', 'a@ex ample.com'])(
    'rejects %s',
    (email) => expect(validateEmail(email)).toBe(false),
  );
});

describe('validatePassword', () => {
  it('accepts a password meeting every rule', () => {
    expect(validatePassword('Str0ng!pass').isValid).toBe(true);
  });

  it('reports every failing rule at once, not just the first', () => {
    // Drip-feeding one rule per attempt is how people end up on their sixth
    // try. All five come back together.
    const { isValid, errors } = validatePassword('abc');
    expect(isValid).toBe(false);
    expect(errors).toHaveLength(4);
  });

  it.each([
    ['length', '8 characters', 'Ab1!'],
    ['uppercase', 'uppercase', 'lowercase1!'],
    ['lowercase', 'lowercase', 'UPPERCASE1!'],
    ['number', 'number', 'NoNumbers!'],
    ['special character', 'special', 'NoSpecial1'],
  ])('flags a missing %s', (_label, needle, password) => {
    const { errors } = validatePassword(password);
    expect(errors.join(' ').toLowerCase()).toContain(needle);
  });
});

describe('sanitizeInput', () => {
  it('strips HTML tags', () => {
    expect(sanitizeInput('<b>hello</b>')).toBe('hello');
  });

  it('strips a script tag and its angle brackets', () => {
    expect(sanitizeInput('<script>alert(1)</script>')).toBe('alert(1)');
  });

  it('trims surrounding whitespace', () => {
    expect(sanitizeInput('  spaced  ')).toBe('spaced');
  });

  it('returns an empty string for a non-string', () => {
    expect(sanitizeInput(null as never)).toBe('');
    expect(sanitizeInput(undefined as never)).toBe('');
  });

  it('does NOT decode entities — it is not an XSS defence on its own', () => {
    // Worth stating plainly: this strips markup from display strings. It is
    // not a substitute for escaping at the render boundary, and React already
    // escapes by default.
    expect(sanitizeInput('&lt;script&gt;')).toBe('&lt;script&gt;');
  });
});

describe('isSuspiciousInput', () => {
  it.each([
    'SELECT * FROM users; DROP TABLE users',
    '<script>alert(1)</script>',
    'javascript:alert(1)',
    '<img onerror=alert(1)>',
    '../../etc/passwd',
  ])('flags %s', (input) => expect(isSuspiciousInput(input)).toBe(true));

  it('passes ordinary text', () => {
    expect(isSuspiciousInput('Software Engineer')).toBe(false);
    expect(isSuspiciousInput('ada@example.com')).toBe(false);
  });

  it('⚠️ flags an apostrophe, so ordinary names trip it', () => {
    // O'Brien, O'Connor, D'Angelo. This is a characterisation test, not an
    // endorsement: if this helper is ever wired to a name field it will reject
    // real people, and the ones it rejects are a specific set of surnames.
    expect(isSuspiciousInput("O'Brien")).toBe(true);
    expect(isSuspiciousInput("it's fine")).toBe(true);
  });

  it('⚠️ flags a hyphen pair, so ranges and dashes trip it', () => {
    expect(isSuspiciousInput('2020--2024')).toBe(true);
  });
});

describe('CSRF tokens', () => {
  it('generates a 64-character hex token', () => {
    const token = generateCSRFToken();
    expect(token).toMatch(/^[0-9a-f]{64}$/);
  });

  it('does not repeat', () => {
    expect(generateCSRFToken()).not.toBe(generateCSRFToken());
  });

  it('verifies a matching pair', () => {
    const token = generateCSRFToken();
    expect(verifyCSRFToken(token, token)).toBe(true);
  });

  it('rejects a mismatch or an empty side', () => {
    expect(verifyCSRFToken('a', 'b')).toBe(false);
    expect(verifyCSRFToken('', 'b')).toBe(false);
    expect(verifyCSRFToken('a', '')).toBe(false);
  });
});

describe('RateLimiter', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it('allows attempts up to the limit', () => {
    const limiter = new RateLimiter(3, 60000);
    expect(limiter.isAllowed('user-1')).toBe(true);
    expect(limiter.isAllowed('user-1')).toBe(true);
    expect(limiter.isAllowed('user-1')).toBe(true);
  });

  it('blocks the attempt past the limit', () => {
    const limiter = new RateLimiter(2, 60000);
    limiter.isAllowed('user-1');
    limiter.isAllowed('user-1');
    expect(limiter.isAllowed('user-1')).toBe(false);
  });

  it('tracks each key separately', () => {
    // Otherwise one noisy user locks out everyone else.
    const limiter = new RateLimiter(1, 60000);
    expect(limiter.isAllowed('user-1')).toBe(true);
    expect(limiter.isAllowed('user-2')).toBe(true);
    expect(limiter.isAllowed('user-1')).toBe(false);
  });

  it('lets the window expire', () => {
    vi.useFakeTimers();
    const limiter = new RateLimiter(1, 1000);
    expect(limiter.isAllowed('user-1')).toBe(true);
    expect(limiter.isAllowed('user-1')).toBe(false);
    vi.advanceTimersByTime(1500);
    expect(limiter.isAllowed('user-1')).toBe(true);
  });

  it('⚠️ is per-tab and in-memory — a refresh clears it', () => {
    // Client-side rate limiting is a UX nicety, never a control. The server
    // throttle is the real one.
    const limiter = new RateLimiter(1, 60000);
    limiter.isAllowed('user-1');
    expect(new RateLimiter(1, 60000).isAllowed('user-1')).toBe(true);
  });
});
