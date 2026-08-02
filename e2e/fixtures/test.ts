import { test as base, expect, type ConsoleMessage, type Page } from '@playwright/test';

/**
 * The project's test fixture.
 *
 * It adds one thing over Playwright's base `test`: the page is watched for
 * signs it broke in ways an assertion would not notice.
 *
 * This matters more than it sounds. A React page that throws during render
 * unmounts to a blank div — and a spec that only asserts "the Book button is
 * absent" PASSES on a blank page. Half the value of a browser suite is knowing
 * the page was alive at all, and that is not something you get for free.
 *
 * Three signals are collected:
 *   - uncaught exceptions (`pageerror`) — a genuine crash
 *   - console.error — React's render errors, failed prop types, unhandled
 *     rejections surfaced by the app's own handlers
 *   - the ErrorBoundary's fallback copy in the DOM
 *
 * `assertHealthy()` is called automatically after every test. Specs that
 * deliberately provoke an error opt out with `expectErrors()`.
 */

export interface PageHealth {
  /** Console errors seen so far, minus the known-noisy ones. */
  errors: () => string[];
  /** Uncaught exceptions. */
  crashes: () => string[];
  /** Stop the automatic end-of-test health assertion for this test. */
  expectErrors: (reason: string) => void;
  /** Assert the page is alive and unbroken. Runs automatically. */
  assertHealthy: () => Promise<void>;
}

/**
 * Noise that says nothing about the app's health.
 *
 * Kept deliberately short. Every entry here is a thing the suite can no longer
 * see, so an over-eager ignore list quietly turns the health check off. If you
 * add to it, say why.
 */
const IGNORED_CONSOLE = [
  // React Router pre-announces v7 behaviour changes on every render.
  'React Router Future Flag Warning',
  // Vite's dev server chatter.
  '[vite]',
  // Downlevel-iteration and similar build noise in dev mode.
  'Download the React DevTools',
];

function isNoise(text: string): boolean {
  return IGNORED_CONSOLE.some((fragment) => text.includes(fragment));
}

export const test = base.extend<{ health: PageHealth }>({
  health: async ({ page }, use, testInfo) => {
    const errors: string[] = [];
    const crashes: string[] = [];
    let optedOut: string | null = null;

    const onConsole = (message: ConsoleMessage) => {
      if (message.type() !== 'error') return;
      const text = message.text();
      if (!isNoise(text)) errors.push(text);
    };

    const onPageError = (error: Error) => {
      crashes.push(error.message);
    };

    page.on('console', onConsole);
    page.on('pageerror', onPageError);

    const assertHealthy = async () => {
      // The ErrorBoundary renders this instead of the page it wrapped.
      const boundary = page.getByText('Something went wrong', { exact: false });
      if (await boundary.count()) {
        throw new Error(
          `The error boundary rendered — the page under test crashed.\n` +
            `Console errors:\n  ${errors.join('\n  ') || '(none captured)'}`,
        );
      }

      if (crashes.length) {
        throw new Error(`Uncaught exception on the page:\n  ${crashes.join('\n  ')}`);
      }

      if (errors.length) {
        throw new Error(`Console errors on the page:\n  ${errors.join('\n  ')}`);
      }
    };

    const health: PageHealth = {
      errors: () => [...errors],
      crashes: () => [...crashes],
      expectErrors: (reason: string) => {
        optedOut = reason;
      },
      assertHealthy,
    };

    await use(health);

    page.off('console', onConsole);
    page.off('pageerror', onPageError);

    // Only assert on a test that was otherwise passing — a health failure
    // stacked on top of a real failure buries the useful message.
    if (!optedOut && testInfo.status === testInfo.expectedStatus) {
      await assertHealthy();
    }
  },
});

export { expect };

/**
 * Waits for the SPA to have actually painted something.
 *
 * `page.goto` resolves on the document load event, which for a client-rendered
 * app is well before React has mounted. Asserting straight after goto is the
 * single most common source of flake in a suite like this.
 */
export async function waitForApp(page: Page): Promise<void> {
  // Deliberately the same selector as AppPage.root(): the toast viewports are
  // siblings of the routed page, so a bare `#root > *` can be satisfied by an
  // empty announcer region while the page itself is still mounting.
  await page.waitForSelector('#root > *:not([role="region"]):not([aria-live])', {
    state: 'attached',
    timeout: 15_000,
  });
}
