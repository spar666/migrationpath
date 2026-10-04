import type { Page, Route } from '@playwright/test';

/**
 * Network stubs for every endpoint the application calls.
 *
 * Why stub the whole API rather than run a real backend:
 *
 *   1. A backend needs Postgres, migrations and seed data. A suite with that
 *      much setup gets run rarely, and a suite that runs rarely is a suite
 *      nobody trusts.
 *   2. Failures stay attributable. When a real backend is in the loop, a red
 *      test means "something, somewhere" — the UI, the API, the data, the
 *      network. Here it means the UI.
 *   3. Edge cases become reachable. Rendering the "no results" or "server is
 *      down" state against a real database means engineering the database into
 *      that state; here it is one line.
 *
 * The trade-off is real and worth stating: these tests cannot catch a contract
 * drift between frontend and backend. That gap is covered by the backend's own
 * functional-flow spec, which drives the real API over HTTP.
 *
 * ---------------------------------------------------------------------------
 * A note on payload shape, because it is the whole game here
 * ---------------------------------------------------------------------------
 *
 * Every canned payload below is shaped to match what the corresponding service
 * in `src/services/` actually unwraps — not what the endpoint "morally"
 * returns. Several of these are non-obvious:
 *
 *   - newsService reads `envelope.data.data` (a Strapi page inside our own
 *     `{ success, data }` envelope). A flat array renders an empty news page.
 *   - pointsService wants `totalPoints` / `belowPassMark`, not `total`.
 *
 * Getting these wrong does not fail loudly. It renders the empty state, and a
 * spec asserting "the page rendered" passes against a page that is blank for
 * the wrong reason. That is the failure mode this file exists to prevent.
 */

export const PROSPECT_ID = '4f1a5c2e-0000-4000-8000-000000000000';
export const HUMAN_REF = 'MP-7F3K9A';

// ---------------------------------------------------------------------------
// Canned payloads
// ---------------------------------------------------------------------------

/** Matches what `useOccupationSearch` normalises: occupation_name -> title. */
export const OCCUPATION = {
  id: 'occ-1',
  anzsco_code: '261313',
  occupation_name: 'Software Engineer',
  title: 'Software Engineer',
  primary_list: 'MLTSSL',
  assessing_authority: 'ACS',
  skill_level: 1,
  on_mltssl: true,
  on_stsol: false,
  on_rol: false,
  is_active: true,
  is_available: true,
};

/** A second row, so "the search filters" is a real assertion and not a tautology. */
export const OTHER_OCCUPATION = {
  id: 'occ-2',
  anzsco_code: '254499',
  occupation_name: 'Registered Nurse',
  title: 'Registered Nurse',
  primary_list: 'STSOL',
  assessing_authority: 'ANMAC',
  skill_level: 1,
  on_mltssl: false,
  on_stsol: true,
  on_rol: false,
  is_active: true,
  is_available: true,
};

/**
 * A single occupation, as `GET /occupations/:code` returns it.
 *
 * Distinct from the list rows above: the detail endpoint carries `thresholds`,
 * `sector` and the two independent priority flags, none of which appear on a
 * list row. Serving a list payload here does not fail — the consumer renders
 * its "no state demand" fallback, which looks like a legitimate result rather
 * than a missing field.
 */
export const OCCUPATION_DETAIL = {
  ...OCCUPATION,
  sector: 'Information Technology',
  is_high_priority: false,
  thresholds: [
    { state_code: 'NSW', is_available: true },
    { state_code: 'VIC', is_available: true },
    { state_code: 'QLD', is_available: true },
    { state_code: 'SA', is_available: true },
    // Filtered out by `is_available !== false` — present so the filter is
    // doing something a spec can observe.
    { state_code: 'TAS', is_available: false },
  ],
};

/**
 * The `/search` row, as `useRealSearch` (occupation search page) reads it.
 *
 * It used to carry `courseName`/`university` too, for the home hero's course
 * suggestions. That group is gone with the course module, and the hero now
 * reads `/occupations` only.
 */
