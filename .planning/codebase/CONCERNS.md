# Codebase Concerns

**Analysis Date:** 2026-03-31

---

## Security Concerns

**Hardcoded credentials in application.properties — all four services:**
- Issue: Every service has `username=admin` and `password=password` committed to source control. These are not read from environment variables.
- Files: `anotame-api/backend/identity-service/src/main/resources/application.properties`, `catalog-service/src/main/resources/application.properties`, `sales-service/src/main/resources/application.properties`, `operations-service/src/main/resources/application.properties`
- Impact: Anyone with repo access has the production database password. Rotating credentials requires a code change and redeploy.
- Fix approach: Replace with `${DB_USERNAME}` and `${DB_PASSWORD}` referencing env vars passed via `docker-compose.yml` `env_file`.
- Severity: **HIGH** | Actively worked: No

**PgAdmin exposed with a hardcoded weak password:**
- Issue: `docker-compose.yml` line 38 sets `PGADMIN_DEFAULT_PASSWORD: password` as a literal value. The admin GUI is accessible at port 5050 with this password.
- Files: `docker-compose.yml`
- Impact: Any network-accessible host exposes full database admin access.
- Fix approach: Move to `.env` and exclude PgAdmin from production compose.
- Severity: **HIGH** | Actively worked: No

**`anotame.auth.cookie.secure=false` in identity-service:**
- Issue: The auth cookie `secure` flag defaults to `false` in `application.properties` and is hardcoded as such. This means the JWT cookie is transmitted over plain HTTP.
- Files: `anotame-api/backend/identity-service/src/main/resources/application.properties`
- Impact: JWT tokens sent over non-HTTPS are interceptable.
- Fix approach: Set `secure=true` in production; make the default `true` and override to `false` only in dev profile.
- Severity: **HIGH** | Actively worked: No

**OperationsController and ScheduleController have no authentication guards:**
- Issue: `OperationsController.java` and `ScheduleController.java` in operations-service have no `@Authenticated`, `@RolesAllowed`, or any security annotation. `UserController.java` in identity-service is likewise unprotected.
- Files: `anotame-api/backend/operations-service/src/main/java/com/anotame/operations/infrastructure/web/controller/OperationsController.java`, `ScheduleController.java`, `anotame-api/backend/identity-service/src/main/java/com/anotame/identity/infrastructure/web/controller/UserController.java`
- Impact: Work orders, schedule config, and user management endpoints are publicly accessible to anyone who can reach the service ports.
- Fix approach: Add `@io.quarkus.security.Authenticated` at the class level (matching the pattern in `OrdersResource` and `CatalogController`). Add `@RolesAllowed("ADMIN")` on user management endpoints.
- Severity: **HIGH** | Actively worked: No

**JWT public key stored alongside private key in service resources:**
- Issue: All four services include `publicKey.pem` (and identity-service also includes `privateKey.pem`) as committed resources. If the private key is checked in, the signing key for all JWTs is exposed.
- Files: `anotame-api/backend/identity-service/src/main/resources/` (privateKey.pem, publicKey.pem)
- Impact: Leaked private key allows generating arbitrary valid JWTs for any user/role.
- Fix approach: Verify `.gitignore` excludes PEM files; if not, rotate keys immediately and add exclusion.
- Severity: **HIGH** | Actively worked: Unknown

**Auth guard is client-side only — no server-side route protection:**
- Issue: `useAuthGuard` in `anotame-web/src/lib/guards/index.svelte.ts` checks `authService.isAuthenticated` in a `$effect` on the browser only. SvelteKit server-side load functions do not enforce auth.
- Files: `anotame-web/src/lib/guards/index.svelte.ts`, `anotame-web/src/routes/(app)/+layout.svelte`
- Impact: SSR-rendered HTML of protected pages is sent to unauthenticated users before the client-side redirect fires.
- Fix approach: Add a `+layout.server.ts` or `hooks.server.ts` that validates the JWT cookie server-side and redirects to `/login` before rendering.
- Severity: **MEDIUM** | Actively worked: No

---

## Technical Debt

