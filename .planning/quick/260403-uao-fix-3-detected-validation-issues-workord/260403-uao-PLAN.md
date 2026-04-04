---
phase: quick
plan: 260403-uao
type: execute
wave: 1
depends_on: []
files_modified:
  - anotame-api/backend/operations-service/src/main/resources/db/migration/V1__baseline.sql
  - anotame-api/backend/operations-service/src/main/java/com/anotame/operations/infrastructure/persistence/entity/WorkOrderJpa.java
  - anotame-api/backend/operations-service/src/main/java/com/anotame/operations/application/service/OperationsService.java
  - anotame-api/backend/sales-service/src/main/java/com/anotame/sales/infrastructure/web/controller/OrdersResource.java
autonomous: true
requirements: []
user_setup: []

must_haves:
  truths:
    - "WorkOrder timestamps use correct PostgreSQL type (timestamp with time zone) matching OffsetDateTime mapping"
    - "OperationsService.getWorkOrder() validates UUID parameter and throws appropriate exception"
    - "OrdersResource.createOrder() validates both user_id and branch_id UUID format before parsing"
    - "Invalid UUID claims in JWT produce clear 400 BadRequestException, not 500 IllegalArgumentException"
    - "Database schema and JPA entity timestamp types are in sync"
  artifacts:
    - path: "anotame-api/backend/operations-service/src/main/resources/db/migration/V1__baseline.sql"
      provides: "tco_work_order schema with correct timestamp types"
      contains: "timestamp with time zone"
    - path: "anotame-api/backend/operations-service/src/main/java/com/anotame/operations/infrastructure/persistence/entity/WorkOrderJpa.java"
      provides: "WorkOrderJpa entity mapping OffsetDateTime to schema"
      contains: "OffsetDateTime"
    - path: "anotame-api/backend/operations-service/src/main/java/com/anotame/operations/application/service/OperationsService.java"
      provides: "Validated UUID parameter handling and specific exceptions"
      contains: "IllegalArgumentException"
    - path: "anotame-api/backend/sales-service/src/main/java/com/anotame/sales/infrastructure/web/controller/OrdersResource.java"
      provides: "UUID claim validation with try-catch error handling"
      contains: "try.*catch.*IllegalArgumentException"
  key_links:
    - from: "WorkOrderJpa.createdAt/updatedAt"
      to: "V1__baseline.sql tco_work_order schema"
      via: "JPA/Hibernate mapping"
      pattern: "OffsetDateTime.*created_at.*timestamp with time zone"
    - from: "OperationsService.getWorkOrder(UUID id)"
      to: "WorkOrderRepositoryPort.findById(id)"
      via: "method call with validation"
      pattern: "getWorkOrder.*\\bif.*id.*null.*orElseThrow"
    - from: "OrdersResource.createOrder()"
      to: "UUID.fromString(userIdClaim|branchIdClaim)"
      via: "try-catch with error handling"
      pattern: "try.*UUID\\.fromString.*catch.*IllegalArgumentException"
---

<objective>
Fix 3 detected validation issues in database schema, UUID parameter validation, and JWT claim parsing that cause type mismatches and unclear error messages.

Purpose: Prevent 500 errors from type mismatches and invalid UUID formats in JWT claims. Ensure clear validation with appropriate 400 BadRequestException responses instead of generic IllegalArgumentException stack traces.

Output: Fixed schema migration, validated entity mapping, robust UUID validation in services and controllers.
</objective>

<execution_context>
These are production stability fixes addressing:
1. Database schema mismatches from earlier OffsetDateTime migration (timestamp type should be "timestamp with time zone" not "timestamp(6) without time zone")
2. Missing UUID validation in OperationsService that throws generic RuntimeException
3. Missing UUID format validation in OrdersResource JWT claim parsing that can throw uncaught IllegalArgumentException as 500 error

All fixes follow AI_RULES.md validation patterns and use specific exception types for clear error responses.
</execution_context>

<context>
@.planning/STATE.md
@AI_RULES.md

Current Issues:

1. WorkOrderJpa Schema Mismatch (V1__baseline.sql lines 340-346):
```sql
CREATE TABLE public.tco_work_order (
    id_work_order uuid NOT NULL,
    created_at timestamp(6) without time zone,
    id_order uuid NOT NULL,
    status character varying(255) NOT NULL,
    updated_at timestamp(6) without time zone
);
```
Problem: Uses "timestamp(6) without time zone" but WorkOrderJpa uses OffsetDateTime which needs "timestamp with time zone"

2. OperationsService.getWorkOrder() (lines 36-39):
```java
public WorkOrder getWorkOrder(UUID id) {
    return workOrderRepositoryPort.findById(id)
            .orElseThrow(() -> new RuntimeException("WorkOrder not found with id: " + id));
}
```
Problem: No null check on id parameter, generic RuntimeException, should throw IllegalArgumentException if id is invalid or EntityNotFoundException if not found

