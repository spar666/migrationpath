import { test, expect, waitForApp } from '../fixtures/test';
import { stubApi, parentAudit } from '../fixtures/api-stubs';
import { ParentAuditPage } from '../pages/parent.page';

/**
 * The parent visa gateway.
 *
 * Three steps and a verdict, but the verdict is the harshest in the product:
 * parent visas have queues measured in decades, so telling someone they are
 * eligible when they are not costs them years of waiting and a non-trivial
 * application fee. The dashboard assertions below lean on that asymmetry.
 *
 * Two client-side rules are worth pinning because they are enforced nowhere
 * else:
 *
 *   - Children in Australia cannot exceed the worldwide total, and lowering
 *     the total drags the Australian count down with it. Without that, the
 *     Balance of Family percentage can exceed 100 and the engine is asked to
 *     score an impossible family.
 *   - The step gates: no sponsor status, no advance; no children at all, no
 *     advance. Both are questions the engine cannot answer around.
 */

test.beforeEach(async ({ page }) => {
  await stubApi(page);
});

test.describe('the sponsor step', () => {
  test('opens on the sponsoring child', async ({ page }) => {
    const parent = new ParentAuditPage(page);
    await parent.goto();
    await waitForApp(page);

    await expect(parent.sponsorHeading()).toBeVisible();
    await expect(parent.stepIndicator()).toContainText(/step 1 of 3/i);
  });

  test('will not advance without a sponsor status', async ({ page }) => {
    const parent = new ParentAuditPage(page);
    await parent.goto();
    await waitForApp(page);

    await expect(parent.continueButton()).toBeDisabled();
  });

  test('advances once a status is chosen', async ({ page }) => {
    const parent = new ParentAuditPage(page);
    await parent.goto();
    await waitForApp(page);

    await parent.chooseSponsorStatus('Australian citizen');

    await expect(parent.continueButton()).toBeEnabled();
    await parent.continueButton().click();
    await expect(parent.balanceHeading()).toBeVisible();
  });

  test('offers the "unsure" status rather than forcing a guess', async ({ page }) => {
    // Someone who does not know their child's status must still be able to
    // get a verdict — the engine can flag it, a blocked form cannot.
    const parent = new ParentAuditPage(page);
    await parent.goto();
    await waitForApp(page);

    await parent.sponsorStatusTrigger().click();

    await expect(
      page.getByRole('option', { name: /none of the above \/ unsure/i }),
    ).toBeVisible();
  });

  test('carries the residence months through to the engine', async ({ page }) => {
    const recorder = await stubApi(page);
    const parent = new ParentAuditPage(page);
    await parent.goto();
    await waitForApp(page);

    await parent.complete({ months: '18' });
    await parent.anyVerdict().waitFor();

    expect(recorder.parentPayload()).toMatchObject({
      sponsorMonthsInAustralia: 18,
    });
  });
});

test.describe('the balance of family step', () => {
  test('will not advance with no children recorded', async ({ page }) => {
    const parent = new ParentAuditPage(page);
    await parent.goto();
    await waitForApp(page);

    await parent.chooseSponsorStatus('Australian citizen');
    await parent.continueButton().click();
    await parent.balanceHeading().waitFor();

    await expect(parent.continueButton()).toBeDisabled();
  });

  test('advances once at least one child is recorded', async ({ page }) => {
    const parent = new ParentAuditPage(page);
    await parent.goto();
    await waitForApp(page);

    await parent.chooseSponsorStatus('Australian citizen');
    await parent.continueButton().click();
    await parent.balanceHeading().waitFor();

    await parent.setStepper(parent.totalChildren(), 1);

    await expect(parent.continueButton()).toBeEnabled();
  });

  test('will not let the count go negative', async ({ page }) => {
    const parent = new ParentAuditPage(page);
    await parent.goto();
    await waitForApp(page);

    await parent.chooseSponsorStatus('Australian citizen');
    await parent.continueButton().click();
    await parent.balanceHeading().waitFor();

    await parent.decrease(parent.totalChildren()).click();
    await parent.decrease(parent.totalChildren()).click();

    expect(await parent.stepperValue(parent.totalChildren())).toBe(0);
  });

  test('caps children in Australia at the worldwide total', async ({ page }) => {
    const parent = new ParentAuditPage(page);
    await parent.goto();
    await waitForApp(page);

    await parent.chooseSponsorStatus('Australian citizen');
    await parent.continueButton().click();
    await parent.balanceHeading().waitFor();

    await parent.setStepper(parent.totalChildren(), 2);
    // Try to push the Australian count past the total.
    for (let i = 0; i < 5; i++) {
      await parent.increase(parent.childrenInAustralia()).click();
    }

    expect(await parent.stepperValue(parent.childrenInAustralia())).toBe(2);
  });

  test('drags the Australian count down when the total is lowered', async ({ page }) => {
    // Otherwise a visitor who over-counts and corrects themselves leaves
    // behind 3-of-2, and the Balance of Family test scores above 100%.
    const parent = new ParentAuditPage(page);
    await parent.goto();
    await waitForApp(page);

    await parent.chooseSponsorStatus('Australian citizen');
    await parent.continueButton().click();
    await parent.balanceHeading().waitFor();

    await parent.setStepper(parent.totalChildren(), 4);
    await parent.setStepper(parent.childrenInAustralia(), 4);
    await parent.setStepper(parent.totalChildren(), 2);

    expect(await parent.stepperValue(parent.childrenInAustralia())).toBe(2);
  });

  test('sends the counts the visitor actually set', async ({ page }) => {
    const recorder = await stubApi(page);
    const parent = new ParentAuditPage(page);
    await parent.goto();
    await waitForApp(page);

    await parent.complete({ total: 4, inAustralia: 3, elsewhere: 1 });
    await parent.anyVerdict().waitFor();

    expect(recorder.parentPayload()).toMatchObject({
      totalChildren: 4,
      childrenInAustralia: 3,
      childrenInLargestOtherCountry: 1,
    });
  });
});