**Hardcoded branch UUID and folio in SalesService:**
- Issue: `SalesService.java` line 45 sets `order.setBranchId(UUID.fromString("ea22f4a4-5504-43d9-92f9-30cc17b234d1"))` and line 44 sets `order.setFolioBranch(1)` as hardcoded values with comments noting "Default Branch" and "Default Folio for test".
- Files: `anotame-api/backend/sales-service/src/main/java/com/anotame/sales/application/service/SalesService.java`
- Impact: All orders are assigned to a single hardcoded branch. This blocks multi-branch support and makes the folio counter meaningless.
- Fix approach: Resolve `branchId` from the authenticated user's JWT claims or a dedicated establishment configuration. Drive folio from a DB sequence per branch.
- Severity: **HIGH** | Actively worked: No

**`database.generation=update` in all services:**
- Issue: All four `application.properties` files use `quarkus.hibernate-orm.database.generation=update`. Hibernate auto-update is unreliable for production schema migrations (cannot drop columns, rename, or handle complex changes safely).
- Files: All four `application.properties` in `anotame-api/backend/*/src/main/resources/`
- Impact: Schema drift between services; risk of silent data corruption or failed deploys on destructive migrations.
- Fix approach: Switch to `validate` or `none` in production and manage schema changes via Flyway or Liquibase.
- Severity: **HIGH** | Actively worked: No

**`migration.sql` is a one-off file with no migration framework:**
- Issue: `migration.sql` at the repo root is a single `ALTER TABLE` statement (adds `unit_price` column). There is no versioned migration runner.
- Files: `migration.sql`
- Impact: Manual SQL must be applied in the correct order by hand. No audit trail for who ran what migration. Breaks reproducibility.
- Fix approach: Adopt Flyway; move `migration.sql` content to `V2__add_unit_price_to_order_item.sql` in a `db/migration/` directory.
- Severity: **MEDIUM** | Actively worked: No

**`ticketNumber` uses `System.currentTimeMillis() % 10000`:**
- Issue: `SalesService.java` line 43 generates ticket numbers with `"ORD-" + System.currentTimeMillis() % 10000`. This produces collisions if two orders are created within the same millisecond, and the 4-digit suffix wraps every ~10 seconds under load.
- Files: `anotame-api/backend/sales-service/src/main/java/com/anotame/sales/application/service/SalesService.java`
- Impact: Duplicate ticket numbers in production. Receipts and customer references become ambiguous.
- Fix approach: Use a DB sequence (e.g., `NEXTVAL('order_ticket_seq')`) or a UUID-derived short code.
- Severity: **MEDIUM** | Actively worked: No

**`createdBy` UUID derived from username bytes:**
- Issue: `SalesService.java` line 46 sets `order.setCreatedBy(UUID.nameUUIDFromBytes(username.getBytes()))`. This is a deterministic but incorrect approach — UUID v3 from a string is not equivalent to the user's actual UUID stored in identity-service.
- Files: `anotame-api/backend/sales-service/src/main/java/com/anotame/sales/application/service/SalesService.java`
- Impact: `createdBy` field does not reference a real user ID. Cross-service user attribution is broken.
- Fix approach: Pass the user's actual UUID as a JWT claim and read it from `@Context SecurityContext` or from a custom header like `X-User-Id`.
- Severity: **MEDIUM** | Actively worked: No

**`anotame-web-legacy/` present in monorepo with `node_modules` and `.next/` build artifacts:**
- Issue: The deprecated Next.js frontend is committed to the repo including its `node_modules/` directory and `.next/` build output, indicated by the directory listing.
- Files: `anotame-web-legacy/`
- Impact: Bloats repo size, confuses contributors, and creates risk of accidentally running legacy code.
- Fix approach: Delete `anotame-web-legacy/node_modules/` and `.next/` immediately. Consider moving the legacy directory to a separate archival branch or git submodule.
- Severity: **MEDIUM** | Actively worked: No

**`RuntimeException` used for all domain errors in identity-service:**
- Issue: `AuthService.java` and `UserService.java` throw bare `RuntimeException` for conditions like "Username already taken", "Invalid credentials", and "User not found".
- Files: `anotame-api/backend/identity-service/src/main/java/com/anotame/identity/application/service/AuthService.java`, `UserService.java`
- Impact: These exceptions result in HTTP 500 responses rather than 400/401/409. Only sales-service has a `GlobalExceptionHandler`; identity-service has none, meaning these errors surface as unformatted 500s.
- Fix approach: Create domain exception classes (`InvalidCredentialsException`, `UserAlreadyExistsException`) and add a `GlobalExceptionHandler` to identity-service mapping them to appropriate HTTP status codes.
- Severity: **MEDIUM** | Actively worked: No

