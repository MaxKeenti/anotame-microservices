# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

---

## Milestone: v1.0 — Code Quality & Security

**Shipped:** 2026-04-03
**Phases:** 7 | **Plans:** 21 | **Sessions:** ~6

### What Was Built

- Per-user color palette customization with PersistedState store and CSS variable injection
- Full security hardening — DB credentials, JWT private key, and PgAdmin password externalized to env vars; `@Authenticated` + `@RolesAllowed` added to all unguarded controllers
- Data integrity restored in sales-service — `branchId` from JWT claims, PostgreSQL sequence for ticket numbers, real user UUID in `createdBy`
- Standardized JSON error shape `{ message, details }` across all 4 services via `GlobalExceptionHandler` + typed domain exceptions (`InvalidCredentialsException`, `UserAlreadyExistsException`, `ResourceNotFoundException`)
- `DataTableWrapper` component (TanStack Table) and `sveltekit-superforms` migration across all major frontend pages
- Flyway migration framework — `quarkus-flyway` on all 4 services, V1 baseline from live `pg_dump`, V2 unit_price migration, per-service history tables preventing cross-service collision
- SmallRye Health (`/q/health/ready`) on all 4 services; Docker Compose healthchecks with `service_healthy` dependencies

### What Worked

- **Plan checker iteration** — catching wave number errors, frontmatter mismatches, and false positive type errors before execution saved re-execution cycles
- **Research-first approach** — Phase 6 research identified the schema drift (missing `tco_work_order`, `tco_ticket_number_seq`) before planning, which prevented a broken baseline
- **Parallel Wave 1 execution** — running 07-01 (health extension) and 07-03 (housekeeping) in parallel with isolation=worktree worked cleanly with no conflicts
- **Checkpoint:human-verify gates** — the Docker Compose smoke test gate in 07-02 caught actual runtime behavior (all 4 containers confirmed healthy before marking complete)
- **Concrete plan actions** — plans with exact property values, XML blocks, and file line references produced clean execution with no re-do cycles

### What Was Inefficient

- **init.sql sync discovered late** — the `anotame-web-legacy` node_modules deletion and `init.sql` schema drift were found during Phase 6 execution rather than during research. A pre-phase codebase scan step would catch this earlier.
- **Rate limit interruptions** — two rate limit hits during Phase 6 required fresh agent continuations. Context re-serialization (completed_tasks table in continuation prompt) was effective but added overhead.
- **Docker Compose env var override limitation** — the staging validate step in Phase 6 discovered that CLI-level env vars don't override service-level definitions in docker-compose.yml. This required accepting dev DB as equivalent staging — a process gap that needs a docker-compose override file approach for next time.
- **Plan checker false positive** — one checker flagged a real SQL type mismatch that turned out to be based on stale facts in the checker prompt. Manual verification of the actual file was needed. The checker's critical_facts input needs to be file-verified, not assumed.

### Patterns Established

- **Per-service Flyway history tables** — when all services share one PostgreSQL DB, unique `quarkus.flyway.table` names per service are mandatory. Pattern: `flyway_schema_history_{service}`.
- **`baseline-on-migrate=true` + `baseline-version=1`** — for retrofitting Flyway onto existing databases; V1 is stamped as already applied without executing, only V2+ run against production.
- **Profile-gated DDL** — `%prod.quarkus.hibernate-orm.database.generation=none` with bare `update` kept for dev local bring-up. This pattern should be applied to all new Quarkus services.
- **`wget --spider` for Alpine healthchecks** — curl is absent from `eclipse-temurin:21-jre-alpine`; busybox `wget` with `--spider` is the correct tool and exits non-zero on HTTP errors.
- **`start_period: 30s`** for Quarkus healthchecks — Flyway `migrate-at-start=true` adds JVM startup time; 30s grace period prevents false unhealthy during normal startup.

### Key Lessons

1. **Schema drift audit before planning any DB phase** — run `pg_dump` against the live DB and diff against `init.sql` at research time, not discovery time. Missing tables and sequences in init.sql caused mid-plan corrections in Phase 6.
2. **Staging isolation needs a docker-compose override file** — CLI env var overrides don't work against service-defined environment blocks. Create `docker-compose.staging.yml` with DB URL overrides for true isolation.
3. **Plan checker facts must be file-verified** — when the checker is given critical_facts about existing code, those facts should be grep-verified against the actual files before being included in the checker prompt. Stale facts produce false positives.
4. **Worktree isolation for parallel plans works** — `isolation=worktree` in parallel Wave 1 execution produces clean separation. No merge conflicts observed. This pattern is reliable for plans modifying non-overlapping file sets.
5. **`branch_id` JWT claim rollout** — when adding a new JWT claim that may be null for existing sessions, always plan a fallback removal task as a follow-on. The fallback lived as a TODO comment through multiple phases.

