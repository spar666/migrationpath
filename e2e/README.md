# E2E tests

Playwright specs covering the whole application.

## Running them

```bash
npm install                      # first time only
npx playwright install chromium  # first time only — downloads the browser
npm run test:e2e
```

Playwright starts the dev server itself (`webServer` in `playwright.config.ts`),
so nothing needs to be running first. No backend, no database, no API keys.

```bash
npm run test:e2e:ui                    # interactive — best for writing specs
npm run test:e2e -- --headed           # watch it drive a real browser
npm run test:e2e -- --debug            # step through
npm run test:e2e -- --project=mobile   # phone viewport
npm run test:e2e -- smoke              # one spec file
```

## Layout

```
e2e/
  fixtures/
    api-stubs.ts     every endpoint the app calls, plus a recorder for
                     what the app sent outward
    test.ts          the project's `test` — adds page-health checking
  pages/
    app.page.ts      the route list and app shell
    prescreen.page.ts
    consult.page.ts
  specs/
    smoke.spec.ts       every route renders
    navigation.spec.ts  routing, deep links, back button, responsive
    funnel.spec.ts      the lead-gen journey end to end
    resilience.spec.ts  what happens when the API misbehaves
```

`testDir` points at `specs/`, so fixtures and page objects are never collected
as tests.

## The page-health fixture

Every test gets a `health` fixture that watches for uncaught exceptions,
`console.error`, and the ErrorBoundary's fallback copy. It asserts
automatically after each test.

This matters more than it sounds. A React page that throws during render
unmounts to a blank div — and a spec asserting "the Book button is absent"
**passes** on a blank page. Half the value of a browser suite is knowing the
page was alive at all, and you do not get that for free.

Specs that provoke an error on purpose opt out:

```ts
test('degrades when the API is down', async ({ page, health }) => {
  health.expectErrors('deliberate 500');
  await stubApi(page, { failing: ['/cms'] });
  // ...
});
```

## What is real and what is stubbed

**Real:** the frontend, the router, every screen, and all state that has to
survive navigation — including the two round trips off our origin.

**Stubbed at the network layer:** our own API, Calendly, and Stripe Checkout.

A deliberate line, for three reasons:

1. **No credentials, no database.** A suite that needs live keys does not run on
   CI, and a suite that does not run gets deleted six months later.
2. **Failures stay attributable.** With a real backend in the loop, red means
   "something, somewhere". Here it means the UI.
3. **Edge cases become reachable.** Rendering the empty state or the
   server-is-down state against a real database means engineering the database
   into that state. Here it is one option.

The honest cost: **these tests cannot catch contract drift between frontend and
backend.** If the API renames a field, the stubs keep returning the old shape
and the suite stays green. That gap is covered by the backend's
`test/funnel-flow.e2e-spec.ts`, which drives the real API over HTTP.

## Selector contracts

The specs address the UI by role and label. Those strings are mirrored by two
fast jsdom suites:

- `src/e2eSelectors.test.tsx` — the pre-screen
- `src/consultSelectors.test.tsx` — the book and confirm pages

They run in ~300ms with `npm test` and fail with the actual reason ("unable to
find a label matching /business name/i") instead of a twenty-minute browser
timeout. **If one goes red, fix the Playwright page object too** — they are the
same strings, deliberately duplicated to buy the fast feedback.

## Adding a spec

Put selectors in a page object, not the spec. The questionnaire is marketing
copy attached to a legislative form, so its wording changes more often than its
flow — one file should absorb that.

```ts
import { expect, test, waitForApp } from '../fixtures/test';
import { stubApi } from '../fixtures/api-stubs';

test('does the thing', async ({ page }) => {
  await stubApi(page);
  await page.goto('/some-route');
  await waitForApp(page);   // goto resolves before React mounts
  // ...
});
```

`waitForApp` is not optional garnish. `page.goto` resolves on the document load
event, which for a client-rendered app is well before React has painted —
asserting straight after `goto` is the single most common source of flake here.

## The mobile project

`playwright.config.ts` runs everything twice: desktop Chrome and a Pixel 7.
That is not padding. The header renders both a desktop nav and a hamburger at
every width and hides one with `md:` classes, so **the links a phone user
cannot reach are still in the DOM and still match a locator**. A spec that
clicks a nav link passes on desktop and fails on mobile — which is the correct
outcome, and the reason `AppPage.revealNav()` and the `filter({ visible: true })`
on `loginLink()` exist.

jsdom cannot mirror this one: it has no layout, so nothing there knows an
element is hidden by a breakpoint. The mobile project is the only thing
covering it.

## Known gaps

- **Contract drift.** Covered above: the stubs cannot notice a renamed API
  field. That is the backend suite's job.
- **No visual regression.** Worth adding (`toHaveScreenshot`) once the UI
  settles; too noisy while pages are still changing.
- **No accessibility assertions.** `@axe-core/playwright` would slot into the
  smoke spec cleanly and is the highest-value next addition.
- **The header/nav selectors have no jsdom mirror**, unlike the funnel's — see
  above for why they cannot have one. They break at browser speed.
