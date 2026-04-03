---
phase: 3
plan: "01"
subsystem: identity-service
tags: [jwt, claims, authentication, branch-assignment]
dependency_graph:
  requires: []
  provides: [user_id-jwt-claim, branch_id-jwt-claim]
  affects: [sales-service/03-03]
tech_stack:
  added: []
  patterns: [native-query-cross-context, conditional-jwt-claim]
key_files:
  created: []
  modified:
    - anotame-api/backend/identity-service/src/main/java/com/anotame/identity/infrastructure/persistence/repository/UserRepository.java
    - anotame-api/backend/identity-service/src/main/java/com/anotame/identity/infrastructure/security/JwtUtils.java
    - anotame-api/backend/identity-service/src/main/java/com/anotame/identity/application/service/AuthService.java
decisions:
  - "Native query in UserRepository (not new entity) avoids introducing a full entity hierarchy for the cross-context tce_employee_assignment join table"
  - "branch_id claim omitted (not null string) when user has no active assignment — downstream must handle absent claim"
metrics:
  duration: "84s"
  completed: "2026-04-01"
  tasks_completed: 3
  files_modified: 3
---

# Phase 3 Plan 01: JWT Claim Enrichment (identity-service) Summary

**One-liner:** Added `user_id` and `branch_id` custom claims to identity-service JWT using native query on `tce_employee_assignment` join table.

**Status:** Complete
**Completed:** 2026-04-01

---

## What Was Done

- Added `findActiveBranchForUser(UUID userId)` to `UserRepository` using a native query against `tce_employee_assignment` — returns `null` (not Optional) when no active assignment exists, consistent with the plan spec for downstream null handling.
- Updated `JwtUtils.generateToken()` to accept `userId` and `branchId` parameters; always adds `user_id` claim, conditionally adds `branch_id` only when non-null.
- Updated `AuthService.login()` and `updateCredentials()` to call `userRepository.findActiveBranchForUser(user.getId())` and pass both IDs to `generateToken`. `register()` is covered via its existing `login()` delegation (no direct change needed).
- Added `import java.util.UUID` to `AuthService`.

---

## Files Modified

- `anotame-api/backend/identity-service/src/main/java/com/anotame/identity/infrastructure/persistence/repository/UserRepository.java` — added `@Inject EntityManager em` + `findActiveBranchForUser()` method
- `anotame-api/backend/identity-service/src/main/java/com/anotame/identity/infrastructure/security/JwtUtils.java` — new `generateToken()` signature with `userId`/`branchId`, conditional `branch_id` claim
- `anotame-api/backend/identity-service/src/main/java/com/anotame/identity/application/service/AuthService.java` — added UUID import, branch lookup + updated both `generateToken()` call sites

---

## Commit

`f29b2b9`: feat(03-01): add user_id and branch_id claims to identity-service JWT

---

## Decisions Made

1. **Native query in UserRepository (not a new entity):** The plan explicitly stated to avoid creating a full `EmployeeAssignment` entity hierarchy to query a cross-context join table. `EntityManager` native query is injected directly into `UserRepository`.

2. **`branch_id` claim omitted when null:** When `findActiveBranchForUser` returns `null` (new user with no assignment), the `branch_id` claim is simply not added to the JWT builder rather than storing a null string. Downstream services (sales-service Plan 03-03) must handle the absent claim using the rollout fallback UUID.

---

## Deviations from Plan

None — plan executed exactly as written.

---

## Known Stubs

None — no stub values introduced. The `branch_id` claim is conditionally absent (not a stub); this is intentional and documented above.

---

## Self-Check: PASSED

- `UserRepository.java` modified: FOUND
- `JwtUtils.java` modified: FOUND
- `AuthService.java` modified: FOUND
- Commit `f29b2b9` exists: FOUND
- `mvn compile` exit code 0: VERIFIED
