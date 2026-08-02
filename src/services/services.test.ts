import { describe, it, expect, beforeEach, vi } from 'vitest';

const get = vi.fn();
const post = vi.fn();
const put = vi.fn();
vi.mock('@/lib/apiClient', () => ({
  apiClient: {
    get: (...a: unknown[]) => get(...a),
    post: (...a: unknown[]) => post(...a),
    put: (...a: unknown[]) => put(...a),
    patch: vi.fn(),
    delete: vi.fn(),
  },
  setSuppressAuthRedirect: vi.fn(),
}));

const { pricingService } = await import('./pricingService');
const { siteConfigService } = await import('./siteConfigService');
const { occupationService } = await import('./occupationService');

/**
 * The service layer's shared problem: response envelopes.
 *
 * The API sometimes returns `{ success, data }` and sometimes the payload
 * bare, depending on the endpoint and whether an interceptor has already
 * unwrapped it. Every service re-implements the unwrapping, so every service
 * gets the chance to get it wrong — and when one does, the symptom is a page
 * rendering `undefined` rather than an error anyone can trace.
 *
 * These tests hit each unwrapper with both shapes.
 */

beforeEach(() => {
  get.mockReset();
  post.mockReset();
  put.mockReset();
});

const PACKAGE = { id: 'pkg-1', name: 'Standard', price: 2500 };

describe('pricingService', () => {
  it('unwraps a { success, data } envelope', async () => {
    get.mockResolvedValue({ success: true, data: [PACKAGE] });
    await expect(pricingService.getPackages()).resolves.toEqual([PACKAGE]);
  });

  it('accepts a bare array', async () => {
    get.mockResolvedValue([PACKAGE]);
    await expect(pricingService.getPackages()).resolves.toEqual([PACKAGE]);
  });

  it('sends the package id and notes when creating a quote', async () => {
    post.mockResolvedValue({ data: { id: 'quote-1' } });

    await pricingService.createQuote('pkg-1', 'please hurry');

    expect(post.mock.calls[0][1]).toEqual({
      package_id: 'pkg-1',
      custom_notes: 'please hurry',
    });
  });

  it('omits notes cleanly when none are given', async () => {
    post.mockResolvedValue({ data: { id: 'quote-1' } });
    await pricingService.createQuote('pkg-1');
    expect(post.mock.calls[0][1].custom_notes).toBeUndefined();
  });

  it('unwraps the created quote', async () => {
    post.mockResolvedValue({ success: true, data: { id: 'quote-1' } });
    await expect(pricingService.createQuote('pkg-1')).resolves.toEqual({
      id: 'quote-1',
    });
  });
});

describe('siteConfigService', () => {
  const CONFIG = { site_name: 'MigrationPath', contact_email: 'hi@example.com' };

  it('unwraps the admin config', async () => {
    get.mockResolvedValue({ success: true, data: CONFIG });
    await expect(siteConfigService.getConfig()).resolves.toEqual(CONFIG);
  });

  it('accepts a bare config object', async () => {
    get.mockResolvedValue(CONFIG);
    await expect(siteConfigService.getConfig()).resolves.toEqual(CONFIG);
  });

  it('reads public config from the public route', async () => {
    // The distinction matters: the admin route is guarded, and calling it from
    // a public page 401s every anonymous visitor.
    get.mockResolvedValue(CONFIG);
    await siteConfigService.getPublicConfig();
    expect(get.mock.calls[0][0]).toContain('/public/site-config');
  });

  it('sends updates to the admin route', async () => {
    put.mockResolvedValue({ data: CONFIG });
    await siteConfigService.updateConfig(CONFIG as never);
    expect(put.mock.calls[0][0]).toContain('/admin/site-config');
    expect(put.mock.calls[0][1]).toEqual(CONFIG);
  });
});

describe('occupationService', () => {
  it('fetches a single occupation by code', async () => {
    get.mockResolvedValue({ anzsco_code: '261313' });
    await occupationService.getOccupation('261313');
    expect(get.mock.calls[0][0]).toContain('261313');
  });

  it('passes paging as query params, not in the path', async () => {
    // Axios params, so the page number never appears in the URL string —
    // asserting on the URL here would be testing the wrong thing.
    get.mockResolvedValue({ data: [], total: 0 });
    await occupationService.listOccupations(3, 50);

    expect(get.mock.calls[0][1]).toEqual({ params: { page: 3, limit: 50 } });
  });

  it('defaults to the first page of twenty', async () => {
    get.mockResolvedValue({ data: [], total: 0 });
    await occupationService.listOccupations();
    expect(get.mock.calls[0][1]).toEqual({ params: { page: 1, limit: 20 } });
  });

  it('forwards search params rather than building a query string by hand', async () => {
    get.mockResolvedValue({ data: [] });
    await occupationService.searchOccupations({
      q: 'engineer',
      state_code: 'NSW',
    } as never);

    expect(get.mock.calls[0][1]).toEqual({
      params: { q: 'engineer', state_code: 'NSW' },
    });
  });

  it('propagates a failed search to the caller', async () => {
    // Worth pinning: the service wraps this call in a try/catch that only
    // rethrows, which reads as if errors are handled somewhere. They are not —
    // the caller owns them, and the search UI has to.
    get.mockRejectedValue(new Error('offline'));

    await expect(
      occupationService.searchOccupations({ q: 'engineer' } as never),
    ).rejects.toThrow('offline');
  });
});