**`GlobalExceptionHandler` exists only in sales-service:**
- Issue: Only `anotame-api/backend/sales-service/src/main/java/com/anotame/sales/infrastructure/web/exception/GlobalExceptionHandler.java` exists. catalog-service, identity-service, and operations-service have no equivalent.
- Impact: Unhandled exceptions in those services return raw Quarkus 500 error pages with stack traces rather than structured JSON.
- Fix approach: Extract the handler to a shared module or duplicate it across all four services.
- Severity: **MEDIUM** | Actively worked: No

---

## Performance Concerns

**`quarkus.hibernate-orm.log.sql=true` enabled in all services:**
- Issue: All four `application.properties` files have `log.sql=true` and `sql-formatting=true` enabled. These are not guarded by a dev profile.
- Files: All four `application.properties`
- Impact: Every SQL query is logged verbosely to stdout in production, bloating logs and reducing throughput.
- Fix approach: Wrap in `%prod.quarkus.hibernate-orm.log.sql=false` or move to a `%dev` profile only.
- Severity: **MEDIUM** | Actively worked: No

**Dashboard metrics service performs 8+ sequential repository queries per request:**
- Issue: `SalesService.getDashboardMetrics()` calls `orderRepository` 8 separate times (countActiveByDeadlineRange, countActiveFromDeadline, countByStatus, countByStatusNotIn, sumPaidAmountInRange x2, sumPendingDebt, getWeeklyRevenueData, getDailyWorkload). Each is a separate database round-trip.
- Files: `anotame-api/backend/sales-service/src/main/java/com/anotame/sales/application/service/SalesService.java`
- Impact: Dashboard page latency is at least 8 × DB round-trip time. Under load this becomes a bottleneck.
- Fix approach: Consolidate into 1-2 CTEs or a single native query; or cache the result for 60 seconds since dashboard metrics do not need real-time precision.
- Severity: **MEDIUM** | Actively worked: No

**`workDays` and `holidays` fetched independently on schedule page load:**
- Issue: `anotame-web/src/routes/(app)/dashboard/admin/schedule/+page.svelte` uses `Promise.all` which is correct, but the backend endpoint is flagged with `console.warn('Backend endpoint may not exist yet', err)` — indicating the API may not be implemented.
- Files: `anotame-web/src/routes/(app)/dashboard/admin/schedule/+page.svelte`
- Impact: Page silently fails to load data and shows an error toast. Users cannot configure schedules.
- Fix approach: Implement the `GET /schedule/config` and `GET /schedule/holidays` endpoints in operations-service (currently `ScheduleController.java` exists but endpoint may not be wired).
- Severity: **MEDIUM** | Actively worked: No

---

## Architecture Gaps

**No API gateway — microservices exposed individually on separate ports:**
- Issue: Each service exposes its own port (8081-8084) directly via `docker-compose.yml`. The SvelteKit frontend acts as a reverse proxy via `anotame-web/src/routes/api/[...path]/+server.ts`, but this is a workaround rather than a gateway.
- Impact: No centralized rate limiting, auth token verification, request logging, or routing policy. Adding a new service requires frontend proxy updates. Direct access to service ports bypasses all frontend proxy logic.
- Fix approach: Add Nginx or Traefik as an API gateway container in `docker-compose.yml` to route `/api/*` paths to the appropriate service.
- Severity: **MEDIUM** | Actively worked: No

**All microservices share a single PostgreSQL database:**
- Issue: All four services (`identity`, `catalog`, `sales`, `operations`) connect to the same `anotame` database. While schema segregation is enforced at the table-name level (`tca_`, `tco_`, etc.), they share one connection pool and one database server.
- Files: All four `application.properties` (`jdbc.postgresql://anotame-db:5432/anotame`)
- Impact: A runaway query in one service can starve connections for others. Schema migration in one service can break another. This contradicts the bounded-context principle stated in `AI_RULES.md`.
- Fix approach: Either use separate schemas with per-schema roles, or ultimately separate databases per service with event-driven cross-service communication.
- Severity: **LOW** | Actively worked: No (known architectural trade-off)

