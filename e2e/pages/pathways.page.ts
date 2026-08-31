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
 *   - the primary CTA reaches the pre-screen, the site's one front door
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
  /** Where the secondary CTA goes. */
  secondaryCta: string;
}

export const PATHWAYS: PathwayUnderTest[] = [
  {
    path: '/pathways/skilled',
    name: 'skilled',
    heading: /direct pr route/i,
    secondaryCta: '/points-calculator',
  },
  {
    path: '/pathways/partner',
    name: 'partner',
    heading: /join your partner/i,
    secondaryCta: '/partner-audit',
  },
  {
    path: '/pathways/employer',
    name: 'employer',
    heading: /australian employer/i,
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
   * These used to be persona-tagged sign-up links. There are no accounts to
   * sign up for now, so every pathway page sends its visitor into the same
   * pre-screen and the persona travels in their answers instead of the URL.
   */
  primaryCtaLinks() {
    return this.page.locator('a[href="/pre-screen"]');
  }

  secondaryLinks(href: string) {
    return this.page.locator(`a[href="${href}"]`);
  }
}
