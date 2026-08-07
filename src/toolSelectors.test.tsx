/**
 * Selector contract for the tool page objects.
 *
 * Third in the series after `e2eSelectors.test.tsx` (pre-screen) and
 * `consultSelectors.test.tsx` (book/confirm), and here for the same reason:
 * the Playwright specs address these screens by their copy and their DOM
 * shape, and both drift. When they do, this file goes red in under a second
 * and names the string, instead of the browser suite going red much later
 * with "timeout waiting for locator".
 *
 * Covers the locators from:
 *   e2e/pages/points.page.ts
 *   e2e/pages/search.page.ts
 *   e2e/pages/auth.page.ts
 *   e2e/pages/quote.page.ts
 *
 * What it deliberately does NOT cover: anything that needs layout or real
 * pointer behaviour. Radix `Select` panels, hover-revealed controls and the
 * `md:` breakpoint rules have no meaning in jsdom, so asserting them here
 * would be theatre. Those stay the browser suite's job, and are called out
 * individually below.
 *
 * Every expectation here has a twin in a page object. Change one, change both.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';

/**
 * Radix measures its own controls on mount. jsdom has no layout and therefore
 * no ResizeObserver, so without this the RadioGroup on the signup form throws
 * during the layout effect and the whole render is lost — a failure that looks
 * like a missing selector and is not.
 */
class NoopResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= NoopResizeObserver as never;

// --- Service doubles -------------------------------------------------------
//
// Mocked at the module boundary rather than the network, because these tests
// are about which strings reach the DOM, not about how they were fetched.

const calculateTotal = vi.fn();
vi.mock('@/services/pointsService', () => ({
  pointsService: { calculateTotal: (...a: unknown[]) => calculateTotal(...a) },
}));

const getPackages = vi.fn();
const createQuote = vi.fn();
vi.mock('@/services/pricingService', () => ({
  pricingService: {
    getPackages: (...a: unknown[]) => getPackages(...a),
    createQuote: (...a: unknown[]) => createQuote(...a),
  },
}));

const me = vi.fn();
const isAuthenticated = vi.fn();
vi.mock('@/services/authService', () => ({
  authService: {
    me: (...a: unknown[]) => me(...a),
    isAuthenticated: (...a: unknown[]) => isAuthenticated(...a),
    login: vi.fn(),
    register: vi.fn(),
  },
}));

const getMyProgress = vi.fn();
vi.mock('@/services/userProgressService', () => ({
  userProgressService: {
    getMyProgress: (...a: unknown[]) => getMyProgress(...a),
    deleteProgress: vi.fn(),
  },
}));

vi.mock('@/services/statsService', () => ({
  statsService: { getStats: vi.fn().mockResolvedValue({ courses: 1, occupations: 1, universities: 1 }) },
}));

// The search box's two hooks are mocked rather than driven, because the
// component filters a fetched list behind a 300ms debounce — real timers here
// would buy nothing the browser suite does not already prove.
const useOccupationSearch = vi.fn();
const useRealSearch = vi.fn();
vi.mock('@/hooks/useOccupationSearch', () => ({
  useOccupationSearch: (...a: unknown[]) => useOccupationSearch(...a),
  useRealSearch: (...a: unknown[]) => useRealSearch(...a),
}));

const useSmartSuggestions = vi.fn();
vi.mock('@/hooks/useSmartSuggestions', () => ({
  useSmartSuggestions: (...a: unknown[]) => useSmartSuggestions(...a),
}));

const resolveIntent = vi.fn();
vi.mock('@/services/searchService', () => ({
  searchService: { resolveIntent: (...a: unknown[]) => resolveIntent(...a) },
}));

const { StructuredPointsCalculator } = await import(
  './components/wizard/StructuredPointsCalculator'
);
const { OccupationSearchTool } = await import(
  './components/search/OccupationSearchTool'
);
const { VisaEligibilityCard } = await import(
  './components/search/VisaEligibilityCard'
);
const { HeroSection } = await import('./components/home/HeroSection');
const Auth = (await import('./pages/Auth')).default;
const Dashboard = (await import('./pages/Dashboard')).default;
const Quote = (await import('./pages/Quote')).default;

