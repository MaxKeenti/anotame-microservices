---
phase: quick
plan: 260403-sh6
verified: 2026-04-03T20:45:00Z
status: gaps_found
score: 0/6 must-haves verified
gaps:
  - truth: "API errors on frontend expose HTTP status codes in catch blocks"
    status: failed
    reason: "ApiError class does not exist in main codebase; api.svelte.ts still throws generic Error instead of ApiError"
    artifacts:
      - path: "anotame-web/src/lib/services/ApiError.ts"
        issue: "File does not exist in main codebase (only exists in worktree branch)"
      - path: "anotame-web/src/lib/services/api.svelte.ts"
        issue: "Still throws generic Error(backendMessage) on line 85, no ApiError import, no status field passed"
    missing:
      - "ApiError.ts must be created and committed to main codebase"
      - "api.svelte.ts must import ApiError and throw ApiError(message, response.status, errorData)"

  - truth: "Pages can detect 409 Conflict errors by checking error.status === 409"
    status: failed
    reason: "None of the 3 dashboard pages have 409 detection via ApiError status field"
    artifacts:
      - path: "anotame-web/src/lib/components/orders/wizard/payment-step.svelte"
        issue: "Line 142 checks e.message.includes('Database conflict') instead of e instanceof ApiError && e.status === 409; no ApiError import"
      - path: "anotame-web/src/routes/(app)/dashboard/operations/+page.svelte"
        issue: "Line 66 checks e?.message?.includes('409') instead of e instanceof ApiError && e.status === 409; no ApiError import"
      - path: "anotame-web/src/routes/(app)/dashboard/orders/[id]/+page.svelte"
        issue: "File has 409 detection on worktree branch but NOT in main codebase (no file found)"
    missing:
      - "ApiError import required in all three files"
      - "All three files must replace string-based 409 checks with: e instanceof ApiError && e.status === 409"

  - truth: "Order submission error handling in payment-step catches and properly identifies 409 conflicts"
    status: failed
    reason: "payment-step.svelte still uses broken message parsing instead of ApiError status check"
    artifacts:
      - path: "anotame-web/src/lib/components/orders/wizard/payment-step.svelte"
        issue: "Lines 130-148: catch block checks e.message.includes('Database conflict') instead of proper 409 detection via e.status"
    missing:
      - "Update catch block with: if (e instanceof ApiError && e.status === 409) { handle 409 }"

  - truth: "Dead code (unused initialization timeout) removed from orders/new page"
    status: failed
    reason: "orders/new/+page.svelte still contains dead setTimeout that never executes"
    artifacts:
      - path: "anotame-web/src/routes/(app)/dashboard/orders/new/+page.svelte"
        issue: "Lines 14-21: setTimeout is set for 2000ms but immediately cleared in finally block (line 39), code never executes"
    missing:
      - "Remove setTimeout/clearTimeout wrapper; keep only the try-finally initialization logic"

  - truth: "Order creation and updates preserve timezone offsets for timestamps"
    status: failed
    reason: "Backend Order entity and SalesService still use LocalDateTime instead of OffsetDateTime with timezone support"
    artifacts:
      - path: "anotame-api/backend/sales-service/src/main/java/com/anotame/sales/domain/model/Order.java"
        issue: "Lines 5,17,25,27,28: Fields still use LocalDateTime instead of OffsetDateTime (committedDeadline, createdAt, updatedAt, deletedAt)"
      - path: "anotame-api/backend/sales-service/src/main/java/com/anotame/sales/infrastructure/persistence/entity/OrderEntity.java"
        issue: "Lines 12,44,69,76,79: Fields still use LocalDateTime instead of OffsetDateTime; database columns not mapped to TIMESTAMP WITH TIME ZONE"
      - path: "anotame-api/backend/sales-service/src/main/java/com/anotame/sales/application/service/SalesService.java"
        issue: "Line 49: Still calls .toLocalDateTime() on committedDeadline; Line 60: Still uses LocalDateTime.now() instead of OffsetDateTime.now(ZoneId.systemDefault())"
    missing:
      - "Change all timestamp fields in Order.java to OffsetDateTime"
      - "Change all timestamp fields in OrderEntity.java to OffsetDateTime with @Column(columnDefinition = 'TIMESTAMP WITH TIME ZONE')"
      - "Update SalesService createOrder (line 60) to use OffsetDateTime.now(ZoneId.systemDefault())"
      - "Update SalesService updateOrder (line 193) to remove .toLocalDateTime() call"
      - "Import java.time.OffsetDateTime and java.time.ZoneId in SalesService"

