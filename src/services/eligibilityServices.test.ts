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

const { partnerEligibilityService } = await import('./partnerEligibilityService');
import type { PartnerEligibilityResult } from './partnerEligibilityService';
import { CONSENT_NOTICE } from '@/components/partner/eligibility/formDefinition';

/**
 * The verdict engine: partner eligibility.
 *
 * It answers a question the visitor will act on — whether to pay for a
 * consult. A verdict that arrives mangled is worse than one that fails to
 * arrive, because a mangled one still renders. So the tests below care less
 * about the happy path than about the shapes that quietly degrade: a missing
 * envelope, a falsy-but-real flag, a dropped negative outcome.
 *
 * Note the asymmetry: showing "eligible" to someone who is not is the
 * expensive direction, so `false` and `ineligible` are pinned harder than
 * their opposites.
 *
 * The parent-audit engine used to be tested alongside this one. It went with
 * the parent funnel.
 */

beforeEach(() => {
  post.mockReset();
});

function partnerResult(
  overrides: Partial<PartnerEligibilityResult> = {},
): PartnerEligibilityResult {
  return {
    id: 'pe-1',
    applicantFirstName: 'Mina',
    sponsorFirstName: 'Tom',
    outcome: 'eligible',
    summary: 'Looks straightforward on the facts given.',
    effort: 'standard',
    highRisk: false,
    becomingEligible: false,
    ineligible: false,
    prospect_id: 'prs_1',
    human_ref: 'MP-7F3K9A',
    can_book: true,
    ...overrides,
  };
}

describe('partnerEligibilityService.submit', () => {
  const answers = {
    applicantFirstName: 'Mina',
    sponsorFirstName: 'Tom',
    applicantCountry: 'Australia',
    relationshipType: 'Married',
    livedTogether: 'Yes, 2 years or more',
  };

  it('posts the answers to the partner eligibility route', async () => {
    post.mockResolvedValue(partnerResult());

    await partnerEligibilityService.submit(answers);

    expect(post.mock.calls[0][0]).toBe('/partner/eligibility');
  });

  it('submits the answers as given without reshaping them', async () => {
    // The engine keys off exact field ids; a rename on the way out is
    // indistinguishable server-side from an unanswered question. Consent is
    // the one documented exception — see the next two tests.
    post.mockResolvedValue(partnerResult());

    await partnerEligibilityService.submit(answers);

    expect(post.mock.calls[0][1]).toMatchObject(answers);
  });

  it('translates a ticked consent box into the API consent fields', async () => {
    // The form stores the notice text rather than a boolean so what was shown
    // and what is stored cannot drift. The API wants them as separate fields,
    // and the backend rejects a submission without consent_given.
    post.mockResolvedValue(partnerResult());

    await partnerEligibilityService.submit({
      ...answers,
      consent: CONSENT_NOTICE,
    });

    const body = post.mock.calls[0][1] as Record<string, unknown>;
    expect(body.consent_given).toBe(true);
    expect(body.consent_text).toBe(CONSENT_NOTICE);
  });

  it('does not claim consent when the box was not ticked', async () => {
    post.mockResolvedValue(partnerResult());

    await partnerEligibilityService.submit(answers);

    const body = post.mock.calls[0][1] as Record<string, unknown>;
    expect(body.consent_given).toBe(false);
    expect(body.consent_text).toBeUndefined();
  });

  it('preserves multi-select array answers', async () => {
    post.mockResolvedValue(partnerResult());
    const withArray = { ...answers, evidence: ['Joint lease', 'Shared account'] };

    await partnerEligibilityService.submit(withArray);

    expect((post.mock.calls[0][1] as typeof withArray).evidence).toEqual([
      'Joint lease',
      'Shared account',
    ]);
  });

  it('returns a bare result unchanged', async () => {
    const bare = partnerResult();
    post.mockResolvedValue(bare);

    await expect(partnerEligibilityService.submit(answers)).resolves.toEqual(bare);
  });

  it('unwraps a { data } envelope', async () => {
    const inner = partnerResult();
    post.mockResolvedValue({ success: true, data: inner });

    await expect(partnerEligibilityService.submit(answers)).resolves.toEqual(inner);
  });

  it('carries an ineligible verdict through intact', async () => {
    post.mockResolvedValue(
      partnerResult({
        outcome: 'ineligible',
        ineligible: true,
        summary: 'A sponsorship bar applies on the facts given.',
      }),
    );

    const res = await partnerEligibilityService.submit(answers);

    expect(res.outcome).toBe('ineligible');
    expect(res.ineligible).toBe(true);
  });

  it('keeps the high-effort outcome distinct from a clean eligible one', async () => {
    // 'high_effort' means billable-but-winnable. Collapsing it into
    // 'eligible' sets the visitor up for a quote they did not expect.
    post.mockResolvedValue(
      partnerResult({ outcome: 'high_effort', effort: 'substantial', highRisk: true }),
    );

    const res = await partnerEligibilityService.submit(answers);

    expect(res.outcome).toBe('high_effort');
    expect(res.highRisk).toBe(true);
  });

  it('does not invent a risk flag when the engine says false', async () => {
    post.mockResolvedValue(partnerResult({ highRisk: false }));

    const res = await partnerEligibilityService.submit(answers);

    expect(res.highRisk).toBe(false);
  });

  it('propagates a submission failure to the caller', async () => {
    post.mockRejectedValue(new Error('Network error. Please check your connection.'));

    await expect(partnerEligibilityService.submit(answers)).rejects.toThrow(
      /Network error/,
    );
  });
});