// --- Fixtures, mirroring e2e/fixtures/api-stubs.ts -------------------------

const OCCUPATION = {
  id: 'occ-1',
  anzsco_code: '261313',
  title: 'Software Engineer',
  assessing_authority: 'ACS',
  skill_level: 1,
  on_mltssl: true,
  on_stsol: false,
  on_rol: false,
  eligibleVisas: [
    { subclass: '189' as const, name: 'Skilled Independent', color: 'green' as const, eligible: true },
    { subclass: '190' as const, name: 'State Nominated', color: 'blue' as const, eligible: true },
    { subclass: '491' as const, name: 'Regional Skilled', color: 'yellow' as const, eligible: true },
  ],
};

const PACKAGE = {
  id: 'pkg-1',
  package_name: 'Skilled Independent',
  visa_subclass: '189',
  category: 'skilled',
  professional_fees: 4500,
  government_charges: 4640,
  estimated_extras: 1200,
  inclusions: ['Skills assessment support'],
  is_active: true,
  display_order: 1,
};

const INACTIVE_PACKAGE = {
  ...PACKAGE,
  id: 'pkg-3',
  package_name: 'Retired Package',
  visa_subclass: '999',
  is_active: false,
};

/**
 * Renders under the same providers App.tsx supplies.
 *
 * All three are load-bearing rather than ceremony: the calculator reads React
 * Query and renders a Radix `Tooltip` for the work-experience cap, and both
 * throw outside their provider. A component that threw renders nothing, and
 * "nothing" is indistinguishable from a selector that stopped matching — which
 * is the exact confusion this file exists to remove.
 *
 * `retry: false` so a rejected service double fails the assertion now instead
 * of after three silent retries.
 */
function renderAt(ui: React.ReactElement, path = '/') {
  window.history.replaceState({}, '', path);
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return render(
    <QueryClientProvider client={client}>
      <TooltipProvider>
        <MemoryRouter initialEntries={[path]}>{ui}</MemoryRouter>
      </TooltipProvider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  calculateTotal.mockResolvedValue({
    totalPoints: 75,
    breakdown: { AGE: 30, ENGLISH: 20, QUALIFICATIONS: 15, WORK_EXPERIENCE_COMBINED: 10, REGIONAL_STUDY: 0 },
    workCapApplied: false,
    belowPassMark: false,
  });
  useOccupationSearch.mockReturnValue({ results: [], isLoading: false, error: null });
  useRealSearch.mockReturnValue({ results: [], isLoading: false, error: null });
  useSmartSuggestions.mockReturnValue({
    suggestions: { occupations: [], courses: [] },
    isLoading: false,
  });
  resolveIntent.mockResolvedValue({
    intent: 'SKILLED',
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
        residencyType: 'permanent',
        name: 'Points-tested stream',
        caveats: null,
      },
    ],
    employerSponsored: [],
  });
  getPackages.mockResolvedValue([PACKAGE, INACTIVE_PACKAGE]);
  getMyProgress.mockResolvedValue([]);
  isAuthenticated.mockReturnValue(false);
  me.mockResolvedValue(null);
});

// ---------------------------------------------------------------------------
// PointsPage
// ---------------------------------------------------------------------------

describe('PointsPage input selectors', () => {
  it('resolve to the ids the page object uses', () => {
    const { container } = renderAt(<StructuredPointsCalculator />);

    // Ids, not labels: two of the three number inputs have labels that differ
    // only by the word "Overseas"/"Australian", and a label-based locator that
    // loose is a rename away from silently matching the wrong field.
    expect(container.querySelector('#age')).toBeTruthy();
    expect(container.querySelector('#os-work')).toBeTruthy();
    expect(container.querySelector('#au-work')).toBeTruthy();
  });

  it('expose exactly two comboboxes, English first', () => {
    renderAt(<StructuredPointsCalculator />);
    const comboboxes = screen.getAllByRole('combobox');

    // The page object addresses these by index. If a third select is ever
    // added above them, `qualificationTrigger()` starts pointing at the wrong
    // control and every points assertion goes subtly wrong rather than red.
    expect(comboboxes).toHaveLength(2);
    expect(comboboxes[0]).toHaveTextContent(/select your english level/i);
    expect(comboboxes[1]).toHaveTextContent(/select your qualification/i);
  });

  it('render the regional-study toggle as plain named buttons', () => {
    renderAt(<StructuredPointsCalculator />);
    expect(screen.getByRole('button', { name: 'Yes' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'No' })).toBeInTheDocument();
  });
});

