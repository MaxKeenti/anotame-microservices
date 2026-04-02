---
phase: 04
plan: 01
subsystem: backend-exception-handling, frontend-api-client
tags: [exception-handling, error-response, global-handler, dto, frontend]
dependency_graph:
  requires: []
  provides: [ErrorResponse DTO all 4 services, DomainException base class, GlobalExceptionHandler all 4 services]
  affects: [identity-service, catalog-service, operations-service, sales-service, anotame-web]
tech_stack:
  added: [quarkus-hibernate-validator (operations-service)]
  patterns: [ExceptionMapper<Exception> via @Provider, ErrorResponse DTO shape]
key_files:
  created:
    - anotame-api/backend/identity-service/src/main/java/com/anotame/identity/infrastructure/web/dto/ErrorResponse.java
    - anotame-api/backend/identity-service/src/main/java/com/anotame/identity/domain/exception/DomainException.java
    - anotame-api/backend/identity-service/src/main/java/com/anotame/identity/infrastructure/web/exception/GlobalExceptionHandler.java
    - anotame-api/backend/catalog-service/src/main/java/com/anotame/catalog/infrastructure/web/dto/ErrorResponse.java
    - anotame-api/backend/catalog-service/src/main/java/com/anotame/catalog/infrastructure/web/exception/GlobalExceptionHandler.java
    - anotame-api/backend/operations-service/src/main/java/com/anotame/operations/infrastructure/web/dto/ErrorResponse.java
    - anotame-api/backend/operations-service/src/main/java/com/anotame/operations/infrastructure/web/exception/GlobalExceptionHandler.java
    - anotame-api/backend/sales-service/src/main/java/com/anotame/sales/infrastructure/web/dto/ErrorResponse.java
  modified:
    - anotame-api/backend/sales-service/src/main/java/com/anotame/sales/infrastructure/web/exception/GlobalExceptionHandler.java
    - anotame-api/backend/operations-service/pom.xml
    - anotame-web/src/lib/services/api.svelte.ts
decisions:
  - ErrorResponse DTO is per-service (not shared library) to preserve service independence per hexagonal architecture
  - DomainException placed in identity-service domain layer only; catalog and operations omit the branch until Plan 04-02 adds typed exceptions there
  - operations-service handler omits DomainException branch (no typed exceptions yet)
  - quarkus-hibernate-validator added to operations-service pom (missing dep blocked compile — Rule 3 fix)
  - errorData.error fallback retained in frontend API client for backward compat during migration
metrics:
  duration: 273s
  completed: 2026-04-02
  tasks_completed: 5
  files_changed: 11
---

# Phase 4 Plan 01: GlobalExceptionHandler + ErrorResponse Shape (all 4 services) Summary

**One-liner:** Unified `{ "message": "...", "details": [] }` error shape across all 4 Quarkus services via per-service `ErrorResponse` DTO and `GlobalExceptionHandler`, with frontend API client updated to consume the new shape.

## What Was Built

All 4 backend services now return a consistent error shape for every 4xx/5xx response. Previously: identity, catalog, and operations had no handler (raw Quarkus defaults); sales-service returned `Map<String,String>` with `{ "error": "..." }` or flat field maps.

**identity-service** — created `ErrorResponse` DTO, `DomainException` abstract base class, and `GlobalExceptionHandler` handling `ConstraintViolationException`, `DomainException`, `WebApplicationException`, and catch-all.

**catalog-service** — created `ErrorResponse` DTO and `GlobalExceptionHandler` handling `ConstraintViolationException`, `WebApplicationException`, and catch-all.

**operations-service** — created `ErrorResponse` DTO and `GlobalExceptionHandler` (same as catalog). Added missing `quarkus-hibernate-validator` dependency to pom.xml.

**sales-service** — created `ErrorResponse` DTO, replaced entire `GlobalExceptionHandler` to use new shape: `ConstraintViolationException` now returns a details list instead of a flat map; `FieldValidationException` mapped to details list; `PersistenceException`/Hibernate FK conflict returns English message with HTTP 409.

**anotame-web** — updated `api.svelte.ts` to check `errorData.message` first (new shape), fall back to `errorData.error` (legacy shape) for backward compat.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | ErrorResponse DTO (identity, catalog, operations) | 9c62610 | 3x ErrorResponse.java |
| 2 | DomainException base class (identity) | 296c7d5 | DomainException.java |
| 3 | GlobalExceptionHandler (identity, catalog, operations) | 9963275 | 3x GlobalExceptionHandler.java, operations pom.xml |
| 4 | ErrorResponse DTO + updated handler (sales) | 937883d | ErrorResponse.java, GlobalExceptionHandler.java |
| 5 | Frontend API client error shape update | bdcb2d7 | api.svelte.ts |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Missing `quarkus-hibernate-validator` in operations-service**
- **Found during:** Task 3
- **Issue:** `jakarta.validation.ConstraintViolationException` could not be resolved in operations-service — the service had no hibernate-validator dependency in its pom.xml, unlike identity-service and catalog-service.
- **Fix:** Added `quarkus-hibernate-validator` to `operations-service/pom.xml` dependencies. Standard Quarkus extension, no version needed (managed by quarkus-bom).
- **Files modified:** `anotame-api/backend/operations-service/pom.xml`
- **Commit:** 9963275

**2. [Rule 1 - Bug] Unused import in sales-service handler**
- **Found during:** Task 4
- **Issue:** Original plan template included `import jakarta.validation.ConstraintViolation` (the single-violation type) which is not used — only `ConstraintViolationException` is needed.
- **Fix:** Removed the unused import before compiling.
- **Files modified:** `GlobalExceptionHandler.java` (sales-service)
- **Commit:** 937883d

## Known Stubs

None — all handlers are fully wired. Error responses flow to real HTTP response bodies. Frontend reads real `errorData.message` from the new shape.

## Self-Check: PASSED
