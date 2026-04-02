# Roadmap: Anotame — Milestone 1 (Code Quality & Security Hardening)

## Overview

This milestone clears the audit backlog accumulated during initial development: a committed private key, unguarded controllers, hardcoded DB credentials, collision-prone ticket numbers, inconsistent error handling, ad-hoc schema management, and missing health infrastructure. Work executes sequentially — security risks first, then data integrity, then code quality cleanup, then database migrations, then operations and housekeeping. The live client stays functional throughout; every change is additive or backward-compatible.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Close UI Color Standardization** - Merge the open WIP branch so main is clean before any security work begins
- [ ] **Phase 2: Security Foundations** - Remove committed credentials and keys, guard all controllers, and harden cookie config
- [ ] **Phase 3: Data Integrity Fixes** - Replace hardcoded branch UUID, collision-prone ticket numbers, and fake user ID derivation
- [ ] **Phase 4: Exception Handling Standardization** - Consistent JSON error shape and typed domain exceptions across all 4 services
- [ ] **Phase 5: Frontend Pattern Compliance** - DataTableWrapper component and superforms migration for order wizard, schedule, and settings
- [ ] **Phase 6: Database Migration Framework** - Flyway across all 4 services with V1 baseline from live schema, per-service history tables
- [ ] **Phase 7: Operational Reliability & Housekeeping** - Health checks, SmallRye Health extension, and .env / legacy artifact cleanup

## Phase Details

### Phase 1: Close UI Color Standardization
**Goal**: Merge the `feat--ui-color-standardization` branch so main is in a clean, deployable state before any security refactoring begins.
**Depends on**: Nothing (first phase)
**Requirements**: WIP-01
**Success Criteria** (what must be TRUE):
  1. `feat--ui-color-standardization` branch is merged to main with no open conflicts
  2. Railway deploy succeeds from the merged main branch (existing client workflow unaffected)
  3. No color-related TODOs or commented-out tokens remain in the UI codebase
**Plans**: TBD

Plans:
- [x] 01-01: Audit branch diff, resolve any remaining color token gaps, and merge to main

### Phase 2: Security Foundations
**Goal**: Eliminate all committed secrets and unguarded endpoints so the live deployment is no longer exposed to credential theft or unauthenticated access.
**Depends on**: Phase 1
**Requirements**: SEC-01, SEC-02, SEC-03, SEC-04, SEC-05, SEC-06
**Success Criteria** (what must be TRUE):
  1. No DB credentials appear in any `application.properties` file — all 4 services read from env vars (`QUARKUS_DATASOURCE_USERNAME`, `QUARKUS_DATASOURCE_PASSWORD`)
  2. `privateKey.pem` and `publicKey.pem` are absent from the repository; `.gitignore` blocks future additions; JWT keys are injected via `SMALLRYE_JWT_SIGN_KEY` and `MP_JWT_VERIFY_PUBLICKEY` env vars
  3. A request to `OperationsController` or `ScheduleController` without a valid JWT returns 401
  4. A request to `UserController` management endpoints without `ADMIN` role returns 403
  5. The auth cookie is set with `secure=true` in production (Railway) and `secure=false` in local dev — controlled by Quarkus `%prod` / `%dev` profiles
  6. PgAdmin password in `docker-compose.yml` references an `.env` variable, not a hardcoded literal
**Plans**: TBD

Plans:
- [x] 02-01: Externalize DB credentials — replace hardcoded values in all 4 `application.properties` with env var references; update `docker-compose.yml` `env_file` wiring
- [x] 02-02: Rotate JWT keys — delete PEM files from repo, add `*.pem` to `.gitignore`, generate new key pair, inject via Railway env vars; coordinate simultaneous 4-service deploy; communicate forced re-login to client
- [x] 02-03: Guard unprotected controllers — add `@Authenticated` at class level to `OperationsController`, `ScheduleController`; add `@Authenticated` + `@RolesAllowed("ADMIN")` to `UserController` management endpoints; use `@PermitAll` on any public methods
- [x] 02-04: Harden cookie and docker-compose config — profile-gate `anotame.auth.cookie.secure`, verify `SameSite` value for Railway topology, move PgAdmin password to `.env`