describe('PointsPage.prompt / score', () => {
  it('resolve on an incomplete profile', () => {
    const { container } = renderAt(<StructuredPointsCalculator />);

    expect(
      screen.getByText(/select your english level and qualification/i),
    ).toBeInTheDocument();

    // The score element is located by this class in the page object, because
    // it is a motion.span with no accessible name.
    const score = container.querySelector('span.text-6xl');
    expect(score).toBeTruthy();
    expect(score).toHaveTextContent('—');

    // And nothing was asked of the engine — the assertion points.spec.ts opens with.
    expect(calculateTotal).not.toHaveBeenCalled();
  });
});

// The scorecard's other strings — "Pass mark met (65+)", "Below pass mark
// (65)", the breakdown heading and the work-cap note — are only reachable once
// both Radix selects have a value, and Radix's listbox does not open under
// jsdom. They are asserted in points.spec.ts against a real browser. Their
// literal text is pinned here so a rename still trips something fast:
describe('PointsPage scorecard copy', () => {
  it('is spelled the way the page object matches it', async () => {
    // Read off disk rather than through a `?raw` import: an import that fails
    // to resolve would have to be caught, and a caught failure turns this into
    // a test that passes by doing nothing. `readFileSync` either produces the
    // source or throws.
    // Resolved from the repo root rather than `import.meta.url`: under Vitest
    // the module URL is a dev-server http:// URL, not a file:// one.
    const { readFileSync } = await import('node:fs');
    const { resolve } = await import('node:path');
    const source = readFileSync(
      resolve(
        process.cwd(),
        'src/components/wizard/StructuredPointsCalculator.tsx',
      ),
      'utf8',
    );

    expect(source).toContain('Pass mark met (65+)');
    expect(source).toContain('Below pass mark (65)');
    expect(source).toContain('capped at the legal maximum of 20 points');
    expect(source).toMatch(/Couldn.t calculate your score/);
  });
});

// ---------------------------------------------------------------------------
// HomePage
// ---------------------------------------------------------------------------

describe('HomePage entry-state selectors', () => {
  it('resolve to both tracks and the audit fallback', () => {
    renderAt(<HeroSection />);

    // The product's central claim, asserted as three locators. Losing any one
    // of them drops a whole category of visitor without breaking the page.
    expect(
      screen.getByRole('heading', { name: /work & study track/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /family & partner track/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /check family & partner pr eligibility/i }),
    ).toBeInTheDocument();

    // The dashed fallback card is one button wrapping both lines of copy, so
    // its accessible name contains the audit's name too. The page object
    // matches the first line deliberately — see the comment there.
    const audit = screen.getByRole('button', { name: /unsure of your visa standing/i });
    expect(audit).toHaveTextContent(/60-Second Onshore Strategy Audit/i);

    expect(
      screen.getByPlaceholderText(/search an occupation, anzsco code/i),
    ).toBeInTheDocument();
  });

  it('render the default hero copy when site config is absent', () => {
    // Both strings are `||` fallbacks behind a CMS value. If the CMS is empty
    // — which is its state today — these are what ships.
    renderAt(<HeroSection />);
    expect(
      screen.getByRole('heading', { name: /your pathway to australian migration/i }),
    ).toBeInTheDocument();
  });
});

