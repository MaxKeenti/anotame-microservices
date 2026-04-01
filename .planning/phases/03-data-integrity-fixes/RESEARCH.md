# Phase 3 Research: Data Integrity Fixes

**Date**: 2026-04-01
**Status**: Complete
**Confidence**: HIGH — all findings derived from direct codebase audit; no inference from training data alone.

---

## Project Constraints (from CLAUDE.md / AI_RULES.md)

- Architecture: Hexagonal / DDD. Domain layer has no framework dependencies. Service layer lives in `application/service/`. Controllers live in `infrastructure/web/controller/`.
- Database: PostgreSQL, UUID v4 PKs, soft deletes (`deleted_at` + `is_deleted`), audit fields (`created_at`, `updated_at`), `snake_case` naming.
- Backend: Quarkus 3.27.2, SmallRye JWT, MicroProfile JWT, Lombok, Panache.
- Security: `@Authenticated` and `@RolesAllowed` enforced at controller level via CDI interception.
- Do not leak framework dependencies into the domain layer.

---

## Summary

Three values in `SalesService.createOrder()` are hardcoded or incorrectly derived:

1. **`branchId`** — hardcoded as `UUID.fromString("ea22f4a4-5504-43d9-92f9-30cc17b234d1")` (line 45 of `SalesService.java`). The good news: this UUID is the real seeded branch in `init.sql`, so existing production orders are not at risk. The fix is to add a `branchId` claim to the JWT (identity-service change) and read it in sales-service via `@Inject JsonWebToken jwt`.

2. **`ticketNumber`** — generated as `"ORD-" + System.currentTimeMillis() % 10000` (line 43). This wraps every ~10 seconds and collides under any concurrency. The `ticket_number` column in `tco_order` is `VARCHAR` with a `UNIQUE` constraint, meaning collisions currently cause a DB constraint violation. A PostgreSQL sequence is the correct fix. This is an additive schema change — existing rows are unaffected.

3. **`createdBy`** — set as `UUID.nameUUIDFromBytes(username.getBytes())` (line 46). This is a deterministic hash from the username string, NOT the user's real UUID from `tca_user`. The fix reads `user.getId()` from the JWT `sub` / `upn` claim, but requires that claim to be added to the token.

The key blocker for both DATA-01 and DATA-03 is the same: `JwtUtils.generateToken()` currently only signs `upn` (username) and `groups` (roles). It does not include `user_id` or `branch_id`. Both claims must be added before sales-service can consume them.

---

## 1. User → Branch Relationship (identity-service)

### `tca_user` schema — no direct `branch_id` column

**Confirmed by audit of `User.java` and `init.sql`.**

`tca_user` has these columns: `id_user`, `id_role`, `username`, `email`, `password_hash`, `first_name`, `last_name`, `last_login_at`, `is_active`, `created_at`, `updated_at`, `deleted_at`, `is_deleted`.

There is **no `branch_id` column** on `tca_user`.

### User → Branch relationship: join table `tce_employee_assignment`

The schema uses a separate assignment table:

```sql
CREATE TABLE tce_employee_assignment (
    id_assignment UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_user  UUID NOT NULL REFERENCES tca_user(id_user),
    id_branch UUID NOT NULL REFERENCES tce_branch(id_branch),
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    UNIQUE(id_user, id_branch)
);
```

This is a many-to-many (a user could have multiple branch assignments), though in the current single-branch single-client scenario, each user has one active assignment.

**Implication for DATA-01:** At login time, `AuthService.login()` must query `tce_employee_assignment` to find the user's active branch. There is currently no `EmployeeAssignmentRepository` or equivalent in identity-service — this repository must be created.

Query at login:
```sql
SELECT id_branch FROM tce_employee_assignment
WHERE id_user = :userId AND is_active = true
LIMIT 1
```

If a user has no active assignment, the branchId claim should be omitted or null, and sales-service falls back to the hardcoded UUID during the transition period.

### `JwtUtils` current claims — what is already in the token

`JwtUtils.generateToken(String username, Set<String> roles)` (line 16-22):

```java
return Jwt.issuer(issuer)
        .upn(username)       // upn = username (string, not UUID)
        .groups(roles)       // groups = Set<String> e.g. {"EMPLOYEE"}
        .expiresIn(Duration.ofHours(24))
        .sign();
```

