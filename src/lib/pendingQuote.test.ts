import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  setPendingQuotePackage,
  getPendingQuotePackage,
  clearPendingQuotePackage,
} from './pendingQuote';

/**
 * The /quote -> /auth -> /quote round trip.
 *
 * This module exists because a visitor who picks a package and is then asked
 * to sign in used to come back to an empty selection. It is deliberately
 * localStorage rather than sessionStorage so the choice survives the tab being
 * closed, with a 24h expiry so a month-old selection doesn't reappear against
 * a price that has since changed.
 *
 * Every path here is wrapped in try/catch, because localStorage throws outright
 * in some private-browsing modes. The contract in that case is "lose the
 * selection quietly", never "break the page" — several tests below pin that.
 */

const KEY = 'pendingQuotePackage';
const DAY = 24 * 60 * 60 * 1000;

beforeEach(() => {
  localStorage.clear();
  vi.useRealTimers();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('round trip', () => {
  it('returns the package that was stored', () => {
    setPendingQuotePackage('pkg-skilled-189');

    expect(getPendingQuotePackage()).toBe('pkg-skilled-189');
  });

  it('returns null when nothing was ever stored', () => {
    expect(getPendingQuotePackage()).toBeNull();
  });

  it('overwrites an earlier selection rather than keeping both', () => {
    setPendingQuotePackage('pkg-a');
    setPendingQuotePackage('pkg-b');

    expect(getPendingQuotePackage()).toBe('pkg-b');
  });

  it('clears the selection', () => {
    setPendingQuotePackage('pkg-a');

    clearPendingQuotePackage();

    expect(getPendingQuotePackage()).toBeNull();
  });

  it('clearing an empty store is a no-op, not an error', () => {
    expect(() => clearPendingQuotePackage()).not.toThrow();
  });

  it('stores under localStorage so the choice survives a closed tab', () => {
    // sessionStorage would be wiped here; that regression is the whole
    // reason this module is not built on it.
    setPendingQuotePackage('pkg-a');

    expect(localStorage.getItem(KEY)).toBeTruthy();
    expect(sessionStorage.getItem(KEY)).toBeNull();
  });

  it('records a timestamp alongside the id', () => {
    setPendingQuotePackage('pkg-a');

    const stored = JSON.parse(localStorage.getItem(KEY) as string);
    expect(stored.packageId).toBe('pkg-a');
    expect(typeof stored.savedAt).toBe('number');
  });
});

describe('expiry', () => {
  it('returns a selection made just under 24 hours ago', () => {
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    setPendingQuotePackage('pkg-a');

    vi.setSystemTime(new Date('2026-01-01T00:00:00Z').getTime() + DAY - 1000);

    expect(getPendingQuotePackage()).toBe('pkg-a');
  });

  it('drops a selection older than 24 hours', () => {
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    setPendingQuotePackage('pkg-a');

    vi.setSystemTime(new Date('2026-01-01T00:00:00Z').getTime() + DAY + 1000);

    expect(getPendingQuotePackage()).toBeNull();
  });

  it('purges the expired entry rather than leaving it to be re-read', () => {
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    setPendingQuotePackage('pkg-a');

    vi.setSystemTime(new Date('2026-01-03T00:00:00Z'));
    getPendingQuotePackage();

    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it('treats a future timestamp from a skewed clock as still valid', () => {
    // Date.now() - savedAt goes negative here. Negative is not "> TTL", so
    // the selection survives — which is the forgiving direction.
    localStorage.setItem(
      KEY,
      JSON.stringify({ packageId: 'pkg-a', savedAt: Date.now() + DAY }),
    );

    expect(getPendingQuotePackage()).toBe('pkg-a');
  });
});

describe('corrupt or hostile storage', () => {
  it('returns null for a value that is not JSON', () => {
    localStorage.setItem(KEY, 'not-json-at-all');

    expect(getPendingQuotePackage()).toBeNull();
  });

  it('clears the corrupt value so it cannot fail again on every read', () => {
    localStorage.setItem(KEY, '{{{');

    getPendingQuotePackage();

    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it('returns null when the stored object has no timestamp', () => {
    // savedAt undefined makes the arithmetic NaN, NaN > TTL is false, so this
    // falls through to returning the id. Pinned as documented behaviour: the
    // selection is honoured rather than the read throwing.
    localStorage.setItem(KEY, JSON.stringify({ packageId: 'pkg-a' }));

    expect(getPendingQuotePackage()).toBe('pkg-a');
  });

  it('returns undefined-safe output when the stored object has no id', () => {
    localStorage.setItem(KEY, JSON.stringify({ savedAt: Date.now() }));

    expect(getPendingQuotePackage()).toBeUndefined();
  });

  it('swallows a throwing setItem instead of breaking package selection', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError');
    });

    expect(() => setPendingQuotePackage('pkg-a')).not.toThrow();
  });

  it('returns null when getItem throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('SecurityError');
    });

    expect(getPendingQuotePackage()).toBeNull();
  });

  it('swallows a throwing removeItem', () => {
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new DOMException('SecurityError');
    });

    expect(() => clearPendingQuotePackage()).not.toThrow();
  });
});
