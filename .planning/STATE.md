# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-31)

**Core value:** A laundry business staff member can take a complete order — from walk-in to ticket — without confusion, on any device, in under two minutes.
**Current focus:** Phase 1 — Close UI Color Standardization

## Current Position

Phase: 1 of 7 (Close UI Color Standardization)
Plan: 0 of 1 in current phase
Status: Ready to plan
Last activity: 2026-03-31 — Roadmap created for Milestone 1 (Code Quality & Security Hardening)

Progress: [░░░░░░░░░░] 0%

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

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Initialization: Security work blocked until WIP-01 branch is merged (Phase 1 must complete first)
- Initialization: JWT key rotation will force re-login for live client — coordinate deploy window and communicate in advance
- Initialization: Flyway V1 must be generated via `pg_dump`, not hand-written — validate on staging before production

### Pending Todos

None yet.

### Blockers/Concerns

- Phase 2: Confirm Railway deployment topology (same subdomain vs different domains) before choosing `SameSite` cookie value — wrong choice silently drops cookies in production
- Phase 3: Confirm `branchId` source of truth in identity-service (direct FK on `tca_user` or join table) before planning Phase 3
- Phase 6: Staging DB environment must exist or be provisioned before Phase 6 can execute — `flyway validate` requires a staging copy of production schema

## Session Continuity

Last session: 2026-03-31
Stopped at: Roadmap written to .planning/ROADMAP.md and STATE.md initialized — ready to plan Phase 1
Resume file: None
