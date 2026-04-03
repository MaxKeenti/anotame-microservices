# Phase 4 Research: Exception Handling Standardization

**Date**: 2026-04-01
**Domain**: Quarkus 3.x exception handling, typed domain exceptions, profile-gated config
**Confidence**: HIGH — all findings based on direct codebase audit

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| QUAL-01 | All 4 services return consistent JSON error shape `{ "message": "...", "details": [] }` for all error responses — `GlobalExceptionHandler` present in identity, catalog, and operations services | Section 1 establishes reference impl; Section 2 lists the 3 services missing it |
| QUAL-02 | Identity-service throws typed domain exceptions (`InvalidCredentialsException`, `UserAlreadyExistsException`) instead of bare `RuntimeException` | Section 3 identifies exact lines to replace; Section 5 confirms `@ServerExceptionMapper` pattern applies |
| QUAL-03 | SQL query logging is gated to the `%dev` profile in all 4 services — production logs are clean | Section 4 documents the exact broken properties in all 4 services |
</phase_requirements>

---

## Project Constraints (from AI_RULES.md)

- Hexagonal Architecture: domain exceptions belong in `domain/exception/`, handlers in `infrastructure/web/exception/`
- No framework-specific imports in the domain layer — `Response.Status` from Jakarta RS is acceptable as it's part of the JAX-RS spec, but keep it minimal
- UUID v4 for all entity IDs
- All services are Quarkus 3.x with `quarkus-rest-jackson` (RESTEasy Reactive)
- Java 21

---

## 1. Sales-service GlobalExceptionHandler (Reference Implementation)

**File**: `anotame-api/backend/sales-service/src/main/java/com/anotame/sales/infrastructure/web/exception/GlobalExceptionHandler.java`

### What it is

The sales-service handler uses `ExceptionMapper<Exception>` (Jakarta RS standard) with `@Provider`. It does **not** use `@ServerExceptionMapper`. This is a critical finding — see Section 5 for why this matters with the project's REST stack.

### Exceptions handled

| Exception Type | HTTP Status | Response Shape |
|---|---|---|
| `ConstraintViolationException` | 400 | `Map<String, String>` — field name → message |
| `FieldValidationException` (custom) | 400 | `Map<String, String>` — field → message |
| `WebApplicationException` | propagated | `{ "error": "..." }` |
| `PersistenceException` / Hibernate `ConstraintViolationException` | 409 | `{ "error": "hardcoded Spanish string" }` |
| `Exception` (catch-all) | 500 | `{ "error": "message or Unknown error" }` |

### Response shape inconsistencies (critical)

The sales-service handler does **not** return `{ "message": "...", "details": [] }`. It returns:
- `Map<String, String>` with field-name keys for validation errors
- `{ "error": "..." }` for all other errors

This means QUAL-01 requires **updating sales-service** too, not just adding handlers to the other 3 services. The reference shape from FEATURES.md (`{ "message": "...", "details": [] }`) is not yet implemented anywhere.

### Domain exception in sales-service

`FieldValidationException` extends `RuntimeException` with a `field` and `message`. It does not use a `DomainException` base class with embedded HTTP status. This is a partial implementation that needs alignment with the typed domain exception pattern.

---

## 2. Exception Handling Gap by Service

| Service | Has GlobalExceptionHandler? | Handler Pattern | Response Shape | What's Missing |
|---|---|---|---|---|
| **sales-service** | YES | `ExceptionMapper<Exception>` + `@Provider` | `Map<String, String>` / `{ "error": "..." }` | Standardize to `{ "message": "...", "details": [] }` |
| **identity-service** | NO | — | Quarkus default (may leak stack traces or HTML) | Add `GlobalExceptionHandler` + `ErrorResponse` DTO |
| **catalog-service** | NO | — | Quarkus default | Add `GlobalExceptionHandler` + `ErrorResponse` DTO |
| **operations-service** | NO | — | Quarkus default | Add `GlobalExceptionHandler` + `ErrorResponse` DTO |