3. OrdersResource.createOrder() (lines 42, 35-40):
```java
String branchIdClaim = (String) jwt.getClaim("branch_id");
UUID branchId = (branchIdClaim != null && !branchIdClaim.isEmpty())
    ? UUID.fromString(branchIdClaim)
    : UUID.fromString("ea22f4a4-5504-43d9-92f9-30cc17b234d1");

UUID userId = UUID.fromString(userIdClaim);
```
Problem: UUID.fromString() calls can throw uncaught IllegalArgumentException if format is invalid. userIdClaim (line 42) lacks try-catch wrapper causing 500 errors instead of 400 BadRequestException.
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix WorkOrder schema timestamp types in Flyway migration</name>
  <files>anotame-api/backend/operations-service/src/main/resources/db/migration/V1__baseline.sql</files>
  <action>
Update the tco_work_order table definition (around line 340-346) to use correct PostgreSQL type for OffsetDateTime mapping:

Current (incorrect):
```sql
CREATE TABLE public.tco_work_order (
    id_work_order uuid NOT NULL,
    created_at timestamp(6) without time zone,
    id_order uuid NOT NULL,
    status character varying(255) NOT NULL,
    updated_at timestamp(6) without time zone
);
```

Change to (correct - match other tables like tco_order, tce_branch):
```sql
CREATE TABLE public.tco_work_order (
    id_work_order uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    id_order uuid NOT NULL,
    status character varying(255) NOT NULL,
    updated_at timestamp with time zone DEFAULT now()
);
```

Rationale: Hibernate @CreationTimestamp and @UpdateTimestamp with OffsetDateTime requires "timestamp with time zone" (which preserves timezone offset). This aligns with other tables in schema (tco_order lines 260-261, tce_branch lines 181-182).
  </action>
  <verify>
    <automated>grep -n "tco_work_order" anotame-api/backend/operations-service/src/main/resources/db/migration/V1__baseline.sql | grep "CREATE TABLE" && grep -A 6 "CREATE TABLE public.tco_work_order" anotame-api/backend/operations-service/src/main/resources/db/migration/V1__baseline.sql | grep "timestamp with time zone" && echo "PASS: Schema uses timestamp with time zone" || echo "FAIL: Schema still uses incorrect type"</automated>
    <automated>cd anotame-api && grep -r "created_at timestamp with time zone" backend/operations-service/src/main/resources/db/migration/V1__baseline.sql >/dev/null && echo "PASS: created_at type correct" || echo "FAIL: created_at type mismatch"</automated>
  </verify>
  <done>
  - tco_work_order.created_at changed to "timestamp with time zone DEFAULT now() NOT NULL"
  - tco_work_order.updated_at changed to "timestamp with time zone DEFAULT now()"
  - Schema type matches OffsetDateTime JPA mapping
  - Consistent with other tables in baseline schema
  </done>
</task>

<task type="auto">
  <name>Task 2: Add UUID parameter validation in OperationsService.getWorkOrder()</name>
  <files>anotame-api/backend/operations-service/src/main/java/com/anotame/operations/application/service/OperationsService.java</files>
  <action>
Update OperationsService.getWorkOrder() (lines 36-39) to validate UUID parameter and use specific exception:

Current:
```java
public WorkOrder getWorkOrder(UUID id) {
    return workOrderRepositoryPort.findById(id)
            .orElseThrow(() -> new RuntimeException("WorkOrder not found with id: " + id));
}
```

Change to:
```java
public WorkOrder getWorkOrder(UUID id) {
    if (id == null) {
        throw new IllegalArgumentException("WorkOrder ID cannot be null");
    }
    return workOrderRepositoryPort.findById(id)
            .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("WorkOrder not found with id: " + id));
}
```

Rationale:
- Null check prevents NullPointerException in repository layer
- EntityNotFoundException (from jakarta.persistence) is more specific than RuntimeException and maps to 404 in REST layer
- Follows hexagonal architecture pattern: service validates inputs before delegation
  </action>
  <verify>
    <automated>grep -A 5 "public WorkOrder getWorkOrder" anotame-api/backend/operations-service/src/main/java/com/anotame/operations/application/service/OperationsService.java | grep -c "IllegalArgumentException" && echo "PASS: Null validation added" || echo "FAIL: Missing null check"</automated>
    <automated>grep -A 5 "public WorkOrder getWorkOrder" anotame-api/backend/operations-service/src/main/java/com/anotame/operations/application/service/OperationsService.java | grep -c "EntityNotFoundException" && echo "PASS: Specific exception used" || echo "FAIL: Still using RuntimeException"</automated>
    <automated>cd anotame-api/backend/operations-service && mvn clean compile -q && echo "PASS: Code compiles" || echo "FAIL: Compilation error"</automated>
  </verify>
  <done>
  - getWorkOrder() validates UUID id is not null
  - Throws IllegalArgumentException for null id
  - Throws EntityNotFoundException for missing WorkOrder (not RuntimeException)
  - Code compiles without errors
  - Follows hexagonal architecture validation pattern
  </done>
</task>

