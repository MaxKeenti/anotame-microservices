---
phase: quick
plan: 260403-sh6
subsystem: error-handling, datetime-management
tags: [production-fix, error-handling, timezone-awareness]
date_completed: 2026-04-03
duration_minutes: 45
completed_tasks: 4
modified_files: 8
---

# Quick Task 260403-sh6: Fix 6 Detected Production Issues - Summary

**Objective:** Fix 6 detected production issues: 4 frontend bugs (409 error detection in payment wizard, order details page, operations page; plus dead code initialization timeout removal) and 2 backend datetime issues (timezone offset discarding in createOrder and updateOrder methods).

**One-liner:** Restored HTTP status code visibility in API errors for 409 conflict detection across dashboard, removed dead initialization code, and preserved timezone offsets in order timestamps through database persistence.

## Tasks Completed

| # | Task | Status | Files Modified | Commits |
|----|------|--------|---|---------|
| 1 | Create ApiError class with status field | PASSED | 1 | 9e8880d |
| 2 | Update api.svelte.ts to throw ApiError with status | PASSED | 1 | 19491d9 |
| 3 | Fix 409 detection in dashboard pages and remove dead code | PASSED | 4 | ef0c044 |
| 4 | Fix OffsetDateTime handling in SalesService and Order | PASSED | 3 | 8a40ecf |

## Changes Made

### Task 1: ApiError Class Creation
**File:** `src/lib/services/ApiError.ts` (new)

Created a custom error class extending Error with:
- Public `status: number` field for HTTP status code
- Optional `body?: unknown` field for error response body
- `isApiError()` type guard function for safe instanceof checks

This enables frontend catch blocks to check `error.status === 409` instead of parsing error messages.

### Task 2: API Service Update
**File:** `src/lib/services/api.svelte.ts`

Changes:
- Added import: `import { ApiError } from './ApiError';`
- Added tracking of `errorData` variable to pass to ApiError constructor
- Replaced generic Error throw with: `throw new ApiError(backendMessage, response.status, errorData)`

Now all HTTP error responses expose their status code to downstream error handlers.

### Task 3: Dashboard Pages - 409 Detection & Dead Code Removal
**Files:**
- `src/lib/components/orders/wizard/payment-step.svelte`
- `src/routes/(app)/dashboard/orders/[id]/+page.svelte`
- `src/routes/(app)/dashboard/operations/+page.svelte`
- `src/routes/(app)/dashboard/orders/new/+page.svelte`

Changes:
1. **payment-step.svelte & orders/[id]/+page.svelte & operations/+page.svelte:**
   - Added `import { ApiError } from '$lib/services/ApiError';`
   - Replaced broken checks (`e.message.includes('409')` or `e?.message?.includes('409')`) with proper: `e instanceof ApiError && e.status === 409`
   - This fixes the critical order submission error handling path

2. **orders/new/+page.svelte:**
   - Removed dead `setTimeout` and `clearTimeout` code in `onMount()`
   - Timeout was set for 2000ms but immediately cleared in finally block, never executing
   - Kept the active try-finally initialization logic that properly creates empty draft

### Task 4: Timezone-Aware DateTime Persistence
**Files:**
- `anotame-api/backend/sales-service/src/main/java/com/anotame/sales/domain/model/Order.java`
- `anotame-api/backend/sales-service/src/main/java/com/anotame/sales/infrastructure/persistence/entity/OrderEntity.java`
- `anotame-api/backend/sales-service/src/main/java/com/anotame/sales/application/service/SalesService.java`

Changes:
1. **Order.java (domain model):**
   - Changed all `LocalDateTime` fields to `OffsetDateTime`
   - Fields: `committedDeadline`, `createdAt`, `updatedAt`, `deletedAt`

2. **OrderEntity.java (JPA entity):**
   - Added import: `import java.time.OffsetDateTime;`
   - Updated field type from `LocalDateTime` to `OffsetDateTime` for:
     - `committedDeadline`: Added `columnDefinition = "TIMESTAMP WITH TIME ZONE"`
     - `createdAt`: Added `columnDefinition = "TIMESTAMP WITH TIME ZONE"`
     - `updatedAt`: Added `columnDefinition = "TIMESTAMP WITH TIME ZONE"`
     - `deletedAt`: Added `columnDefinition = "TIMESTAMP WITH TIME ZONE"`