**Currently missing from the token:**
- `user_id` — the real UUID of the user (`tca_user.id_user`)
- `branch_id` — the branch UUID from `tce_employee_assignment`

### `AuthService.login()` — what data is available

`AuthService.login()` already loads the full `User` entity, so `user.getId()` (the real UUID) is available without any additional query. Only the branch lookup is new work.

The signature change required:
```java
// Current:
jwtUtils.generateToken(user.getUsername(), roles)

// Required:
jwtUtils.generateToken(user.getUsername(), user.getId(), branchId, roles)
```

---

## 2. Order Creation — Current State (sales-service)

### Exact lines with hardcoded / incorrect values

File: `anotame-api/backend/sales-service/src/main/java/com/anotame/sales/application/service/SalesService.java`

```
Line 43: order.setTicketNumber("ORD-" + System.currentTimeMillis() % 10000);
Line 44: order.setFolioBranch(1);  // hardcoded default
Line 45: order.setBranchId(UUID.fromString("ea22f4a4-5504-43d9-92f9-30cc17b234d1"));
Line 46: order.setCreatedBy(UUID.nameUUIDFromBytes(username.getBytes()));
```

### `createOrder` signature and how `username` arrives

`OrdersResource.java` (the controller, line 26):
```java
public Order createOrder(@Valid CreateOrderRequest request, @HeaderParam("X-User-Name") String username) {
    return salesService.createOrder(request, username);
}
```

The `username` currently comes from `X-User-Name` **HTTP header**, not from the JWT. This is the root cause of DATA-03: the header value is whatever the caller provides (or the SvelteKit BFF forwards), not a verified JWT claim. Switching to `@Inject JsonWebToken jwt` removes this trust boundary issue.

### `SalesService.createOrder` signature

```java
public Order createOrder(CreateOrderRequest request, String username)
```

The new signature should accept a `UUID userId` and `UUID branchId` extracted from the JWT at the controller layer, and pass them to the service:

```java
public Order createOrder(CreateOrderRequest request, UUID userId, UUID branchId)
```

### Order domain model fields

`Order.java` (domain model — no JPA annotations):
- `UUID id`
- `String ticketNumber`
- `Integer folioBranch`
- `UUID branchId`
- `Customer customer`
- `LocalDateTime committedDeadline`
- `String status` (default: "RECEIVED")
- `BigDecimal totalAmount`
- `String notes`
- `BigDecimal amountPaid`
- `String paymentMethod`
- `Integer totalDurationMin`
- `List<OrderItem> items`
- `LocalDateTime createdAt`
- `UUID createdBy`
- `LocalDateTime updatedAt`, `deletedAt`, `boolean deleted`

### `OrderEntity` — DB column mapping

Key columns relevant to this phase:
- `ticket_number VARCHAR UNIQUE NOT NULL` — current approach collides; must be sequence-generated
- `id_branch UUID NOT NULL` — foreign key to `tce_branch`
- `created_by_user_id UUID NOT NULL` — logical reference to identity-service (no FK constraint)
- `folio_branch INT NOT NULL` — currently hardcoded to `1`

---

## 3. Database Schema

### `tco_order` relevant columns

```sql
ticket_number  VARCHAR (no length specified in init.sql, UNIQUE constraint in OrderEntity)
id_branch      UUID NOT NULL REFERENCES tce_branch(id_branch)
created_by_user_id UUID NOT NULL
folio_branch   INT NOT NULL  -- described as "Sequential ID logic handled by App"
```

### `tce_branch` seeded data — confirms safe migration

```sql
INSERT INTO tce_branch (id_branch, id_establishment, name, is_active)
VALUES ('ea22f4a4-5504-43d9-92f9-30cc17b234d1', 'b8c6e2a1-...', 'Oaxaca #113...', true);
```

The hardcoded UUID in `SalesService` exactly matches the seeded live branch. Existing orders have the correct `id_branch` value — reading from JWT will produce the same UUID after migration for users assigned to this branch. No data migration is needed for existing order rows.

### No existing sequences

