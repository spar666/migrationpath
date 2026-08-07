import { describe, it, expect, beforeEach, vi } from 'vitest';

const post = vi.fn();
vi.mock('@/lib/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: (...args: unknown[]) => post(...args),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

const { pointsService } = await import('./pointsService');
import type { UserProfileInput, StructuredPointsResult } from './pointsService';

/**
 * The points score is the number the whole skilled funnel is judged on.
 *
 * Two failure modes matter here and neither throws:
 *
 *   1. The envelope. The endpoint sometimes answers bare and sometimes wrapped
 *      in { data }. Unwrap the wrong one and the calculator renders a total of
 *      `undefined` — which reads to the visitor as "0 points" and to us as a
 *      silent bug.
 *   2. Field drop. The profile is posted verbatim; anything the client forgets
 *      to send is scored as absent server-side, and a missing
 *      `australianWorkYears` quietly costs the visitor real points.
 *
 * These tests pin both.
 */

function profile(overrides: Partial<UserProfileInput> = {}): UserProfileInput {
  return {
    age: 31,
    englishLevel: 'proficient',
    qualification: 'bachelor_masters',
    overseasWorkYears: 5,
    australianWorkYears: 2,
    ...overrides,
  };
}

function result(
  overrides: Partial<StructuredPointsResult> = {},
): StructuredPointsResult {
  return {
    totalPoints: 75,
    breakdown: { age: 30, english: 10, qualification: 15, work: 20 },
    workCapApplied: false,
    belowPassMark: false,
    ...overrides,
  };
}

beforeEach(() => {
  post.mockReset();
});

describe('calculateTotal', () => {
  it('posts to the aggregate endpoint, not a per-factor one', async () => {
    post.mockResolvedValue(result());

    await pointsService.calculateTotal(profile());

    expect(post.mock.calls[0][0]).toBe('/points/calculate/total');
  });

  it('sends the profile through untouched so no factor is silently dropped', async () => {
    post.mockResolvedValue(result());
    const input = profile({ visaGroup: 'skilled', regionalStudy: true });

    await pointsService.calculateTotal(input);

    expect(post.mock.calls[0][1]).toEqual(input);
  });

  it('sends a zero work year value rather than omitting it', async () => {
    post.mockResolvedValue(result());

    await pointsService.calculateTotal(
      profile({ overseasWorkYears: 0, australianWorkYears: 0 }),
    );

    const sent = post.mock.calls[0][1] as UserProfileInput;
    expect(sent.overseasWorkYears).toBe(0);
    expect(sent.australianWorkYears).toBe(0);
  });

  it('returns a bare result unchanged', async () => {
    const bare = result();
    post.mockResolvedValue(bare);

    await expect(pointsService.calculateTotal(profile())).resolves.toEqual(bare);
  });

  it('unwraps a { data } envelope', async () => {
    const inner = result();
    post.mockResolvedValue({ success: true, data: inner });

    await expect(pointsService.calculateTotal(profile())).resolves.toEqual(inner);
  });

  it('prefers the bare shape when a payload has both totalPoints and data', async () => {
    // A result that happens to carry a nested `data` field must not be
    // mistaken for an envelope — that would replace a real score with a
    // fragment of itself.
    const ambiguous = { ...result(), data: { totalPoints: 0 } };
    post.mockResolvedValue(ambiguous);

    const res = await pointsService.calculateTotal(profile());

    expect(res.totalPoints).toBe(75);
  });

  it('preserves a zero total instead of treating it as missing', async () => {
    post.mockResolvedValue(result({ totalPoints: 0, belowPassMark: true }));

    const res = await pointsService.calculateTotal(profile());

    expect(res.totalPoints).toBe(0);
    expect(res.belowPassMark).toBe(true);
  });

  it('carries the work cap flag through so the UI can explain a capped score', async () => {
    post.mockResolvedValue(
      result({ totalPoints: 65, workCapApplied: true }),
    );

    const res = await pointsService.calculateTotal(
      profile({ overseasWorkYears: 20 }),
    );

    expect(res.workCapApplied).toBe(true);
  });

  it('carries the ineligibility reason rather than flattening it to a bare zero', async () => {
    post.mockResolvedValue(
      result({
        totalPoints: 0,
        belowPassMark: true,
        ineligibilityReason: 'Over the maximum age for a points-tested visa.',
      }),
    );

    const res = await pointsService.calculateTotal(profile({ age: 48 }));

    expect(res.ineligibilityReason).toMatch(/age/i);
  });

  it('keeps the breakdown so a total can always be justified line by line', async () => {
    post.mockResolvedValue(result());

    const res = await pointsService.calculateTotal(profile());

    expect(res.breakdown).toEqual({
      age: 30,
      english: 10,
      qualification: 15,
      work: 20,
    });
  });

  it('propagates a failure instead of resolving to a wrong score', async () => {
    post.mockRejectedValue(new Error('Server error. Please try again later.'));

    await expect(pointsService.calculateTotal(profile())).rejects.toThrow(
      /Server error/,
    );
  });
});