**No `ErrorResponse` DTO exists in any service.** All 4 need one created (or a shared definition — see Section 2.1 below).

### 2.1 Shared vs per-service ErrorResponse

The project has no shared library module. Each service is an independent Maven artifact. The `ErrorResponse` DTO must be duplicated into each service:

```
{service}/src/main/java/com/anotame/{service}/infrastructure/web/dto/ErrorResponse.java
```

This is consistent with the bounded-context principle in AI_RULES.md (avoid massive shared tables / shared code coupling between services).

---

## 3. Identity-service Exception Throwing — Current State

### AuthService.java — exact throw sites

| Line | Method | Exception thrown | Correct HTTP status | Fix |
|---|---|---|---|---|
| 29 | `register()` | `new RuntimeException("Username already taken")` | 409 Conflict | Replace with `UserAlreadyExistsException` |
| 57 | `login()` | `new RuntimeException("User not found")` | 401 Unauthorized | Replace with `InvalidCredentialsException` |
| 60 | `login()` | `new RuntimeException("Invalid credentials")` | 401 Unauthorized | Replace with `InvalidCredentialsException` |
| 88 | `getUser()` | `new RuntimeException("User not found")` | 404 Not Found | Replace with `ResourceNotFoundException` |
| 104 | `updateCredentials()` | `new RuntimeException("User not found")` | 404 Not Found | Replace with `ResourceNotFoundException` |
| 108 | `updateCredentials()` | `new RuntimeException("Invalid current password")` | 401 Unauthorized | Replace with `InvalidCredentialsException` or new `InvalidPasswordException` |
| 115 | `updateCredentials()` | `new RuntimeException("Username already taken")` | 409 Conflict | Replace with `UserAlreadyExistsException` |

### UserService.java — exact throw sites

| Line | Method | Exception thrown | Correct HTTP status | Fix |
|---|---|---|---|---|
| 31 | `createUser()` | `new RuntimeException("Username already taken")` | 409 Conflict | Replace with `UserAlreadyExistsException` |
| 44 | `createUser()` | `new RuntimeException("Role not found: " + roleCode)` | 404 Not Found | Replace with `ResourceNotFoundException` |
| 52 | `getUserById()` | `new RuntimeException("User not found")` | 404 Not Found | Replace with `ResourceNotFoundException` |
| 63 | `updateUser()` | `new RuntimeException("User not found")` | 404 Not Found | Replace with `ResourceNotFoundException` |

### AuthController.java — current HTTP behavior

`AuthController` does not catch exceptions from `AuthService`. There is no try/catch and no explicit `Response.Status` mapping. When `AuthService.login()` throws `RuntimeException("User not found")` or `RuntimeException("Invalid credentials")`, the current behavior is:
- Without a `GlobalExceptionHandler`: Quarkus returns HTTP 500 with an HTML error page or partial JSON depending on content negotiation — **not** 401.
- This is the bug QUAL-02 requires fixing.

### Catalog and operations RuntimeException sites

- **catalog-service** `CatalogService.java` lines 47, 90: `RuntimeException("Garment not found")`, `RuntimeException("Service not found")` — currently bubble to 500
- **operations-service** `OperationsService.java` line 36: `RuntimeException("WorkOrder not found with id: " + id)` — currently bubbles to 500

These are out of scope for QUAL-02 (which targets identity-service only) but will be caught by the `GlobalExceptionHandler` catch-all once added (QUAL-01).

---

## 4. SQL Logging Properties — Current State

### Findings

All 4 services have `quarkus.hibernate-orm.log.sql=true` set unconditionally (no profile prefix). This means SQL queries are emitted in production (Railway) logs.