`init.sql` contains no `CREATE SEQUENCE` statements. `ticket_number` has no `SERIAL` or `GENERATED` column definition. A new sequence must be created as part of this phase.

### Recommended sequence

```sql
CREATE SEQUENCE IF NOT EXISTS tco_ticket_number_seq
    START WITH 1 INCREMENT BY 1 NO CYCLE;
```

`ticket_number` value format: `'ORD-' || LPAD(nextval('tco_ticket_number_seq')::text, 5, '0')`
Example: `ORD-00001`, `ORD-00042`.

The Java side calls the sequence via a native query:
```java
// Inside OrderRepositoryPort implementation
Long next = (Long) em.createNativeQuery("SELECT nextval('tco_ticket_number_seq')").getSingleResult();
String ticketNumber = String.format("ORD-%05d", next);
```

Because `hibernate.ddl-auto=update` is active in all environments, **Hibernate will not create this sequence automatically** — it must be applied via an explicit SQL migration or DDL script.

---

## 4. JWT Access Pattern in Sales-service

### Current pattern — trusts HTTP header, not JWT

`OrdersResource` currently reads user identity from an `X-User-Name` HTTP header, not from the JWT token:
```java
@HeaderParam("X-User-Name") String username
```

This means the service can be spoofed by any caller setting that header manually.

### Target pattern — read claims from injected `JsonWebToken`

SmallRye JWT / MicroProfile JWT provides `@Inject JsonWebToken jwt` in any CDI-managed bean. Since `OrdersResource` is already `@Authenticated`, the JWT is validated before the method is invoked — so the injected token is guaranteed to be signed and trusted.

```java
@Inject
JsonWebToken jwt;

@POST
public Order createOrder(@Valid CreateOrderRequest request) {
    UUID userId  = UUID.fromString(jwt.getClaim("user_id"));
    UUID branchId = UUID.fromString(jwt.getClaim("branch_id"));
    return salesService.createOrder(request, userId, branchId);
}
```

The standard `upn` claim (username) is available as `jwt.getName()`. Custom claims (`user_id`, `branch_id`) are accessible via `jwt.getClaim("claim_name")`.

### `@Claim` injection alternative

For individual claims, SmallRye JWT also supports field injection:

```java
@Inject
@Claim("user_id")
String userId;

@Inject
@Claim("branch_id")
String branchId;
```

This is request-scoped and works in `@RequestScoped` beans. However, since `OrdersResource` is effectively `@ApplicationScoped` in Quarkus REST, use `jwt.getClaim()` at method-call time, not field injection — field injection of request-scoped claims into application-scoped beans requires a `@RequestScoped` provider wrapper and is more complex.

**Recommendation: use `jwt.getClaim("user_id")` and `jwt.getClaim("branch_id")` at method call time.**

### `application.properties` for sales-service JWT

Already correctly configured (Phase 2 output):
```properties
mp.jwt.verify.publickey=${MP_JWT_VERIFY_PUBLICKEY}
mp.jwt.verify.issuer=anotame-identity
mp.jwt.token.header=Cookie
mp.jwt.token.cookie=jwt
```

No property changes needed for Phase 3.

---

## 5. Key Risks and Constraints

### Risk 1: Missing `EmployeeAssignmentRepository` in identity-service

There is no Panache repository for `tce_employee_assignment` in the current identity-service codebase. The `AuthService.login()` method uses only `UserRepository` and `RoleRepository`. A new `EmployeeAssignmentRepository` (or a native query inside `UserRepository`) must be created.

**Constraint:** The identity-service domain model does not have an `EmployeeAssignment` entity. If we follow hexagonal architecture strictly, we need a domain model class + infrastructure repository. Minimum viable approach: a single native query in `AuthService` using `EntityManager` to avoid creating a full entity (since the assignment entity would cross bounded context boundaries).

### Risk 2: Null `branchId` claim during rollout window

If identity-service is deployed with the new claim before all users re-login, tokens in-flight do not have `branch_id`. Sales-service must handle a missing claim gracefully.

**Recommended transition guard:**
```java
String branchClaim = jwt.getClaim("branch_id");
UUID branchId = (branchClaim != null)
    ? UUID.fromString(branchClaim)
    : UUID.fromString("ea22f4a4-5504-43d9-92f9-30cc17b234d1"); // fallback
```

