# MigrationPath — Removal Manifest

**Companion to `CODE_AUDIT_2026-08-17.md`.** Every path below was read from the live working trees on 17 Aug 2026.

**Legend**
`DELETE` remove the file/directory · `EDIT` file survives, lines come out · `MIGRATION` needs a TypeORM migration, not a file delete · `KEEP` explicitly do **not** remove, despite the to-do list

Counts are non-spec source files unless noted. Specs go with their subject.

---

## STEP 0 — Housekeeping (before anything)

| Action | Path | Note |
|---|---|---|
| Commit separately | backend `dist/**`, `.pnp.cjs`, `.yarn/`, `__probe*.js`, `__verify*.js`, `__e2e.js`, `__pricecheck.js`, `__urlcheck.js` | Already staged for deletion. ⚠ Confirm Vercel builds from source before committing a tree without `dist/` |
| Verify then delete | backend root `1777010968411-AddCourseFieldsTest.ts` | Stray migration **outside** `src/database/migrations/`. Confirm never applied to Supabase |
| Commit separately | frontend ~30 root `*.md` handover docs, `.lovable/`, `.continue/`, `.env.additions` | Already staged |

---

## STEP 1 — Copy & dead code (zero build risk)

### Unverifiable claims — `EDIT`

| File | Line | Remove |
|---|---|---|
| `frontend/src/components/home/HeroSection.tsx` | 144 | `"Trusted by 10,000+ migrants"` |
| `frontend/src/pages/Auth.tsx` | 603, 642 | `"Join 10,000+ migrants…"` ×2 |
| `frontend/src/components/onshore/StrategyPreviewCard.tsx` | 249 | `"10,000+ Visas Processed"` (file dies at Step 5; strip the claim now) |

⚠ **Not** `AdminOverview.tsx:114-119` "AI-Powered Insights" — it's inside `/admin/*` behind `AdminGate`, never public. No change needed.

### Closed visas — `EDIT` (only 2 live references exist)

| File | Line | Change |
|---|---|---|
| `frontend/src/types/migrationRules.ts` | 18 | drop `"188"` from the `VisaType` union |
| `frontend/src/types/migrationRules.ts` | 44 | drop the `Business Innovation (188)` row from `VISA_TYPES` |
| `backend/src/points-engine/user-points.service.ts` | 116 | drop `visaType: '188'` |

Same file, same commit — two adjacent defects:
- `migrationRules.ts:47` — `482` is labelled **"Temporary Skill Shortage"**. Renamed **Skills in Demand** Dec 2024.
- `migrationRules.ts:39-49` — `VISA_TYPES` is **missing `494`, `191`, `485`**, all FEATURE per §0a.

`132 / 489 / 187 / 124 / Global Talent / Distinguished Talent` — **zero matches in either repo.** If they're still live they're **Strapi CMS content**. Check the CMS separately; there is nothing to do in code.

### Document vault — `DELETE` (already gone backend-side)

| Action | Path | Note |
|---|---|---|
| `DELETE` | `frontend/src/types/document.ts` | `DocumentStatus`, `UserDocument`. **Zero consumers** |
| `EDIT` | `frontend/src/types/index.ts:37-41` | drop the re-export block |
| `DELETE` | `frontend/src/components/admin/AdminSettings.tsx:24-105` | "Purge Old Rejected Documents" — calls a dead endpoint, always errors |
| `EDIT` | `frontend/src/types/migrationRules.ts:31-39` | `DocumentRequirement` interface |
| `KEEP` | backend | Nothing to do — migration `1785000000000-AddPointsValueAndRemoveUserDocuments` already dropped it |

### Dead UI — `DELETE`

| Path | Why |
|---|---|
| `frontend/src/components/common/navbar/Header.tsx:240-247` | The standalone search icon `<Button>` — **no `onClick`, no handler**. Dead control. Resolves §7a's "double search" question |

---

