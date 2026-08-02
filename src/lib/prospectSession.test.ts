import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  clearProspectSession,
  getProspectSession,
  resolveProspect,
  saveProspectSession,
} from './prospectSession';

/**
 * The prospect session is what makes the funnel survive its two trips off our
 * origin (Calendly, then Stripe). Every failure here looks the same to the
 * visitor: they come back from paying and the site does not know who they are.
 */

const VALID = {
  prospectId: '4f1a5c2e-0000-4000-8000-000000000000',
  humanRef: 'MP-7F3K9A',
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  party: 'applicant' as const,
};

beforeEach(() => {
  localStorage.clear();
  vi.useRealTimers();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('round trip', () => {
  it('saves and reads back the identity', () => {
    saveProspectSession(VALID);
    expect(getProspectSession()).toMatchObject(VALID);
  });

  it('stamps the save time so it can expire', () => {
    saveProspectSession(VALID);
    expect(getProspectSession()?.savedAt).toBeTypeOf('number');
  });

  it('returns null when nothing was ever saved', () => {
    expect(getProspectSession()).toBeNull();
  });

  it('clears on demand', () => {
    saveProspectSession(VALID);
    clearProspectSession();
    expect(getProspectSession()).toBeNull();
  });
});

describe('what is stored', () => {
  it('never persists questionnaire answers', () => {
    // Shared devices are the norm at the low end of this funnel. The id and
    // reference are recoverable; someone's visa history is not.
    saveProspectSession(VALID);
    const raw = localStorage.getItem('migrationpath.prospect') ?? '';
    expect(raw).not.toMatch(/occupation|salary|english|health/i);
  });
});

describe('expiry', () => {
  it('keeps a session that is within the window', () => {
    vi.useFakeTimers();
    saveProspectSession(VALID);
    vi.advanceTimersByTime(6 * 24 * 60 * 60 * 1000); // 6 days
    expect(getProspectSession()).not.toBeNull();
  });

  it('drops a session past the window, and evicts it', () => {
    vi.useFakeTimers();
    saveProspectSession(VALID);
    vi.advanceTimersByTime(8 * 24 * 60 * 60 * 1000); // 8 days
    expect(getProspectSession()).toBeNull();
    // Not just hidden — actually removed, so a stale prospect does not linger
    // on a shared machine.
    expect(localStorage.getItem('migrationpath.prospect')).toBeNull();
  });
});

describe('corrupt storage', () => {
  it('survives unparseable JSON and cleans it up', () => {
    localStorage.setItem('migrationpath.prospect', '{not json');
    expect(getProspectSession()).toBeNull();
    expect(localStorage.getItem('migrationpath.prospect')).toBeNull();
  });

  it('rejects a well-formed object that is missing the identity', () => {
    // A half-written record is worse than none: it would send the book page
    // into a state where it thinks it has a prospect and cannot use it.
    localStorage.setItem(
      'migrationpath.prospect',
      JSON.stringify({ name: 'Ada', savedAt: Date.now() }),
    );
    expect(getProspectSession()).toBeNull();
  });

  it('does not throw when localStorage is unavailable', () => {
    // Private browsing and full-storage both throw on setItem. Losing
    // persistence is acceptable; crashing the result screen is not.
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    expect(() => saveProspectSession(VALID)).not.toThrow();
  });

  it('does not throw when reading is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    expect(() => getProspectSession()).not.toThrow();
    expect(getProspectSession()).toBeNull();
  });
});

describe('resolveProspect precedence', () => {
  it('prefers the URL over storage', () => {
    // If someone opens their confirmation link in a different browser, or
    // forwards it, the query string is the identity they meant.
    saveProspectSession(VALID);
    const resolved = resolveProspect(
      '?prospect_id=aaaaaaaa-0000-4000-8000-000000000000&ref=MP-OTHER1',
    );
    expect(resolved.prospectId).toBe('aaaaaaaa-0000-4000-8000-000000000000');
    expect(resolved.humanRef).toBe('MP-OTHER1');
  });

  it('falls back to storage when the URL is bare', () => {
    saveProspectSession(VALID);
    const resolved = resolveProspect('');
    expect(resolved.prospectId).toBe(VALID.prospectId);
    expect(resolved.humanRef).toBe(VALID.humanRef);
  });

  it('accepts the shorter ?prospect= alias', () => {
    const resolved = resolveProspect('?prospect=abc&ref=MP-1');
    expect(resolved.prospectId).toBe('abc');
  });

  it('mixes URL ref with stored id when only one is on the link', () => {
    saveProspectSession(VALID);
    const resolved = resolveProspect('?ref=MP-OTHER1');
    expect(resolved.prospectId).toBe(VALID.prospectId);
    expect(resolved.humanRef).toBe('MP-OTHER1');
  });

  it('reports nulls for a cold visitor rather than throwing', () => {
    const resolved = resolveProspect('');
    expect(resolved.prospectId).toBeNull();
    expect(resolved.humanRef).toBeNull();
    expect(resolved.session).toBeNull();
  });
});
