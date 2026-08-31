# MigrationPath — Pre-Removal Code Audit

**Date:** 17 August 2026
**Scope:** the `CONFIRM FIRST` block, §2/§3 removal targets, §8e backend wire items, and the `‹verify›` legislated values from the developer to-do list.
**Method:** static read of the live working trees at `migrationpath-backend` and `migrationpath-frontend`. No DB access, no dev server, no code changed.

**Verdict in one line:** the to-do list is broadly right about *what* to remove, but wrong about *order* in three places and wrong about *state* in six. Four items are already done. Two are hard blockers that will take the site or the admin down if executed as written.

---

## 0. Repo state warning — read before any branch work

Both working trees are dirty with large, uncommitted deletions already staged/unstaged.

| Repo | Sample of pending deletions |
|---|---|
| backend | `.pnp.cjs`, `.yarn/install-state.gz`, `dist/**` (hundreds of files), `CHANGELOG_HANDOVER.md`, `__probe.js`, `__verify.js`, a stray `1777010968411-AddCourseFieldsTest.ts` migration at repo root |
| frontend | `.yarnrc.yml`, `.lovable/plan.md`, ~30 root-level `*.md` handover docs, `.env.additions` |

Two consequences:

1. **The `dist/` deletions in the backend are not obviously safe.** `vercel.json` and the Vercel build config should be confirmed before committing a tree with `dist/` removed. Check whether the deploy builds from source or serves a committed `dist/`.
2. **A stray migration file sits at the backend repo root** (`1777010968411-AddCourseFieldsTest.ts`), outside `src/database/migrations/`. Confirm it was never applied to the Supabase instance before deleting it.

**Recommendation:** commit or stash the existing deletions as their own reviewable commit *before* starting §1. Mixing them with functional removals makes every later diff unreadable.

---

## 1. CONFIRM FIRST — answers

### 1.1 ⚠ Does admin login use the auth module? — **YES, and worse than assumed. BLOCKER.**

The doc's own suspicion is correct, but understates it. Deleting the account layer as §3 describes takes the admin down through **four** separate paths:

**Backend** — `auth/` provides `JwtAuthGuard`, `RolesGuard` and `@Roles`, consumed by 12 modules including every one on the KEEP list:

```
admin/admin.controller.ts:4-6      → JwtAuthGuard, RolesGuard, Roles
leads/leads.controller.ts:16-17    → both guards
prospect/prospect.controller.ts:16-17
consultation/consultation.controller.ts:16-17
payments/payments.controller.ts:7-8
partner/partner.controller.ts:22-23
points-engine/points-engine.controller.ts:24-25
migration-rules/migration-rule.controller.ts:21-22
data-freshness/data-freshness.controller.ts:12-13
user-profile, courses, user-progress (being removed anyway)
```

`admin/entities/activity-log.entity.ts:9` imports the `User` entity directly. Roles come from `auth/roles.enum.ts` (`app_role.ADMIN`), and `users.role` is a Postgres **enum column** — dropping the enum requires a migration, not a file delete.

**Frontend — the two real blockers.** These are not in the to-do list and they are the reason §3 cannot ship as written:

```
hooks/useAdminAuth.ts:26   → unauthenticated  → navigate("/auth")
hooks/useAdminAuth.ts:65   → not an admin     → navigate("/dashboard")
lib/apiClient.ts:85        → any 401 response → window.location.href = '/auth'
```

§3 deletes `/auth` **and** `/dashboard`. After that: the admin has no login page, a session expiry hard-navigates to a 404, and a failed admin check redirects to a 404. The doc's line *"admin logs in via a non-public route"* describes a route **that does not exist yet**.

`components/common/navbar/Header.tsx:88-108` also calls `authService.me()` on **every public page load**, so `authService` cannot be deleted without editing the shared Header.

> **Required before §3:** build the replacement admin login route first (e.g. `/admin/login`), repoint `useAdminAuth` and the `apiClient` 401 handler at it, and strip the `authService.me()` call out of the public Header. Only then delete `/auth` and `/dashboard`. Backend `auth/` is **KEEP** — remove only the `POST /auth/signup` endpoint (`auth/auth.controller.ts:26-34`) and the `USER` role's public entry points.

### 1.2 Does the calculator read Points Config or hardcoded values? — **DB-driven. But it is missing 7 of 13 factors.**

Good news on the wiring, bad news on the coverage.

**Wiring is already correct.** `points-engine/points-aggregator.service.ts` reads bracket values from the `points_rule` table (`ruleRepo.findActive(visaGroup)`) and reads the two scalars from admin-editable `policy_config`:

```ts
workCap  = policyConfig.getNumber('points.combinedWorkCap', 20)
passMark = policyConfig.getNumber('points.gsmPassMark', 65)
```

