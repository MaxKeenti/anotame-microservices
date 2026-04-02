---
phase: 04-exception-handling-standardization
plan: "02"
subsystem: api
tags: [quarkus, java, exceptions, rest, identity-service, domain-exceptions]

# Dependency graph
requires:
  - phase: 04-exception-handling-standardization
    plan: "01"
    provides: DomainException base class and GlobalExceptionHandler in identity-service
provides:
  - InvalidCredentialsException (401) for login failures and wrong-password checks
  - UserAlreadyExistsException (409) for duplicate username registration and update
  - ResourceNotFoundException (404) for missing users and roles
  - AuthService: all 7 RuntimeException throws replaced with typed domain exceptions
  - UserService: all 4 RuntimeException throws replaced with typed domain exceptions
affects: [04-exception-handling-standardization]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Domain exception subclasses carry HTTP status — handler needs no switch logic"
    - "Login path uses InvalidCredentialsException for both user-not-found and wrong-password to prevent user enumeration"

key-files:
  created:
    - anotame-api/backend/identity-service/src/main/java/com/anotame/identity/domain/exception/InvalidCredentialsException.java
    - anotame-api/backend/identity-service/src/main/java/com/anotame/identity/domain/exception/UserAlreadyExistsException.java
    - anotame-api/backend/identity-service/src/main/java/com/anotame/identity/domain/exception/ResourceNotFoundException.java
  modified:
    - anotame-api/backend/identity-service/src/main/java/com/anotame/identity/application/service/AuthService.java
    - anotame-api/backend/identity-service/src/main/java/com/anotame/identity/application/service/UserService.java

key-decisions:
  - "Login context throws InvalidCredentialsException for both 'user not found' and 'wrong password' — prevents user enumeration at the API level"
  - "updateCredentials 'invalid current password' uses InvalidCredentialsException with generic message — same anti-enumeration rationale"

patterns-established:
  - "Pattern: throw typed DomainException subclass; GlobalExceptionHandler reads embedded HTTP status automatically"
  - "Pattern: user enumeration prevention — all authentication failures produce same 401 with same message"

requirements-completed: [QUAL-02]

# Metrics
duration: 3min
completed: 2026-04-01
---

# Phase 04 Plan 02: Typed Domain Exceptions in identity-service Summary

**InvalidCredentialsException (401), UserAlreadyExistsException (409), and ResourceNotFoundException (404) replace all 11 bare RuntimeException throws in AuthService and UserService — login now returns 401, duplicate registration returns 409**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-01T20:36:49Z
- **Completed:** 2026-04-01T20:39:52Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments

- Created three typed exception classes extending DomainException in `domain/exception/`: InvalidCredentialsException (401), UserAlreadyExistsException (409), ResourceNotFoundException (404)
- Replaced all 7 RuntimeException throw sites in AuthService with typed exceptions; login uses InvalidCredentialsException for both user-not-found and wrong-password paths (user enumeration prevention)
- Replaced all 4 RuntimeException throw sites in UserService with typed exceptions; role-not-found uses ResourceNotFoundException with specific role code in message

## Task Commits

Each task was committed atomically:

1. **Task 1: Create typed domain exception classes** - `5c71cea` (feat)
2. **Task 2: Replace RuntimeException throws in AuthService** - `b161602` (feat)
3. **Task 3: Replace RuntimeException throws in UserService** - `49139f1` (feat)

## Files Created/Modified

- `domain/exception/InvalidCredentialsException.java` - Extends DomainException with 401 UNAUTHORIZED and "Invalid username or password" message
- `domain/exception/UserAlreadyExistsException.java` - Extends DomainException with 409 CONFLICT and "Username already taken: {username}" message
- `domain/exception/ResourceNotFoundException.java` - Extends DomainException with 404 NOT_FOUND and "{resource} not found" message
- `application/service/AuthService.java` - 7 RuntimeException throws replaced; 3 new imports added
- `application/service/UserService.java` - 4 RuntimeException throws replaced; 2 new imports added

## Decisions Made

- Login path (`findByUsername` in `login()`) uses `InvalidCredentialsException` instead of `ResourceNotFoundException` — prevents distinguishing "no such user" from "wrong password" at the HTTP level, which would allow username enumeration
- Same decision applied to `updateCredentials()` current-password check — generic "Invalid username or password" message rather than field-specific error
- `updateCredentials()` username conflict throws `UserAlreadyExistsException(request.getNewUsername())` with the new username in the message, consistent with `register()` behavior

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

- `mvn compile -pl anotame-api/backend/identity-service` from repo root failed with reactor path error; used `./mvnw compile -pl identity-service` from `anotame-api/backend/` directory instead. This is a pre-existing configuration issue (not introduced by this plan). Compilation with the correct invocation exits 0.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- All 11 RuntimeException throw sites in identity-service are now typed; GlobalExceptionHandler from 04-01 catches them and returns correct HTTP status automatically
- QUAL-02 implementation complete: invalid-credentials login returns 401, duplicate-username registration returns 409
- Integration smoke tests (docker compose) can be run to validate QUAL-02 end-to-end; compile verification confirmed clean

---
*Phase: 04-exception-handling-standardization*
*Completed: 2026-04-01*

## Self-Check: PASSED

- All 5 files created/modified confirmed present on disk
- All 3 task commits (5c71cea, b161602, 49139f1) confirmed in git log
