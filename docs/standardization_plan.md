# Codebase Standardization Plan

**Created:** 2026-03-31
**Source:** Codebase audit — `.planning/codebase/CONCERNS.md` + `.planning/codebase/STACK.md`

This document tracks all standardization and compliance work identified in the audit.
Items are ordered by priority. Check off each item as completed.

---

## Completed

- [x] **Java version alignment** — `sales-service` bumped from Java 17 → 21 (`pom.xml` `maven.compiler.release`)
- [x] **Parent POM cleanup** — Removed Spring Boot parent inheritance, Spring Cloud BOM, and Spring Boot dependencies from `anotame-api/backend/pom.xml`; now a clean aggregator-only POM

---

## Priority 1 — Security (do before any production deploy)

- [ ] **Hardcoded DB credentials in `application.properties`**
  - All 4 services have `username=admin` / `password=password` committed to source
  - Fix: Replace with `${DB_USERNAME}` / `${DB_PASSWORD}` env vars; wire via `docker-compose.yml` `env_file`
  - Files: `*/src/main/resources/application.properties` (all 4 services)

- [ ] **JWT private key committed to repo**
  - `identity-service/src/main/resources/privateKey.pem` is in source control
  - Fix: Add `*.pem` to `.gitignore`; rotate keys; inject key path via env var
  - Files: `identity-service/src/main/resources/privateKey.pem`, `.gitignore`

- [ ] **Auth cookie `secure=false` in identity-service**
  - JWT cookie transmitted over plain HTTP
  - Fix: Default to `true`; override with `%dev.anotame.auth.cookie.secure=false` for local dev
  - Files: `identity-service/src/main/resources/application.properties`

- [ ] **Missing auth guards on controllers**
  - `OperationsController`, `ScheduleController`, and `UserController` have no `@Authenticated` / `@RolesAllowed`
  - Fix: Add `@io.quarkus.security.Authenticated` at class level (match pattern in `OrdersResource`)
  - Files: `operations-service/.../OperationsController.java`, `ScheduleController.java`, `identity-service/.../UserController.java`

- [ ] **PgAdmin hardcoded weak password in `docker-compose.yml`**
  - `PGADMIN_DEFAULT_PASSWORD: password` as a literal value
  - Fix: Move to `.env`; exclude PgAdmin from production compose profile

---

## Priority 2 — Data Integrity

- [ ] **Hardcoded branch UUID and broken ticket numbers in `SalesService`**
  - `branchId` is a hardcoded UUID; ticket numbers use `System.currentTimeMillis() % 10000` (collides every ~10 seconds under load)
  - Fix: Resolve `branchId` from JWT claims; replace ticket number with a DB sequence
  - Files: `sales-service/.../application/service/SalesService.java`

- [ ] **`createdBy` UUID derived from username bytes (not real user ID)**
  - `UUID.nameUUIDFromBytes(username.getBytes())` is not the user's actual UUID
  - Fix: Add `userId` as a JWT claim in identity-service; read it from `SecurityContext` in sales-service
  - Files: `SalesService.java`, `identity-service/.../AuthService.java`

- [ ] **`hibernate.database.generation=update` on all services**
  - Auto-update is unreliable for production schema changes
  - Fix: Switch to `validate`/`none`; adopt Flyway for migrations
  - Files: All 4 `application.properties`

- [ ] **No versioned DB migrations — `migration.sql` is a one-off file**
  - Fix: Add Flyway dependency; move `migration.sql` → `db/migration/V2__add_unit_price_to_order_item.sql`

---

## Priority 3 — Code Quality & Consistency

- [ ] **`GlobalExceptionHandler` only in `sales-service`**
  - identity, catalog, and operations return raw 500s with stack traces
  - Fix: Copy handler to all 4 services (or extract to a shared module)
  - Files: `sales-service/.../GlobalExceptionHandler.java` → replicate to other 3 services

