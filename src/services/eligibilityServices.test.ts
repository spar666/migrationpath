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
const { parentService } = await import('./parentService');
import type { PartnerEligibilityResult } from './partnerEligibilityService';
import { CONSENT_NOTICE } from '@/components/partner/eligibility/formDefinition';
import type { ParentAuditResult, ParentProfileInput } from './parentService';

/**
 * The two verdict engines: partner eligibility and the parent audit.
 *
 * Both answer a question the visitor will act on — whether to pay for a
 * consult, whether to keep waiting for a parent visa. A verdict that arrives
 * mangled is worse than one that fails to arrive, because a mangled one still
 * renders. So the tests below care less about the happy path than about the
 * shapes that quietly degrade: a missing envelope, a falsy-but-real flag, a
 * dropped negative outcome.
 *
 * Note the asymmetry that runs through both suites: showing "eligible" to
 * someone who is not is the expensive direction, so `false` and `ineligible`
 * are pinned harder than their opposites.
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

function parentProfile(
  overrides: Partial<ParentProfileInput> = {},
): ParentProfileInput {
  return {
    sponsorStatus: 'citizen',
    sponsorMonthsInAustralia: 30,
    totalChildren: 3,
    childrenInAustralia: 2,
    childrenInLargestOtherCountry: 1,
    sponsorTaxableIncome: 95_000,
    parentAge: 67,
    ...overrides,
  };
}

function parentAudit(
  overrides: Partial<ParentAuditResult> = {},
): ParentAuditResult {
  return {
    auditId: 'pa-1',
    isEligible: true,
    status: 'LEGALLY_ELIGIBLE',
    balanceOfFamily: {
      childrenInAustralia: 2,
      totalChildren: 3,
      percentage: 66.67,
      pass: true,
      alternativeLimbPass: true,
    },
    sponsorCheck: { pass: true },
    aos: {
      sponsorTaxableIncome: 95_000,
      benchmark: 83_454.8,
      meetsBenchmark: true,
      requiresCoAssurer: false,
    },
    predictedVisa: {
      subclass: '864',
      name: 'Contributory Aged Parent',
      track: 'contributory_parent',
    },
    recommendations: [],
    ...overrides,
  };
}

describe('parentService.submitAudit', () => {
  it('posts to the parent audit route', async () => {
    post.mockResolvedValue(parentAudit());

    await parentService.submitAudit(parentProfile());

    expect(post.mock.calls[0][0]).toBe('/parent/audit');
  });

  it('sends the full profile so balance-of-family can be computed', async () => {
    post.mockResolvedValue(parentAudit());
    const input = parentProfile();

    await parentService.submitAudit(input);

    expect(post.mock.calls[0][1]).toEqual(input);
  });

  it('sends a zero child count rather than dropping the field', async () => {
    // childrenInAustralia: 0 is a meaningful answer — it fails the test.
    // Omitting it looks to the engine like an unanswered question.
    post.mockResolvedValue(parentAudit());

    await parentService.submitAudit(
      parentProfile({ childrenInAustralia: 0, childrenInLargestOtherCountry: 3 }),
    );

    const sent = post.mock.calls[0][1] as ParentProfileInput;
    expect(sent.childrenInAustralia).toBe(0);
  });

  it('returns a bare audit unchanged', async () => {
    const bare = parentAudit();
    post.mockResolvedValue(bare);

    await expect(parentService.submitAudit(parentProfile())).resolves.toEqual(bare);
  });

  it('unwraps a { data } envelope', async () => {
    const inner = parentAudit();
    post.mockResolvedValue({ success: true, data: inner });

    await expect(parentService.submitAudit(parentProfile())).resolves.toEqual(inner);
  });

  it('unwraps an envelope even when the verdict is a falsy isEligible', async () => {
    // The unwrapper keys on the presence of `isEligible`, not its truth.
    // If it ever checked truthiness instead, every ineligible verdict would
    // fall through to the envelope branch and come back as the wrapper.
    const inner = parentAudit({ isEligible: false, status: 'LEGALLY_INELIGIBLE' });
    post.mockResolvedValue({ success: true, data: inner });

    const res = await parentService.submitAudit(parentProfile());

    expect(res.isEligible).toBe(false);
    expect(res.status).toBe('LEGALLY_INELIGIBLE');
    expect(res.auditId).toBe('pa-1');
  });

  it('carries a failed balance-of-family test with its reason', async () => {
    post.mockResolvedValue(
      parentAudit({
        isEligible: false,
        status: 'LEGALLY_INELIGIBLE',
        balanceOfFamily: {
          childrenInAustralia: 1,
          totalChildren: 4,
          percentage: 25,
          pass: false,
          alternativeLimbPass: false,
          reason: 'Fewer than half the children are in Australia.',
        },
      }),
    );

    const res = await parentService.submitAudit(
      parentProfile({ totalChildren: 4, childrenInAustralia: 1 }),
    );

    expect(res.balanceOfFamily.pass).toBe(false);
    expect(res.balanceOfFamily.reason).toMatch(/half/i);
  });

  it('surfaces the co-assurer requirement when income is under the benchmark', async () => {
    post.mockResolvedValue(
      parentAudit({
        aos: {
          sponsorTaxableIncome: 60_000,
          benchmark: 83_454.8,
          meetsBenchmark: false,
          requiresCoAssurer: true,
          warning: 'Income is below the AoS benchmark.',
        },
      }),
    );

    const res = await parentService.submitAudit(
      parentProfile({ sponsorTaxableIncome: 60_000 }),
    );

    expect(res.aos.meetsBenchmark).toBe(false);
    expect(res.aos.requiresCoAssurer).toBe(true);
  });

  it('keeps the predicted subclass as a string so a leading zero survives', async () => {
    post.mockResolvedValue(
      parentAudit({
        predictedVisa: { subclass: '804', name: 'Aged Parent', track: 'aged_parent' },
      }),
    );

    const res = await parentService.submitAudit(parentProfile());

    expect(res.predictedVisa.subclass).toBe('804');
    expect(typeof res.predictedVisa.subclass).toBe('string');
  });

  it('preserves recommendations rather than collapsing them to an empty list', async () => {
    post.mockResolvedValue(
      parentAudit({
        recommendations: ['Wait until the sponsor reaches two years of residence.'],
      }),
    );

    const res = await parentService.submitAudit(parentProfile());

    expect(res.recommendations).toHaveLength(1);
  });

  it('propagates a failed audit to the caller', async () => {
    post.mockRejectedValue(new Error('Server error. Please try again later.'));

    await expect(parentService.submitAudit(parentProfile())).rejects.toThrow(
      /Server error/,
    );
  });
});
