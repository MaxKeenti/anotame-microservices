---
phase: 07-operational-reliability-housekeeping
plan: "03"
subsystem: housekeeping
tags: [env, cors, gitignore, sveltekit, cleanup]
dependency_graph:
  requires: []
  provides: [PUBLIC_* env convention, CORS x-user-name header, clean worktree]
  affects: [.env.example, .gitignore, sales-service CORS]
tech_stack:
  added: []
  patterns: [SvelteKit PUBLIC_* env prefix, Quarkus CORS headers]
key_files:
  created: []
  modified:
    - .env.example
    - .gitignore
    - anotame-api/backend/sales-service/src/main/resources/application.properties
decisions:
  - ".env.example comment avoids mentioning NEXT_PUBLIC_* to keep grep -c output at 0 (acceptance criteria requirement)"
metrics:
  duration: "~3 minutes"
  completed: "2026-04-03T00:28:48Z"
requirements: [HOUSE-01, HOUSE-02, HOUSE-03]
---

# Phase 07 Plan 03: Housekeeping Fixes Summary

## One-liner

Renamed NEXT_PUBLIC_* to PUBLIC_* in .env.example (adding OPERATIONS_URL), deleted untracked anotame-web-legacy build artifacts and blocked them in .gitignore, and appended x-user-name to sales-service CORS allowed-headers.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Update .env.example — replace NEXT_PUBLIC_* with PUBLIC_* and add OPERATIONS_URL | 7d48fcb | .env.example |
| 2 | Delete legacy build artifacts and add root .gitignore entries | e31bb0d | .gitignore |
| 3 | Add x-user-name to sales-service CORS allowed-headers | 32bb4a6 | anotame-api/backend/sales-service/src/main/resources/application.properties |

## Verification Results

All 6 acceptance criteria passed:

- HOUSE-01: `grep -c "NEXT_PUBLIC_" .env.example` = 0 — PASS
- HOUSE-01: `PUBLIC_OPERATIONS_URL` present in .env.example — PASS
- HOUSE-02: `anotame-web-legacy/node_modules` not on disk — PASS
- HOUSE-02: `anotame-web-legacy/.next` not on disk — PASS
- HOUSE-02: `.gitignore` contains `anotame-web-legacy/node_modules/` entry — PASS
- HOUSE-03: `quarkus.http.cors.headers` includes `x-user-name` in sales-service — PASS

## Decisions Made

- The `.env.example` comment was reworded to not include `NEXT_PUBLIC_*` text, satisfying the acceptance criteria that `grep -c "NEXT_PUBLIC_" .env.example` returns 0. The comment still communicates the PUBLIC_* convention clearly.
- `x-user-name` added as the last entry in sales-service CORS headers, matching the pattern used in identity-service (`x-requested-with, x-user-name`).

## Deviations from Plan

None — plan executed exactly as written. The comment wording was adjusted to satisfy the strict `grep -c "NEXT_PUBLIC_" = 0` criterion while still conveying the migration guidance; this was an inline decision within Task 1 scope.

## Known Stubs

None.

## Self-Check: PASSED

Files verified:
- FOUND: .env.example (PUBLIC_OPERATIONS_URL present, 0 NEXT_PUBLIC_ references)
- FOUND: .gitignore (anotame-web-legacy entries present)
- FOUND: anotame-api/backend/sales-service/src/main/resources/application.properties (x-user-name present)
- MISSING from disk: anotame-web-legacy/node_modules/ (deleted as intended)
- MISSING from disk: anotame-web-legacy/.next/ (deleted as intended)

Commits verified:
- 7d48fcb: chore(07-03): replace NEXT_PUBLIC_* with PUBLIC_* in .env.example
- e31bb0d: chore(07-03): delete anotame-web-legacy artifacts and block in .gitignore
- 32bb4a6: fix(07-03): add x-user-name to sales-service CORS allowed-headers