### Phase 3: Data Integrity Fixes
**Goal**: Replace the three hardcoded / incorrectly derived values in `SalesService` so orders are created with the correct branch, a collision-free ticket number, and the real user UUID.
**Depends on**: Phase 2
**Requirements**: DATA-01, DATA-02, DATA-03
**Success Criteria** (what must be TRUE):
  1. Creating an order records the `branchId` resolved from the authenticated user's JWT claim — not the hardcoded UUID `ea22f4a4-...`
  2. Ticket numbers are generated from a PostgreSQL sequence; two simultaneous orders never produce the same ticket number
  3. The `createdBy` field on a new order stores the actual user UUID from the JWT — not a `UUID.nameUUIDFromBytes` hash
  4. Existing orders in production are unaffected (the hardcoded UUID equals the live branch UUID during rollout; no data changes)
**Plans**: TBD

Plans:
- [x] 03-01: Add `branchId` and `userId` JWT claims — extend identity-service `AuthService` to look up and embed the user's branch UUID and real UUID in the issued token
- [x] 03-02: Resolve branch and user from JWT in sales-service — update `SalesService` to read `branchId` and `sub`/`userId` from `SecurityContext`; keep hardcoded UUID fallback until all active sessions have refreshed; remove fallback after validation
- [x] 03-03: Replace collision-prone ticket numbers with a DB sequence — add a `CREATE SEQUENCE` migration, update `SalesService` to call `NEXTVAL`, prepend `ORD-` prefix

### Phase 4: Exception Handling Standardization
**Goal**: Every service returns the same structured JSON error shape for all failures, and identity-service uses typed domain exceptions instead of bare `RuntimeException`.
**Depends on**: Phase 3
**Requirements**: QUAL-01, QUAL-02, QUAL-03
**Success Criteria** (what must be TRUE):
  1. A 4xx or 5xx response from any of the 4 services contains the JSON shape `{ "message": "...", "details": [] }` — no stack traces in responses
  2. An invalid-credentials login attempt returns HTTP 401 with a typed error message — not HTTP 500
  3. A duplicate-username registration attempt returns HTTP 409 — not HTTP 500
  4. SQL query logging does not appear in Railway (production) logs — only visible in local `%dev` profile
**Plans**: 3 plans

Plans:
- [x] 04-01-PLAN.md — Add `ErrorResponse` DTO, `DomainException` base, and `GlobalExceptionHandler` to identity, catalog, and operations services; update sales-service handler to return `{ "message": "...", "details": [] }` shape
- [x] 04-02-PLAN.md — Create typed domain exceptions (`InvalidCredentialsException`, `UserAlreadyExistsException`, `ResourceNotFoundException`) in identity-service; replace all 11 bare `RuntimeException` throws in `AuthService` and `UserService`
- [ ] 04-03-PLAN.md — Gate SQL logging to `%dev` profile in all 4 services; fix incorrect `sql-formatting` property name to `log.format-sql`

### Phase 5: Frontend Pattern Compliance
**Goal**: Standardize the two structural frontend patterns mandated by `AI_RULES.md` — table rendering through `DataTableWrapper` and form handling through `sveltekit-superforms`.
**Depends on**: Phase 4
**Requirements**: QUAL-04, QUAL-05
**Success Criteria** (what must be TRUE):
  1. A `DataTableWrapper` Svelte component exists in `src/lib/components/ui/` and wraps TanStack Table; the orders page and customers page both render through it
  2. The order wizard steps, schedule page, and settings page use `sveltekit-superforms` for form state and validation — no raw form handling remains on those pages
  3. No regressions on existing order creation or customer search flows
**Plans**: TBD

