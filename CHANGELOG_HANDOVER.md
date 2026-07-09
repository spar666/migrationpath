# MigrationPath — Developer Handover & Changelog

A single consolidated record of the full build. The two archives
(`migrationpath-backend.zip`, `migrationpath-frontend.zip`) are complete
repositories with **all changes applied and wired** — module registration in
`app.module.ts`, routes in `App.tsx`, admin nav/routes — so they are ready to push
to GitHub and build.

> **Verification note:** all code was assembled and checked **statically**
> (imports, structure, brace balance). It was **not** compiled or migrated in the
> build environment. Run `npm install && npm run build` and `npm run migration:run`
> on a branch before merging.

---

## 1. Quick start

```bash
# Backend
cd backend && npm install && npm run migration:run && npm run build && npm run start:prod
# Frontend
cd frontend && npm install && npm run build
```

Migrations must run in order (1788 → 1796). See section 5.

## 2. Wiring already applied in these archives

- `backend/src/app.module.ts` registers: `PartnerModule`, `ParentModule`,
  `PolicyConfigModule`, `RegionalPostcodeModule`, `DataFreshnessModule`.
- `frontend/src/App.tsx` adds routes `/partner-audit` and `/parent-audit`.
- Admin sidebar/routes include **Legislative Settings**, **Regional Postcodes**,
  **Occupation Lists**; the duplicate **Occupation Manager** was removed
  (`/admin/occupations` now redirects to `/admin/occupation-master`); the sidebar
  shows green/amber/red freshness dots on the four tracked domains.

## 3. Files deleted

- `frontend/src/components/wizard/MigrationPointsCalculator.tsx` (superseded by
  `StructuredPointsCalculator`).
- `frontend/src/components/admin/OccupationListManager.tsx` (duplicate occupation
  editor on the deprecated `onMltssl` model).

---

## 4. Changelog by session

1. **Occupation/visa relational refactor.** `occupations_list` keyed on
   `anzsco_code`; new `visas` + `occupation_visas` junction; `primary_list` enum;
   single visa-mapping matrix; `POST /admin/occupations/sync-visas`.
2. **Smart Query Intent Router.** `GET /search/intent` (SKILLED/STUDENT/FAMILY/
   UNKNOWN); two-track hero; `SmartSearch`; goal-branching `FastAuditForm`.
3. **Structured points + regional postcode.** `POST /points/calculate/total`;
   `PostcodeValidatorService` derives regional; course postcode fields; live GSM
   calculator replaces the old one.
4. **Partner evidentiary engine.** `POST /partner/audit`; four weighted pillars;
   BDM waiver; 820/309; `partner_audits`; throttling; wizard + gauge dashboard.
5. **Parent gateway engine.** `POST /parent/audit`; sponsor gate + Balance of
   Family + AoS check; 804/143; wizard + eligibility dashboard.
6. **Occupation-logic consolidation.** `search`, `visa-recommendation`, and points
   `getOccupationPoints` all derive from `OccupationsService`
   (`getCanonicalNameMap`); removed the hard-coded 189/190/491 recommendation.
7. **Course Manager admin fix.** Replaced the manual "Regional Points" toggle with
   a Campus Postcode field + read-only auto-classification.
8. **Lean course/university.** Dropped `annualFees`/`duration`; occupation title
   auto-resolved from the master; removed the duplicate dynamic-points/roadmap
   logic; slimmed the module; removed `GET /courses/:id/pathway`.
9. **Conversion polish.** One shared `ConsultationCTA` (single label/route) across
   hero, both previews, both dashboards; family track funnels into `/partner-audit`;
   course-preview leak plugged; duplicate **Occupation Manager** screen removed.
10. **Dynamic legislative settings.** New `policy_config` table + `PolicyConfigService`
    + **Legislative Settings** admin screen. The previously hard-coded scalars —
    GSM pass mark/caps, all partner pillar weights/thresholds, and the parent gates
    (sponsor months, balance ratio, AoS baseline, pension age) — are now
    admin-editable with a source note + effective date. Engines read them at runtime
    with the original values as fallbacks, so behaviour is unchanged until edited.
    (The points age/English/work brackets were already dynamic via `points_config`.)
