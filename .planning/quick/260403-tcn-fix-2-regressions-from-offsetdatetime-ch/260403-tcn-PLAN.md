---
phase: quick-260403-tcn
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - anotame-api/sales-service/src/main/java/com/elhilvan/anotame/sales/application/SalesService.java
  - anotame-api/sales-service/src/main/java/com/elhilvan/anotame/sales/infrastructure/web/OrdersResource.java
autonomous: true
requirements: []
user_setup: []

must_haves:
  truths:
    - getDashboardMetrics API endpoint returns dashboard metric data without QueryArgumentException
    - createOrder API endpoint accepts valid order request without NullPointerException
    - All deadline queries work with OffsetDateTime consistently
  artifacts:
    - path: anotame-api/sales-service/src/main/java/com/elhilvan/anotame/sales/application/SalesService.java
      provides: getDashboardMetrics method with correct OffsetDateTime parameter conversion
      contains: LocalDateTime converted to OffsetDateTime before countActiveByDeadlineRange call
    - path: anotame-api/sales-service/src/main/java/com/elhilvan/anotame/sales/infrastructure/web/OrdersResource.java
      provides: createOrder method with null-safe UUID handling
      contains: null-check for @RequestParam before UUID.fromString() call
  key_links:
    - from: SalesService.getDashboardMetrics()
      to: OrderRepository.countActiveByDeadlineRange()
      via: parameter passing
      pattern: "OffsetDateTime"
    - from: OrdersResource.createOrder()
      to: UUID.fromString()
      via: @RequestParam
      pattern: "null.*check|validation"
---

<objective>
Fix 2 regressions introduced by OffsetDateTime timezone changes in version 1.1.

**Regression 1:** getDashboardMetrics → QueryArgumentException due to LocalDateTime/OffsetDateTime mismatch in deadline parameter
**Regression 2:** createOrder → NullPointerException in UUID.fromString() when @RequestParam is null

Purpose: Restore dashboard metrics API and order creation API to working state
Output: Two method fixes, both tested locally with sample data
</objective>

<execution_context>
Quick task for Production Stability (v1.1)
Root cause: Recent OffsetDateTime refactoring did not fully propagate through all callers
Related commits: 8475338 (ORDER_PERSISTENCE timestamp fixes), bae2203 (STATE update)
</execution_context>

<context>
## Recent Timezone Changes
- OrderPersistenceAdapter now uses OffsetDateTime for all timestamp fields (createdAt, updatedAt, committedDeadline)
- SalesService.getDashboardMetrics still passing LocalDateTime to repository method expecting OffsetDateTime
- OrdersResource.createOrder missing parameter validation before UUID creation

## Method Signatures (Current State)
From OrderRepository (inferred from error):
- `countActiveByDeadlineRange(OffsetDateTime startDeadline, OffsetDateTime endDeadline): long`

From SalesService (line 302):
- `getDashboardMetrics()` calls `countActiveByDeadlineRange()` with LocalDateTime.now() arguments

From OrdersResource (line 32):
- `createOrder(@RequestParam String orderId, ...)` → `UUID.fromString(orderId)` without null check
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix getDashboardMetrics OffsetDateTime conversion</name>
  <files>anotame-api/sales-service/src/main/java/com/elhilvan/anotame/sales/application/SalesService.java</files>
  <action>
In SalesService.getDashboardMetrics() method (around line 302):

Current pattern (BROKEN):
```java
LocalDateTime startDeadline = LocalDateTime.now().withHour(0).withMinute(0);
LocalDateTime endDeadline = startDeadline.plusDays(1);
repository.countActiveByDeadlineRange(startDeadline, endDeadline);
```

Fix approach:
1. Import java.time.OffsetDateTime and ZoneOffset if not present
2. Change the LocalDateTime variables to OffsetDateTime with proper timezone handling:
```java
OffsetDateTime startDeadline = OffsetDateTime.now(ZoneOffset.UTC).withHour(0).withMinute(0).withSecond(0).withNano(0);
OffsetDateTime endDeadline = startDeadline.plusDays(1);
repository.countActiveByDeadlineRange(startDeadline, endDeadline);
```
3. OR if the method should use system default timezone instead of UTC:
```java
OffsetDateTime startDeadline = OffsetDateTime.now().withHour(0).withMinute(0).withSecond(0).withNano(0);
OffsetDateTime endDeadline = startDeadline.plusDays(1);
repository.countActiveByDeadlineRange(startDeadline, endDeadline);
```