export const SEARCH_ROW = {
  id: 'search-row-1',
  title: 'Software Engineer — 189 pathway',
  description: 'Skilled Independent',
};

// --- Intent classification -------------------------------------------------
//
// `/search/intent` is the home page's router: whatever it returns decides
// whether the visitor stays on the hero, or is sent to the partner audit or
// the get-started splitter. Each shape below matches one branch of
// `IntentResult` in searchService — and they are NOT interchangeable. A
// SKILLED payload missing `occupation` renders the split-screen against
// `undefined` and takes the whole page down, which is exactly the class of
// failure the hero specs exist to catch.

export const SKILLED_INTENT = {
  intent: 'SKILLED' as const,
  query: '261313',
  occupation: {
    anzscoCode: '261313',
    title: 'Software Engineer',
    primaryList: 'MLTSSL',
    assessingAuthority: 'ACS',
  },
  pointsTested: [
    {
      id: 'visa-189',
      subclassNumber: '189',
      streamTitle: 'Skilled Independent',
      residencyType: 'permanent' as const,
      name: 'Points-tested stream',
      caveats: null,
    },
  ],
  employerSponsored: [] as unknown[],
};

/**
 * Still carries its `courses` array, on purpose.
 *
 * The classifier has not been told the course module is gone, so this is what
 * the app really receives — and the assertion worth making is that it routes
 * to the splitter anyway instead of acting on a payload it can no longer use.
 */
export const STUDENT_INTENT = {
  intent: 'STUDENT' as const,
  query: 'Master of Nursing',
  courses: [
    {
      id: 'course-1',
      courseName: 'Master of Nursing',
      university: 'Deakin University',
    },
  ],
};

export const FAMILY_INTENT = {
  intent: 'FAMILY' as const,
  query: 'partner visa',
  matchedKeyword: 'partner',
  redirectTo: '/partner-audit',
};

export const UNKNOWN_INTENT = {
  intent: 'UNKNOWN' as const,
  query: 'help me',
  suggestAudit: true as const,
  redirectTo: '/pre-screen',
};

/**
 * Strapi's article shape, which is what `transformArticle` consumes.
 * `content` is deliberately long enough that the derived "N min read" is stable.
 */
export const NEWS_ARTICLE = {
  id: 1,
  documentId: 'news-1',
  slug: 'example-update',
  title: 'An example policy update',
  content:
    'Something changed in the skilled migration program. '.repeat(20),
  category: 'Policy',
  target_persona: 'Skilled',
  is_breaking: true,
  publishedAt: '2026-07-01T00:00:00.000Z',
  createdAt: '2026-07-01T00:00:00.000Z',
  updatedAt: '2026-07-01T00:00:00.000Z',
};

export const SECOND_NEWS_ARTICLE = {
  ...NEWS_ARTICLE,
  id: 2,
  documentId: 'news-2',
  slug: 'second-update',
  title: 'A second policy update',
  is_breaking: false,
};

export const SITE_CONFIG = {
  site_name: 'MigrationPath',
  contact_email: 'hello@example.com',
  contact_phone: '+61 2 0000 0000',
};

// `courses` and `universities` are still returned by /stats and deliberately
// still stubbed: the frontend stopped reading both with the course module, and
// a stub that dropped them could not catch the app reading them again by
// accident. Only `occupations` reaches a page.
export const PLATFORM_STATS = {
  courses: 512,
  occupations: 214,
  universities: 57,
};

export const USER = {
  id: 'user-1',
  email: 'ada@example.com',
  firstName: 'Ada',
  lastName: 'Lovelace',
  fullName: 'Ada Lovelace',
  personaType: 'skilled',
  isAdmin: false,
  pointsScore: 75,
  anzscoCode: '261313',
};

/** Matches `StructuredPointsResult` in pointsService. */
export function pointsResult(overrides: Record<string, unknown> = {}) {
  return {
    totalPoints: 75,
    breakdown: {
      AGE: 30,
      ENGLISH: 20,
      QUALIFICATIONS: 15,
      WORK_EXPERIENCE_COMBINED: 10,
      REGIONAL_STUDY: 0,
    },
    workCapApplied: false,
    belowPassMark: false,
    ...overrides,
  };
}