describe('HomePage.suggestion / group headers', () => {
  it('resolve when the smart search has results', () => {
    useSmartSuggestions.mockReturnValue({
      suggestions: {
        occupations: [{ type: 'occupation', anzscoCode: '261313', title: 'Software Engineer' }],
        courses: [
          { type: 'course', id: 'c1', courseName: 'Master of Nursing', university: 'Deakin University' },
        ],
      },
      isLoading: false,
    });

    renderAt(<HeroSection />);
    fireEvent.change(
      screen.getByPlaceholderText(/search an occupation, anzsco code/i),
      { target: { value: 'so' } },
    );

    // Group headers are list items, same as the rows — which is why the page
    // object filters `listitem` by text rather than reaching for a heading.
    const items = screen.getAllByRole('listitem');
    const texts = items.map((li) => li.textContent ?? '');
    expect(texts.some((t) => /^Occupations$/.test(t))).toBe(true);
    expect(texts.some((t) => /Courses \/ Degrees/.test(t))).toBe(true);
    expect(texts.some((t) => /Software Engineer/.test(t))).toBe(true);
    expect(texts.some((t) => /Master of Nursing/.test(t))).toBe(true);
  });

  it('send the ANZSCO code, not the title, when a suggestion is chosen', async () => {
    // The contract home.spec.ts asserts end to end. Pinned here too because
    // it is a one-word change in SmartSearch.commit() away from silently
    // classifying every picked occupation as UNKNOWN.
    useSmartSuggestions.mockReturnValue({
      suggestions: {
        occupations: [{ type: 'occupation', anzscoCode: '261313', title: 'Software Engineer' }],
        courses: [],
      },
      isLoading: false,
    });

    renderAt(<HeroSection />);
    const input = screen.getByPlaceholderText(/search an occupation, anzsco code/i);
    fireEvent.change(input, { target: { value: 'software' } });

    const row = screen
      .getAllByRole('listitem')
      .find((li) => /ANZSCO 261313/.test(li.textContent ?? ''));
    expect(row).toBeTruthy();
    fireEvent.click(row!);

    expect(resolveIntent).toHaveBeenCalledWith('261313');
  });
});