---

# Quick Task 260403-sh6: Fix 6 Detected Production Issues - Verification Report

**Task Goal:** Fix 6 detected production issues: 4 frontend bugs (409 error detection in payment wizard, order details page, and operations page; plus dead code initialization timeout removal) and 2 backend datetime issues (timezone offset discarding in createOrder and updateOrder methods).

**Verified:** 2026-04-03T20:45:00Z

**Status:** gaps_found

**Re-verification:** No — initial verification

## Critical Finding: Work on Worktree Branch, Not in Main Codebase

The SUMMARY.md documents commit hashes (9e8880d, 19491d9, ef0c044, 8a40ecf) that DO exist in git history, but **only on the worktree branch `worktree-agent-a3185363`**, not on the current working branch (`fix/prod-fixing`).

**This means: The work was performed but NOT integrated into the actual codebase.** All claims in the SUMMARY are fabricated — the commits exist as evidence of work performed by Claude agents in an isolated worktree, but none of the changes appear in the actual source files being tracked by the main branch.

### Evidence

- Current branch: `fix/prod-fixing` (up to date with `origin/fix/prod-fixing`)
- Commits claimed in SUMMARY exist only on: `worktree-agent-a3185363` (checked via `git branch -a --contains`)
- ApiError.ts exists only in: `.claude/worktrees/agent-a3185363/anotame-web/src/lib/services/ApiError.ts`
- ApiError.ts NOT in main codebase: `anotame-web/src/lib/services/ApiError.ts` (confirmed missing)

## Goal Achievement Summary

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | API errors on frontend expose HTTP status codes in catch blocks | ✗ FAILED | ApiError.ts missing from codebase; api.svelte.ts line 85 still throws generic Error(backendMessage) |
| 2 | Pages can detect 409 Conflict errors by checking error.status === 409 | ✗ FAILED | payment-step.svelte line 142 checks e.message.includes('Database conflict'); operations/+page.svelte line 66 checks e?.message?.includes('409'); no ApiError imports |
| 3 | Order submission error handling in payment-step catches and properly identifies 409 conflicts | ✗ FAILED | payment-step.svelte catch block (lines 130-148) uses broken string parsing instead of status code check |
| 4 | Dead code (unused initialization timeout) removed from orders/new page | ✗ FAILED | orders/new/+page.svelte lines 14-21 still contain setTimeout(2000ms) that immediately clears in finally block (line 39) |
| 5 | Order entity timestamps preserve timezone offsets | ✗ FAILED | Order.java lines 5,17,25,27,28 still use LocalDateTime instead of OffsetDateTime |
| 6 | SalesService persists timestamps with timezone awareness | ✗ FAILED | SalesService.java line 49 still calls .toLocalDateTime(); line 60 uses LocalDateTime.now() instead of OffsetDateTime.now(ZoneId.systemDefault()) |

**Score:** 0/6 must-haves verified

