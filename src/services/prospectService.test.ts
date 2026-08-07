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

const { prospectService } = await import('./prospectService');
import type { CaptureProspectPayload } from './prospectService';

/**
 * Lightweight prospect capture — the funnel spine.
 *
 * This is the endpoint every non-questionnaire surface uses to put a person
 * on the board: the points calculator, the partner tool, anything without its
 * own eligibility engine. It returns no verdict, and the tests below check
 * that it stays that way; a caller that starts expecting an eligibility field
 * here is a caller that should have used preScreenService instead.
 *
 * The consent flag is the one that carries legal weight. It must reach the
 * server exactly as the visitor set it — a `false` that gets dropped rather
 * than sent is indistinguishable server-side from a form that never asked.
 */

function payload(
  overrides: Partial<CaptureProspectPayload> = {},
): CaptureProspectPayload {
  return {
    full_name: 'Mina Rahimi',
    email: 'mina@example.com',
    consent_given: true,
    source: 'points_calculator',
    ...overrides,
  };
}

const RESULT = {
  prospect_id: 'prs_123',
  human_ref: 'MP-7F3K9A',
  stage: 'captured',
};

beforeEach(() => {
  post.mockReset();
});

describe('capture', () => {
  it('posts to /prospects, not the pre-screen engine', async () => {
    // /pre-screen runs the engine and returns a verdict. Sending calculator
    // leads there would produce an eligibility result nobody asked for.
    post.mockResolvedValue(RESULT);

    await prospectService.capture(payload());

    expect(post.mock.calls[0][0]).toBe('/prospects');
  });

  it('sends the payload through unchanged', async () => {
    post.mockResolvedValue(RESULT);
    const body = payload({ phone: '+61400000000', visa_interest: 'subclass_189' });

    await prospectService.capture(body);

    expect(post.mock.calls[0][1]).toEqual(body);
  });

  it('sends consent_given: false rather than omitting it', async () => {
    post.mockResolvedValue(RESULT);

    await prospectService.capture(payload({ consent_given: false }));

    const sent = post.mock.calls[0][1] as CaptureProspectPayload;
    expect(sent).toHaveProperty('consent_given');
    expect(sent.consent_given).toBe(false);
  });

  it('carries the consent text so the notice shown can be reconstructed', async () => {
    post.mockResolvedValue(RESULT);
    const text = 'I agree to be contacted about my migration options.';

    await prospectService.capture(payload({ consent_text: text }));

    expect((post.mock.calls[0][1] as CaptureProspectPayload).consent_text).toBe(
      text,
    );
  });

  it('tags the originating surface so leads can be told apart in the queue', async () => {
    post.mockResolvedValue(RESULT);

    await prospectService.capture(payload({ source: 'partner_tool' }));

    expect((post.mock.calls[0][1] as CaptureProspectPayload).source).toBe(
      'partner_tool',
    );
  });

  it('forwards calculator answers verbatim for the agent to read', async () => {
    post.mockResolvedValue(RESULT);
    const answers = { age: 31, englishLevel: 'proficient', totalPoints: 75 };

    await prospectService.capture(payload({ answers }));

    expect((post.mock.calls[0][1] as CaptureProspectPayload).answers).toEqual(
      answers,
    );
  });

  it('preserves a nested answers structure without flattening it', async () => {
    post.mockResolvedValue(RESULT);
    const answers = { profile: { age: 31 }, breakdown: { age: 30, english: 10 } };

    await prospectService.capture(payload({ answers }));

    expect((post.mock.calls[0][1] as CaptureProspectPayload).answers).toEqual(
      answers,
    );
  });

  it('returns a bare result unchanged', async () => {
    post.mockResolvedValue(RESULT);

    await expect(prospectService.capture(payload())).resolves.toEqual(RESULT);
  });

  it('unwraps a { data } envelope', async () => {
    post.mockResolvedValue({ success: true, data: RESULT });

    await expect(prospectService.capture(payload())).resolves.toEqual(RESULT);
  });

  it('returns the human reference the confirmation page needs to poll with', async () => {
    post.mockResolvedValue(RESULT);

    const res = await prospectService.capture(payload());

    expect(res.human_ref).toBe('MP-7F3K9A');
    expect(res.prospect_id).toBe('prs_123');
  });

  it('propagates a capture failure so the form can keep the visitor’s input', async () => {
    post.mockRejectedValue(new Error('Network error. Please check your connection.'));

    await expect(prospectService.capture(payload())).rejects.toThrow(
      /Network error/,
    );
  });
});