## STEP 2 — Admin login (⚠ BLOCKER — build before any Step 6 work)

Nothing is removed here. This exists because Step 6 is impossible without it.

| Action | Path | Change |
|---|---|---|
| `CREATE` | `frontend/src/pages/AdminLogin.tsx` + route | non-public admin login |
| `EDIT` | `frontend/src/hooks/useAdminAuth.ts:27, 37` | `navigate("/auth")` → new admin login |
| `EDIT` | `frontend/src/hooks/useAdminAuth.ts:57, 70` | `navigate("/dashboard")` → new admin login |
| `EDIT` | `frontend/src/lib/apiClient.ts:85` | `window.location.href = '/auth'` → new admin login |
| `EDIT` | `frontend/src/lib/apiClient.test.ts:284, 328` | assertions expect `'/auth'` |
| `EDIT` | `frontend/src/components/common/navbar/Header.tsx:88-108` | remove the `authService.me()` call from the **public** Header |

---

## STEP 2b — Repoint signup CTAs (⚠ before `/auth` is deleted)

§7b calls this "add end-of-page CTA." It's a **repoint** — the CTAs exist and point at user registration, violating Ground Rule 1 on pages you're keeping.

| File | Lines | Current target | New target |
|---|---|---|---|
| `frontend/src/pages/pathways/SkilledPathway.tsx` | 109, 227 | `/auth?intent=signup&persona=skilled` | points calculator |
| `frontend/src/pages/pathways/PartnerPathway.tsx` | 94, 210 | `/auth?intent=signup&persona=partner` | `/partner-audit` |
| `frontend/src/pages/pathways/EmployerPathway.tsx` | 86, 211 | `/auth?intent=signup&persona=employer` | `/pre-screen` |

`OnshorePathway.tsx:215` and `StudentPathway.tsx:110,232` also carry them, but those files die at Steps 5 and 3.

---

## STEP 3 — Clean removals (no build coupling)

### Quote / pricing

| Action | Path | Files |
|---|---|---|
| `EDIT` **first** | `frontend/src/components/home/FinalCTA.tsx:106` | `navigate("/quote")` → Get Started. ⚠ **Only CTA on the homepage's closing section** — repoint before deleting or the homepage ends in a 404 |
| `DELETE` | `frontend/src/components/quote/` | 6 files: `CostBreakdown`, `PaymentMilestones`, `QuoteSlideOver`, `QuoteSummary`, `StartApplicationFlow`, `VisaCard` |
| `DELETE` | `frontend/src/pages/Quote.tsx` | |
| `DELETE` | `frontend/src/services/pricingService.ts` | |
| `EDIT` | `frontend/src/App.tsx:12, 78` | import + `/quote` route |
| `EDIT` | `frontend/src/components/common/navbar/Header.tsx` | `:15` import · `:224-231` desktop "Get Quote" · `:343` mobile "Get Quote" · `:380` `<QuoteSlideOver>` render — **4 sites**, all needed to compile |
| `EDIT` | `frontend/src/toolSelectors.test.tsx:57-58`, `services/services.test.ts:17,41-71` | pricingService mocks |
| `DELETE` | `backend/src/pricing/` | 4 src + 4 dto/entity. Only consumer: `app.module.ts:20,84` |
| `MIGRATION` | `service_packages`, `quotes` tables | from `1775755120471-InitialSchemaMigration` |

### Parent

| Action | Path |
|---|---|
| `DELETE` | `frontend/src/components/parent/` — `ParentAuditWizard.tsx`, `ParentEligibilityDashboard.tsx` |
| `DELETE` | `frontend/src/pages/ParentAudit.tsx`, `frontend/src/services/parentService.ts` |
| `EDIT` | `frontend/src/App.tsx:24, 77` · `services/eligibilityServices.test.ts:15-18, 200-230` |
| `DELETE` | `backend/src/parent/` — `parent-audit.engine.ts`, `parent.controller.ts`, `parent.module.ts` + 2 dto + 1 entity |
| `EDIT` | `backend/src/app.module.ts:37, 95` |
| `MIGRATION` | `parent_audits` — `1792000000000-CreateParentAudits` |