| Service | Property | Current Value | Profile-gated? |
|---|---|---|---|
| identity-service | `quarkus.hibernate-orm.log.sql` | `true` | NO |
| identity-service | `quarkus.hibernate-orm.sql-formatting` | `true` | NO |
| catalog-service | `quarkus.hibernate-orm.log.sql` | `true` | NO |
| catalog-service | `quarkus.hibernate-orm.sql-formatting` | `true` | NO |
| sales-service | `quarkus.hibernate-orm.log.sql` | `true` | NO |
| sales-service | `quarkus.hibernate-orm.sql-formatting` | `true` | NO |
| operations-service | `quarkus.hibernate-orm.log.sql` | `true` | NO |
| operations-service | `quarkus.hibernate-orm.sql-formatting` | `true` | NO |

**Note on property name:** The current files use `quarkus.hibernate-orm.sql-formatting` but FEATURES.md uses `quarkus.hibernate-orm.log.format-sql`. These are different keys. The correct Quarkus 3.x property name for SQL formatting is `quarkus.hibernate-orm.log.format-sql` (HIGH confidence from official Quarkus docs). The current `sql-formatting` key may be silently ignored by Quarkus — the fix should use the verified property names.

### Correct property names (Quarkus 3.x)

```properties
# Default: off in all profiles
quarkus.hibernate-orm.log.sql=false
quarkus.hibernate-orm.log.format-sql=false

# Dev override: enable for local development
%dev.quarkus.hibernate-orm.log.sql=true
%dev.quarkus.hibernate-orm.log.format-sql=true
```

No `bind-parameters` property is currently set in any service — this is fine (defaults to false).

### Required change per service (all 4)

Remove ungated `true` settings. Add:
```properties
quarkus.hibernate-orm.log.sql=false
quarkus.hibernate-orm.log.format-sql=false
%dev.quarkus.hibernate-orm.log.sql=true
%dev.quarkus.hibernate-orm.log.format-sql=true
```

---

## 5. REST Implementation

### Confirmed: All 4 services use RESTEasy Reactive (Quarkus REST)

All 4 services declare `quarkus-rest-jackson` in their `pom.xml`. This is the **Quarkus REST (RESTEasy Reactive)** artifact, not `quarkus-resteasy-jackson` (RESTEasy Classic).

| Artifact ID | REST Stack | Preferred Exception Mapper |
|---|---|---|
| `quarkus-rest-jackson` | RESTEasy Reactive (Quarkus REST) | `@ServerExceptionMapper` (preferred) OR `ExceptionMapper<T>` (supported) |
| `quarkus-resteasy-jackson` | RESTEasy Classic | `ExceptionMapper<T>` with `@Provider` |

### Current sales-service uses `ExceptionMapper<T>` — this works but is not the Quarkus REST preferred pattern

The existing sales-service uses the Jakarta RS standard `ExceptionMapper<T>` with `@Provider`. This is supported in Quarkus REST (RESTEasy Reactive) as a compatibility path but `@ServerExceptionMapper` is the preferred pattern because:

1. It works natively with Quarkus REST's non-blocking pipeline
2. It supports `RestResponse<T>` return type (more type-safe)
3. It avoids the `@Provider` CDI scan overhead

### Decision: keep `ExceptionMapper<T>` pattern for consistency

Since sales-service already uses `ExceptionMapper<T>` and it is fully supported, the new handlers in identity, catalog, and operations should use the **same pattern** for consistency. Switching sales-service to `@ServerExceptionMapper` in the same phase would add scope. The planner should use `ExceptionMapper<T>` + `@Provider` for all 4 handlers.

If the project later wants to migrate to `@ServerExceptionMapper`, that is a trivial swap in a future housekeeping phase.

---

## Architecture Patterns

### New files to create per service

**Pattern for identity, catalog, operations (3 new files each):**

```
{service}/src/main/java/com/anotame/{pkg}/
  domain/exception/DomainException.java          (base class)
  domain/exception/InvalidCredentialsException.java   (identity only)
  domain/exception/UserAlreadyExistsException.java    (identity only)
  domain/exception/ResourceNotFoundException.java     (identity only, reuse in catalog/ops later)
  infrastructure/web/dto/ErrorResponse.java       (response shape)
  infrastructure/web/exception/GlobalExceptionHandler.java  (mapper)
```