`constants/points-catalogue.ts` is the **seed** for the migration `1790000000000-SeedStructuredPointsRules`, not a runtime source — except `GSM_MAX_AGE` (45), which *is* read at runtime and is **not** admin-configurable. That violates Ground Rule 9.

**The seeded values are all correct against the current published table.** Verified factor by factor — see §5.

**The real problem: the calculator only implements 6 of the 13 factors in §0b.** `PointsCategory` has exactly `AGE, ENGLISH, OVERSEAS_WORK, AUSTRALIAN_WORK, QUALIFICATIONS, REGIONAL_STUDY`. Missing:

| Missing factor | Points forgone |
|---|---|
| Specialist education (STEM Masters/PhD) | 5 |
| Australian study requirement | 5 |
| Professional Year | 5 |
| Community language (NAATI) | 5 |
| Partner skills / single applicant | 5–10 |
| State nomination — 190 | 5 |
| State/family sponsorship — 491 | 15 |

**Up to ~45 points of undercount.** A genuine 70-point candidate can be shown a score in the 30s and told they are below the 65 pass mark. That is the *free value* the site leads with (Ground Rule 2), and right now it is wrong in the direction that loses the lead.

Compounding it: only one `visa_group` (`'GSM'`) is seeded, so **189, 190 and 491 all return identical scores.** The 190 (+5) and 491 (+15) nomination points that make those subclasses worth showing separately don't exist. `pointsService.calculateTotal()` sends `visaGroup` but nothing differentiates on it.

> §5 is not "wire the calculator to config" — that's done. §5 is **"add the 7 missing categories and per-subclass nomination points."** Materially bigger than the to-do list implies.

### 1.3 Document vault thread — **largely already removed. §3 is stale.**

The backend vault is **gone**: migration `1785000000000-AddPointsValueAndRemoveUserDocuments.ts` already dropped it. No `documents` module, no `/documents/*` controller. Frontend has no `/documents` route and no `/admin/documents` route (`App.tsx`, `pages/Admin.tsx` both confirmed clean).

What actually survives — three small dead ends:

| Path | What it is |
|---|---|
| `src/types/document.ts` | `DocumentStatus`, `UserDocument` types. Re-exported by `types/index.ts:37-41`. **Zero consumers.** Dead code. |
| `components/admin/AdminSettings.tsx:24-105` | "Purge Old Rejected Documents" panel calling an endpoint that no longer exists. Currently a button that always errors. |
| `types/migrationRules.ts:31-39` | `DocumentRequirement` interface — the doc-vault rows in Migration Rules. |

> §3's document-vault work is ~30 lines of dead-code deletion, not a careful untangle. Downgrade it. There is nothing to untangle. The funnel résumé/JD upload the doc wants to keep **does not exist yet** either — see §4 (WI-7).

### 1.4 `/quote`, "Get Quote" nav, homepage final CTA — destinations confirmed

| Surface | Actual destination | Note |
|---|---|---|
| Homepage final CTA | `components/home/FinalCTA.tsx:106` → `navigate("/quote")` | ⚠ **Only** CTA on the homepage's closing section. Deleting `/quote` without repointing this leaves the homepage ending in a 404. |
| Nav "Get Quote" | `Header.tsx:236-247` → opens `<QuoteSlideOver>`, **not** `/quote` | Not a route link. `Header.tsx:15` imports it, `:380` renders it. Deleting `components/quote/` breaks the Header build until both lines go. |
| Mobile menu "Get Quote" | `Header.tsx:344-351` → same slide-over | |
| `/quote` route | `App.tsx:78` → `pages/Quote.tsx` | Reachable only by direct URL and the FinalCTA. |

Also: `pages/Quote.tsx:96-106` reads a `localStorage` handoff set by `components/quote/StartApplicationFlow.tsx`, which imports `authService` — so the quote tool is tangled into the account layer too. Delete it before §3 and §3 gets simpler.

### 1.5 `courses` references inside search and stats — **confirmed, and this reverses your removal order**

```
search/search.module.ts:6      → Course entity
search/search.service.ts:4,82  → injects Repository<Course>
search/intent.service.ts:4     → Course entity
stats/stats.module.ts:5        → Course entity
stats/stats.service.ts:4,10    → injects Repository<Course>
```

`search.service.ts` is deeply coupled — ~10 call sites, and its whole result shape is course-centric (`sampleCourses`, `courseTitle`, `buildPathways(courses, invitations)`).

**Two order corrections the to-do list gets wrong:**

**(a) `postcode` cannot be removed in §2 — it must wait for courses in §3.**

```
courses/courses.module.ts:6   → imports PostcodeModule
courses/courses.service.ts:6  → injects PostcodeValidatorService
```