**No inter-service communication mechanism for cross-context data:**
- Issue: `AI_RULES.md` states services should "communicate via events/HTTP" for cross-context data. Currently, sales-service duplicates catalog data by name string (`garmentName`, `serviceName`) in `OrderItem` rather than fetching it from catalog-service.
- Files: `anotame-api/backend/sales-service/src/main/java/com/anotame/sales/application/service/SalesService.java`
- Impact: If a service or garment is renamed in catalog-service, historical order records retain the old name with no way to reconcile.
- Fix approach: Either call catalog-service at order creation time to snapshot current names (preferred for immutable order records), or establish an event bus for catalog change notifications.
- Severity: **LOW** | Actively worked: No

**SvelteKit proxy forwards raw cookies including JWT to backend services:**
- Issue: `anotame-web/src/routes/api/[...path]/+server.ts` forwards all request headers unmodified (`new Headers(request.headers)`), including the `Cookie` header with the JWT. This is intentional for auth but means any new header (e.g., `Authorization`) is also passed through blindly.
- Files: `anotame-web/src/routes/api/[...path]/+server.ts`
- Impact: Low risk currently but the proxy has no header sanitization; a future client-side injection could pass unexpected headers to backend services.
- Severity: **LOW** | Actively worked: No

---

## Testing Gaps

**Zero frontend tests — 0 test files across 153 frontend source files:**
- Issue: `find anotame-web/src -name "*.test.*" -o -name "*.spec.*"` returns 0 files. No testing framework is configured.
- Files: `anotame-web/src/` (entire directory)
- Impact: Any regression in the order wizard, auth guard, or adaptive UI components goes undetected. The wizard's multi-step state logic is particularly risky with no coverage.
- Fix approach: Add Vitest + `@testing-library/svelte`. Minimum coverage targets: `src/lib/guards/`, `src/lib/services/api.svelte.ts`, order wizard steps.
- Severity: **HIGH** | Actively worked: No

**Only 1 test file exists across all four backend services:**
- Issue: `find anotame-api/backend -name "*.java" -path "*/test/*"` returns 1 file: `BackendApplicationTests.java` in the root `backend/src/test/` — a default Spring Boot bootstrap test, not a meaningful test.
- Files: `anotame-api/backend/src/test/java/com/anotame_api/backend/BackendApplicationTests.java`
- Impact: `SalesService.createOrder`, `SalesService.getDashboardMetrics`, `AuthService.login`, `AuthService.register`, and all pricing logic have zero test coverage.
- Fix approach: Add Quarkus test classes with `@QuarkusTest` for each service. Start with `SalesService` (most complex) and `AuthService` (security-critical).
- Severity: **HIGH** | Actively worked: No

---

## Frontend Code Quality

**Widespread use of `any` types — 48 occurrences across 21 files:**
- Issue: TypeScript `any` is used extensively in state declarations (`$state<any[]>`), props (`item: any | null`), and API responses. This bypasses TypeScript's type safety throughout the frontend.
- Files: Most notably `anotame-web/src/routes/(app)/dashboard/admin/schedule/+page.svelte`, `orders/+page.svelte`, `catalog/services/+page.svelte`, and `orders/wizard/item-sub-wizard.svelte`
- Impact: Runtime type errors cannot be caught at compile time. Refactoring is error-prone.
- Fix approach: Define response DTO types in `src/lib/types/` and replace `any` progressively, starting with the order wizard and dashboard types.
- Severity: **MEDIUM** | Actively worked: No

**i18n coverage is effectively zero — Paraglide is configured but not used:**
- Issue: `AI_RULES.md` requires all text to be internationalized via Paraglide. Two message files exist (`messages/en.json`, `messages/es.json`) but `find src -name "*.svelte" | xargs grep -l "from.*paraglide"` returns 0 files. All UI strings are hardcoded Spanish literals.
- Files: All `.svelte` route files in `anotame-web/src/routes/(app)/`
- Impact: The app is locked to Spanish. Switching or adding a language requires touching every component. This is inconsistent with the stated requirement.
- Fix approach: Create message keys for existing strings; import `m` from Paraglide in components and replace literals. This is a large effort — prioritize new features over retroactive migration.
- Severity: **MEDIUM** | Actively worked: No (branch `feat--ui-color-standardization` suggests UI work is ongoing but not i18n-focused)

