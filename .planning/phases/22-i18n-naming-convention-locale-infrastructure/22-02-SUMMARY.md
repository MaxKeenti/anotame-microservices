---
phase: 22
plan: 22-02
title: "Identity Service Locale Column + PATCH Endpoint"
subsystem: identity-service
tags: [i18n, locale, backend, flyway, jpa, quarkus]
dependency_graph:
  requires: []
  provides: [user.locale-column, locale-patch-endpoint, locale-in-auth-response]
  affects: [anotame-web]
tech_stack:
  added: []
  patterns: [flyway-additive-migration, jakarta-bean-validation, lombok-builder]
key_files:
  created:
    - anotame-api/backend/identity-service/src/main/resources/db/migration/V2__add_user_locale.sql
    - anotame-api/backend/identity-service/src/main/java/com/anotame/identity/application/dto/UpdateLocaleRequest.java
  modified:
    - anotame-api/backend/identity-service/src/main/java/com/anotame/identity/domain/model/User.java
    - anotame-api/backend/identity-service/src/main/java/com/anotame/identity/application/dto/UserResponse.java
    - anotame-api/backend/identity-service/src/main/java/com/anotame/identity/application/service/AuthService.java
    - anotame-api/backend/identity-service/src/main/java/com/anotame/identity/application/service/UserService.java
    - anotame-api/backend/identity-service/src/main/java/com/anotame/identity/infrastructure/web/controller/UserController.java
decisions:
  - "Used String (not enum) for locale field — BCP-47 tags are strings; Paraglide manages tag validation at compile time"
  - "Default locale is 'es' (not 'es-MX') to match Paraglide sourceLanguageTag; frontend maps 'es' to display label 'Español (México)'"
  - "PATCH /{id}/locale has no @RolesAllowed — any authenticated user can update their own locale preference"
metrics:
  duration: "3 min"
  completed: "2026-04-20"
  tasks_completed: 8
  files_changed: 7
---

# Phase 22 Plan 02: Identity Service Locale Column + PATCH Endpoint Summary

**One-liner:** Adds `locale VARCHAR(10) DEFAULT 'es'` to `tca_user` via Flyway V2, surfaces it in `UserResponse` (login now returns user locale), and exposes `PATCH /users/{id}/locale` with `es|en` validation.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add V2 Flyway migration for locale column | 7112c2c | V2__add_user_locale.sql |
| 2 | Add locale field to User entity | c6af896 | User.java |
| 3 | Add locale to UserResponse DTO | f0db596 | UserResponse.java |
| 4 | Update AuthService locale in all UserResponse builders | 0c8a4ba | AuthService.java |
| 5 | Create UpdateLocaleRequest DTO | 3f0e507 | UpdateLocaleRequest.java |
| 6 | Add updateLocale method to UserService | e836fbf | UserService.java |
| 7 | Add PATCH locale endpoint to UserController | d2840cd | UserController.java |
| 8 | Verify backend compiles | — | (compile-only, BUILD SUCCESS) |

## Decisions Made

- **String locale field:** Used `String` not enum — BCP-47 tags are inherently string-based; Paraglide owns the list of valid language tags at compile time.
- **Default `es` not `es-MX`:** Paraglide's `sourceLanguageTag` is `es`. The frontend maps `es` to the display label "Español (México)". Using `es-MX` would fail Paraglide tag matching.
- **No `@RolesAllowed` on PATCH endpoint:** Any authenticated user can update their own locale. The endpoint inherits class-level `@Authenticated`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical functionality] Include locale in UserService.mapToResponse()**
- **Found during:** Post-task 7 review before SUMMARY
- **Issue:** `UserService.mapToResponse()` built `UserResponse` without `.locale(user.getLocale())`. All UserService-sourced responses (`getAllUsers`, `getUserById`, `createUser`, `updateUser`) would return `locale: null`, making the locale field unreliable for consumers.
- **Fix:** Added `.locale(user.getLocale())` to `mapToResponse()` in UserService.java
- **Files modified:** `UserService.java`
- **Commit:** b776317

## Known Stubs

None — all locale fields are wired to the `User` entity's `locale` field, which has a DB default of `'es'`.

## Threat Flags

None — the PATCH endpoint is protected by class-level `@Authenticated`. No new unauthenticated surface introduced. Input is validated via `@Pattern(regexp = "^(es|en)$")`.

## Self-Check: PASSED

- V2__add_user_locale.sql: FOUND
- UpdateLocaleRequest.java: FOUND
- User.java locale field: FOUND (`private String locale = "es"`)
- UserResponse.java locale field: FOUND
- AuthService 3x `.locale(user.getLocale())`: FOUND (count=3)
- UserService updateLocale method: FOUND
- UserController @PATCH /{id}/locale: FOUND
- Compile: BUILD SUCCESS (exit 0)
- Commits: 7112c2c, c6af896, f0db596, 0c8a4ba, 3f0e507, e836fbf, d2840cd, b776317 — all verified in git log
