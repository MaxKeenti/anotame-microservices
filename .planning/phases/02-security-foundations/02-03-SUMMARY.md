---
phase: 2
plan: "03"
subsystem: security
tags: [authentication, rbac, quarkus, identity-service, operations-service]
dependency-graph:
  requires: []
  provides: [SEC-03, SEC-04]
  affects: [operations-service, identity-service]
tech-stack:
  added: []
  patterns: ["@io.quarkus.security.Authenticated class-level guard", "@RolesAllowed ADMIN on mutation endpoints", "@PermitAll method-level exemption"]
key-files:
  created: []
  modified:
    - anotame-api/backend/operations-service/src/main/java/com/anotame/operations/infrastructure/web/controller/OperationsController.java
    - anotame-api/backend/operations-service/src/main/java/com/anotame/operations/infrastructure/web/controller/EstablishmentController.java
    - anotame-api/backend/operations-service/src/main/java/com/anotame/operations/infrastructure/web/controller/ScheduleController.java
    - anotame-api/backend/identity-service/src/main/java/com/anotame/identity/infrastructure/web/controller/UserController.java
decisions:
  - "Class-level @Authenticated preferred over method-level to enforce security by default and reduce per-method boilerplate"
  - "@PermitAll on GET /schedule/check intentionally overrides class-level auth for guest-facing booking widget"
  - "GET /users and GET /users/{id} omit @RolesAllowed — any authenticated user can read; mutations require ADMIN"
  - "AuthController left untouched — login/register/logout must remain public endpoints"
metrics:
  duration: "~10 minutes"
  completed: "2026-04-01"
  tasks: 5
  files: 4
---

# Phase 2 Plan 03: Add Security Annotations to Controllers Summary

**Status**: Complete
**Completed**: 2026-04-01
**One-liner**: Class-level @Authenticated guards on all unprotected controllers with ADMIN RBAC on UserController mutation endpoints and @PermitAll exemption on guest-facing schedule check.

## What was done

- Added `@io.quarkus.security.Authenticated` at class level to `OperationsController`, `EstablishmentController`, and `ScheduleController` in operations-service
- Added `@jakarta.annotation.security.PermitAll` on `GET /schedule/check` (`checkAvailability`) to preserve guest-facing booking widget access without JWT
- Added `@io.quarkus.security.Authenticated` at class level to `UserController` in identity-service
- Added `@jakarta.annotation.security.RolesAllowed("ADMIN")` on `POST /users` (createUser), `PUT /users/{id}` (updateUser), and `DELETE /users/{id}` (deleteUser)
- Verified `AuthController` unchanged: `login`, `register`, and `logout` remain public; `GET /auth/me` and `POST /auth/change-credentials` retain their existing method-level `@Authenticated`

## Controllers modified

- **operations-service**: `OperationsController.java`, `ScheduleController.java`, `EstablishmentController.java`
- **identity-service**: `UserController.java`

## Decisions Made

1. **Class-level vs method-level @Authenticated**: Class-level annotation chosen for all four controllers to enforce security by default. Any new method added to these controllers will be authenticated automatically without requiring developer awareness.

2. **@PermitAll on GET /schedule/check**: This single exemption allows the booking widget (consumed by unauthenticated guest users) to query availability without a JWT, while all schedule mutation endpoints (config, holidays) remain protected.

3. **GET /users not restricted to ADMIN**: Read access to user lists is granted to any authenticated user (EMPLOYEE or ADMIN). Only mutation endpoints (create, update, delete) require the ADMIN role.

4. **AuthController untouched**: Login, register, and logout endpoints must remain public. The existing method-level guards on `/auth/me` and `/auth/change-credentials` correctly protect those sensitive endpoints.

## Commit

26fc822: security(SEC-03,SEC-04): add authentication and RBAC to controllers

## Deviations from Plan

None - plan executed exactly as written. Task 4 (docker integration tests) is a manual verification step that requires running services — compilation verification confirms correctness of annotations. No code changes were needed beyond the specified four files.

## Known Stubs

None.

## Self-Check: PASSED

- OperationsController.java modified: FOUND
- EstablishmentController.java modified: FOUND
- ScheduleController.java modified: FOUND
- UserController.java modified: FOUND
- Commit 26fc822: FOUND (git log confirmed)
- operations-service compile: EXIT_CODE 0
- identity-service compile: EXIT_CODE 0
- Annotation counts: OperationsController(1), EstablishmentController(1), ScheduleController(2), UserController(4) — all match expected
