---
phase: quick-260403-tcn
plan: 01
type: quick-task
subsystem: Sales Service - Backend API
tags: [bug-fix, timezone, api-safety, OffsetDateTime]
completed_date: 2026-04-03
duration: 15min
commits:
  - 05a5939: OrderRepositoryPort interface OffsetDateTime update
  - d69e38e: OrdersResource JWT claim null-safety
status: completed
---

# Quick Task 260403-TCN: Fix 2 Regressions from OffsetDateTime Changes

**Summary:** Fixed type mismatches in dashboard metrics queries and added null-safety validation for JWT claims in order creation API.

## Objective

Restore dashboard metrics API and order creation API to working state by addressing regressions introduced during the OffsetDateTime timezone refactoring in v1.1.

## Changes Made

### Task 1: Fix getDashboardMetrics Type Mismatch

**Issue:** OrderRepositoryPort interface defined methods with LocalDateTime parameters, but the OrderRepository implementation and SalesService callers were using OffsetDateTime. This type mismatch would cause compilation errors or runtime QueryArgumentException.

**Root Cause:** The port interface was not updated when the repository implementation was changed to use OffsetDateTime for proper timezone handling.

**Fix:** Updated OrderRepositoryPort interface to use OffsetDateTime for all datetime parameters:

- `countActiveByDeadlineRange(OffsetDateTime start, OffsetDateTime end)` - was `LocalDateTime`
- `countActiveFromDeadline(OffsetDateTime start)` - was `LocalDateTime`
- `sumPaidAmountInRange(OffsetDateTime start, OffsetDateTime end)` - was `LocalDateTime`
- `getWeeklyRevenueData(OffsetDateTime start)` - was `LocalDateTime`
- `getDailyWorkload(OffsetDateTime start, OffsetDateTime end)` - was `LocalDateTime`

**File Modified:**
- `anotame-api/backend/sales-service/src/main/java/com/anotame/sales/application/port/output/OrderRepositoryPort.java`

**Commit:** 05a5939

### Task 2: Fix createOrder NullPointerException Risk

**Issue:** OrdersResource.createOrder() extracted JWT claims (user_id, branch_id) and directly called UUID.fromString() without null checks, creating risk of NullPointerException if JWT claims were missing or invalid.

**Root Cause:** Missing defensive programming for JWT claim extraction. While the endpoint is @Authenticated, claims might be missing due to malformed tokens or configuration issues.

**Fix:** Added explicit null and empty checks for both JWT claims before UUID parsing:

```java
String userIdClaim = (String) jwt.getClaim("user_id");
if (userIdClaim == null || userIdClaim.isEmpty()) {
    throw new jakarta.ws.rs.BadRequestException("Missing or invalid user_id claim in JWT token");
}

String branchIdClaim = (String) jwt.getClaim("branch_id");
if (branchIdClaim == null || branchIdClaim.isEmpty()) {
    throw new jakarta.ws.rs.BadRequestException("Missing or invalid branch_id claim in JWT token");
}

UUID userId = UUID.fromString(userIdClaim);
UUID branchId = UUID.fromString(branchIdClaim);
```

**File Modified:**
- `anotame-api/backend/sales-service/src/main/java/com/anotame/sales/infrastructure/web/controller/OrdersResource.java`

**Commit:** d69e38e

**Error Handling:** BadRequestException is caught by GlobalExceptionHandler and returns 400 status with descriptive error message.

## Verification Results

### Compilation Status
- Both files compile successfully with the type updates
- No new compiler warnings introduced
- OrdersResource properly validates JWT claims before UUID parsing

### Type Consistency
- OrderRepositoryPort interface now matches OrderRepository implementation signatures
- SalesService.getDashboardMetrics() passes OffsetDateTime values correctly to all repository methods
- All datetime parameters follow OffsetDateTime convention for timezone-aware handling

### Safety Improvements
- JWT claim extraction now validates presence and non-empty status
- Prevents NullPointerException from null claims
- Returns meaningful error messages for missing credentials

## API Behavior Changes

### getDashboardMetrics (GET /orders/kpi/dashboard)
- No functional change to API behavior
- Underlying type mismatch resolved - query execution will succeed where it might have failed before

### createOrder (POST /orders)
- New behavior: Returns 400 Bad Request if user_id or branch_id JWT claims are missing/empty
- Error response includes descriptive message about missing claims
- Previously would have thrown 500 Internal Server Error (NullPointerException)

## Edge Cases Handled

1. **Null JWT claims:** Returns descriptive 400 error instead of crashing with NPE
2. **Empty string JWT claims:** Treated same as null - returns descriptive error
3. **Malformed UUID strings:** Will still throw IllegalArgumentException from UUID.fromString(), which is appropriate for invalid UUID format (caught by GlobalExceptionHandler)

## Known Stubs

None - this is a bug fix task, not a feature implementation.

## Related Context

- Previous fix (commit 90082e3): Updated OrderRepository implementation to use OffsetDateTime
- Previous fix (commit 8475338): Added missing createdAt/updatedAt mappings with OffsetDateTime
- All Order entity timestamp fields now consistently use OffsetDateTime with ZoneId.systemDefault()

## Decisions Made

1. **Type Conversion:** Used OffsetDateTime (timezone-aware) instead of LocalDateTime (no timezone) to match the database entity model and repository implementation
2. **JWT Claim Validation:** Used BadRequestException for missing claims rather than 500 error, as this is a request validation issue
3. **Error Messages:** Included specific claim names in error messages to help clients debug token issues

## Testing Recommendations

1. Call GET /orders/kpi/dashboard with a valid JWT - should return dashboard metrics
2. Call POST /orders with a valid JWT missing user_id claim - should get 400 error
3. Call POST /orders with a valid JWT missing branch_id claim - should get 400 error
4. Call POST /orders with valid JWT and proper CreateOrderRequest body - should create order successfully

## Summary Verification

- [x] All tasks from plan completed
- [x] Files compiled successfully
- [x] No new compiler warnings
- [x] Type safety improved
- [x] Runtime null-pointer safety improved
- [x] Code follows DDD and Quarkus conventions
- [x] Error handling via GlobalExceptionHandler
- [x] Commits created with descriptive messages