describe('HomePage skilled split-screen selectors', () => {
  it('resolve after a query classifies as SKILLED', async () => {
    renderAt(<HeroSection />);
    const input = screen.getByPlaceholderText(/search an occupation, anzsco code/i);
    fireEvent.change(input, { target: { value: '261313' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(
      await screen.findByRole('heading', { name: /^Software Engineer$/ }),
    ).toBeInTheDocument();

    expect(screen.getByRole('heading', { name: /^points-tested$/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /^employer-sponsored$/i })).toBeInTheDocument();
    expect(screen.getByText(/Subclass 189/)).toBeInTheDocument();

    // The empty stream still renders, and says why. Hiding it would read as
    // "not assessed" rather than "assessed, no options".
    expect(
      screen.getByText(/no direct eligibility via this stream/i),
    ).toBeInTheDocument();

    expect(screen.getByRole('button', { name: /new search/i })).toBeInTheDocument();

    // The entry state is gone — the assertion that proves the hero switched
    // rather than appended.
    expect(
      screen.queryByRole('heading', { name: /work & study track/i }),
    ).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// SearchPage
// ---------------------------------------------------------------------------

describe('SearchPage.input', () => {
  it('resolves by its placeholder', () => {
    renderAt(<OccupationSearchTool />);
    expect(
      screen.getByPlaceholderText(/search by occupation or anzsco code/i),
    ).toBeInTheDocument();
  });
});

describe('SearchPage dropdown selectors', () => {
  it('resolve when there are results', async () => {
    useOccupationSearch.mockReturnValue({
      results: [OCCUPATION],
      isLoading: false,
      error: null,
    });
    useRealSearch.mockReturnValue({
      results: [{ title: 'Software Engineer — 189 pathway', description: 'Skilled Independent' }],
      isLoading: false,
      error: null,
    });

    renderAt(<OccupationSearchTool />);
    fireEvent.change(
      screen.getByPlaceholderText(/search by occupation or anzsco code/i),
      { target: { value: 'software' } },
    );

    expect(screen.getByText('Search Results')).toBeInTheDocument();

    // Both section headers are `<div>`s. The page object relies on that for
    // "Occupations" specifically, because the stats strip on the page around
    // this component uses the same word in a `<span>`.
    const occupations = screen.getByText('Occupations');
    expect(occupations.tagName).toBe('DIV');
    expect(screen.getByText('General Results').tagName).toBe('DIV');

    // Suggestions are addressed as list items.
    const items = screen.getAllByRole('listitem');
    expect(items.some((li) => /Software Engineer/.test(li.textContent ?? ''))).toBe(true);
  });
});

describe('SearchPage eligibility-card selectors', () => {
  it('resolve against a rendered card', () => {
    renderAt(<VisaEligibilityCard occupation={OCCUPATION as never} />);

    expect(screen.getByText('Visa Eligibility')).toBeInTheDocument();
    expect(screen.getByText(/3 Visas Available/)).toBeInTheDocument();

    // The three row descriptions the page object locates by — deliberately not
    // the subclass numbers, which repeat elsewhere on the page.
    expect(screen.getByText(/No sponsorship required/i)).toBeInTheDocument();
    expect(screen.getByText(/Requires state\/territory nomination/i)).toBeInTheDocument();
    expect(screen.getByText(/Provisional regional visa/i)).toBeInTheDocument();

    // List pills carry a ✓/✗ prefix in the same text node as the list name.
    expect(screen.getByText(/[✓✗]\s*MLTSSL/)).toBeInTheDocument();
    expect(screen.getByText(/[✓✗]\s*STSOL/)).toBeInTheDocument();
    expect(screen.getByText(/[✓✗]\s*ROL/)).toBeInTheDocument();

    expect(screen.getByText('ACS')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /start assessment/i })).toBeInTheDocument();
  });

  it('counts only the eligible visas', () => {
    // Mirrors the STSOL-only case in search.spec.ts: an occupation off the
    // MLTSSL must not be shown a 189.
    const stsolOnly = {
      ...OCCUPATION,
      title: 'Registered Nurse',
      on_mltssl: false,
      on_stsol: true,
      eligibleVisas: [
        { subclass: '189' as const, name: 'Skilled Independent', color: 'green' as const, eligible: false },
        { subclass: '190' as const, name: 'State Nominated', color: 'blue' as const, eligible: true },
        { subclass: '491' as const, name: 'Regional Skilled', color: 'yellow' as const, eligible: true },
      ],
    };
    renderAt(<VisaEligibilityCard occupation={stsolOnly as never} />);
    expect(screen.getByText(/2 Visas Available/)).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// AuthPage
// ---------------------------------------------------------------------------

describe('AuthPage field selectors', () => {
  it('resolve on the login form', () => {
    const { container } = renderAt(<Auth />, '/auth?intent=login');

    expect(container.querySelector('#email')).toBeTruthy();
    expect(container.querySelector('#password')).toBeTruthy();

    // Signup-only fields must be absent, or a spec that fills them would pass
    // against the wrong form.
    expect(container.querySelector('#fullName')).toBeNull();
    expect(container.querySelector('#confirmPassword')).toBeNull();
  });

  it('resolve on the signup form, including the persona ids', () => {
    const { container } = renderAt(<Auth />, '/auth?intent=signup');

    expect(container.querySelector('#fullName')).toBeTruthy();
    expect(container.querySelector('#confirmPassword')).toBeTruthy();

    // The page object clicks these by id. They are the persona slugs the API
    // receives verbatim as `personaType`.
    for (const persona of ['student', 'skilled', 'onshore-skilled', 'partner', 'employer']) {
      expect(container.querySelector(`#${CSS.escape(persona)}`)).toBeTruthy();
    }
  });
});

describe('AuthPage.submitButton', () => {
  it('is unambiguous in both modes', () => {
    // The reason the page object pins `type=submit` rather than a label: in
    // signup mode the submit reads "Create Account" and the toggle beneath it
    // reads "Sign in", so a name-based locator covering both modes matches
    // two elements and fails Playwright's strict mode.
    const login = renderAt(<Auth />, '/auth?intent=login');
    expect(login.container.querySelectorAll('button[type="submit"]')).toHaveLength(1);
    expect(login.container.querySelector('button[type="submit"]')).toHaveTextContent(/sign in/i);
    login.unmount();

    const signup = renderAt(<Auth />, '/auth?intent=signup');
    expect(signup.container.querySelectorAll('button[type="submit"]')).toHaveLength(1);
    expect(signup.container.querySelector('button[type="submit"]')).toHaveTextContent(
      /create account/i,
    );
  });
});

// ---------------------------------------------------------------------------
// DashboardPage
// ---------------------------------------------------------------------------

describe('DashboardPage selectors', () => {
  it('resolve for a signed-in visitor with a saved pathway', async () => {
    isAuthenticated.mockReturnValue(true);
    me.mockResolvedValue({
      id: 'user-1',
      email: 'ada@example.com',
      fullName: 'Ada Lovelace',
      personaType: 'skilled',
      isAdmin: false,
      pointsScore: 75,
    });
    getMyProgress.mockResolvedValue([
      {
        id: 'progress-1',
        title: 'Software Engineer — 189',
        current_step: 'points_calculator',
        calculated_points: 80,
      },
    ]);

    const { container } = renderAt(<Dashboard />, '/dashboard');

    expect(await screen.findByText('Saved Pathways')).toBeInTheDocument();
    expect(screen.getByText('Software Engineer — 189')).toBeInTheDocument();

    // The quick-stats figure the page object digs out by class. 80, not 75:
    // the saved pathway's calculated score outranks the profile's stale one,
    // which is the assertion auth.spec.ts makes and the reason the two
    // fixtures deliberately disagree.
    const pointsCell = container.querySelector('span.tabular-nums');
    expect(pointsCell).toHaveTextContent('80');

    // The dismiss control is found via the lucide icon class.
    expect(container.querySelector('svg.lucide-x')).toBeTruthy();
  });

  it('resolve in the empty state', async () => {
    isAuthenticated.mockReturnValue(true);
    me.mockResolvedValue({ id: 'user-1', email: 'ada@example.com', fullName: 'Ada Lovelace' });
    getMyProgress.mockResolvedValue([]);

    renderAt(<Dashboard />, '/dashboard');

    expect(await screen.findByText(/no saved pathways yet/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /browse courses/i })).toBeInTheDocument();
  });

  it('resolve on the profile-error state', async () => {
    isAuthenticated.mockReturnValue(true);
    me.mockRejectedValue(new Error('boom'));

    renderAt(<Dashboard />, '/dashboard');
    expect(await screen.findByText(/profile not found/i)).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// QuotePage
// ---------------------------------------------------------------------------

describe('QuotePage selectors', () => {
  it('resolve on the pricing table, and hide retired packages', async () => {
    renderAt(<Quote />, '/quote');

    expect(await screen.findByRole('heading', { name: /skilled migration/i })).toBeInTheDocument();
    expect(screen.getByText('Skilled Independent')).toBeInTheDocument();
    expect(screen.queryByText('Retired Package')).not.toBeInTheDocument();

    expect(
      screen.getByRole('heading', { name: /select a visa subclass/i }),
    ).toBeInTheDocument();
  });

  it('resolve on the summary once a package is chosen', async () => {
    renderAt(<Quote />, '/quote');
    fireEvent.click(await screen.findByText('Skilled Independent'));

    // Two elements now read "Subclass 189" — the card and the summary. This
    // is exactly why the page object takes `.last()`; without it Playwright's
    // strict mode fails here.
    const badges = screen.getAllByText('Subclass 189');
    expect(badges.length).toBeGreaterThan(1);

    // 4500 + 4640 + 1200 - 150 credit.
    expect(screen.getByText('$10,190')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /start application/i })).toBeInTheDocument();
  });

  it('resolve on the application dialog', async () => {
    renderAt(<Quote />, '/quote');
    fireEvent.click(await screen.findByText('Skilled Independent'));
    fireEvent.click(screen.getByRole('button', { name: /start application/i }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByLabelText(/full name/i)).toHaveAttribute('id', 'app-name');
    expect(within(dialog).getByLabelText(/email address/i)).toHaveAttribute('id', 'app-email');
    expect(within(dialog).getByLabelText(/phone number/i)).toHaveAttribute('id', 'app-phone');

    // The honeypot is present and empty. It is positioned off-screen rather
    // than hidden, which is what makes it fillable by a bot and invisible to
    // everyone else.
    const honeypot = within(dialog).getByLabelText(/leave this field blank/i);
    expect(honeypot).toHaveAttribute('id', 'app-website');
    expect(honeypot).toHaveValue('');

    expect(
      within(dialog).getByRole('button', { name: /continue to payment/i }),
    ).toBeInTheDocument();
  });
});
