import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

const calculateTotal = vi.fn();
vi.mock('@/services/pointsService', () => ({
  pointsService: {
    calculateTotal: (...args: unknown[]) => calculateTotal(...args),
  },
}));

const { useStructuredPoints } = await import('./useStructuredPoints');
import type { UserProfileInput } from '@/services/pointsService';

/**
 * The calculator's recompute loop.
 *
 * Two things about it are load-bearing and neither is visible in the return
 * value: the 300ms debounce (a slider drag would otherwise fire a request per
 * pixel) and the `enabled` gate (an incomplete profile scores as though the
 * missing answers were "none", which shows a confidently wrong low total).
 *
 * The debounce is tested with fake timers. React Query's own async work still
 * needs real microtask turns, so the pattern here is: advance timers inside
 * `act`, then `waitFor` the query.
 */

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return React.createElement(QueryClientProvider, { client }, children);
}

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

const RESULT = {
  totalPoints: 75,
  breakdown: { age: 30 },
  workCapApplied: false,
  belowPassMark: false,
};

beforeEach(() => {
  calculateTotal.mockReset();
  calculateTotal.mockResolvedValue(RESULT);
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.useRealTimers();
});

async function settle(ms = 350) {
  await act(async () => {
    vi.advanceTimersByTime(ms);
  });
}

describe('gating', () => {
  it('calculates immediately on mount when the profile is already complete', async () => {
    // `debounced` is seeded from the initial profile, so a page loaded with a
    // restored or prefilled profile scores straight away. The debounce governs
    // edits, not first paint — a 300ms blank total on load would be a
    // regression, not a fix.
    const { result } = renderHook(() => useStructuredPoints(profile()), {
      wrapper,
    });

    await waitFor(() => expect(result.current.result).toEqual(RESULT));
    expect(calculateTotal).toHaveBeenCalledTimes(1);
  });

  it('calculates once the profile is complete and the debounce settles', async () => {
    const { result } = renderHook(() => useStructuredPoints(profile()), {
      wrapper,
    });

    await settle();
    await waitFor(() => expect(result.current.result).toEqual(RESULT));
    expect(calculateTotal).toHaveBeenCalledTimes(1);
  });

  it('stays idle for an under-18 age rather than scoring an ineligible profile', async () => {
    renderHook(() => useStructuredPoints(profile({ age: 17 })), { wrapper });

    await settle();

    expect(calculateTotal).not.toHaveBeenCalled();
  });

  it('stays idle when age is not a finite number', async () => {
    renderHook(() => useStructuredPoints(profile({ age: NaN })), { wrapper });

    await settle();

    expect(calculateTotal).not.toHaveBeenCalled();
  });

  it('stays idle until an english level is chosen', async () => {
    renderHook(
      () =>
        useStructuredPoints(
          profile({ englishLevel: undefined as unknown as 'proficient' }),
        ),
      { wrapper },
    );

    await settle();

    expect(calculateTotal).not.toHaveBeenCalled();
  });

  it('stays idle until a qualification is chosen', async () => {
    renderHook(
      () =>
        useStructuredPoints(
          profile({ qualification: undefined as unknown as 'doctorate' }),
        ),
      { wrapper },
    );

    await settle();

    expect(calculateTotal).not.toHaveBeenCalled();
  });

  it('starts calculating as soon as the last missing answer arrives', async () => {
    const { rerender } = renderHook(
      (p: UserProfileInput) => useStructuredPoints(p),
      {
        wrapper,
        initialProps: profile({
          qualification: undefined as unknown as 'doctorate',
        }),
      },
    );

    await settle();
    expect(calculateTotal).not.toHaveBeenCalled();

    rerender(profile());
    await settle();

    await waitFor(() => expect(calculateTotal).toHaveBeenCalledTimes(1));
  });
});

describe('debounce', () => {
  it('collapses a burst of edits into a single extra request', async () => {
    const { rerender } = renderHook(
      (p: UserProfileInput) => useStructuredPoints(p),
      { wrapper, initialProps: profile({ age: 25 }) },
    );

    await waitFor(() => expect(calculateTotal).toHaveBeenCalledTimes(1));

    // A slider dragged across four values inside the debounce window.
    // Undebounced, that is four more requests; debounced, it is one.
    for (const age of [26, 27, 28, 29]) {
      rerender(profile({ age }));
      await act(async () => {
        vi.advanceTimersByTime(50);
      });
    }
    await settle();

    await waitFor(() => expect(calculateTotal).toHaveBeenCalledTimes(2));
  });

  it('scores the final value of a burst, not an intermediate one', async () => {
    const { rerender } = renderHook(
      (p: UserProfileInput) => useStructuredPoints(p),
      { wrapper, initialProps: profile({ age: 25 }) },
    );

    for (const age of [26, 27, 28, 29]) {
      rerender(profile({ age }));
      await act(async () => {
        vi.advanceTimersByTime(50);
      });
    }
    await settle();

    await waitFor(() => expect(calculateTotal).toHaveBeenCalled());
    const sent = calculateTotal.mock.calls.at(-1)?.[0] as UserProfileInput;
    expect(sent.age).toBe(29);
  });

  it('recalculates when a settled edit changes the profile', async () => {
    const { rerender } = renderHook(
      (p: UserProfileInput) => useStructuredPoints(p),
      { wrapper, initialProps: profile({ age: 31 }) },
    );

    await settle();
    await waitFor(() => expect(calculateTotal).toHaveBeenCalledTimes(1));

    rerender(profile({ age: 40 }));
    await settle();

    await waitFor(() => expect(calculateTotal).toHaveBeenCalledTimes(2));
  });
});

describe('reporting', () => {
  it('reports an error message rather than an error object', async () => {
    calculateTotal.mockRejectedValue(new Error('Server error. Please try again later.'));

    const { result } = renderHook(() => useStructuredPoints(profile()), {
      wrapper,
    });
    await settle();

    await waitFor(() => expect(result.current.error).toMatch(/Server error/));
  });

  it('reports no error on a clean calculation', async () => {
    const { result } = renderHook(() => useStructuredPoints(profile()), {
      wrapper,
    });
    await settle();

    await waitFor(() => expect(result.current.result).toEqual(RESULT));
    expect(result.current.error).toBeNull();
  });

  it('settles isCalculating to false once the result lands', async () => {
    const { result } = renderHook(() => useStructuredPoints(profile()), {
      wrapper,
    });
    await settle();

    await waitFor(() => expect(result.current.isCalculating).toBe(false));
    expect(result.current.result).toEqual(RESULT);
  });
});