test.describe('the verdict', () => {
  test('declares a passing profile legally eligible', async ({ page }) => {
    const parent = new ParentAuditPage(page);
    await parent.goto();
    await waitForApp(page);

    await parent.complete();

    await expect(parent.eligibleBadge()).toBeVisible();
  });

  test('declares a failing profile legally ineligible', async ({ page }) => {
    await stubApi(page, {
      parent: parentAudit({
        isEligible: false,
        status: 'LEGALLY_INELIGIBLE',
        balanceOfFamily: {
          childrenInAustralia: 1,
          totalChildren: 4,
          percentage: 25,
          pass: false,
          alternativeLimbPass: false,
          reason: 'Fewer than half the children live in Australia.',
        },
      }),
    });
    const parent = new ParentAuditPage(page);
    await parent.goto();
    await waitForApp(page);

    await parent.complete({ total: 4, inAustralia: 1, elsewhere: 3 });

    await expect(parent.ineligibleBadge()).toBeVisible();
    await expect(parent.eligibleBadge()).toHaveCount(0);
  });

  test('shows the balance of family working, not just the outcome', async ({ page }) => {
    // A bare verdict on a decade-long queue is not actionable. The numbers
    // are what let someone check the answer against their own family.
    const parent = new ParentAuditPage(page);
    await parent.goto();
    await waitForApp(page);

    await parent.complete();

    await expect(parent.balanceOfFamilyCard()).toBeVisible();
    await expect(parent.childrenSummary()).toContainText('2 out of 3');
  });

  test('names the visa track the profile points at', async ({ page }) => {
    const parent = new ParentAuditPage(page);
    await parent.goto();
    await waitForApp(page);

    await parent.complete();

    await expect(parent.likelyPath()).toContainText(/contributory aged parent/i);
  });

  test('distinguishes the aged parent track from the contributory one', async ({ page }) => {
    await stubApi(page, {
      parent: parentAudit({
        predictedVisa: {
          subclass: '804',
          name: 'Aged Parent',
          track: 'aged_parent',
        },
      }),
    });
    const parent = new ParentAuditPage(page);
    await parent.goto();
    await waitForApp(page);

    await parent.complete();

    await expect(parent.likelyPath()).toContainText(/aged parent/i);
    await expect(parent.likelyPath()).not.toContainText(/contributory/i);
  });

  test('warns when a co-assurer will be needed', async ({ page }) => {
    await stubApi(page, {
      parent: parentAudit({
        aos: {
          sponsorTaxableIncome: 45_000,
          benchmark: 83_454.8,
          meetsBenchmark: false,
          requiresCoAssurer: true,
          warning: 'Income is below the Assurance of Support benchmark.',
        },
      }),
    });
    const parent = new ParentAuditPage(page);
    await parent.goto();
    await waitForApp(page);

    await parent.complete({ income: '45000' });

    await expect(parent.coAssurerWarning()).toBeVisible();
  });

  test('stays quiet about a co-assurer when the income clears the benchmark', async ({ page }) => {
    const parent = new ParentAuditPage(page);
    await parent.goto();
    await waitForApp(page);

    await parent.complete();

    await expect(parent.coAssurerWarning()).toHaveCount(0);
  });

  test('carries the not-advice disclaimer', async ({ page }) => {
    const parent = new ParentAuditPage(page);
    await parent.goto();
    await waitForApp(page);

    await parent.complete();

    await expect(parent.disclaimer()).toBeVisible();
  });

  test('offers a way to run the audit again', async ({ page }) => {
    const parent = new ParentAuditPage(page);
    await parent.goto();
    await waitForApp(page);

    await parent.complete();
    await expect(parent.anyVerdict()).toBeVisible();

    await parent.restartButton().click();

    await expect(parent.sponsorHeading()).toBeVisible();
    await expect(parent.stepIndicator()).toContainText(/step 1 of 3/i);
  });

  test('a restarted audit does not remember the last one', async ({ page }) => {
    const parent = new ParentAuditPage(page);
    await parent.goto();
    await waitForApp(page);

    await parent.complete({ total: 3 });
    await parent.restartButton().click();
    await parent.sponsorHeading().waitFor();

    // Sponsor status is back to unset, which is what gates step 1.
    await expect(parent.continueButton()).toBeDisabled();
  });
});

test.describe('when the audit engine is down', () => {
  test('says so instead of showing an invented verdict', async ({ page, health }) => {
    health.expectErrors('the wizard reports the failed submission');
    await stubApi(page, { failing: ['/parent/audit'] });
    const parent = new ParentAuditPage(page);
    await parent.goto();
    await waitForApp(page);

    await parent.complete();

    await expect(parent.errorToast()).toBeVisible();
    await expect(parent.anyVerdict()).toHaveCount(0);
  });

  test('leaves the visitor able to resubmit', async ({ page, health }) => {
    health.expectErrors('the wizard reports the failed submission');
    await stubApi(page, { failing: ['/parent/audit'] });
    const parent = new ParentAuditPage(page);
    await parent.goto();
    await waitForApp(page);

    await parent.complete();
    await expect(parent.errorToast()).toBeVisible();

    await expect(parent.submitButton()).toBeEnabled();
  });
});