- [ ] **`RuntimeException` used for domain errors in identity-service**
  - `AuthService` and `UserService` throw bare `RuntimeException` → HTTP 500 instead of 400/401/409
  - Fix: Create typed exceptions (`InvalidCredentialsException`, `UserAlreadyExistsException`) + add `GlobalExceptionHandler`
  - Files: `identity-service/.../AuthService.java`, `UserService.java`

- [ ] **SQL logging enabled in production**
  - `quarkus.hibernate-orm.log.sql=true` and `sql-formatting=true` are not profile-gated
  - Fix: Move to `%dev.quarkus.hibernate-orm.log.sql=true`
  - Files: All 4 `application.properties`

- [ ] **`DataTableWrapper` required by AI_RULES.md but does not exist**
  - Tables are built ad-hoc with raw `<Table.Root>`; no shared sorting/filtering/pagination
  - Fix: Create `src/lib/components/ui/DataTableWrapper.svelte` wrapping TanStack Table
  - Files: `anotame-web/src/lib/components/ui/` (new file)

- [ ] **`superforms` only used in ~4 of 10 form/dialog components**
  - Order wizard steps, schedule page, and settings page use raw form handling
  - Fix: Migrate remaining forms to `sveltekit-superforms`
  - Files: Wizard step components, `admin/schedule/+page.svelte`, `admin/settings/+page.svelte`

- [ ] **48 `any` types across 21 frontend files**
  - Fix: Define DTO types in `src/lib/types/`; replace progressively starting with order wizard and dashboard
  - Files: `src/routes/(app)/dashboard/**/*.svelte`, `src/lib/components/orders/wizard/`

---

## Priority 4 — Operational Reliability

- [ ] **No health checks for backend services in `docker-compose.yml`**
  - Docker marks services "up" at container start, not JVM ready
  - Fix: Add `healthcheck: curl -f http://localhost:808X/q/health/ready || exit 1` to all 4 services
  - Files: `docker-compose.yml`

- [ ] **Client-side-only auth guard — no server-side route protection**
  - SSR HTML of protected pages is sent before client-side redirect fires
  - Fix: Add `hooks.server.ts` that validates JWT cookie and redirects before rendering
  - Files: `anotame-web/src/hooks.server.ts` (new file)

- [ ] **No error boundary or fallback UI in frontend**
  - API failures leave pages in empty/spinner state
  - Fix: Add `+error.svelte` at the `(app)` layout level; standardize loading/error state pattern
  - Files: `anotame-web/src/routes/(app)/+error.svelte` (new file)

- [ ] **Dashboard metrics: 8+ sequential DB queries per request**
  - Fix: Consolidate into 1-2 CTEs or add 60-second result cache
  - Files: `sales-service/.../SalesService.java`

---

## Priority 5 — Housekeeping

- [ ] **`anotame-web-legacy/` contains `node_modules/` and `.next/` build artifacts**
  - Fix: Delete `node_modules/` and `.next/`; add to `.gitignore`

- [ ] **`.env.example` uses `NEXT_PUBLIC_*` variable names (leftover from Next.js)**
  - Fix: Rename to `PUBLIC_*` to match actual SvelteKit + Dockerfile usage

- [ ] **`x-user-name` header in identity-service CORS but not in sales-service config**
  - Integration gap — sales-service reads this header but it's not in its CORS `allowed-headers`
  - Files: `sales-service/src/main/resources/application.properties`

- [ ] **Hardcoded `es-MX` / `es-ES` locale in formatting utilities**
  - Fix: Centralize in `src/lib/config/locale.ts`; reference everywhere formatting occurs
  - Files: `src/lib/utils/formatUtils.ts`, `receipt-generator.ts`, adaptive picker components

---

## Testing Backlog (separate track)

- [ ] Add `@QuarkusTest` for `SalesService` (highest complexity + hardcoded bugs)
- [ ] Add `@QuarkusTest` for `AuthService` (security-critical)
- [ ] Add Vitest + `@testing-library/svelte` to frontend
- [ ] Minimum coverage: `src/lib/guards/`, `src/lib/services/api.svelte.ts`, order wizard steps

---

*Reference: `.planning/codebase/CONCERNS.md`, `.planning/codebase/STACK.md`*