### Cost Observations

- Model mix: ~100% Sonnet 4.6 (orchestrator + all subagents)
- Sessions: ~6 across 3 days
- Notable: Parallel Wave 1 execution (two agents simultaneously) completed in ~3 minutes total vs ~6 minutes sequential — halved wall time for independent plans. Worthwhile for waves with 2+ independent plans.

---

## Milestone: v1.1 — Production Stability

**Shipped:** 2026-04-03
**Phases:** 2 | **Plans:** 4 | **Sessions:** ~2

### What Was Built
- KPI dashboard corrected to use `/orders/kpi/dashboard` path
- `DataTableWrapper` loop crash fixed using `untrack()` in pagination effect
- User-friendly Spanish toast messages for HTTP 409 FK constraint violations
- Full catalog migration: Garments, Services, Price Lists, and Users pages moved to `DataTableWrapper`

---

## Milestone: v1.2 — UI Standardization

**Shipped:** 2026-04-06
**Phases:** 5 | **Plans:** 10 | **Sessions:** ~4

### What Was Built
- Visual foundation refresh with shadcn-svelte preset and Tailwind v4 oklch tokens
- `DataTableWrapper` filter consolidation: eliminated duplicate filter bars on Customers and Orders pages via `showFilter` prop
- Full form standardization: 10+ forms and all CRUD dialogs migrated to `sveltekit-superforms` + `Form.*` field kit
- WCAG 2.1 Level AA color compliance: refined semantic tokens and introduced standardized `StatusBadge` component
- Multi-tenant theming engine: backend persistence for brand color/font and reactive CSS variable injection with FOUC prevention

### What Worked
- **Component-first standardization** — by focusing on `DataTableWrapper` and the `Form.*` kit first, subsequent page migrations became repetitive and highly predictable
- **Reactive CSS variable injection** — the Svelte 5 `$effect` + server-side hydration pattern proved reliable for dynamic theming without visual artifacts
- **Audit-driven quality** — the Phase 12 form audit ensured that no "dark corners" of the UI remained with legacy patterns

### What Was Inefficient
- **Requirements tracking drift** — `REQUIREMENTS.md` checkboxes and traceability were often forgotten during execution, requiring a manual sync at milestone completion. This needs to be a "must-have" task in phase planning
- **Manual verification debt** — some UAT items (like "Edit Existing Order") were identified as missing features rather than bugs, causing slight confusion during verification. These should be moved to the next milestone's requirements immediately upon discovery

### Patterns Established
- **`untrack()` for store writes in effects** — essential for preventing infinite loops when initializing stores from server data during hydration
- **OKLCH for semantic colors** — provides consistent lightness and chroma across both themes, simplifying WCAG compliance
- **Native HTML5 color picker + hex text fallback** — robust and accessible pattern for user-facing color configuration

### Key Lessons
1. **Unify DOM manipulations** — multiple effects modifying `document.documentElement.style` can cause race conditions or loop depth errors. Consolidated theme/palette injection into a single effect
2. **Standardize the "Spanish Voice"** — consistency in error messages and UI labels was improved by centralizing translations in components like `StatusBadge`

### Cost Observations
- Model mix: ~90% Sonnet 4.6, ~10% Opus (for complex refactor planning)
- Sessions: ~4 for v1.2
- Notable: Form migration speed increased significantly after the first 3 dialogs were standardized

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.0 | ~6 | 7 | First milestone with GSD workflow; established all core patterns |
| v1.1 | ~2 | 2 | Focused stability run; rapid execution of targeted fixes |
| v1.2 | ~4 | 5 | Shift from infrastructure to UI/UX standardization; established design tokens |

### Cumulative Quality

| Milestone | Test Coverage | Zero-Dep Additions | Migrations |
|-----------|-------------|-------------------|------------|
| v1.0 | 0% (deferred) | quarkus-flyway, quarkus-smallrye-health, sveltekit-superforms | 2 (V1 baseline, V2 unit_price) |
| v1.1 | 0% (deferred) | - | 0 |
| v1.2 | 0% (deferred) | shadcn-svelte, @fontsource-variable/* | 1 (V2 theme fields) |