**Hardcoded `es-MX` / `es-ES` locale throughout formatting utilities:**
- Issue: `src/lib/utils/formatUtils.ts`, `src/lib/utils/receipt-generator.ts`, and multiple `.svelte` files use `'es-MX'` or `'es-ES'` as hardcoded locale arguments to `Intl.NumberFormat`, `toLocaleDateString`, and `toLocaleString`.
- Files: `anotame-web/src/lib/utils/formatUtils.ts`, `anotame-web/src/lib/utils/receipt-generator.ts`, `anotame-web/src/lib/components/ui/responsive/adaptive-date-picker.svelte`, `anotame-web/src/lib/components/ui/responsive/adaptive-datetime-picker.svelte`
- Impact: Two inconsistent locales in use (es-MX and es-ES produce different currency and date formatting). Cannot be changed without modifying each file individually.
- Fix approach: Centralize locale in a single constant in `src/lib/config/` and reference it everywhere formatting occurs.
- Severity: **LOW** | Actively worked: No

**`DataTableWrapper` / TanStack table pattern required by AI_RULES.md but not implemented:**
- Issue: `AI_RULES.md` mandates using `DataTableWrapper` with TanStack table for tables. No `DataTableWrapper` component exists (`find src -name "DataTable*"` returns nothing). Tables are built ad-hoc with raw `<Table.Root>` markup in each page component.
- Files: `anotame-web/src/routes/(app)/dashboard/orders/+page.svelte`, `customers/+page.svelte`, `admin/users/+page.svelte`
- Impact: No sorting, filtering, or pagination is shared. Each page reimplements table logic independently.
- Fix approach: Create `src/lib/components/ui/DataTableWrapper.svelte` wrapping TanStack Table and migrate existing table pages to it.
- Severity: **MEDIUM** | Actively worked: No

**`superforms` only used in 4 of approximately 10 dialog/form components:**
- Issue: `AI_RULES.md` requires all forms/dialogs to use `sveltekit-superforms`. Only `garment-dialog.svelte`, `service-dialog.svelte`, `customer-dialog.svelte`, and `user-dialog.svelte` use it. Order wizard steps, schedule page, and settings page use raw form handling without superforms.
- Files: `anotame-web/src/routes/(app)/dashboard/admin/schedule/+page.svelte`, `anotame-web/src/routes/(app)/dashboard/admin/settings/+page.svelte`, wizard step components in `anotame-web/src/lib/components/orders/wizard/`
- Impact: Inconsistent validation UX; forms outside superforms lack structured error display and are harder to test.
- Severity: **LOW** | Actively worked: No

---

## Operational Concerns

**Backend microservices have no health check endpoints in docker-compose.yml:**
- Issue: Only `anotame-db` has a `healthcheck` defined in `docker-compose.yml`. The four Quarkus services have no `healthcheck` configured. `sales-service` uses `condition: service_started` for its dependencies, not `service_healthy`.
- Files: `docker-compose.yml`
- Impact: Docker considers services "up" as soon as the container starts, not when the JVM is ready. Dependent services may fail on startup if a dependency is still initializing.
- Fix approach: Add `healthcheck` using `curl -f http://localhost:808X/q/health/ready || exit 1` for each service (Quarkus provides `/q/health` out of the box via SmallRye Health).
- Severity: **MEDIUM** | Actively worked: No

**No error boundary or fallback UI in frontend:**
- Issue: There is no Svelte error boundary (`+error.svelte`) visible at the route level other than the default SvelteKit one. API call failures in page components use `console.error` + toast but leave the page in an undefined state (empty lists, spinner never resolves).
- Files: `anotame-web/src/routes/(app)/dashboard/operations/+page.svelte`, `anotame-web/src/routes/(app)/dashboard/orders/+page.svelte`
- Impact: If an API call fails, users see a blank list with a toast error. There is no retry or graceful degradation.
- Fix approach: Add `+error.svelte` pages at the `(app)` layout level; implement loading/error state patterns consistently across all dashboard pages.
- Severity: **LOW** | Actively worked: No

---

## Dependencies at Risk

**`anotame-web-legacy/` contains an active `node_modules/` directory:**
- Risk: The legacy Next.js app's dependencies are not actively maintained. Given the repo was built on an older Next.js version, these packages likely contain known CVEs.
- Impact: Security scanners (e.g., `npm audit`) will flag vulnerabilities against any CI pipeline scanning the full repo.
- Migration plan: Delete `anotame-web-legacy/node_modules/` and add it to `.gitignore`. If the legacy code is needed for reference, keep only source files.
- Severity: **MEDIUM** | Actively worked: No

---

*Concerns audit: 2026-03-31*