Plans:
- [ ] 05-01: Create `DataTableWrapper.svelte` — implement TanStack Table wrapper with sorting, filtering, and pagination slots; migrate orders and customers pages to use it
- [ ] 05-02: Migrate order wizard steps to `sveltekit-superforms` — each wizard step form uses superforms schema validation and submission
- [ ] 05-03: Migrate schedule and settings pages to `sveltekit-superforms`
**UI hint**: yes

### Phase 6: Database Migration Framework
**Goal**: Replace Hibernate auto-DDL with Flyway across all 4 services using a V1 baseline generated from the live schema, so future schema changes are versioned and auditable.
**Depends on**: Phase 5
**Requirements**: DB-01, DB-02, DB-03, DB-04
**Success Criteria** (what must be TRUE):
  1. All 4 services start with `quarkus-flyway` enabled; `hibernate-orm.database.generation` is set to `none` in production
  2. Each service has a `V1__baseline.sql` generated from the live DB using `pg_dump --schema-only` — not hand-written
  3. `flyway validate` passes on a staging copy of the production DB before any production deploy
  4. Each service uses its own Flyway history table (`flyway_schema_history_{service}`) — no cross-service history conflicts
  5. The existing `migration.sql` at repo root is converted to `V2__add_unit_price_to_order_item.sql` in the sales-service migration directory
**Plans**: TBD

Plans:
- [ ] 06-01: Add `quarkus-flyway` extension to all 4 services — update `pom.xml` files, set `database.generation=none`, configure per-service history table names and `baseline-on-migrate=true`
- [ ] 06-02: Generate V1 baselines — run `pg_dump --schema-only` per service against the live DB; place SQL files in each service's `src/main/resources/db/migration/` directory
- [ ] 06-03: Migrate `migration.sql` — convert to `V2__add_unit_price_to_order_item.sql` in sales-service; validate numbering is correct
- [ ] 06-04: Staging validate gate — run `flyway validate` against a staging DB copy; confirm all services start cleanly before touching production

### Phase 7: Operational Reliability & Housekeeping
**Goal**: Add health check infrastructure to all backend services and clean up legacy artifacts and stale config that pollute the repository.
**Depends on**: Phase 6
**Requirements**: OPS-01, OPS-02, HOUSE-01, HOUSE-02, HOUSE-03
**Success Criteria** (what must be TRUE):
  1. All 4 backend services respond with HTTP 200 at `/q/health/ready` when the DB connection is live
  2. `docker-compose.yml` includes `healthcheck` entries for all 4 services using `/q/health/ready`; dependent services use `condition: service_healthy`
  3. `.env.example` contains no `NEXT_PUBLIC_*` references — all replaced with `PUBLIC_*`
  4. `anotame-web-legacy/node_modules/` and `anotame-web-legacy/.next/` are absent from the repository and blocked by `.gitignore`
  5. `x-user-name` appears in sales-service CORS `allowed-headers` config
**Plans**: TBD

Plans:
- [ ] 07-01: Add `quarkus-smallrye-health` extension to all 4 services — verify `/q/health/ready` responds correctly with DB connectivity
- [ ] 07-02: Wire health checks into `docker-compose.yml` — add `healthcheck` entries for all 4 services; update `depends_on` conditions
- [ ] 07-03: Housekeeping sweep — update `.env.example` variable names, delete legacy build artifacts, add `.gitignore` entries, add `x-user-name` to sales-service CORS config

## Progress

**Execution Order:**
Phases execute sequentially: 1 → 2 → 3 → 4 → 5 → 6 → 7

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Close UI Color Standardization | 1/1 | Complete   | 2026-04-01 |
| 2. Security Foundations | 4/4 | Complete   | 2026-04-01 |
| 3. Data Integrity Fixes | 3/3 | Complete    | 2026-04-01 |
| 4. Exception Handling Standardization | 2/3 | Executing   | - |
| 5. Frontend Pattern Compliance | 0/3 | Not started | - |
| 6. Database Migration Framework | 0/4 | Not started | - |
| 7. Operational Reliability & Housekeeping | 0/3 | Not started | - |