### Fully isolated backend modules

Each verified: **`app.module.ts` is the only external consumer.**

| Action | Path | Files | app.module lines |
|---|---|---|---|
| `DELETE` | `backend/src/visa-recommendation/` | 3 src + 1 dto (+2 specs) | 29, 90 |
| `DELETE` | `backend/src/analytics/` | 4 src + 1 entity | 22, 86 |
| `DELETE` | `backend/src/user-progress/` | 4 src + 2 dto + 1 entity | 32, 101 |

`analytics` has **zero** consumers — that answers the doc's "keep if used, else remove": **remove.**
`MIGRATION`: `user_progress` (`1779385055809`), `analytics_events`, `visa_recommendations`.

### Student pathway

| Action | Path |
|---|---|
| `DELETE` | `frontend/src/pages/pathways/StudentPathway.tsx` |
| `EDIT` | `frontend/src/pages/pathways/index.ts` · `App.tsx:26, 83` · `Header.tsx:31-36` (Pathways dropdown entry 1) |

---

## STEP 4 — Courses, then postcode (⚠ ORDER REVERSED vs the to-do list)

`courses/courses.module.ts:6` imports `PostcodeModule`; `courses.service.ts:6` injects `PostcodeValidatorService`. **`PostcodeModule`'s only consumer is `CoursesModule`** — it isn't even registered in `app.module.ts`. Delete `postcode/` first and the backend stops compiling.

### 4a. Untangle `search` and `stats` — `EDIT`

| File | Lines | Change |
|---|---|---|
| `backend/src/search/search.module.ts` | 6, 12 | drop `Course` from the import and `forFeature([Course, Invitation])` |
| `backend/src/search/search.service.ts` | 4, 82-83, 86-100, 103-130, 157-162, 185-267, 360-374 | **~10 call sites.** The whole result shape is course-centric (`sampleCourses`, `courseTitle`, `buildPathways(courses, invitations)`). Largest single job in the removal set |
| `backend/src/search/intent.service.ts` | 4 | `Course` entity; `intent.service.spec.ts:5` too |
| `backend/src/search/dto/search-query.dto.ts` | 5, 30-34 | `COURSE = 'course'` enum member + `course?` filter |
| `backend/src/search/search.controller.ts` | 25-32, 44, 51 | "Search courses and occupations", `searchCoursesAndOccupations`, "universities and courses" |
| `backend/src/stats/stats.module.ts` | 5, 9 | drop `Course` |
| `backend/src/stats/stats.service.ts` | 4, 10-11, 17-28 | drop `courses` count + `DISTINCT universityName` |

### 4b. ⚠ Two decisions that must be made here

**(i) The homepage stats strip — §1 and §3 are mutually exclusive.**
`HeroSection.tsx:47-65, 275-277` renders Courses / Occupations / Universities from `statsService`. Two of three count off the `Course` table. The "1+" you saw is the real count from a near-empty table. You cannot "fix the stats to be real" *and* delete the table. **Recommended:** collapse to one honest tile — `occupations.count()` survives.

**(ii) Search degrades silently if the invitation table goes dormant.**
`search.service.ts:110, 159, 187, 360-374` reads `invitations` to annotate results with `visa_subclass`, `age_points`, `priority`. §2's "leave DB table dormant" means every search result quietly loses its visa annotation. Decide: accept it, or give search its own visa mapping.

### 4c. Delete courses