11. **Accuracy backbone + freshness system.**
    - **Regional postcodes dynamic:** new `regional_postcode_bands` table (seeded
      from the old static set) + **Regional Postcodes** admin screen (CRUD + CSV
      bulk import). `PostcodeValidatorService` reads a warm in-memory cache from it
      and falls back to the static set only if empty, so `validate()` stays
      synchronous.
    - **Occupation-list bulk sync:** **Occupation Lists** screen +
      `POST /admin/occupations/import-lists` to bulk-set MLTSSL/STSOL/ROL/CSOL by
      ANZSCO code and re-resolve the visa junction (separate
      `OccupationListImportService`).
    - **Colour-coded freshness:** new `data_source_meta` table + `data-freshness`
      API. Sidebar shows green/amber/red dots per domain, each relevant screen has a
      freshness badge + "Mark verified" button. Everything starts red until verified.
      Status: `current` within 75% of the review interval, `review` past 75%,
      `stale` past 100% or never verified.

---

## 5. Database migrations (run in order)

```
1788 CreateVisasAndOccupationVisas
1789 AddCoursePostcodeFields
1790 SeedStructuredPointsRules
1791 CreatePartnerAudits
1792 CreateParentAudits
1793 LeanCourseFields            (drops courses.annual_fees, courses.duration)
1794 CreatePolicyConfig          (creates + seeds policy_config)
1795 CreateDataSourceMeta        (creates + seeds the 4 freshness domains)
1796 CreateRegionalPostcodeBands (creates + seeds regional_postcode_bands)
```

## 6. API endpoints (new / changed)

| Method | Path | Auth |
| --- | --- | --- |
| POST | `/api/v1/admin/occupations/sync-visas` | admin |
| POST | `/api/v1/admin/occupations/import-lists` | admin |
| GET  | `/api/v1/search/intent?q=` | public |
| POST | `/api/v1/points/calculate/total` | public |
| POST | `/api/v1/partner/audit` | public (throttled) |
| POST | `/api/v1/parent/audit` | public (throttled) |
| GET / PUT | `/api/v1/admin/policy-config[/:key]` | admin |
| GET / POST / PUT / DELETE | `/api/v1/admin/regional-postcodes[/:id]` (+ `/bulk-import`) | admin |
| GET | `/api/v1/admin/data-freshness` | admin |
| POST | `/api/v1/admin/data-freshness/:domain/verify` | admin |
| PUT | `/api/v1/admin/data-freshness/:domain` | admin |

`GET /courses/:id/pathway` was **removed**; course detail is now `GET /courses/:id`.

---

## 7. Admin-editable data & what to keep current

Everything legislatively sensitive is now DB-backed and editable from the Admin
Suite. The freshness dots flag *when* each needs re-checking; a human still
confirms the *values*.

| Data | Table | Admin screen | Cadence |
| --- | --- | --- | --- |
| Points brackets (age/English/work) | `points_rules` / `points_config` | Points Configuration | — |
| Legislative scalars (pass mark, partner weights, parent gates, AoS baseline) | `policy_config` | Legislative Settings | 90d |
| Regional postcode bands | `regional_postcode_bands` | Regional Postcodes | 180d |
| Skilled-list membership (MLTSSL/STSOL/ROL/CSOL) | `occupations.primary_list` | Occupation Lists | 365d |
| Invitation rounds | (existing) | Live Invitations | 30d |

Manual upkeep loop: an admin presses **Mark verified** after checking a domain
against its instrument (turns the dot green, resets the clock); paste periodic
occupation-list / invitation-round updates; and have a **registered MARA agent**
sign off the partner/parent heuristic values.

## 8. Legislative accuracy

The GSM points test is genuine legislated math. The partner pillar weights and the
parent AoS baseline are **indicative heuristics** — now admin-editable, but still
requiring MARA sign-off against current instruments. The partner and parent
dashboards display disclaimers to that effect.

## 9. Known outstanding / recommended next

- **Analytics/event instrumentation** — track assessment starts, step drop-off,
  completions, and consultation bookings so conversion is measured, not assumed.
- **Progressive email capture** at the result step (before the all-or-nothing
  booking) to convert not-ready-yet users.
- **Secondary-CTA sweep** — demote the remaining marketing/pathway CTAs to
  secondary styling using the shared `ConsultationCTA`.
- `Invitation.occupation` is matched by free-text name in search; re-key it on
  `anzsco_code`.
- `PathwayPreviewSheet` / `PathwayPreviewDrawer` still duplicate inner logic
  (mobile/desktop pair) — optional body-merge.
- `getOccupationPoints` returns hard-coded modifier values; `user-points`
  save/compare use a naive sum that can double-count a breakdown carrying both a
  total and its parts.
- Decide the fate of the `/pathways/*` marketing pages now that the hero funnels
  into the assessments (keep as SEO landing pages, or retire).