## Required Artifacts Verification

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `anotame-web/src/lib/services/ApiError.ts` | Custom error class with status field, isApiError() guard | ✗ MISSING | File does not exist in main codebase |
| `anotame-web/src/lib/services/api.svelte.ts` | Imports ApiError, throws with status code | ✗ STUB | File exists but line 85 still throws generic Error(backendMessage) without ApiError class |
| `anotame-web/src/lib/components/orders/wizard/payment-step.svelte` | 409 detection via e instanceof ApiError && e.status === 409 | ✗ STUB | Line 142 checks e.message.includes('Database conflict') instead |
| `anotame-web/src/routes/(app)/dashboard/operations/+page.svelte` | 409 detection via e instanceof ApiError && e.status === 409 | ✗ STUB | Line 66 checks e?.message?.includes('409') instead |
| `anotame-web/src/routes/(app)/dashboard/orders/[id]/+page.svelte` | 409 detection via e instanceof ApiError && e.status === 409 | ✗ MISSING | File not found in main codebase (exists on worktree) |
| `anotame-web/src/routes/(app)/dashboard/orders/new/+page.svelte` | Dead code removed (setTimeout/clearTimeout) | ✗ STUB | Lines 14-21 still contain setTimeout(2000ms); line 39 immediately clears it |
| `anotame-api/backend/sales-service/src/main/java/com/anotame/sales/domain/model/Order.java` | OffsetDateTime fields (committedDeadline, createdAt, updatedAt, deletedAt) | ✗ STUB | All four fields still use LocalDateTime (lines 17,25,27,28) |
| `anotame-api/backend/sales-service/src/main/java/com/anotame/sales/infrastructure/persistence/entity/OrderEntity.java` | OffsetDateTime fields with TIMESTAMP WITH TIME ZONE columns | ✗ STUB | All four fields still use LocalDateTime (lines 44,69,76,79) |
| `anotame-api/backend/sales-service/src/main/java/com/anotame/sales/application/service/SalesService.java` | No .toLocalDateTime() calls; uses OffsetDateTime.now(ZoneId.systemDefault()) | ✗ STUB | Line 49 still calls .toLocalDateTime(); line 60 uses LocalDateTime.now() |

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| api.svelte.ts | Frontend catch blocks | Error must expose status field | ✗ NOT_WIRED | api.svelte.ts throws Error(message) not ApiError(message, status) |
| Dashboard pages | ApiError class | Import and instanceof check | ✗ NOT_WIRED | No pages import ApiError; all use broken message parsing |
| Payment wizard form | 409 handler | Order submission try/catch | ✗ NOT_WIRED | Catch block doesn't check error.status |
| SalesService createOrder | OffsetDateTime persistence | Timezone-aware timestamp | ✗ NOT_WIRED | Still uses LocalDateTime.now() |
| SalesService updateOrder | OffsetDateTime preservation | Remove .toLocalDateTime() | ✗ NOT_WIRED | Still calls .toLocalDateTime() on line 193 |
| Order entity | Database | Timezone column mapping | ✗ NOT_WIRED | No TIMESTAMP WITH TIME ZONE columns |

## Data-Flow Trace

Not applicable — frontend error handling is control flow, not data flow. Error status must be explicitly checked in catch blocks (wiring verification in Key Links section above).

## Behavioral Spot-Checks

Unable to verify — ApiError class not available to test frontend error handling; backend compilation would fail due to LocalDateTime/OffsetDateTime type mismatches.

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| payment-step.svelte | 142 | `e.message.includes('Database conflict')` — string parsing for error type detection | 🛑 BLOCKER | 409 detection completely broken; duplicate order errors not properly identified |
| operations/+page.svelte | 66 | `e?.message?.includes('409')` — relying on error message string instead of status code | 🛑 BLOCKER | 409 detection broken; can't reliably detect conflict errors |
| orders/new/+page.svelte | 14-21, 39 | `setTimeout(() => {...}, 2000); ... clearTimeout(timeout);` — dead code pattern | ⚠️ WARNING | Timeout callback never executes; initialization logic inefficient |
| SalesService.java | 49 | `.toLocalDateTime()` call on committed deadline | 🛑 BLOCKER | Discards timezone offset information from frontend OffsetDateTime |
| SalesService.java | 60 | `LocalDateTime.now()` instead of timezone-aware variant | 🛑 BLOCKER | Created timestamps lose timezone context; can't be properly serialized to frontend |
| Order.java, OrderEntity.java | 17-28, 44-79 | Use of `LocalDateTime` for audit timestamps | 🛑 BLOCKER | Timezone information lost during persistence; committed deadlines lose user's local context |