| Action | Path |
|---|---|
| `DELETE` | `backend/src/courses/` — `courses.controller.ts`, `courses.module.ts`, `courses.service.ts` + `dto/course.dto.ts` + `entities/course.entity.ts` |
| `EDIT` | `backend/src/app.module.ts:31, 100` |
| `DELETE` | `frontend/src/services/courseService.ts` |
| `DELETE` | `frontend/src/components/admin/CourseManager.tsx` (20 KB) |
| `EDIT` | `frontend/src/pages/Admin.tsx:43` route · `components/admin/index.ts` · `AdminSidebar.tsx` |
| `MIGRATION` | `courses` table — touched by `1775756000000`, `1775760000000`, `1789000000000`, `1793000000000` |

### 4d. Then delete postcode

| Action | Path | Note |
|---|---|---|
| `DELETE` | `backend/src/postcode/` — `postcode.module.ts`, `postcode-validator.service.ts` (+spec) | Not registered in `app.module.ts` |
| `DELETE` | `backend/src/regional-postcode/` — controller, module, service + dto + entity |
| `EDIT` | `backend/src/app.module.ts:39, 98` |
| `DELETE` | `frontend/src/services/regionalPostcodeService.ts` · `components/admin/RegionalPostcodeManager.tsx` |
| `EDIT` | `frontend/src/pages/Admin.tsx:40` route · `components/admin/index.ts` · `AdminSidebar.tsx` |
| `MIGRATION` | `regional_postcode_bands` (`1796000000000`) **and** the `'regional_postcodes'` seed row in `1795000000000-CreateDataSourceMeta:31-34` pointing at `/admin/regional-postcodes` |

✅ **The calculator's regional-study question is unaffected** — it's a `REGIONAL_STUDY` row in `points_rule`, keyed on the boolean `profile.regionalStudy`, not a postcode lookup. The doc's ⚠ is satisfied. Note `postcode-validator.service.ts:2` imports `REGIONAL_STUDY_POINTS` from the points catalogue; that import dies with the file, the constant stays.

---

## STEP 5 — Onshore (⚠ RECLASSIFIED §2 → §3, 10 external sites)

The to-do list files this under "clean, no entanglement." It is in **live homepage copy and five admin surfaces**.

| Action | Path | Lines |
|---|---|---|
| `DELETE` | `frontend/src/components/onshore/` | `FastAuditForm.tsx` (18 KB), `QuickAuditModal.tsx` (15 KB), `StrategyPreviewCard.tsx`, `index.ts` |
| `DELETE` | `frontend/src/pages/pathways/OnshorePathway.tsx` | |
| `EDIT` | `App.tsx` | 28, 86 |
| `EDIT` | `components/home/HeroSection.tsx` | **260** — live CTA *"Take our 60-Second Onshore Strategy Audit"* |
| `EDIT` | `components/home/PathwayCards.tsx` | **109, 118** — *"Onshore vs. Offshore Pathways"* section + card |
| `EDIT` | `components/common/navbar/Header.tsx` | 41-45 — Pathways dropdown entry 3 |
| `EDIT` | `components/admin/SiteConfigEditor.tsx` | 80 — default `heroHeadline: "Onshore to PR Strategy"` |
| `EDIT` | `components/admin/FormLogicEditor.tsx` | 47, 164 |
| `EDIT` | `components/admin/MigrationRulesManager.tsx` | 60 — `onshore` rule category |
| `EDIT` | `components/admin/NewsEditor.tsx` | 58, 67 |
| `EDIT` | `components/admin/UserOversight.tsx` | 27 — persona badge |
| `EDIT` | `components/dashboard/PathwaySwitcher.tsx` | 27 (dies at Step 6) |

⚠ **Plan a data pass, not just a code delete.** `NewsEditor` writes an `"Onshore Skilled"` category into **Strapi content**, and `MigrationRulesManager` uses `onshore` as a live rule category. Existing rows carrying those values orphan.

---

## STEP 6 — Account layer (only safe after Step 2)

### Frontend — `DELETE`