`PostcodeModule` has exactly **one** consumer: `CoursesModule`. It isn't even registered in `app.module.ts`. So the real order is **courses first, then postcode/regional-postcode** — the reverse of §2-before-§3. Delete `postcode/` first and the backend stops compiling.

Note `postcode/postcode-validator.service.ts:2` imports `REGIONAL_STUDY_POINTS` from the points catalogue. That import dies with the module; the calculator's own regional-study question is unaffected (it's a `REGIONAL_STUDY` rule row, keyed on the boolean `profile.regionalStudy`). The doc's ⚠ on this is satisfied.

**(b) `search` also depends on the `invitation` module.**

```
search/search.module.ts:12    → TypeOrmModule.forFeature([Course, Invitation])
search/search.service.ts:5,84 → injects Repository<Invitation>
```

§2 says remove the Live Invitations ticker and "leave DB table dormant." Fine for the table — but `search.service` reads `invitations` at lines 110, 159, 187 and derives `visa_subclass`, `age_points` and `priority` from them (`:360-374`). Leaving the table dormant means **search silently degrades**: with no invitation rows, every search result loses its visa-subclass annotation. Decide deliberately whether that's acceptable or whether search needs its own visa mapping.

**(c) §1 and §3 conflict directly.**

`components/home/HeroSection.tsx:47-65` fetches the homepage stats strip from `statsService`, which hits `stats.getStats()`, which returns `{ courses, occupations, universities }` — **two of the three counted off the `Course` table**:

```ts
courses:     courseRepository.count()
universities: DISTINCT course.universityName
occupations:  occupationRepository.count()
```

The "1+" you saw is the *real* count from a near-empty courses table. §1 says "fix homepage stats → real numbers"; §3 deletes the table those numbers come from. **You cannot do both.** Pick one:

- **Recommended:** replace the 3-tile strip with a single honest "N occupations on the current CSOL" tile (`occupations.count()` survives courses removal), or drop the strip entirely.
- Or keep `courses` purely as a stats/search backing table and remove only the public course UI — contradicts §3.

Sequence §1's stats fix **after** the courses decision, or you'll do it twice.

### 1.6 `visa-recommendation` + `analytics` consumers — **both fully isolated. Safe.**

Grepped for every external import. Result for each: **`app.module.ts` only.**

