import { defineConfig, devices } from '@playwright/test';

/**
 * E2E config for the lead-gen funnel.
 *
 * Deliberately self-contained: the specs intercept the API, Stripe and
 * Calendly at the network layer, so this suite needs no backend, no database
 * and no live credentials. That is what makes it runnable on CI today rather
 * than "once the keys are set up" — and it keeps the funnel's own logic under
 * test without coupling the run to a third party's uptime.
 *
 * The trade-off is honest: this proves the browser journey, not the
 * integration. Contract-level behaviour (signature verification, webhook
 * idempotency) lives in the backend Jest specs, where it belongs.
 */
export default defineConfig({
  // Points at specs/ rather than the whole e2e/ tree, so fixtures and page
  // objects are never mistaken for test files.
  testDir: './e2e/specs',
  // Every spec here is independent, so parallelism is free.
  fullyParallel: true,
  // Stops a committed .only from silently narrowing the CI run to one test.
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI
    ? [['html', { open: 'never' }], ['github']]
    : [['html', { open: 'never' }], ['list']],

  use: {
    baseURL: 'http://localhost:8080',
    // Artifacts only for failures — a green run producing hundreds of MB of
    // video is how people start ignoring the artifacts.
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    // Most of this funnel's traffic will be phones. The questionnaire is the
    // part most likely to break there — long option lists, sticky buttons.
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:8080',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      // REQUIRED, and the reason is not obvious: `.env` ships with
      // VITE_CALENDLY_CONSULT_URL empty, and openScheduler() throws when it is
      // missing. Without this the Book button hits its "scheduling is not
      // configured" path and the happy-path spec fails at the handoff — a
      // failure about configuration wearing the costume of a broken funnel.
      //
      // The value is never fetched. e2e/fixtures/api-stubs.ts intercepts
      // calendly.com and records the URL; that recording IS the assertion.
      VITE_CALENDLY_CONSULT_URL: 'https://calendly.com/e2e/consultation',
      // Keeps the API on the relative path the fixtures intercept.
      VITE_API_BASE_URL: '/api/v1',
    },
  },
});
