# MigrationPath — web client

React single-page app for the MigrationPath migration-advisory product: the
public marketing site, the eligibility and points tools, the consult booking
funnel, and the admin console.

It has no database of its own. Everything comes from the Nest API in the
`migrationpath-backend` repo, addressed through `VITE_API_BASE_URL`.

## Stack

Vite · React 18 · TypeScript · Tailwind + shadcn/ui · React Router · TanStack
Query · Vitest (unit) · Playwright (E2E).

## Getting started

```bash
npm ci
cp .env.example .env
npm run dev          # http://localhost:8080
```

`npm run dev` proxies `/api` to `http://localhost:3000`, so a backend running
locally on its default port needs no extra configuration.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with HMR on port 8080 |
| `npm run build` | Typecheck, then production bundle into `dist/` |
| `npm run preview` | Serve the built bundle |
| `npm run typecheck` | `tsc -b --force`, no emit |
| `npm run lint` | ESLint over the repo |
| `npm test` | Vitest, single run |
| `npm run test:watch` | Vitest in watch mode |
| `npm run test:e2e` | Playwright; starts its own dev server |

## Environment

`.env.example` is the reference. `VITE_API_BASE_URL` is the only required
variable; the rest have working defaults.

| Variable | Purpose |
| --- | --- |
| `VITE_API_BASE_URL` | Backend origin, including the `/api/v1` prefix |
| `VITE_CALENDLY_CONSULT_URL` | Calendly event the consult is booked against. `lib/booking.ts` appends the prospect id as `utm_content`, which is how the Calendly webhook links a booking back to its prospect — the funnel breaks silently without it |
| `VITE_API_DEBUG` | Logs every request and response |
| `VITE_REQUEST_TIMEOUT`, `VITE_MAX_RETRIES` | API client tuning |
| `VITE_ENABLE_ANALYTICS`, `VITE_ENABLE_LOGGING` | Feature flags |

`.env.staging` and `.env.production` hold the deployed values.

## Layout

```
src/
  components/   Feature-grouped UI; components/ui is shadcn primitives
  pages/        One file per route, wired up in App.tsx
  services/     API calls, one module per backend resource
  hooks/        Data-fetching and stateful UI hooks
  lib/          Framework-free helpers (api client, booking, security)
  contexts/     React context providers
  types/        Shared TypeScript types
e2e/            Playwright specs and page objects
docs/           Longer-form notes
```

## Testing

Unit and component tests sit next to the code they cover and run in jsdom.

Three of them — `e2eSelectors`, `consultSelectors` and `toolSelectors` — are
selector contracts rather than ordinary component tests. They assert the exact
strings the Playwright page objects address the UI by, so a renamed label fails
in under a second with the string in the message, instead of failing twenty
minutes later in the browser suite as a locator timeout. If one goes red, fix
the page object in `e2e/pages/` too; they are the same strings.

## Deployment

Vercel, from `dist/`. `vercel.json` rewrites all paths to `index.html` so
client-side routing survives a hard refresh. CI (`.github/workflows/ci.yml`)
runs lint, typecheck, tests and a build on every push and pull request.
