import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

const get = vi.fn();
// Only the transport is stubbed. `unwrapArray` is the code under test here, so
// it has to be the real one.
vi.mock('@/lib/apiClient', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/apiClient')>()),
  apiClient: { get: (...args: unknown[]) => get(...args) },
}));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));

const { useAdminUsers } = await import('./useAdminUsers');

/**
 * `GET /users` comes back wrapped twice — the API-wide `{ success, data }`
 * envelope around the endpoint's own `{ data, total }` pagination object. The
 * admin dashboard calls `.filter` and `.slice` on whatever this hook returns,
 * so anything other than an array here is a white screen, not a bad number.
 */

const ROWS = [
  { id: '1', full_name: 'Ada', persona_type: 'skilled' },
  { id: '2', full_name: 'Grace', persona_type: 'employer' },
];

describe('useAdminUsers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('reads the rows out of the real double-wrapped response', async () => {
    get.mockResolvedValue({
      success: true,
      data: { data: ROWS, total: 2, page: 1, limit: 100, totalPages: 1 },
    });

    const { result } = renderHook(() => useAdminUsers());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.users).toEqual(ROWS);
  });

  it.each([
    ['a bare array', ROWS],
    ['a single wrap', { data: ROWS }],
    ['a double wrap', { success: true, data: { data: ROWS } }],
  ])('tolerates %s', async (_label, payload) => {
    get.mockResolvedValue(payload);

    const { result } = renderHook(() => useAdminUsers());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.users).toEqual(ROWS);
  });

  it('returns an array when the payload is an unexpected shape', async () => {
    // The bug this replaces handed the pagination OBJECT to the component,
    // which then died on `.filter`. Degrading to empty keeps the page up.
    get.mockResolvedValue({ success: true, data: { total: 0, page: 1 } });

    const { result } = renderHook(() => useAdminUsers());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(Array.isArray(result.current.users)).toBe(true);
    expect(result.current.users).toEqual([]);
  });

  it('surfaces a failed request instead of showing it as zero users', async () => {
    get.mockRejectedValue(new Error('Session expired'));

    const { result } = renderHook(() => useAdminUsers());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.users).toEqual([]);
    expect(result.current.error).toBe('Session expired');
  });
});