Verify that all calls to countActiveByDeadlineRange within getDashboardMetrics use OffsetDateTime consistently.
  </action>
  <verify>
    <automated>
grep -n "OffsetDateTime.*deadline" anotame-api/sales-service/src/main/java/com/elhilvan/anotame/sales/application/SalesService.java | head -5
    </automated>
  </verify>
  <done>getDashboardMetrics passes OffsetDateTime parameters to countActiveByDeadlineRange; no LocalDateTime used in deadline parameter conversion</done>
</task>

<task type="auto">
  <name>Task 2: Fix createOrder NullPointerException in UUID generation</name>
  <files>anotame-api/sales-service/src/main/java/com/elhilvan/anotame/sales/infrastructure/web/OrdersResource.java</files>
  <action>
In OrdersResource.createOrder() method (around line 32):

Current pattern (BROKEN):
```java
@PostMapping
public ResponseEntity<?> createOrder(@RequestParam String orderId, ...) {
    UUID uuid = UUID.fromString(orderId);  // NullPointerException if orderId is null
    ...
}
```

Fix approach:
1. Add null validation before UUID.fromString():
```java
@PostMapping
public ResponseEntity<?> createOrder(@RequestParam String orderId, ...) {
    if (orderId == null || orderId.isEmpty()) {
        return ResponseEntity.badRequest()
            .body(new ApiError("INVALID_REQUEST", "orderId parameter is required"));
    }
    try {
        UUID uuid = UUID.fromString(orderId);
        ...
    } catch (IllegalArgumentException e) {
        return ResponseEntity.badRequest()
            .body(new ApiError("INVALID_UUID", "orderId must be a valid UUID"));
    }
}
```

2. OR if orderId should be marked @RequestParam(required = true):
```java
@PostMapping
public ResponseEntity<?> createOrder(@RequestParam(required = true) String orderId, ...) {
    // Let Spring handle null validation via @RequestParam(required = true)
    UUID uuid = UUID.fromString(orderId);
    ...
}
```

Choose approach #1 (explicit null check with custom error response) for better error messaging consistency with ApiError class. Add try-catch for malformed UUIDs as defense-in-depth.
  </action>
  <verify>
    <automated>
grep -n "if.*orderId.*null\|@RequestParam.*required.*true" anotame-api/sales-service/src/main/java/com/elhilvan/anotame/sales/infrastructure/web/OrdersResource.java
    </automated>
  </verify>
  <done>createOrder validates orderId is not null/empty before calling UUID.fromString(); handles malformed UUIDs with error response</done>
</task>

</tasks>

<verification>
After completing both tasks:

1. **Task 1 verification:**
   - SalesService.getDashboardMetrics() contains no LocalDateTime used in deadline parameters
   - All deadline parameters passed to OrderRepository are OffsetDateTime type
   - Code compiles without type errors

2. **Task 2 verification:**
   - OrdersResource.createOrder() has null/empty check before UUID.fromString()
   - IllegalArgumentException from malformed UUID is caught and returns error response
   - Code compiles without type errors

3. **Local testing (optional):**
   - Build: `bun run build:api` (sales-service) should complete without errors
   - If Docker compose available: `docker compose up --build` and test endpoints manually
</verification>

<success_criteria>
- getDashboardMetrics API no longer returns QueryArgumentException on deadline queries
- createOrder API no longer returns NullPointerException on missing orderId parameter
- Both methods handle edge cases gracefully (null params, malformed UUIDs)
- Code compiles successfully
- No new compiler warnings introduced
</success_criteria>

<output>
After completion, create `.planning/quick/260403-tcn-fix-2-regressions-from-offsetdatetime-ch/260403-tcn-SUMMARY.md` with:
- What was fixed (both regressions)
- Files modified and changes made
- Verification results
- Any edge cases handled
</output>