Remove the fallback in a follow-up after confirming all sessions are refreshed.

### Risk 3: `ticket_number` sequence must exist before service starts

`hibernate.ddl-auto=update` will NOT create a PostgreSQL sequence. The sequence must be created via a Flyway migration, a Liquibase script, or a one-time DDL applied to the database before the updated sales-service is deployed. If the sequence does not exist, the first order creation will throw a `PSQLException`.

**Deployment order:** Apply sequence DDL first, then deploy updated sales-service.

### Risk 4: `folio_branch` is currently hardcoded to `1`

`folioBranch` (column `folio_branch`, type `INT NOT NULL`) is hardcoded to `1` on line 44. The init.sql comments it as "Sequential ID logic handled by App." This field is in scope for `ticket_number` replacement (DATA-02) — consider whether `folio_branch` should also be sequence-driven or if using `ticketNumber` alone is sufficient. For safety, this phase should also fix `folio_branch` using the same sequence value (or a per-branch sequence), but if the planner scopes DATA-02 narrowly to `ticketNumber`, `folio_branch` can be addressed in a follow-up.

### Risk 5: Existing orders unaffected — confirmed

The hardcoded `ea22f4a4-...` UUID is the seeded, real production branch UUID. All existing orders have the correct `id_branch` value. The migration from hardcoded to JWT-derived will continue producing the same UUID for the current single-branch client. No data migration is needed for existing order rows.

### Risk 6: `createdBy` existing data uses hashed UUIDs

Existing `created_by_user_id` values in `tco_order` are `UUID.nameUUIDFromBytes(username.getBytes())` hashes, not real user UUIDs. After this fix, new orders will have real user UUIDs. Old orders will have the name-based hash UUID. If there is any query that joins `tco_order.created_by_user_id` to `tca_user.id_user`, those joins will now produce results for new orders but not for old ones. Currently no such cross-service join exists (the column is a "logical reference" per init.sql). Document this split, but no retroactive migration is required.

---

## 6. Recommended Plan Structure

### Plan 03-01: JWT claim enrichment (identity-service)

**Scope:** identity-service only.

Tasks:
1. Create `EmployeeAssignmentRepository` (or equivalent native query) to fetch active branch for a user.
2. Update `JwtUtils.generateToken()` to accept `userId: UUID` and `branchId: UUID` as additional parameters and add them as custom claims (`user_id`, `branch_id`).
3. Update `AuthService.login()` to query the user's active branch and pass both `user.getId()` and `branchId` to `JwtUtils`.
4. Update `AuthService.register()` — new users have no branch assignment at registration time; omit the claim or pass `null` (claim is then absent from token, which is handled by the sales-service fallback).
5. Update `AuthService.updateCredentials()` — re-uses `generateToken`; must also pass `userId` and `branchId`.

**Verification:** Decoded JWT from `POST /auth/login` contains `user_id` and `branch_id` claims.

---

### Plan 03-02: Ticket number sequence (sales-service + DB)

**Scope:** Database DDL + sales-service.

Tasks:
1. Write and apply DDL: `CREATE SEQUENCE IF NOT EXISTS tco_ticket_number_seq START 1 INCREMENT 1 NO CYCLE;`
2. Add `nextTicketNumber()` method to `OrderRepositoryPort` interface (application port).
3. Implement `nextTicketNumber()` in `OrderPersistenceAdapter` using a native query: `SELECT nextval('tco_ticket_number_seq')`.
4. In `SalesService.createOrder()`, replace `"ORD-" + System.currentTimeMillis() % 10000` with `orderRepository.nextTicketNumber()`.
5. Decide and document `folio_branch` behavior (use same sequence value, or keep `1` temporarily).

**Verification:** Two concurrent order creation calls produce different `ticketNumber` values; no `UNIQUE` constraint violation.

---

### Plan 03-03: JWT-sourced branchId and createdBy (sales-service)

**Scope:** sales-service controller + service layer.