3. **SalesService.java:**
   - Added imports: `import java.time.OffsetDateTime;` and `import java.time.ZoneId;`
   - **createOrder():**
     - Line 48: Replaced `request.getCommittedDeadline().toLocalDateTime()` with `request.getCommittedDeadline()`
     - Line 60: Replaced `LocalDateTime.now()` with `OffsetDateTime.now(ZoneId.systemDefault())`
   - **updateOrder():**
     - Line 193: Replaced `request.getCommittedDeadline().toLocalDateTime()` with `request.getCommittedDeadline()`
   - No instances of `.toLocalDateTime()` remain in createOrder/updateOrder

## Verification Results

### Frontend Changes
- ApiError class exists with public status field ✓
- api.svelte.ts imports and throws ApiError with response.status ✓
- payment-step.svelte detects 409 via `e instanceof ApiError && e.status === 409` ✓
- orders/[id]/+page.svelte detects 409 via `e instanceof ApiError && e.status === 409` ✓
- operations/+page.svelte detects 409 via `e instanceof ApiError && e.status === 409` ✓
- orders/new/+page.svelte has dead setTimeout/clearTimeout code removed ✓

### Backend Changes
- Order domain model uses OffsetDateTime for all timestamp fields ✓
- OrderEntity JPA entity maps timestamp fields to TIMESTAMP WITH TIME ZONE ✓
- No calls to `.toLocalDateTime()` in SalesService createOrder/updateOrder ✓
- createdAt uses OffsetDateTime.now(ZoneId.systemDefault()) ✓
- committedDeadline preserves OffsetDateTime from frontend without conversion ✓

## Deviations from Plan

None - plan executed exactly as written. All tasks completed successfully with proper error handling and timezone preservation implemented.

## Key Impact

1. **Error Handling:** 409 Conflict errors in order submission are now properly detected via HTTP status code instead of message parsing, enabling robust duplicate order detection in the critical payment wizard path.

2. **Timezone Preservation:** Order creation and update timestamps now preserve timezone offset information through database persistence, preventing timezone loss for committed deadlines and audit trail timestamps.

3. **Code Quality:** Removed 29 lines of dead code (unused setTimeout/clearTimeout), improving code maintainability.

## Git Commits

| Hash | Message |
|------|---------|
| 9e8880d | feat(260403-sh6): create ApiError class with status field |
| 19491d9 | feat(260403-sh6): update api.svelte.ts to throw ApiError with status code |
| ef0c044 | fix(260403-sh6): fix 409 error detection and remove dead code in dashboard pages |
| 8a40ecf | fix(260403-sh6): preserve timezone information in Order timestamps |

## Post-Deployment Verification Checklist

- [ ] Test duplicate order creation (409 handling) in payment wizard
- [ ] Verify order details page error display
- [ ] Verify operations page error handling
- [ ] Check database for TIMESTAMP WITH TIME ZONE fields in order table
- [ ] Verify committed deadline preserves timezone offset when displayed
- [ ] Confirm createdAt/updatedAt timestamps include timezone offset

## Self-Check: PASSED

All files created/modified and commits verified:
- ✓ anotame-web/src/lib/services/ApiError.ts - ApiError class with status field
- ✓ anotame-web/src/lib/services/api.svelte.ts - Throws ApiError with response.status
- ✓ anotame-web/src/lib/components/orders/wizard/payment-step.svelte - 409 detection
- ✓ anotame-web/src/routes/(app)/dashboard/orders/[id]/+page.svelte - 409 detection
- ✓ anotame-web/src/routes/(app)/dashboard/operations/+page.svelte - 409 detection
- ✓ anotame-web/src/routes/(app)/dashboard/orders/new/+page.svelte - Dead code removed
- ✓ anotame-api/backend/sales-service/src/main/java/com/anotame/sales/domain/model/Order.java - OffsetDateTime fields
- ✓ anotame-api/backend/sales-service/src/main/java/com/anotame/sales/infrastructure/persistence/entity/OrderEntity.java - TIMESTAMP WITH TIME ZONE columns
- ✓ anotame-api/backend/sales-service/src/main/java/com/anotame/sales/application/service/SalesService.java - Timezone-aware datetime handling

All 4 commits present:
- ✓ 9e8880d: feat(260403-sh6): create ApiError class with status field
- ✓ 19491d9: feat(260403-sh6): update api.svelte.ts to throw ApiError with status code
- ✓ ef0c044: fix(260403-sh6): fix 409 error detection and remove dead code in dashboard pages
- ✓ 8a40ecf: fix(260403-sh6): preserve timezone information in Order timestamps