| Module | External consumers | Verdict |
|---|---|---|
| `visa-recommendation` | `app.module.ts:29,90` | ✅ Clean delete |
| `analytics` | `app.module.ts:22,86` | ✅ Clean delete (nothing uses it → answers the doc's "keep if used, else remove": **remove**) |
| `pricing` | `app.module.ts:20,84` | ✅ Clean delete |
| `parent` | `app.module.ts:37,95` | ✅ Clean delete |
| `user-progress` | `app.module.ts:32,101` | ✅ Clean delete |

**Two that are *not* isolated, contradicting §3:**

| Module | Blocking consumers |
|---|---|
| `user-profile` | `auth/auth.service.ts:17`, `auth/auth.module.ts:12`, `admin/entities/activity-log.entity.ts:10` — all import the `Profile` entity |
| `notifications` | `auth/auth.service.ts:18`, `auth/auth.module.ts:13` — import `NotificationPreference`; also `user-profile/user-profile.service.ts:14` |

§3 says *"Keep a minimal user-profile if the admin activity-log needs it."* It does — **and so does `auth`.** Same for `notifications`: `auth` imports `NotificationPreference`, so the entity must survive even if the end-user preference UI goes. Both are **KEEP (reduced)**, not optional.

### 1.7 Open/closed status of featured visas — **verified, see §5**

`858` National Innovation Visa: **open**, permanent, invitation-required, and correctly the Global Talent successor. Safe to feature per §0a.
`494`: **open** to new applications. Safe to label as "→ 191 PR."

---

## 2. Closed-visa cleanup — far smaller than §2 claims

Grepped `188 / 132 / 489 / 187 / 124 / Global Talent / Distinguished Talent / Business Innovation / Business Talent / RSMS` across both `src/` trees.

**Total live references: two.**

| File | Line | Content |
|---|---|---|
| `frontend/src/types/migrationRules.ts` | 18, 44 | `"188"` in the `VisaType` union and `{ id: "188", label: "Business Innovation (188)", group: "Business", action: "Points" }` in `VISA_TYPES` |
| `backend/src/points-engine/user-points.service.ts` | 116 | `visaType: '188'` |

`132`, `489`, `187`, `124`, "Global Talent" and "Distinguished Talent" appear **nowhere** in either codebase. Either they were already removed or they only ever lived in Strapi CMS content — **check the CMS separately**, that's the only place left they can be.

**Two adjacent defects found in the same file** (`types/migrationRules.ts:39-49`), both worth fixing in the same commit:

1. `482` is labelled **"Temporary Skill Shortage (482)"**. It was renamed **Skills in Demand** in December 2024. §0a specifies the new name. This is stale public-facing copy.
2. `VISA_TYPES` is **missing `494`, `191` and `485`** — all three are FEATURE per §0a.

`backend/src/occupations/constants/visa-mapping.ts` is clean of closed subclasses, but note its own header caveat: 485 is mapped under MLTSSL "for continuity with the legacy Graduate Work stream," and the file flags that post-2024 the 485 is largely no longer occupation-list gated. Worth resolving while you're in §0a.

---

## 3. `onshore` is **not** a clean removal — reclassify §2 → §3

§2 lists onshore under "REMOVE — clean (no entanglement)." It has **9 external reference sites**, including two on the homepage and five in admin:

| File | Line | What it is |
|---|---|---|
| `components/home/HeroSection.tsx` | 260 | *"Take our 60-Second Onshore Strategy Audit"* — **live homepage CTA copy** |
| `components/home/PathwayCards.tsx` | 109, 118 | *"Onshore vs. Offshore Pathways"* section + `subtitle="Onshore"` card |
| `components/common/navbar/Header.tsx` | 41-45 | "Onshore Professionals" entry in the Pathways dropdown |
| `components/admin/SiteConfigEditor.tsx` | 80 | default `heroHeadline: "Onshore to PR Strategy"` |
| `components/admin/FormLogicEditor.tsx` | 47, 164 | *"Available visa options for the Onshore Strategy Audit"* |
| `components/admin/MigrationRulesManager.tsx` | 60 | `onshore: { label: "Onshore Skilled", ... }` category |
| `components/admin/NewsEditor.tsx` | 58, 67 | "For Onshore Skilled" news category + "Onshore Skilled Dashboard" target |
| `components/admin/UserOversight.tsx` | 27 | "Onshore Skilled" persona badge |
| `components/dashboard/PathwaySwitcher.tsx` | 27 | `onshore-skilled` persona |
| `components/onshore/StrategyPreviewCard.tsx` | 249 | *"10,000+ Visas Processed"* — a **second** unverifiable claim, per Ground Rule 6 |

The admin references matter most: `NewsEditor` writes an "Onshore Skilled" category into **Strapi CMS content**, and `MigrationRulesManager` uses `onshore` as a live rule category. Existing rows carrying those values will orphan. Plan a data pass, not just a code delete.

---

## 4. §8e backend wire items — actual state

Four of the nine are in better shape than the doc assumes.

| WI | Doc says | Reality | Verdict |
|---|---|---|---|
| **WI-1** occupation check → real `isOnAnyList` | to do | **Already done.** `pre-screen/pre-screen.service.ts:74-78` wires it in `onModuleInit()`: `engine.setOccupationListCheck((code, lists) => occupationsService.isOnAnyList(code, lists))`. The form-checkbox fallback at `employer-sponsored.engine.ts:479` is now unreachable in production. | ✅ **Close it.** Verify `occupations.primary_list` is CSOL-current (that's WI-9) and delete the stale ⚠ comment block at `employer-sponsored.config.ts:139-152` that still claims it's unwired. |
| **WI-2** move config thresholds to admin | to do | Confirmed hardcoded in `employer-sponsored/constants/employer-sponsored.config.ts`. `policy_config` is the right destination and already has `category`, `unit`, `sourceNote`, `effectiveDate` columns — a good fit. **But:** `policy_config.numericValue` is `double precision NOT NULL`. It can hold CSIT/SSIT/English bands/age caps. It **cannot** hold `OCCUPATION_LIST_NAMES`, stream labels, `CLIENT_FIT.servicedSubclasses`, or **any eligibility copy** — which Ground Rule 9 requires be admin-editable. | ⚠ **Needs a schema decision first.** Either add a nullable `text_value`/`json_value` to `policy_config`, or route non-numeric policy through the `site_config` JSONB row. Don't start WI-2 until this is decided. |
| **WI-3** verify Book gates on engine flags | to do | Engine exposes `eligible`, `statutory_eligible`, `client_fit` and a human-readable `reasons[]` (`employer-sponsored.engine.ts:75-105`, `:274-278`). Gating primitives exist and are correct. Frontend gate not yet verified line-by-line. | 🔶 **Verify only** — no backend build needed |
| **WI-4** persist outcome tags + gap codes | to do | Confirmed missing. `prospect.entity.ts` has only `statutory_eligible?: boolean` and `client_fit?: boolean`. Reasons land in `prospect_summary.eligibility` / `.engine_result` **JSONB** (`prospect-summary.entity.ts:31-41`) — stored, but not queryable, so §8d's *"make Leads view filterable by these"* is impossible today. | ❌ **Real work.** Needs a migration adding an indexed `outcome_tag` enum column (`qualified` / `remediable` / `hard_disqualified`) + a `gap_codes text[]` on `prospect`. |
| **WI-5** SBS remediable, LMT never a gate | to do | **LMT already correct.** `employer-sponsored.engine.ts:424-428`: when `rule.requiresLmt` and `lmt_completed === false`, the comment reads *"Not a blocker — LMT is something the sponsor can still go and do"* and it is not pushed to `blockers`. SBS handling needs confirming against `is_standard_business_sponsor` (`:48`). | 🔶 **Mostly done** — verify SBS only |
| **WI-6** candidate-invite loop | needs email provider | An `invitation/` module exists but it is **unrelated** — it's the Live Invitations *feed* (SkillSelect round data: `visa_class`, `points`, `priority`), the thing §2 removes. Don't mistake it for the candidate-invite loop. | ❌ **Real work**, and don't reuse the name |
| **WI-7** file attachment → Supabase storage | to do | No Supabase storage client, no `multer`, no upload service in the backend. The only `FileInterceptor` is `user-profile/user-profile.controller.ts:74` — **inside a module §3 reduces**. | ❌ **Real work.** Note §3 removes the only existing upload plumbing; sequence WI-7 with awareness of that. |
| **WI-8** payment flag on Calendly→Stripe | to do | Confirmed absent: no `PAYMENT_ENABLED`, no feature-flag mechanism anywhere in `src/` or `.env.example`. Stripe/Calendly env keys are all present and wired (`STRIPE_CONSULT_PRICE_ID`, `STRIPE_SUCCESS_URL`, `STRIPE_CANCEL_URL`, `CALENDLY_WEBHOOK_SIGNING_KEY`). | ❌ **Real work**, but small — one flag on an already-working chain |
| **WI-9** populate config with current values | to do | See §5. Config is **two annual indexations stale**. | ❌ **Blocks go-live** |

### Two corrections to the doc's own framing

**"Email provider (§4)" is not greenfield.** `nodemailer` is already a dependency (`package.json:52`) with two working SMTP senders: `leads/lead-notifier.service.ts` and `prospect/prospect-notifier.service.ts`, configured off `notifications.smtp.*` (`SMTP_HOST/PORT/USER/PASS/FROM` in `.env.example:128-133`), degrading silently when unconfigured.

**The gap is directional, and it's the important part:** both existing notifiers send **inbound alerts to the agent**. `ProspectNotifierService.notifyBookingConfirmed()` fires on the Stripe webhook to tell *you* a booking is real. **Nothing sends anything to the prospect.** So every outbound email the to-do list wants — capture confirmation (§5, §6), "copy of your results" (§8d), the candidate invite (WI-6), admin password reset — is new work. What you get for free is the transport, not the messages. Swapping SMTP for Postmark/Resend is then a config change, not a build.

**"form-logic" is not a backend module.** The KEEP list names `form-logic` among backend modules and §8 says the funnel *"uses the existing form-logic conditional-question system."* There is **no `form-logic` in `backend/src/`** — zero matches for `form-logic`, `FormLogic` or `form_logic`. It is **frontend-only**: `components/admin/FormLogicEditor.tsx` (+ `AdminStrategyPanel`, `Admin.tsx:36`, `services/preScreenService.ts`). Whether that editor's output persists server-side is unresolved and worth settling before §8 — the funnel's conditional-reveal spec (§8a) depends on it.

---

## 5. Legislated values — `‹verify›` resolved

Checked against current public sources, August 2026. **None of this is MARA sign-off** — it's a starting point to put in front of your agent.

### 5.1 Employer-sponsored thresholds — config is two indexations stale

| Value | In `employer-sponsored.config.ts` | Current (from 1 Jul 2026) | Gap |
|---|---|---|---|
| Core Skills Income Threshold | `73_150` | **$79,499** | **−$6,349** |
| Specialist Skills Income Threshold | `135_000` | **~$146,717** | **−$11,717** |

$73,150 is the FY2024-25 figure. It has missed **two** 1 July indexations. Every salary gate the funnel has ever applied has been ~8% too low — it has been passing prospects who fail the real threshold.

⚠ **Sources disagree on the exact cents-level figure.** Two independent sources give CSIT **$79,499** ([BDO](https://www.bdo.com.au/en-au/insights/migration-services/updated-income-thresholds-for-skilled-visas-what-employers-need-to-know), [One Planet Migration Law](https://oneplanetmigrationlaw.com.au/immigration-blog/core-skills-income-threshold-csit-australia-2026/)); a third gives **$79,423** ([RACC](https://www.racc.net.au/migration-employer-sponsored-visas-482-skills-in-demand-visa/salary-requirement)) — which is the figure quoted in the to-do list itself. SSIT similarly splits **$146,717** vs **$146,576**. The Home Affairs salary-requirements page is dated 1/07/2026 but its figures didn't render on fetch. **Have the agent read the current legislative instrument directly.** Do not ship either number on a blog's authority.

Both are **excluding superannuation**, as the to-do list states. AMSR (Annual Market Salary Rate) has no national figure — it's assessed per role against local market evidence, which is consistent with §0c treating it as offline consult work.

### 5.2 Subclass rules — config structure is right, numbers check out

| Subclass | Config value | Verified | Status |
|---|---|---|---|
| 482 min experience | `1` yr | 1 yr relevant (Core Skills) | ✅ |
| 482 English | `5.0` overall / `5.0` per band | "Competent English"; exact bands not confirmed in sources read | 🔶 Confirm with agent |
| 186 max age | `45` | Under 45 at application | ✅ |
| 186 min experience | `3` yrs | 3 yrs relevant | ✅ |
| 186 English | `6.0` / `6.0` | **IELTS 6.0 in each component**, test ≤3 yrs old | ✅ |
| 186 occupation list | `['CSOL']` | CSOL, benchmarked to ANZSCO 2022 | ✅ |
| 494 max age | `45` | 45 | ✅ |
| 494 min experience | `3` yrs | 3 yrs | ✅ |
| 494 status | in `CONSIDERED_SUBCLASSES` | **Open** to new applications | ✅ |

**186 age exemptions exist and the engine does not model them** — academics (Level B–E), scientists/researchers assessed at skill level 1–2 by a government agency, and 444/461 holders with 2+ years at the nominating employer. §0c flags this as `‹verify›`; the answer is that `maxAge: 45` is currently a **hard fail for exempt applicants**. Given Ground Rule 8 (directional, never definitive) and §8a (remediable must proceed), over-45 should route to **agent review**, not decline.

### 5.3 GSM points — every seeded value is correct

Compared the 20 rows seeded by `1790000000000-SeedStructuredPointsRules` against the current published table. **All match:**

| Factor | Seeded | Published |
|---|---|---|
| Age 18–24 / 25–32 / 33–39 / 40–44 / 45+ | 25 / 30 / 25 / 15 / 0 | 25 / 30 / 25 / 15 / ineligible | ✅ |
| English Superior / Proficient / Competent | 20 / 10 / 0 | 20 / 10 / 0 | ✅ |
| Overseas work <3 / 3–4 / 5–7 / 8+ | 0 / 5 / 10 / 15 | 0 / 5 / 10 / 15 | ✅ |
| Australian work <1 / 1–2 / 3–4 / 5–7 / 8+ | 0 / 5 / 10 / 15 / 20 | 0 / 5 / 10 / 15 / 20 | ✅ |
| Doctorate / Bachelor-Masters / Diploma-trade / other recognised | 20 / 15 / 10 / 10 | 20 / 15 / 10 / 10 | ✅ |
| Combined skilled employment cap | 20 | 20 | ✅ |
| Regional study | 5 | 5 | ✅ |
| Pass mark | 65 | **65** to lodge an EOI | ✅ |
| Age ceiling | 45 | under 45 at invitation | ✅ |

So §0b's `‹verify›` markers on these resolve clean. **The problem isn't the numbers, it's the 7 absent categories** — see §1.2. Also: `GSM_MAX_AGE` is read at runtime from the constants file, not from `policy_config` like `passMark` and `workCap` are. Move it for Ground Rule 9 consistency.

---

## 6. Ground Rule 6 — unverifiable claims inventory

§1 names one. There are **four**, and one is dynamic.

| # | Location | Claim | Disposition |
|---|---|---|---|
| 1 | `components/home/HeroSection.tsx:144` | "Trusted by 10,000+ migrants" | **Remove.** The §1 target. |
| 2 | `components/onshore/StrategyPreviewCard.tsx:249` | "10,000+ Visas Processed" | Dies with onshore (§3) — but until then it's live on `/pathways/onshore` |
| 3 | `pages/Auth.tsx:603, 642` | "Join 10,000+ migrants using our automated 2026 strategy tools" | Dies with `/auth` (§3) — but §3 is now blocked (§1.1), so this stays live longer than planned. **Remove the copy now, independently.** |
| 4 | `components/home/HeroSection.tsx:275-277` | Stats strip: Courses / Occupations / Universities | Real DB counts, but see §1.5(c) — sourced from a table being deleted |

Also worth a look: `components/home/SuccessStories.tsx` + `services/successStoryService.ts`. Not audited for content provenance. If those are fabricated testimonials they're a bigger Ground Rule 6 problem than a "10,000+" badge, and they render on the homepage.

`AdminOverview.tsx:114-119` "AI-Powered Insights" is **admin-only** (inside `/admin/*` behind `AdminGate`), so it never reaches a public view. §1's concern doesn't apply — no change needed unless you want it gone from admin too.

---

## 7. Navigation — §7a target state vs live code

§7a's screenshot-derived description of the bar is accurate. Corrections to the *actions*:

| §7a item | Reality | Note |
|---|---|---|
| Remove "Log In" | `Header.tsx:264-269` (desktop), `:366-368` (mobile) | ⚠ Blocked until the admin login route exists (§1.1) |
| Remove "Get Quote" | Not a link — a slide-over. **4 sites**: `Header.tsx:15` (import), `:224-231` (desktop button), `:343` (mobile button), `:380` (render) | Delete all four |
| Trim Pathways dropdown | `Header.tsx:29-56` — `pathwayCategories` array. Drop entries 1 (Students) and 3 (Onshore Professionals) | Straightforward |
| ⚠ Resolve double-search | **The icon has no `onClick`.** `Header.tsx:240-247` renders a `<Button>` with a `Search` icon and `<span className="sr-only">Search</span>` at `:246` — **no handler at all.** It is a dead button. | ✅ **Decision made for you: delete it.** It does nothing today. `MobileSearchOverlay` on the homepage (`Index.tsx:30-38`) is wired separately and works. |
| Add "Get Started" pinned right | Takes the `Log In` slot | Do it in the same commit as the login-route move |
| Dashboard in nav | `Header.tsx:21` `navLinks[0]`, filtered by `isAuthenticated` at `:111` | Remove the entry and the filter together |

**Mobile bottom nav** (`MobileBottomNav.tsx:7-11`) is `Home / Search / Dashboard / Points / Profile`. §7b wants Dashboard and Profile replaced — `Profile` points at `/auth` (`:11`), so this is a third dependency on the deleted route. Same blocker.

### ⚠ The `/dashboard` and signup CTAs are more widespread than §7b assumes

§7b says *"⚠ No CTA anywhere routes to `/dashboard`"* as a rule to enforce. **Nine sites currently violate it:**

```
components/quote/StartApplicationFlow.tsx:128 → navigate("/dashboard")
components/common/navbar/UserMenu.tsx:83      → <Link to="/dashboard">
components/common/navbar/UserMenu.tsx:97      → <Link to="/dashboard?tab=settings">
components/common/navbar/MobileBottomNav.tsx:9 → href: "/dashboard"
components/common/navbar/Header.tsx:21        → navLinks[0]
hooks/useAdminAuth.ts:57, :70                 → navigate("/dashboard")  ← the §1.1 blocker
pages/Auth.tsx:115                            → navigate(isAdmin ? '/admin' : '/dashboard')
pages/Quote.tsx:110                           → navigate("/dashboard")
```

Most die with their host files, but `UserMenu.tsx` and `MobileBottomNav.tsx` are shared components and `useAdminAuth.ts` is the admin path.

**More important — and not in the to-do list at all:** §7b asks to *"add end-of-page CTA to Partner & Employer pathway pages."* Those pages **already have CTAs**, and they point at **registration**, which is a direct Ground Rule 1 violation on pages the doc marks KEEP:

| File (KEEP page) | Lines | CTA target |
|---|---|---|
| `pages/pathways/SkilledPathway.tsx` | 109, 227 | `/auth?intent=signup&persona=skilled` |
| `pages/pathways/PartnerPathway.tsx` | 94, 210 | `/auth?intent=signup&persona=partner` |
| `pages/pathways/EmployerPathway.tsx` | 86, 211 | `/auth?intent=signup&persona=employer` |
| `pages/pathways/OnshorePathway.tsx` | 215 | `/auth?intent=signup&persona=onshore-skilled` (dies with onshore) |
| `pages/pathways/StudentPathway.tsx` | 110, 232 | `/auth?intent=signup&persona=student` (dies with §2) |

That's **six live signup CTAs on three pages you're keeping.** §7b is therefore a *repoint*, not an *add* — Skilled → calculator, Partner → `/partner-audit`, Employer → `/pre-screen`. And they must be repointed **before** `/auth` is deleted, or three kept pathway pages end in 404 CTAs.

`pages/Dashboard.tsx:53` also redirects unauthenticated visitors to `/auth?intent=login` — moot once Dashboard goes, but it's a fourth `/auth` dependency to sequence.

---

## 8. Corrected deploy order

The doc's order breaks the build at step 2 and blocks at step 3. Revised:

| # | Step | Change from doc |
|---|---|---|
| 0 | **Commit the existing dirty-tree deletions separately.** Confirm Vercel doesn't serve committed `dist/`. Confirm the root-level stray migration was never applied. | **New** |
| 1 | Copy-only cleanup: "Trusted by 10,000+" (`HeroSection:144`), the two `Auth.tsx` claims, `482` → "Skills in Demand", add `494/191/485` to `VISA_TYPES`, remove `188` (2 sites). Delete dead `types/document.ts` + the broken purge panel. | Merged; **defer the stats strip** |
| 2 | **Build `/admin/login`.** Repoint `useAdminAuth` (both redirects) and `apiClient.ts:85`. Strip `authService.me()` from the public Header. | **New — unblocks everything downstream** |
| 2b | **Repoint the 6 signup CTAs on the kept pathway pages** (`SkilledPathway:109,227`, `PartnerPathway:94,210`, `EmployerPathway:86,211`) away from `/auth?intent=signup`. This is §7b's real content. | **New — was mis-scoped as "add CTA"** |
| 3 | Clean removals: `/quote` + `QuoteSlideOver` + `pricing` (repoint `FinalCTA:106` first), `parent`, `visa-recommendation`, `analytics`, `StudentPathway`, `user-progress` | `postcode` **removed from this step** |
| 4 | **`courses` untangle** → then `postcode` + `regional-postcode`. Decide the stats-strip replacement here. Decide the search/invitation degradation question. | **Order reversed vs doc** |
| 5 | `onshore` removal — including homepage copy, admin categories, and the CMS/rules data pass | **Reclassified §2 → §3** |
| 6 | Account layer: delete `/auth`, `/dashboard`, `components/auth`, `components/dashboard`, `authService`, `userProgressService`. Remove `POST /auth/signup`. **Keep** backend `auth/`, reduced `user-profile`, reduced `notifications` | Now safe; scope reduced |
| 7 | Decide the `policy_config` text/JSON schema question → **then** WI-2 | **New gate** |
| 8 | Outbound email to prospects (new senders on the existing nodemailer transport) | Reframed |
| 9 | **Calculator: add the 7 missing point categories + per-subclass nomination points.** Move `GSM_MAX_AGE` to `policy_config`. Then capture. | **Much larger than doc's §5** |
| 10 | Payment flag (WI-8) → Get Started + lead form + nav (§6/§7) → occupation-search reframe → pre-screen FE + WI-3/4/5/7 → 858 → WI-6 | Unchanged |

---

## 9. Blockers, in priority order

1. **`/auth` + `/dashboard` are the admin's only login and only fallback route.** `useAdminAuth.ts:26,65` and `apiClient.ts:85`. Build `/admin/login` before touching the account layer, or you lock yourself out of production.
2. **Points calculator omits 7 of 13 factors — up to ~45 points.** It under-scores real candidates below the 65 pass mark. This is the site's headline free value and it is currently wrong in the lead-losing direction.
3. **`CORE_SKILLS_INCOME_THRESHOLD` is two indexations stale** ($73,150 vs ~$79,499). Every salary gate the funnel has run has been ~8% too permissive.
4. **`postcode` must be deleted after `courses`, not before.** Doc order breaks the backend build.
5. **§1's stats fix and §3's courses removal are mutually exclusive.** Decide the strip's fate before doing either.
6. **`onshore` is entangled in the homepage and five admin surfaces**, including CMS content categories. Not a clean removal.
7. **`policy_config` cannot store text**, so Ground Rule 9's "all eligibility copy admin-configurable" has no home. Schema decision needed before WI-2.
8. **CSIT/SSIT sources disagree** at the hundreds-of-dollars level. Read the instrument; don't ship a blog figure.
9. **Three kept pathway pages have six CTAs pointing at user registration** (§7 above). Ground Rule 1 violation, live today, and they 404 the moment `/auth` goes.

## 10. Already done — close these out

- **WI-1** occupation-list check is wired (`pre-screen.service.ts:74-78`). Delete the stale ⚠ block at `employer-sponsored.config.ts:139-152`.
- **WI-5 (LMT half)** already correct — `engine.ts:424-428`, non-blocking with an explanatory comment.
- **Document vault** already removed backend-side (migration `1785000000000`). Only ~30 lines of frontend dead code remain.
- **Calculator config wiring** already DB-driven with `policy_config` overrides for the pass mark and work cap.
- **Email transport** already present (nodemailer + `notifications.smtp.*`). Only the prospect-facing *messages* are missing.
- **Closed visas** are effectively already gone from code — 2 references, not the sweep §2 implies. Check Strapi.

---

*Audit is static analysis only. No DB queried, no server run, no code modified. Every path and line number above was read from the working tree on 17 Aug 2026 — re-confirm before deleting, per the doc's own ground rule. All legislated figures need MARA sign-off before go-live.*