/** Matches `PartnerEligibilityResult` in partnerEligibilityService. */
export function partnerResult(overrides: Record<string, unknown> = {}) {
  return {
    id: 'partner-1',
    applicantFirstName: 'Ada',
    sponsorFirstName: 'Charles',
    outcome: 'eligible',
    summary: 'You look like a strong candidate.',
    effort: 'standard',
    highRisk: false,
    becomingEligible: false,
    ineligible: false,
    // The quiz now writes onto the funnel spine. Without these the result
    // screen has no prospect to attach a booking to and hides the CTA, so
    // omitting them here would silently turn the booking specs into no-ops.
    prospect_id: PROSPECT_ID,
    human_ref: HUMAN_REF,
    can_book: true,
    ...overrides,
  };
}

export function preScreenResult(overrides: Record<string, unknown> = {}) {
  return {
    prospect_id: PROSPECT_ID,
    human_ref: HUMAN_REF,
    statutory_eligible: true,
    client_fit: true,
    can_book: true,
    recommended_subclass: '482',
    recommended_label: 'Skills in Demand',
    reasons: ['Occupation appears on the relevant list'],
    blockers: [],
    next_steps: ['Book a consultation with a registered migration agent.'],
    ...overrides,
  };
}

export function prospectStatus(overrides: Record<string, unknown> = {}) {
  return {
    prospect_id: PROSPECT_ID,
    human_ref: HUMAN_REF,
    stage: 'pre_screened',
    statutory_eligible: true,
    client_fit: true,
    consult_confirmed: false,
    booking: {
      id: 'booking-1',
      status: 'pending',
      scheduled_at: '2026-08-01T02:00:00.000Z',
      scheduled_end_at: '2026-08-01T02:45:00.000Z',
      join_url: null,
      reschedule_url: null,
      cancel_url: null,
    },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Recorder — what the app sent outward
// ---------------------------------------------------------------------------

export interface Recorder {
  preScreenPayload: () => Record<string, unknown> | null;
  checkoutPayload: () => Record<string, unknown> | null;
  calendlyUrl: () => string | null;
  signinPayload: () => Record<string, unknown> | null;
  pointsPayload: () => Record<string, unknown> | null;
  partnerPayload: () => Record<string, unknown> | null;
  questionnairePayload: () => Record<string, unknown> | null;
  /**
   * The `q` sent to GET /search/intent.
   *
   * Worth recording rather than inferring: picking an occupation suggestion
   * sends its ANZSCO CODE while displaying its title, and the two being
   * different is the whole point — a code classifies exactly, a title does not.
   */
  intentQuery: () => string | null;
  statusCallCount: () => number;
  /** What the browser reported about the slot it just booked, if anything. */
  reportedBooking: () => Record<string, unknown> | null;
  /** Number of POST /points/calculate/total calls — the debounce assertion. */
  pointsCallCount: () => number;
  logoutCalled: () => boolean;
  /** Every API path the app requested, in order. */
  requests: () => string[];
  /**
   * Zero the status-poll counter that `confirmAfter` counts against.
   *
   * Needed because the counter is per-test but `confirmAfter` is really about
   * one page's polling. Walking the funnel means /consult/book has already
   * polled status twice before the confirmation page mounts, so a
   * `confirmAfter: 2` intended as "confirm on the second poll after arriving"
   * is already satisfied and the page renders "booked" on its first frame —
   * silently turning the "never opens on success" assertion into a no-op.
   */
  resetStatusPolls: () => void;
}

export interface StubOptions {
  /** Overrides for POST /pre-screen. */
  preScreen?: Record<string, unknown>;
  /** Overrides for GET /prospects/:id/status. */
  status?: Record<string, unknown>;
  /**
   * Flip the status endpoint to confirmed on the Nth call.
   *
   * Counts every status poll in the test, not just the ones from the page you
   * care about — /consult/book polls the same endpoint. A spec that walks the
   * whole funnel should call `resetStatusPolls()` on arriving at the page
   * whose polling it means to observe.
   */
  confirmAfter?: number;
  /** Force these path fragments to fail with a 500, e.g. ['/occupations']. */
  failing?: string[];
  /**
   * Force a specific status code per path fragment, e.g.
   * `{ '/auth/signin': 401, '/pre-screen': 422 }`.
   *
   * Separate from `failing` because "the server broke" and "the server said no"
   * are different products to the user, and a suite that can only simulate the
   * first will never notice that the second is handled by the same generic
   * "something went wrong" toast.
   */
  httpErrors?: Record<string, number>;
  /** Body returned with a forced error. Defaults to a message envelope. */
  errorBody?: unknown;
  /** Return empty collections everywhere — the "no results" state. */
  empty?: boolean;
  /**
   * Start the session holding a token whose profile is NOT an admin.
   *
   * The public site has no accounts, so this is not a "logged-in visitor" any
   * more — it is the state the admin gate has to reject: a real token, a real
   * profile, and no admin claim. Keeping it simulable is the only way to test
   * that the gate fails closed rather than merely redirecting the tokenless.
   */
  authenticated?: boolean;
  /** Start the session signed in as an admin. Implies a token for /auth/me. */
  admin?: boolean;
  /** Overrides for POST /points/calculate/total. */
  points?: Record<string, unknown>;
  /** Overrides for POST /partner/eligibility. */
  partner?: Record<string, unknown>;
  /** Overrides for GET /occupations/:code. */
  occupationDetail?: Record<string, unknown>;
  /** Delay every stubbed response by this many ms — for loading-state specs. */
  latencyMs?: number;
  /**
   * Which branch GET /search/intent classifies into. Defaults to 'skilled'.
   *
   * This one option decides where the home page sends a visitor, so it is the
   * axis the hero specs vary — the four values are four different funnels.
   */
  intent?: 'skilled' | 'student' | 'family' | 'unknown';
  /** Field-level overrides on top of the chosen intent payload. */
  intentOverrides?: Record<string, unknown>;
}

/**
 * Installs the full stub set. Call once per test, before the first navigation.
 */
export async function stubApi(
  page: Page,
  options: StubOptions = {},
): Promise<Recorder> {
  let preScreenPayload: Record<string, unknown> | null = null;
  let checkoutPayload: Record<string, unknown> | null = null;
  let signinPayload: Record<string, unknown> | null = null;
  let pointsPayload: Record<string, unknown> | null = null;
  let partnerPayload: Record<string, unknown> | null = null;
  let questionnairePayload: Record<string, unknown> | null = null;
  let intentQuery: string | null = null;
  let calendlyUrl: string | null = null;
  let statusCalls = 0;
  let reportedBooking: Record<string, unknown> | null = null;
  let pointsCalls = 0;
  let logoutCalled = false;
  const requests: string[] = [];

  const json = (route: Route, body: unknown, status = 200) =>
    route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(body),
    });

  /** The status code this request has been told to fail with, if any. */
  function forcedStatus(path: string): number | null {
    for (const [fragment, code] of Object.entries(options.httpErrors ?? {})) {
      if (path.includes(fragment)) return code;
    }
    if (options.failing?.some((fragment) => path.includes(fragment))) return 500;
    return null;
  }

  /**
   * Wraps a handler so that `failing` and `httpErrors` are honoured everywhere.
   *
   * This has to live in the wrapper rather than in the catch-all, and the
   * reason is a genuine trap: Playwright matches the MOST RECENTLY registered
   * route first. A specific handler registered after the catch-all therefore
   * shadows it completely — so a `failing: ['/pre-screen']` option checked only
   * in the catch-all silently does nothing, and the spec that relies on it
   * passes against a 200.
   */
  function handler(
    label: string,
    respond: (route: Route, path: string) => Promise<unknown> | unknown,
  ) {
    return async (route: Route) => {
      const path = new URL(route.request().url()).pathname;
      requests.push(label);

      if (options.latencyMs) {
        await new Promise((resolve) => setTimeout(resolve, options.latencyMs));
      }

      const code = forcedStatus(path) ?? forcedStatus(label);
      if (code !== null) {
        return json(
          route,
          options.errorBody ?? {
            success: false,
            statusCode: code,
            message: `Simulated ${code}`,
          },
          code,
        );
      }

      return respond(route, path);
    };
  }

  const envelope = <T>(data: T) => ({
    success: true,
    data,
    timestamp: '2026-07-01T00:00:00.000Z',
    path: '/stub',
    requestId: 'stub-request',
  });

  const list = <T>(items: T[]) => ({
    success: true,
    data: options.empty ? [] : items,
    total: options.empty ? 0 : items.length,
    page: 1,
    limit: 20,
  });

  const collection = <T>(items: T[]): T[] => (options.empty ? [] : items);

  if (options.authenticated || options.admin) {
    await page.addInitScript(() => {
      localStorage.setItem('auth_token', 'e2e-fake-token');
    });
  }

  const currentUser = { ...USER, isAdmin: !!options.admin };

  // A single catch-all placed FIRST so nothing escapes to a real network.
  // Playwright matches the most recently registered route first, so the
  // specific handlers below take precedence over this one. Anything that
  // reaches here is an endpoint the stubs do not know about — it answers 200
  // with an empty envelope rather than hanging, and shows up in requests()
  // so a spec can assert on it.
  await page.route(
    '**/api/**',
    handler('(unstubbed)', (route) => json(route, { success: true, data: [] })),
  );

  // --- Auth ---
  await page.route(
    '**/api/v1/auth/signin',
    handler('/auth/signin', (route) => {
      signinPayload = route.request().postDataJSON();
      return json(route, {
        access_token: 'e2e-fake-token',
        user: currentUser,
      });
    }),
  );

  await page.route(
    '**/api/v1/auth/me',
    handler('/auth/me', (route) => json(route, envelope(currentUser))),
  );

  await page.route(
    '**/api/v1/auth/logout',
    handler('/auth/logout', (route) => {
      logoutCalled = true;
      return json(route, { success: true });
    }),
  );

  // --- Occupations & search ---
  //
  // Registration order matters and reads backwards: the LAST route registered
  // wins, so the more specific pattern goes last.
  await page.route(
    '**/api/v1/occupations**',
    handler('/occupations', (route) =>
      json(route, list([OCCUPATION, OTHER_OCCUPATION])),
    ),
  );

  // A single occupation by ANZSCO code. Registered between the list glob and
  // the search glob deliberately: `**/occupations/*` also matches
  // `/occupations/search`, so search has to be registered AFTER this to win,
  // and this has to be registered after the plain list glob to win over it.
  await page.route(
    '**/api/v1/occupations/*',
    handler('/occupations/:code', (route) =>
      json(route, envelope({ ...OCCUPATION_DETAIL, ...options.occupationDetail })),
    ),
  );

  await page.route(
    '**/api/v1/occupations/search**',
    handler('/occupations/search', (route) =>
      json(route, list([OCCUPATION, OTHER_OCCUPATION])),
    ),
  );

  // `useRealSearch` maps over the response directly, so this must be an ARRAY.
  // An envelope here renders no "General Results" section and no error — the
  // section simply never appears, which is indistinguishable from working.
  await page.route(
    '**/api/v1/search**',
    handler('/search', (route) => json(route, collection([SEARCH_ROW]))),
  );

  // The home page's router. `intent` picks which branch the hero takes.
  await page.route(
    '**/api/v1/search/intent**',
    handler('/search/intent', (route, path) => {
      intentQuery = new URL(route.request().url()).searchParams.get('q');
      void path;

      const byName = {
        skilled: SKILLED_INTENT,
        student: STUDENT_INTENT,
        family: FAMILY_INTENT,
        unknown: UNKNOWN_INTENT,
      };
      const base = byName[options.intent ?? 'skilled'];

      return json(route, envelope({ ...base, ...options.intentOverrides }));
    }),
  );

  // --- Points ---
  await page.route(
    '**/api/v1/points/**',
    handler('/points', (route) => {
      pointsCalls += 1;
      pointsPayload = route.request().postDataJSON();
      return json(route, envelope(pointsResult(options.points)));
    }),
  );

  // --- Content ---
  //
  // newsService reads `envelope.data.data` — our envelope wrapping a Strapi
  // page. A flat list here renders "No articles available yet."
  await page.route(
    '**/api/v1/cms/**',
    handler('/cms', (route) => json(route, list([]))),
  );

  await page.route(
    '**/api/v1/cms/news-articles**',
    handler('/cms/news-articles', (route) => {
      const articles = collection([NEWS_ARTICLE, SECOND_NEWS_ARTICLE]);
      return json(
        route,
        envelope({
          data: articles,
          meta: { pagination: { page: 1, pageSize: 25, total: articles.length } },
        }),
      );
    }),
  );

  await page.route(
    '**/api/v1/cms/news-articles/slug/**',
    handler('/cms/news-articles/slug', (route, path) => {
      const slug = decodeURIComponent(path.split('/').pop() ?? '');
      const article =
        [NEWS_ARTICLE, SECOND_NEWS_ARTICLE].find((a) => a.slug === slug) ?? null;
      if (options.empty || !article) return json(route, envelope({ data: null, meta: {} }));
      return json(route, envelope({ data: article, meta: {} }));
    }),
  );

  // --- Audits ---
  await page.route(
    '**/api/v1/partner/**',
    handler('/partner', (route) =>
      json(route, envelope({ eligible: true, reasons: ['Looks workable'], blockers: [] })),
    ),
  );

  await page.route(
    '**/api/v1/partner/eligibility',
    handler('/partner/eligibility', (route) => {
      partnerPayload = route.request().postDataJSON();
      return json(route, envelope(partnerResult(options.partner)));
    }),
  );

  // --- Consultation ---
  await page.route(
    '**/api/v1/consultation/**',
    handler('/consultation/questionnaire', (route) => {
      questionnairePayload = route.request().postDataJSON();
      return json(route, envelope({ id: 'questionnaire-1' }));
    }),
  );

  // --- Funnel ---
  await page.route(
    '**/api/v1/pre-screen',
    handler('/pre-screen', (route) => {
      preScreenPayload = route.request().postDataJSON();
      return json(route, preScreenResult(options.preScreen));
    }),
  );

  await page.route(
    '**/api/v1/prospects/*/status**',
    handler('/prospects/status', (route) => {
      statusCalls += 1;

      const confirmed =
        options.confirmAfter !== undefined && statusCalls >= options.confirmAfter;

      return json(
        route,
        prospectStatus({
          ...(confirmed
            ? {
                stage: 'booked',
                consult_confirmed: true,
                booking: {
                  id: 'booking-1',
                  status: 'confirmed',
                  scheduled_at: '2026-08-01T02:00:00.000Z',
                  scheduled_end_at: '2026-08-01T02:45:00.000Z',
                  join_url: 'https://meet.example/abc',
                  reschedule_url: 'https://calendly.com/reschedule/abc',
                  cancel_url: 'https://calendly.com/cancel/abc',
                },
              }
            : {}),
          ...options.status,
        }),
      );
    }),
  );

  // The browser reporting the slot it just watched Calendly confirm. This is
  // what makes checkout work when the invitee webhook is late, misconfigured,
  // or — on localhost — undeliverable, so the stub answers with a booking the
  // way the real endpoint does.
  await page.route(
    '**/api/v1/prospects/*/booking**',
    handler('/prospects/booking', (route) => {
      reportedBooking = route.request().postDataJSON();
      return json(
        route,
        prospectStatus({
          booking: {
            id: 'booking-1',
            status: 'pending',
            scheduled_at: '2026-08-01T02:00:00.000Z',
            scheduled_end_at: '2026-08-01T02:45:00.000Z',
            join_url: null,
            reschedule_url: null,
            cancel_url: null,
          },
          ...options.status,
        }),
      );
    }),
  );

  await page.route(
    '**/api/v1/prospects',
    handler('/prospects', (route) =>
      json(route, {
        prospect_id: PROSPECT_ID,
        human_ref: HUMAN_REF,
        stage: 'captured',
      }),
    ),
  );

  await page.route(
    '**/api/v1/payments/consultation/checkout',
    handler('/payments/checkout', (route) => {
      checkoutPayload = route.request().postDataJSON();
      return json(route, {
        checkout_url: 'https://checkout.stripe.com/c/pay/cs_test_e2e',
        payment_id: 'payment-1',
      });
    }),
  );

  // --- Third parties ---
  //
  // Matched by RegExp on the host: a `**/host/**` glob does not reliably match
  // an origin, because the `**` has to span "https://".
  //
  // Neither page is ever loaded for real. Driving someone else's hosted UI
  // makes the suite fail the next time they ship a redesign, which trains
  // everyone to ignore red. What matters is that we hand off with the right
  // parameters, and that is observable here.
  //
  // The calendar is now embedded on our own page rather than linked to, so
  // this stub has to stand in for three things: the widget script, the booking
  // iframe, and the message the real widget posts when a slot is taken.
  //
  // The iframe is served from a calendly.com URL on purpose. /consult/schedule
  // checks `event.origin` before it trusts a "booking made" message — any page
  // can postMessage into a window, and acting on a forged one would march the
  // visitor to checkout for a slot that does not exist. Posting from our own
  // origin would be rejected, and the stub would prove nothing.
  // Registration order matters and is the reverse of what reads naturally:
  // Playwright tries the MOST RECENTLY registered route first, so the broad
  // calendly.com handler goes in before the narrow widget.js one. Registered
  // the other way round, the broad handler swallows the script request, the
  // widget never defines window.Calendly, and the embed silently falls back to
  // its "calendar unavailable" branch.
  await page.route(/calendly\.com/, async (route) => {
    calendlyUrl = route.request().url();
    return route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: `<html><body>
        <h1>Calendly (stubbed)</h1>
        <button id="pick-slot" onclick="parent.postMessage({
          event: 'calendly.event_scheduled',
          payload: {
            invitee: { uri: 'https://api.calendly.com/scheduled_events/E1/invitees/I1' },
            event: {
              uri: 'https://api.calendly.com/scheduled_events/E1',
              start_time: '2026-08-01T02:00:00.000Z',
              end_time: '2026-08-01T02:45:00.000Z'
            }
          }
        }, '*')">
          Confirm this time
        </button>
      </body></html>`,
    });
  });

  await page.route(/assets\.calendly\.com\/.*widget\.js/, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: `
        window.Calendly = {
          initInlineWidget: function (options) {
            var frame = document.createElement('iframe');
            frame.src = options.url;
            frame.width = '100%';
            frame.height = '700';
            frame.setAttribute('data-testid', 'calendly-frame');
            options.parentElement.appendChild(frame);
          }
        };
      `,
    }),
  );

  await page.route(/checkout\.stripe\.com/, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: '<html><body><h1>Stripe Checkout (stubbed)</h1></body></html>',
    }),
  );

  return {
    preScreenPayload: () => preScreenPayload,
    checkoutPayload: () => checkoutPayload,
    signinPayload: () => signinPayload,
    pointsPayload: () => pointsPayload,
    partnerPayload: () => partnerPayload,
    questionnairePayload: () => questionnairePayload,
    intentQuery: () => intentQuery,
    calendlyUrl: () => calendlyUrl,
    statusCallCount: () => statusCalls,
    reportedBooking: () => reportedBooking,
    resetStatusPolls: () => {
      statusCalls = 0;
    },
    pointsCallCount: () => pointsCalls,
    logoutCalled: () => logoutCalled,
    requests: () => [...requests],
  };
}