| Path | Note |
|---|---|
| `frontend/src/pages/Auth.tsx` | |
| `frontend/src/pages/Dashboard.tsx` | `:53` redirects to `/auth?intent=login` |
| `frontend/src/components/dashboard/` | `MigrationProgressBar.tsx`, `PathwaySwitcher.tsx`, `PRPointsGauge.tsx` |
| `frontend/src/components/common/navbar/UserMenu.tsx` | `:83, :97` are 2 of the 9 `/dashboard` links |
| `frontend/src/services/authService.ts` (+`.test.ts`) | |
| `frontend/src/services/userProgressService.ts` | |
| `frontend/src/types/user.ts`, `types/auth.ts`, `types/userProgress.ts`, `types/persona.ts` | verify no admin consumer first |

⚠ **`frontend/src/components/auth/` does not exist.** §3 lists it. Nothing to delete.

### Frontend — `EDIT`

| File | Lines |
|---|---|
| `App.tsx` | 13, 22 (imports) · 58, 59 (routes) |
| `components/common/navbar/Header.tsx` | 18 `authService` import · **21** `navLinks[0]` Dashboard · 111 `visibleLinks` filter · 78-108 profile effect · 249-278 `isAuthenticated` branch + Log In · 351-373 mobile branch + Log In |
| `components/common/navbar/MobileBottomNav.tsx` | **9** `/dashboard` · **11** `/auth` — §7b replaces both with Get Started |
| `components/consultation/PreSessionQuestionnaire.tsx` | `authService` import |
| `types/index.ts` | re-exports of the deleted type files |
| `toolSelectors.test.tsx` | 532, 600-631 |

### Backend — `EDIT` only. ⚠ `auth/` is **KEEP**

| Action | Path | Why |
|---|---|---|
| `KEEP` | `backend/src/auth/` **entire module** | `JwtAuthGuard` / `RolesGuard` / `@Roles` are consumed by **12 modules**, incl. `admin`, `leads`, `prospect`, `consultation`, `payments`, `partner`, `points-engine`, `migration-rules`, `data-freshness` — all on your KEEP list |
| `EDIT` | `backend/src/auth/auth.controller.ts:26-34` | remove `POST /auth/signup` — the public registration endpoint |
| `EDIT` | `backend/src/auth/dto/sign-up.dto.ts` | goes with it |
| `KEEP (reduced)` | `backend/src/user-profile/` | ⚠ **Not optional.** `auth/auth.service.ts:17`, `auth/auth.module.ts:12` and `admin/entities/activity-log.entity.ts:10` all import `Profile`. Remove the end-user controller surface; **keep `entities/profile.entity.ts`** |
| `KEEP (reduced)` | `backend/src/notifications/` | ⚠ `auth/auth.service.ts:18` + `auth/auth.module.ts:13` import `NotificationPreference`; `user-profile.service.ts:14` imports `NotificationsService`. **Keep `entities/notification.entity.ts`**; remove the end-user preferences controller |
| `MIGRATION` | `users.role` is a **Postgres enum** (`auth/roles.enum.ts` → `app_role`) | Dropping the `USER` member needs a migration, not a file delete. **Simplest: leave the enum alone**, just stop creating `USER` rows |

### Also drop with the account layer — not in the to-do list

| Action | Path | Why |
|---|---|---|
| `DELETE` | `backend/src/points-engine/user-points.service.ts`, `user-points.repository.ts`, `entities/user-points.entity.ts`, `dto/save-points.dto.ts` | Per-user saved scores — account-layer functionality with no home once accounts go. Also the site of the `'188'` reference (Step 1) |
| `EDIT` | `backend/src/points-engine/points-engine.module.ts` | drop those providers |
| `MIGRATION` | `user_points` — `1780000000000-CreateUserPointsTable` | |
| `REVIEW` | `backend/src/points-engine/points-calculator/points-calculator.service.ts` (+spec) | **Likely dead.** The frontend calls `/points/calculate/total` → `PointsAggregatorService`. This older service has a different shape and may have no live caller. Confirm, then delete |

