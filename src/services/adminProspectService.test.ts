import { describe, it, expect, beforeEach, vi } from 'vitest';

const get = vi.fn();
const patch = vi.fn();
vi.mock('@/lib/apiClient', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/apiClient')>()),
  apiClient: {
    get: (...a: unknown[]) => get(...a),
    patch: (...a: unknown[]) => patch(...a),
  },
}));

const { adminProspectService } = await import('./adminProspectService');

const ROW = {
  id: 'p1',
  human_ref: 'MP-7F3K9A',
  party: 'business',
  full_name: 'Grace Hopper',
  email: 'grace@acme.example',
  stage: 'pre_screened',
  statutory_eligible: true,
  client_fit: true,
  source: 'pre_screen_business',
  consent_given: true,
  created_at: '2026-08-01T00:00:00.000Z',
  updated_at: '2026-08-01T00:00:00.000Z',
};

/** The real envelope: `{success, data}` around `{data, total, page, …}`. */
function page(rows: unknown[], meta: Record<string, unknown> = {}) {
  return {
    success: true,
    data: { data: rows, total: rows.length, page: 1, limit: 20, totalPages: 1, ...meta },
  };
}

describe('adminProspectService.list', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    get.mockResolvedValue(page([ROW]));
  });

  it('reads rows and pagination out of the double-wrapped response', async () => {
    get.mockResolvedValue(page([ROW], { total: 41, page: 2, totalPages: 3 }));
    const result = await adminProspectService.list({ page: 2 });

    expect(result.data).toHaveLength(1);
    expect(result.data[0].human_ref).toBe('MP-7F3K9A');
    expect(result.total).toBe(41);
    expect(result.totalPages).toBe(3);
  });

  it('omits filters that are unset rather than sending empty values', async () => {
    // The backend builds its where clause from whatever arrives, so an empty
    // stage would filter every row out instead of meaning "any stage".
    await adminProspectService.list({ page: 1 });
    expect(get).toHaveBeenCalledWith('/prospects', {
      params: { page: 1, limit: 20 },
    });
  });

  it('passes stage and party through when they are set', async () => {
    await adminProspectService.list({ stage: 'booked', party: 'business' });
    expect(get).toHaveBeenCalledWith('/prospects', {
      params: { page: 1, limit: 20, stage: 'booked', party: 'business' },
    });
  });

  it('returns an array when the payload is an unexpected shape', async () => {
    get.mockResolvedValue({ success: true, data: { total: 0 } });
    const result = await adminProspectService.list();
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data).toEqual([]);
  });
});

describe('adminProspectService detail + stage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('unwraps the prep view envelope', async () => {
    get.mockResolvedValue({
      success: true,
      data: { prospect: ROW, summary: { answers: { age: '32' } } },
    });

    const view = await adminProspectService.getPrepView('p1');
    expect(view.prospect.human_ref).toBe('MP-7F3K9A');
    expect(view.summary?.answers).toEqual({ age: '32' });
  });

  it('encodes the reference so a quoted ref cannot break the path', async () => {
    get.mockResolvedValue({ success: true, data: ROW });
    await adminProspectService.getByRef('MP 7F3/K9A');
    expect(get).toHaveBeenCalledWith('/prospects/ref/MP%207F3%2FK9A');
  });

  it('sends the stage change as the backend expects', async () => {
    patch.mockResolvedValue({ success: true, data: { ...ROW, stage: 'booked' } });
    const updated = await adminProspectService.advanceStage('p1', 'booked');

    expect(patch).toHaveBeenCalledWith('/prospects/p1/stage', {
      stage: 'booked',
    });
    expect(updated.stage).toBe('booked');
  });
});