Tasks:
1. Inject `JsonWebToken jwt` into `OrdersResource`.
2. In `OrdersResource.createOrder()`, extract `user_id` and `branch_id` claims from JWT. Apply fallback to hardcoded UUID if `branch_id` claim is absent (transition safety).
3. Change `SalesService.createOrder()` signature: replace `String username` with `UUID userId, UUID branchId`.
4. In `SalesService.createOrder()`, replace:
   - `order.setBranchId(UUID.fromString("ea22f4a4-..."))` with `order.setBranchId(branchId)`
   - `order.setCreatedBy(UUID.nameUUIDFromBytes(...))` with `order.setCreatedBy(userId)`
5. Remove the `@HeaderParam("X-User-Name")` parameter from `OrdersResource.createOrder()` — it is no longer needed.

**Verification:** Order created after login has `branchId == user's actual branch UUID` and `createdBy == user's actual UUID from tca_user`.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None detected — no test files or test config found in sales-service or identity-service |
| Config file | None |
| Quick run command | `mvn test -pl anotame-api/backend/sales-service` (no tests exist yet) |
| Full suite command | `mvn verify` |

### Phase Requirements → Test Map

| ID | Behavior | Test Type | Automated Command | File Exists? |
|----|----------|-----------|-------------------|-------------|
| DATA-01 | `branchId` in new order equals JWT `branch_id` claim | Integration / manual | `curl` smoke test against running service | No — Wave 0 |
| DATA-02 | `ticketNumber` values are unique under concurrency | Unit (sequence logic) | None yet | No — Wave 0 |
| DATA-03 | `createdBy` in new order equals JWT `user_id` claim | Integration / manual | `curl` smoke test | No — Wave 0 |

Both services use Hibernate `ddl-auto=update` and are verified end-to-end via `docker compose up --build`. No automated unit/integration tests exist in the current codebase for these services.

**Manual verification protocol (substitutes for automated tests until tests are added):**
1. Start all services: `docker compose up --build`
2. `POST /auth/login` — decode the JWT and confirm `user_id` and `branch_id` claims are present.
3. `POST /orders` (authenticated) — confirm returned order has the correct `branchId`, `createdBy`, and a unique `ticketNumber`.
4. Repeat step 3 twice rapidly — confirm different ticket numbers.

### Wave 0 Gaps

- No test files exist in either service. Wave 0 for this phase is manual smoke-test verification per AI_RULES.md rule: "Verify end-to-end via `docker compose up --build`."

---

## Environment Availability

Step 2.6: No new external tools are required. The phase is code + schema changes only. All dependencies (PostgreSQL, Quarkus, Docker Compose) are already part of the existing stack.

---

## Sources

### PRIMARY (HIGH confidence — direct codebase audit)

| File | Finding |
|------|---------|
| `SalesService.java:43-46` | Exact lines with hardcoded/incorrect values |
| `OrdersResource.java:26` | `X-User-Name` header as username source |
| `JwtUtils.java:16-22` | JWT currently contains only `upn` + `groups` |
| `AuthService.java:54-67` | Login flow — `user.getId()` is available, branch lookup is missing |
| `User.java` | No `branch_id` column on `tca_user` entity |
| `init.sql:130-138` | `tce_employee_assignment` join table definition |
| `init.sql:286` | `ea22f4a4-...` is the seeded live branch UUID |
| `init.sql:193-225` | `tco_order` schema — `ticket_number VARCHAR`, no sequence |
| `OrderEntity.java` | `ticket_number` has `@Column(unique = true)` |
| `application.properties` (sales) | JWT already configured correctly from Phase 2 |

### SECONDARY (HIGH confidence — prior research docs)

- `.planning/research/STACK.md` — SmallRye JWT claim injection patterns
- `.planning/research/PITFALLS.md` — Branch UUID migration safety, ticket collision analysis

---

## Metadata

**Confidence breakdown:**
- Current bug locations: HIGH — read directly from source files
- Branch relationship structure: HIGH — read from `User.java` and `init.sql`
- JWT claim access pattern: HIGH — verified against STACK.md (SmallRye JWT 4.x)
- Sequence approach: HIGH — standard PostgreSQL + Hibernate native query pattern
- Safe rollout sequence: HIGH — verified from PITFALLS.md section 5

**Research date:** 2026-04-01
**Valid until:** 2026-05-01 (stable stack; only invalidated if DB schema or JWT library changes)