<task type="auto">
  <name>Task 3: Add UUID format validation in OrdersResource.createOrder() JWT claim parsing</name>
  <files>anotame-api/backend/sales-service/src/main/java/com/anotame/sales/infrastructure/web/controller/OrdersResource.java</files>
  <action>
Update OrdersResource.createOrder() to wrap UUID.fromString() calls with try-catch for both user_id and branch_id claims:

Current (lines 30-44):
```java
String userIdClaim = (String) jwt.getClaim("user_id");
if (userIdClaim == null || userIdClaim.isEmpty()) {
    throw new jakarta.ws.rs.BadRequestException("Missing or invalid user_id claim in JWT token");
}

String branchIdClaim = (String) jwt.getClaim("branch_id");
// Intentional backward compatibility: branch_id is optional with fallback to default branch (Oaxaca #113)
// This supports newly registered users, legacy sessions, and v1.0 rollout without requiring re-login
UUID branchId = (branchIdClaim != null && !branchIdClaim.isEmpty())
    ? UUID.fromString(branchIdClaim)
    : UUID.fromString("ea22f4a4-5504-43d9-92f9-30cc17b234d1");

UUID userId = UUID.fromString(userIdClaim);
```

Change to:
```java
String userIdClaim = (String) jwt.getClaim("user_id");
if (userIdClaim == null || userIdClaim.isEmpty()) {
    throw new jakarta.ws.rs.BadRequestException("Missing or invalid user_id claim in JWT token");
}

String branchIdClaim = (String) jwt.getClaim("branch_id");
// Intentional backward compatibility: branch_id is optional with fallback to default branch (Oaxaca #113)
// This supports newly registered users, legacy sessions, and v1.0 rollout without requiring re-login
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

Rationale:
- UUID.fromString() throws IllegalArgumentException for invalid formats (uncaught = 500 error)
- Wrapping with try-catch converts to BadRequestException (400 error) with clear message
- user_id validation needed since no error handling exists currently
- branchId fallback to hardcoded UUID always succeeds, but wrapping both for consistency and future-proofing
  </action>
  <verify>
    <automated>grep -A 20 "public OrderResponse createOrder" anotame-api/backend/sales-service/src/main/java/com/anotame/sales/infrastructure/web/controller/OrdersResource.java | grep -c "try.*catch.*IllegalArgumentException" && echo "PASS: UUID validation wrapping added" || echo "FAIL: Missing try-catch for UUID parsing"</automated>
    <automated>grep -A 20 "public OrderResponse createOrder" anotame-api/backend/sales-service/src/main/java/com/anotame/sales/infrastructure/web/controller/OrdersResource.java | grep "userId = UUID.fromString" && grep -B 3 "userId = UUID.fromString" anotame-api/backend/sales-service/src/main/java/com/anotame/sales/infrastructure/web/controller/OrdersResource.java | grep -c "try" && echo "PASS: user_id UUID parsing wrapped in try-catch" || echo "FAIL: user_id still not wrapped"</automated>
    <automated>cd anotame-api/backend/sales-service && mvn clean compile -q && echo "PASS: Code compiles" || echo "FAIL: Compilation error"</automated>
  </verify>
  <done>
  - user_id claim UUID.fromString() wrapped in try-catch
  - branch_id claim UUID.fromString() wrapped in try-catch
  - Both throw BadRequestException (400) on invalid UUID format instead of letting IllegalArgumentException become 500
  - user_id and branch_id error messages are clear and specific
  - Code compiles without errors
  - Aligns with earlier 260403-tqw backward compatibility pattern for branch_id
  </done>
</task>

</tasks>

<verification>
1. Schema Fix: Migration file updated with correct timestamp type matching OffsetDateTime mapping
2. Service Validation: OperationsService.getWorkOrder() validates UUID parameter and throws specific exception
3. Controller Validation: OrdersResource.createOrder() wraps UUID.fromString() calls with try-catch
4. Error Messages: Invalid UUID claims return 400 BadRequestException with clear messages
5. Compilation: All modules compile without errors (mvn clean compile)
6. Consistency: Fixes align with AI_RULES.md validation patterns and hexagonal architecture
</verification>

<success_criteria>
- WorkOrder schema uses "timestamp with time zone" for OffsetDateTime support
- OperationsService validates UUID parameter and uses EntityNotFoundException
- OrdersResource validates both user_id and branch_id UUID formats with BadRequestException
- Invalid UUID claims return 400 errors, not 500 errors
- All code compiles successfully
- Database migrations are flyway-compatible
</success_criteria>

<output>
After completion:
1. Verify schema: `grep -A 6 "CREATE TABLE public.tco_work_order" anotame-api/backend/operations-service/src/main/resources/db/migration/V1__baseline.sql`
2. Verify service: `grep -A 8 "public WorkOrder getWorkOrder" anotame-api/backend/operations-service/src/main/java/com/anotame/operations/application/service/OperationsService.java`
3. Verify controller: `grep -A 25 "public OrderResponse createOrder" anotame-api/backend/sales-service/src/main/java/com/anotame/sales/infrastructure/web/controller/OrdersResource.java`
4. Build: `cd anotame-api && mvn clean compile -q`
</output>
