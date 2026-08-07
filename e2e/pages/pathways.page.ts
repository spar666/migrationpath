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
 *   - the signup CTA carries the right `persona` query parameter, because that
 *     is what routes the new account into the right funnel
 *   - the secondary CTA points at the tool this audience actually needs
 *
 * A persona typo is invisible on the page and changes where every signup from
 * that page lands. That is the failure this file exists to catch.
 */

export interface PathwayUnderTest {
  path: string;
  name: string;
  /** Distinctive words from the h1. Matched loosely — it spans two lines. */
  heading: RegExp;
  /** The `persona` query param the signup CTA must carry. */
  persona: string;
  /** Where the secondary CTA goes. */
  secondaryCta: string;
}

export const PATHWAYS: PathwayUnderTest[] = [
  {
    path: '/pathways/student',
    name: 'student',
    heading: /student to pr/i,
    persona: 'student',
    secondaryCta: '/points-calculator',
  },
  {
    path: '/pathways/skilled',
    name: 'skilled',
    heading: /direct pr route/i,
    persona: 'skilled',
    secondaryCta: '/points-calculator',
  },
  {
    path: '/pathways/partner',
    name: 'partner',
    heading: /join your partner/i,
    persona: 'partner',
    secondaryCta: '/quote',
  },
  {
    path: '/pathways/onshore',
    name: 'onshore',
    heading: /maximize your pr chances/i,
    persona: 'onshore-skilled',
    secondaryCta: '/points-calculator',
  },
  {
    path: '/pathways/employer',
    name: 'employer',
    heading: /australian employer/i,
    persona: 'employer',
    secondaryCta: '/quote',
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
   * Every signup link on the page.
   *
   * Plural deliberately: these pages repeat the CTA at the top and bottom, and
   * a spec that checked only the first would miss a footer CTA carrying the
   * wrong persona — which is exactly the kind of thing that gets copy-pasted
   * from another pathway page and never noticed.
   */
  signupLinks() {
    return this.page.locator('a[href*="/auth?intent=signup"]');
  }

  signupLinksFor(persona: string) {
    return this.page.locator(`a[href*="persona=${persona}"]`);
  }

  secondaryLinks(href: string) {
    return this.page.locator(`a[href="${href}"]`);
  }
}