**For sales-service (update only, no new files):**
- Update `GlobalExceptionHandler.java` to return `{ "message": "...", "details": [] }` instead of `Map<String, String>` / `{ "error": "..." }`

### `ErrorResponse` DTO (target shape)

```java
// {service}/src/main/java/com/anotame/{pkg}/infrastructure/web/dto/ErrorResponse.java
@Data
@AllArgsConstructor
@NoArgsConstructor
public class ErrorResponse {
    private String message;
    private List<String> details;

    public ErrorResponse(String message) {
        this.message = message;
        this.details = List.of();
    }
}
```

### `GlobalExceptionHandler` target pattern (all 4 services)

```java
@Provider
public class GlobalExceptionHandler implements ExceptionMapper<Exception> {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @Override
    public Response toResponse(Exception exception) {
        if (exception instanceof ConstraintViolationException cve) {
            List<String> details = cve.getConstraintViolations().stream()
                .map(v -> v.getPropertyPath() + ": " + v.getMessage())
                .toList();
            return Response.status(Response.Status.BAD_REQUEST)
                .entity(new ErrorResponse("Validation failed", details))
                .build();
        }
        if (exception instanceof DomainException de) {
            return Response.status(de.getHttpStatus())
                .entity(new ErrorResponse(de.getMessage()))
                .build();
        }
        if (exception instanceof WebApplicationException wae) {
            return Response.status(wae.getResponse().getStatus())
                .entity(new ErrorResponse(wae.getMessage()))
                .build();
        }
        log.error("Unhandled exception", exception);
        return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(new ErrorResponse("Internal server error"))
                .build();
    }
}
```

