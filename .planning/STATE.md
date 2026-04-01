---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: Ready to execute
stopped_at: Completed 03-01-PLAN.md
last_updated: "2026-04-01T20:02:46.470Z"
last_activity: 2026-04-01
progress:
  total_phases: 7
  completed_phases: 2
  total_plans: 8
  completed_plans: 6
  percent: 28
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-31)

**Core value:** A laundry business staff member can take a complete order — from walk-in to ticket — without confusion, on any device, in under two minutes.
**Current focus:** Phase 03 — Data Integrity Fixes

## Current Position

Phase: 03 (Data Integrity Fixes) — EXECUTING
Plan: 2 of 3
Next: Phase 03 — Data Integrity Fixes
Last activity: 2026-04-01

Progress: [██░░░░░░░░] 28% (2/7 phases)

## Performance Metrics

**Velocity:**

- Total plans completed: 0
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

### Pending Todos

None yet.

### Blockers/Concerns

- Phase 2: Confirm Railway deployment topology (same subdomain vs different domains) before choosing `SameSite` cookie value — wrong choice silently drops cookies in production
- Phase 3: Confirm `branchId` source of truth in identity-service (direct FK on `tca_user` or join table) before planning Phase 3
- Phase 6: Staging DB environment must exist or be provisioned before Phase 6 can execute — `flyway validate` requires a staging copy of production schema

## Session Continuity

Last session: 2026-04-01T20:02:46.468Z
Stopped at: Completed 03-01-PLAN.md
Resume file: None