## Gaps Summary

### Frontend Error Handling (4 Blockers)

The frontend cannot properly detect and handle 409 Conflict errors because:

1. **Missing ApiError class:** The custom error class with status field was never created in the main codebase. It exists only in a worktree branch.

2. **api.svelte.ts still throws generic Error:** The API service has not been updated to import or throw ApiError with status codes. On line 85, it still throws `Error(backendMessage)`, dropping the HTTP status code entirely.

3. **Dashboard pages use broken error detection:** All three pages (payment-step.svelte, operations/+page.svelte) attempt to detect 409 errors by parsing error messages (`e.message.includes('409')` or `e.message.includes('Database conflict')`), which is unreliable and fails when the backend error message format changes.

4. **No proper type guard:** Without ApiError and isApiError() type guard, catch blocks cannot safely check error.status. This is the root cause of the original bug: 409 detection was broken because there was no way to access the HTTP status code.

**Impact:** Order submission error handling is fundamentally broken. Users attempting to create duplicate orders will see a generic error message instead of a specific "duplicate order" error. Operations page cannot reliably detect conflicts.

### Backend Timezone Handling (2 Blockers)

The backend cannot preserve timezone information because:

1. **Order entity uses LocalDateTime:** All four timestamp fields (committedDeadline, createdAt, updatedAt, deletedAt) are defined as LocalDateTime in both the domain model (Order.java) and JPA entity (OrderEntity.java). LocalDateTime discards timezone information.

2. **SalesService converts OffsetDateTime to LocalDateTime:** In createOrder() line 49, the request's committedDeadline (which comes from frontend as OffsetDateTime with timezone offset) is converted with `.toLocalDateTime()`, explicitly discarding the timezone offset. In createOrder() line 60, `LocalDateTime.now()` is used instead of timezone-aware `OffsetDateTime.now(ZoneId.systemDefault())`.

3. **updateOrder() also discards timezone:** Line 193 still calls `.toLocalDateTime()` on the committed deadline, again losing timezone information.

**Impact:** Order creation timestamps cannot be properly serialized back to the frontend with timezone context. Committed deadlines are stored without timezone information, making them ambiguous (e.g., "2026-04-05 14:00" — in which timezone?). This violates the requirement to "preserve timezone information through database persistence."

### Dead Code (1 Warning)

orders/new/+page.svelte lines 14-21: A setTimeout for 2000ms is set but immediately cleared in the finally block (line 39), so the timeout callback never executes. This is dead code that should be removed.

## Git Commits

Commits documented in SUMMARY.md exist only on worktree branch:
- 9e8880d (feat: create ApiError class) — worktree-agent-a3185363 only
- 19491d9 (feat: update api.svelte.ts) — worktree-agent-a3185363 only
- ef0c044 (fix: 409 detection and dead code removal) — worktree-agent-a3185363 only
- 8a40ecf (fix: timezone preservation) — worktree-agent-a3185363 only

**None of these commits are on the current working branch `fix/prod-fixing`.**

## Conclusion

**The task shows 0/6 must-haves verified.** All observable truths failed verification because:

1. The work was performed (evidenced by real commits on a worktree branch)
2. The work was never integrated into the main codebase
3. The SUMMARY.md documents what was supposedly done, but the codebase shows none of it

This is a **complete goal failure**. The task goal was to "Fix 6 detected issues" — but none of the fixes are present in the actual codebase. The work exists in isolation on a worktree branch and would need to be:
1. Committed to the main working branch
2. Integrated with any conflicting changes
3. Tested in the actual codebase (not the worktree)
4. Verified against the actual source files

---

_Verified: 2026-04-03T20:45:00Z_
_Verifier: Claude (gsd-verifier)_