**Key note for sales-service update:** Remove the `{ "error": "..." }` and `Map<String, String>` response patterns. Replace `FieldValidationException` handling to use the new `ErrorResponse` shape. The `FieldValidationException` in sales-service can remain (it's domain-specific) but should extend `DomainException` or be mapped to `{ "message": "...", "details": ["field: message"] }`.

### `DomainException` base class (identity-service)

Place in `domain/exception/` per hexagonal architecture:

```java
// identity-service: domain/exception/DomainException.java
public abstract class DomainException extends RuntimeException {
    private final Response.Status httpStatus;

    protected DomainException(String message, Response.Status status) {
        super(message);
        this.httpStatus = status;
    }

    public Response.Status getHttpStatus() {
        return httpStatus;
    }
}
```

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---|---|---|---|
| Constraint violation message extraction | Custom reflection | `ConstraintViolation.getPropertyPath()` + `getMessage()` | Already in Jakarta Validation API |
| HTTP status mapping | Switch/if-else in every controller | `ExceptionMapper<Exception>` catch-all | Single point of truth |
| JSON error serialization | Custom toString | Jackson (already in `quarkus-rest-jackson`) | Zero config needed |

---

## Common Pitfalls

### Pitfall 1: `ExceptionMapper<Exception>` not catching all exceptions in Quarkus REST

**What goes wrong:** In RESTEasy Reactive, some framework-level exceptions (e.g., 404 from routing, 401 from JWT validation) may bypass a `ExceptionMapper<Exception>` if they are thrown before request processing reaches application code.

**Why it happens:** Quarkus REST's JWT filter throws `UnauthorizedException` before the handler is invoked. This is caught by Quarkus's built-in security exception mapper, not the application one.

**How to avoid:** Test auth failures (missing/expired JWT) explicitly. Accept that the JWT 401 response from Quarkus security may not match the `ErrorResponse` shape — this is acceptable behavior (security layer is separate from application layer).

**Warning signs:** Postman/curl shows HTML or different JSON shape on JWT-absent requests vs. app-level 401s.

### Pitfall 2: `sql-formatting` vs `log.format-sql` property name

**What goes wrong:** All 4 services currently set `quarkus.hibernate-orm.sql-formatting=true`. This is likely a silently ignored property. The correct key is `quarkus.hibernate-orm.log.format-sql`.

**How to avoid:** Use `log.format-sql` in the fix. Verify in `quarkus dev` logs that formatted SQL appears.

### Pitfall 3: Sales-service response shape migration breaks frontend

**What goes wrong:** The frontend currently expects sales-service error responses in the `{ "error": "..." }` or `Map<String, String>` shape. Changing to `{ "message": "...", "details": [] }` is a breaking change.

**How to avoid:** Audit frontend error handling for sales-service before updating. The SvelteKit frontend in `anotame-web` reads error responses — the change to `message` key instead of `error` key must be accounted for.

**Recommendation:** Include frontend error shape update in the sales-service plan task.

### Pitfall 4: `DomainException` importing `jakarta.ws.rs.core.Response.Status` in domain layer

**What goes wrong:** Strict hexagonal architecture forbids framework imports in the domain layer. `Response.Status` is from Jakarta RS (web framework).

**How to avoid:** Two options:
1. Accept `jakarta.ws.rs.core.Response.Status` in domain — it's a spec API, not a framework implementation. This is common Quarkus practice.
2. Use an integer HTTP status code in `DomainException` and convert at the mapper boundary.

**Recommendation:** Option 1 is pragmatic and consistent with the FEATURES.md reference implementation. The project already uses Jakarta RS annotations directly in controllers.

---

## Validation Architecture

Nyquist validation is enabled (`workflow.nyquist_validation: true`).

### Test Framework

| Property | Value |
|---|---|
| Framework | None installed — no `quarkus-junit5` or `rest-assured` in any service pom.xml |
| Config file | None |
| Quick run command | `mvn test -pl anotame-api/backend/identity-service` (will find no tests) |
| Full suite command | `mvn test` (no tests exist) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|---|---|---|---|---|
| QUAL-01 | All services return `{ "message": "...", "details": [] }` | Integration (REST Assured) | — | No tests exist |
| QUAL-02 | Login with bad credentials → HTTP 401, not 500 | Integration (REST Assured) | — | No tests exist |
| QUAL-02 | Duplicate username registration → HTTP 409, not 500 | Integration (REST Assured) | — | No tests exist |
| QUAL-03 | SQL logs absent in prod profile | Manual/config inspection | manual | N/A |

**All automated test types require `quarkus-junit5` + `rest-assured` which are not installed. These tests are deferred to TEST-02 per REQUIREMENTS.md.**

QUAL-03 (SQL logging) is config-only — verified manually by checking Railway logs or running `quarkus:dev` and confirming SQL appears, then `quarkus:run` (prod mode) and confirming it does not.

### Wave 0 Gaps

- No test infrastructure additions needed for this phase — TEST-01/TEST-02 are explicitly deferred to a future milestone per REQUIREMENTS.md.
- Validation for QUAL-01 and QUAL-02 will be manual: `curl` the running Docker Compose stack and verify HTTP status codes and response shapes.

*(Automated test infrastructure is out of scope for Phase 4 per REQUIREMENTS.md deferred items.)*

---

## Recommended Plan Structure

### Plan 04-01: Add `GlobalExceptionHandler` to identity, catalog, and operations + update sales-service

**Covers:** QUAL-01

**Tasks:**
1. Create `ErrorResponse` DTO in identity, catalog, operations (3 files)
2. Create `DomainException` base class in identity-service `domain/exception/`
3. Add `GlobalExceptionHandler` implementing `ExceptionMapper<Exception>` to identity, catalog, operations (3 files)
4. Update sales-service `GlobalExceptionHandler` to return `{ "message": "...", "details": [] }` instead of `Map` / `{ "error": "..." }` shapes
5. Update sales-service `FieldValidationException` handling in the mapper to use `ErrorResponse` with `details` list
6. Audit SvelteKit frontend `anotame-web` for any places that reads `error.error` from sales-service responses and update to read `error.message`

**Verification:** `curl -X POST http://localhost:8081/auth/login -d '{"username":"x","password":"y"}' -H 'Content-Type: application/json'` → response contains `{ "message": "...", "details": [] }` (not stack trace, not HTML)

### Plan 04-02: Typed domain exceptions in identity-service

**Covers:** QUAL-02

**Tasks:**
1. Create `InvalidCredentialsException` in `identity-service/domain/exception/`
2. Create `UserAlreadyExistsException` in `identity-service/domain/exception/`
3. Create `ResourceNotFoundException` in `identity-service/domain/exception/`
4. Replace all 7 `throw new RuntimeException(...)` sites in `AuthService.java` with typed exceptions (lines 29, 57, 60, 88, 104, 108, 115)
5. Replace all 4 `throw new RuntimeException(...)` sites in `UserService.java` with typed exceptions (lines 31, 44, 52, 63)
6. Verify: `DomainException` is caught by the `GlobalExceptionHandler` from 04-01 — no additional controller changes needed

**Verification:** Login with wrong password → HTTP 401 with `{ "message": "Invalid username or password", "details": [] }`. Register duplicate username → HTTP 409 with `{ "message": "User already exists: X", "details": [] }`.

### Plan 04-03: Gate SQL logging to `%dev` profile in all 4 services

**Covers:** QUAL-03

**Tasks:**
1. Update `identity-service/application.properties` — replace `log.sql=true` / `sql-formatting=true` with `log.sql=false` / `log.format-sql=false` + `%dev.` overrides
2. Update `catalog-service/application.properties` — same change
3. Update `sales-service/application.properties` — same change
4. Update `operations-service/application.properties` — same change
5. Note: remove the incorrect `sql-formatting` key (typo) and use correct `log.format-sql` in all services

**Verification:** `docker compose up` → Railway (prod profile) logs show no `Hibernate: select ...` lines. `quarkus:dev` → SQL queries appear as expected.

---

## Environment Availability

Step 2.6: SKIPPED for the SQL logging changes (config-only). The Java/Maven changes require Docker Compose for integration verification.

| Dependency | Required By | Available | Version | Fallback |
|---|---|---|---|---|
| Docker | Integration testing | Assumed available (project standard) | Unknown | Manual curl testing |
| Maven 3.x | Build | Assumed available | Unknown | — |
| Java 21 | Build/run | Set in pom.xml `maven.compiler.release=21` | 21 | — |

---

## Sources

### Primary (HIGH confidence)
- Direct codebase audit — all findings are from reading actual source files
- `FEATURES.md` (`.planning/research/FEATURES.md`) — `@ServerExceptionMapper` pattern, `ErrorResponse` DTO, profile-gated properties
- `AI_RULES.md` — hexagonal architecture constraints, layer naming conventions

### Secondary (MEDIUM confidence)
- Quarkus 3.x documentation (from training): `quarkus-rest-jackson` = RESTEasy Reactive, `ExceptionMapper<T>` is supported alongside `@ServerExceptionMapper`
- Quarkus property name `log.format-sql` vs `sql-formatting` — HIGH confidence that `sql-formatting` is a non-standard/wrong key based on Quarkus docs pattern

### Tertiary (LOW confidence)
- Claim that JWT security 401s bypass `ExceptionMapper<Exception>` — consistent with how Quarkus security works but not verified against a running instance

---

## Metadata

**Confidence breakdown:**
- Current state (what code does): HIGH — read directly from source files
- Standard stack: HIGH — all 4 services confirmed to use `quarkus-rest-jackson` (RESTEasy Reactive)
- Architecture patterns: HIGH — based on existing sales-service as reference + FEATURES.md
- Pitfalls: MEDIUM — `ExceptionMapper` vs security layer interaction is training-data based, not live-verified
- SQL property name fix: HIGH — `sql-formatting` is non-standard; `log.format-sql` is the documented key

**Research date:** 2026-04-01
**Valid until:** 2026-05-01 (stable Quarkus 3.x APIs)
