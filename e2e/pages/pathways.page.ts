import type { Page } from '@playwright/test';

/**
 * The five public pathway landing pages.
 *
 * These are marketing pages, so asserting on their prose would make the suite
 * go red every time somebody rewrites a paragraph — a test that cries wolf
 * gets muted, and then it is not a test. What is worth pinning is the part a
 * marketing edit can break silently:
 *
 *   - the page renders its own hero rather than a blank shell
 *   - the primary CTA reaches the funnel that matches THIS page's audience
 *   - the secondary CTA points at the tool this audience actually needs
 *
 * These pages are near-identical and get copy-pasted from each other, so a
 * secondary CTA pointing at another audience's tool is invisible on the page
 * and wrong for everyone who clicks it. That is the failure this file catches.
 */

export interface PathwayUnderTest {
  path: string;
  name: string;
  /** Distinctive words from the h1. Matched loosely — it spans two lines. */
  heading: RegExp;
  /**
   * The funnel this page's audience belongs in.
   *
   * Per-pathway, not shared. All three pages used to send everyone to
   * /pre-screen — the employer-sponsored questionnaire — which asked a partner
   * applicant about their sponsor's ABN and a skilled applicant about a job
   * offer they had not been asked to have.
   */
  primaryCta: string;
  /** Where the secondary CTA goes. */
  secondaryCta: string;
}

export const PATHWAYS: PathwayUnderTest[] = [
  {
    path: '/pathways/skilled',
    name: 'skilled',
    heading: /direct pr route/i,
    primaryCta: '/points-calculator',
    secondaryCta: '/consultation',
  },
  {
    path: '/pathways/partner',
    name: 'partner',
    heading: /join your partner/i,
    primaryCta: '/partner-audit',
    secondaryCta: '/consultation',
  },
  {
    path: '/pathways/employer',
    name: 'employer',
    heading: /australian employer/i,
    primaryCta: '/pre-screen',
    secondaryCta: '/occupation-search',
  },
];

export class PathwayPage {
  constructor(private readonly page: Page) {}

  async goto(path: string) {
    await this.page.goto(path);
  }

  hero() {
    return this.page.locator('h1').first();
  }

  /**
   * Every primary CTA on the page.
   *
   * Plural deliberately: these pages repeat the CTA at the top and bottom, and
   * a spec that checked only the first would miss a footer CTA pointing
   * somewhere else — exactly the kind of thing that gets copy-pasted from
   * another pathway page and never noticed.
   *
   * These used to be persona-tagged sign-up links, and then — once the
   * accounts went — a single shared link to /pre-screen. Neither was right:
   * the persona decides which questionnaire can actually assess the visitor,
   * so the destination is passed in per pathway rather than fixed here.
   *
   * Scoped to <main>, and that scope is load-bearing. Several CTA targets
   * (/points-calculator, /occupation-search) are also header and bottom-nav
   * entries, and the header copy comes first in the DOM — so an unscoped
   * `.first()` picks up the nav link, which is display:none at phone widths.
   * The spec then fails on a visible, working button because it was looking
   * at the chrome.
   */
  primaryCtaLinks(href: string) {
    return this.page.locator(`main a[href="${href}"]`);
  }

  secondaryLinks(href: string) {
    return this.page.locator(`main a[href="${href}"]`);
  }
}
