---
phase: quick
plan: 260403-uao
type: complete
date_completed: "2026-04-04"
duration: 15min
tasks_completed: 3
files_modified: 3
commits:
  - hash: da8251d
    message: "fix(quick-260403-uao): Fix 3 validation issues - schema timestamps, UUID validation, JWT claim parsing"
---

# Quick Task 260403-uao: Fix 3 Detected Validation Issues

**Objective:** Fix database schema mismatches, UUID parameter validation, and JWT claim parsing that cause type mismatches and unclear error messages.

**Purpose:** Prevent 500 errors from type mismatches and invalid UUID formats. Ensure clear validation with 400 BadRequestException responses instead of generic exceptions.

## Execution Summary

Three production stability fixes were completed to address validation issues in the backend microservices:

### Task 1: Fixed WorkOrder Schema Timestamp Types

**File:** `anotame-api/backend/operations-service/src/main/resources/db/migration/V1__baseline.sql` (lines 342, 345)

**Change:** Updated the `tco_work_order` table definition to use correct PostgreSQL type for OffsetDateTime JPA mapping:
- Changed `created_at` from `timestamp(6) without time zone` to `timestamp with time zone DEFAULT now() NOT NULL`
- Changed `updated_at` from `timestamp(6) without time zone` to `timestamp with time zone DEFAULT now()`

**Rationale:** Hibernate `@CreationTimestamp` and `@UpdateTimestamp` annotations with `OffsetDateTime` require `timestamp with time zone` type to preserve timezone offset. This aligns with other tables in the schema (tco_order, tce_branch).

**Verification:** Schema now matches OffsetDateTime JPA entity mapping

---

### Task 2: Added UUID Parameter Validation in OperationsService

**File:** `anotame-api/backend/operations-service/src/main/java/com/anotame/operations/application/service/OperationsService.java` (lines 36-42)

**Change:** Updated `getWorkOrder(UUID id)` method with:
- Added null check for id parameter throwing `IllegalArgumentException`
- Changed exception from generic `RuntimeException` to specific `jakarta.persistence.EntityNotFoundException`

**Before:**
```java
public WorkOrder getWorkOrder(UUID id) {
    return workOrderRepositoryPort.findById(id)
            .orElseThrow(() -> new RuntimeException("WorkOrder not found with id: " + id));
}
```

**After:**
```java
public WorkOrder getWorkOrder(UUID id) {
    if (id == null) {
        throw new IllegalArgumentException("WorkOrder ID cannot be null");
    }
    return workOrderRepositoryPort.findById(id)
            .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("WorkOrder not found with id: " + id));
}
```

**Rationale:**
- Null check prevents NullPointerException in repository layer
- EntityNotFoundException maps to 404 in REST layer (more appropriate than 500 from RuntimeException)
- Follows hexagonal architecture validation pattern

**Verification:** Code uses specific exception types for clear error responses

---

### Task 3: Added UUID Format Validation in OrdersResource JWT Claim Parsing

**File:** `anotame-api/backend/sales-service/src/main/java/com/anotame/sales/infrastructure/web/controller/OrdersResource.java` (lines 28-55)

**Change:** Wrapped both `user_id` and `branch_id` UUID.fromString() calls with try-catch blocks:
- Added try-catch around `branchId` UUID.fromString() call with proper error message
- Added try-catch around `userId` UUID.fromString() call with proper error message
- Both catch `IllegalArgumentException` and throw `BadRequestException` (400) instead

**Before:**
```java
UUID branchId = (branchIdClaim != null && !branchIdClaim.isEmpty())
    ? UUID.fromString(branchIdClaim)
    : UUID.fromString("ea22f4a4-5504-43d9-92f9-30cc17b234d1");

UUID userId = UUID.fromString(userIdClaim);  // No error handling
```

**After:**
```java
UUID branchId;
try {
    branchId = (branchIdClaim != null && !branchIdClaim.isEmpty())
        ? UUID.fromString(branchIdClaim)
        : UUID.fromString("ea22f4a4-5504-43d9-92f9-30cc17b234d1");
} catch (IllegalArgumentException e) {
    throw new jakarta.ws.rs.BadRequestException("Invalid branch_id format in JWT token: " + e.getMessage());
}

UUID userId;
try {
    userId = UUID.fromString(userIdClaim);
} catch (IllegalArgumentException e) {
    throw new jakarta.ws.rs.BadRequestException("Invalid user_id format in JWT token: " + e.getMessage());
}
```

**Rationale:**
- UUID.fromString() throws uncaught IllegalArgumentException for invalid formats (→ 500 error)
- Wrapping with try-catch converts to BadRequestException (400 error) with clear message
- user_id validation needed since no error handling existed
- branchId fallback always succeeds, but wrapping for consistency and future-proofing

**Verification:** Invalid UUID claims return 400 errors with clear messages, not 500 errors

---

## Success Criteria Met

- ✓ WorkOrder schema uses `timestamp with time zone` for OffsetDateTime support
- ✓ OperationsService validates UUID parameter and uses EntityNotFoundException
- ✓ OrdersResource validates both user_id and branch_id UUID formats with BadRequestException
- ✓ Invalid UUID claims return 400 errors, not 500 errors
- ✓ All changes align with AI_RULES.md validation patterns
- ✓ Database migrations are Flyway-compatible

## Deviations from Plan

None - plan executed exactly as written.

## Notes

- These are production stability fixes addressing issues from earlier OffsetDateTime migration
- All changes follow hexagonal architecture validation pattern
- Backward compatibility maintained for branch_id fallback (Oaxaca #113) per quick task 260403-tqw
