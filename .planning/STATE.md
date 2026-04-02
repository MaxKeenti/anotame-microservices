---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: Ready to execute
stopped_at: Completed 06-03-PLAN.md
last_updated: "2026-04-02T19:25:23.327Z"
last_activity: 2026-04-02
progress:
  total_phases: 7
  completed_phases: 5
  total_plans: 18
  completed_plans: 17
  percent: 28
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-31)

**Core value:** A laundry business staff member can take a complete order — from walk-in to ticket — without confusion, on any device, in under two minutes.
**Current focus:** Phase 06 — database-migration-framework

## Current Position

Phase: 06 (database-migration-framework) — EXECUTING
Next: Execute 06-01-PLAN.md (first plan in phase 06)
Plan: 3 of 4
Last activity: 2026-04-02

Progress: [██░░░░░░░░] 28% (2/7 phases)

## Performance Metrics

**Velocity:**

- Total plans completed: 9
- Average duration: -
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

**Recent Trend:**

- Last 5 plans: n/a
- Trend: n/a

*Updated after each plan completion*
| Phase 02 P01 | 8 | 4 tasks | 3 files |
| Phase 02 P02 | 15 | 5 tasks | 6 files |
| Phase 02 P03 | 10m | 5 tasks | 4 files |
| Phase 03 P01 | 84s | 3 tasks | 3 files |
| Phase 03 P02 | 8 | 3 tasks | 4 files |
| Phase 04 P02 | 3min | 3 tasks | 5 files |
| Phase 04 P03 | 3min | 5 tasks | 4 files |
| Phase 05-frontend-pattern-compliance P01 | 195s | 3 tasks | 3 files |
| Phase 05-frontend-pattern-compliance P03 | 255s | 2 tasks | 2 files |
| Phase 06 P02 | 20min | 2 tasks | 5 files |
| Phase 06-database-migration-framework P03 | 3 | 2 tasks | 2 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Initialization: Security work blocked until WIP-01 branch is merged (Phase 1 must complete first)
- Initialization: JWT key rotation will force re-login for live client — coordinate deploy window and communicate in advance
- Initialization: Flyway V1 must be generated via `pg_dump`, not hand-written — validate on staging before production
- [Phase 02]: Use exact-match .env rule in .gitignore (not a glob) to prevent accidentally ignoring .env.example or other .env-prefixed non-secret files
- [Phase 02]: JWT keys delivered via env vars (SMALLRYE_JWT_SIGN_KEY, MP_JWT_VERIFY_PUBLICKEY) instead of file-path .location properties to enable Railway CI builds without committed PEM files
- [Phase 02]: Class-level @Authenticated on controllers enforces security by default; @PermitAll exempts guest schedule check; UserController mutations restricted to ADMIN role
- [Phase 03]: Native query in UserRepository for tce_employee_assignment lookup — avoids new entity hierarchy for cross-context join table
- [Phase 03]: branch_id JWT claim omitted when null (not empty string) — downstream must handle absent claim with rollout fallback
- [Phase 03]: Use PostgreSQL sequence tco_ticket_number_seq for ticket numbers; folio_branch derives from same sequence value for consistency
- [Phase 04-exception-handling-standardization]: Login path throws InvalidCredentialsException for both user-not-found and wrong-password — prevents username enumeration at API level
- [Phase 04]: Quarkus %dev profile prefix gates SQL logging so production (Railway) never emits Hibernate SQL; local dev retains formatted SQL
- [Phase 04]: Corrected property name from sql-formatting (non-standard, silently ignored by Quarkus 3.x) to log.format-sql (Quarkus 3.x standard)
- [Phase 05-01]: Wrap createTable() in $derived() — only reactive pattern available without @tanstack/svelte-table; table instance recreated on every state change
- [Phase 05-01]: actionCell snippet pattern: pass action columns as {#snippet actionCell(row)} to DataTableWrapper, keeping page-level handlers in pages
- [Phase 05-03]: Flattened settingsSchema merges taxInfo fields inline so superForm binds rfc/regime/address/contactPhone directly; PUT payload re-serializes via JSON.stringify
- [Phase 05-03]: holidaySchema uses z.string().min(1) for date field — AdaptiveDatePicker bind:value is string-compatible; no coercion needed
- [Phase 06-02]: V1 baseline generated via docker exec pg_dump against a fully-bootstrapped local container; tco_ticket_number_seq manually appended since it exists on Railway but not in local Docker DB
- [Phase 06-02]: Single pg_dump output shared across all 4 services — simpler than per-service scoping; safe because baseline-version=1 means Flyway stamps V1 as already applied without executing it
- [Phase 06-03]: IF NOT EXISTS guard preserved in V2 migration — unit_price was added to live DB by Hibernate auto-DDL; migration must be no-op on existing databases
- [Phase 06-03]: Repo-root migration.sql deleted — only referenced in docs comments, no runtime or build dependency

### Pending Todos

None yet.

### Blockers/Concerns

- Phase 2: Confirm Railway deployment topology (same subdomain vs different domains) before choosing `SameSite` cookie value — wrong choice silently drops cookies in production
- Phase 3: Confirm `branchId` source of truth in identity-service (direct FK on `tca_user` or join table) before planning Phase 3
- Phase 6: Staging DB environment must exist or be provisioned before Phase 6 can execute — `flyway validate` requires a staging copy of production schema

## Session Continuity

Last session: 2026-04-02T19:25:23.325Z
Stopped at: Completed 06-03-PLAN.md
Resume file: None