---

## Live Invitations — split across steps

⚠ §2 names only `LiveInvitationsManager`. There are **two** admin surfaces and a backend module `search` depends on.

| Action | Path | Note |
|---|---|---|
| `DELETE` | `frontend/src/components/home/InvitationFeed.tsx` | homepage ticker |
| `EDIT` | `frontend/src/pages/Index.tsx:7, 22` | |
| `DELETE` | `frontend/src/components/admin/LiveInvitationsManager.tsx` (16 KB) | |
| `DELETE` | `frontend/src/components/admin/InviteTrendsManager.tsx` (14 KB) | ⚠ **Second invitations admin surface, not in the to-do list.** Confirm it's the same feature |
| `EDIT` | `frontend/src/pages/Admin.tsx:9, 44` · `components/admin/index.ts` · `AdminSidebar.tsx` | |
| `KEEP` | `backend/src/invitation/` | ⚠ **Do not delete.** `search.module.ts:12` + `search.service.ts:5,84` depend on the `Invitation` entity. Removing the admin write path leaves the read path intact and the table dormant — see Step 4b(ii) |

⚠ **Do not confuse `backend/src/invitation/` with WI-6.** It is the SkillSelect *round-results feed* (`visa_class`, `points`, `priority`), **not** the candidate-invite loop. WI-6 is new work and should not reuse this name.

---

## Not in the to-do list — decide

| Path | Question |
|---|---|
| `frontend/src/components/prospectus/FinalizedStrategyPDF.tsx` (16 KB) | Sole file in its directory, appears in no removal or keep list. Orphan? |
| `frontend/src/components/home/SuccessStories.tsx` + `services/successStoryService.ts` | Renders on the homepage. **Not audited for content provenance.** If the testimonials are fabricated this is a larger Ground Rule 6 problem than a "10,000+" badge |
| `frontend/src/components/home/MigrationOutlookBanner.tsx` | Unreferenced by `Index.tsx` — dead? |
| `frontend/src/components/search/VisaEligibilityCard.tsx` | Check against §7b's "directional copy, no definitive eligibility claim" |
| `backend/src/employer-sponsored/constants/employer-sponsored.config.ts:139-152` | `DELETE` the ⚠ block claiming the occupation check is unwired — **it was wired** at `pre-screen.service.ts:74-78` |
| `backend/src/employer-sponsored/constants/employer-sponsored.config.ts:1-40` | The "DO NOT GO LIVE" header — delete only **after** WI-9 sign-off, per the checklist inside it |

---

## Summary

| Step | Deletes | Edits | Migrations | Risk |
|---|---|---|---|---|
| 0 Housekeeping | staged | — | — | ⚠ verify `dist/` + stray migration |
| 1 Copy & dead code | 3 | ~8 | — | none |
| 2 Admin login | 0 | 6 | — | ⚠ **unblocks everything** |
| 2b Repoint CTAs | 0 | 3 files / 6 CTAs | — | ⚠ before `/auth` goes |
| 3 Clean removals | ~28 | ~12 | 5 tables | low |
| 4 Courses → postcode | ~12 | ~10 | 3 tables + 1 seed row | ⚠ order; `search.service` is the big one |
| 5 Onshore | 5 | 10 | — | ⚠ CMS + rules data pass |
| 6 Account layer | ~12 | ~10 | 1-2 tables | ⚠ blocked on Step 2 |

**Roughly 60 files deleted, 60 edited, ~10 tables retired.**

Three things the to-do list gets wrong that this manifest corrects: `postcode` goes **after** courses, not before; `onshore` is a **careful** removal, not a clean one; and backend `auth/`, `user-profile/`, `notifications/` and `invitation/` are all **KEEP**, not delete.

---

*Static analysis only — no DB queried, no server run, no code modified. Re-confirm every path against live code before deleting, per the doc's own ground rule.*
