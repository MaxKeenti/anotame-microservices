# Architecture

**Analysis Date:** 2026-03-31

## Pattern Overview

**Overall:** Hexagonal Architecture (Ports & Adapters) with Domain-Driven Design (DDD) across a microservices monorepo.

**Key Characteristics:**
- Four bounded-context microservices sharing a single PostgreSQL instance (database-per-service schema separation via table prefixes)
- Each service is a self-contained Quarkus application with identical hexagonal layering
- SvelteKit frontend acts as a BFF (Backend For Frontend) via a catch-all API proxy route
- JWT authentication via HttpOnly cookie — the browser never touches the raw token
- Touch-first, adaptive UI layer with responsive wrapper components that swap between shadcn-svelte and native browser primitives based on viewport

## Bounded Contexts (Microservices)

**identity-service (Port 8081):**
- Domain: Authentication, user management, roles
- Root package: `com.anotame.identity`
- Application entry: `anotame-api/backend/identity-service/src/main/java/com/anotame/identity/IdentityServiceApplication.java`
- Tables: `tca_user`, `cca_role`
- Key domain models: `User`, `Role`
- Key services: `AuthService`, `UserService`
- Key controllers: `AuthController` (`/auth/*`), `UserController` (`/users/*`)
- Notes: Only service that issues/expires JWT cookies. All other services validate via SmallRye JWT.

**catalog-service (Port 8082):**
- Domain: Garment types, laundry/dry-cleaning services, price lists
- Root package: `com.anotame.catalog`
- Application entry: `anotame-api/backend/catalog-service/src/main/java/com/anotame/catalog/CatalogServiceApplication.java`
- Tables: `cci_garment_type`, `cci_service`, `tcc_price_list`, `tcc_price_list_item`
- Key domain models: `GarmentType`, `Service`, `PriceList`, `PriceListItem`
- Key services: `CatalogService`, `PriceListService`
- Key controllers: `CatalogController` (`/catalog/*`), `PriceListController` (`/pricelists/*`), `PricingController` (`/pricing/*`)
- Notes: DTOs live at `com.anotame.catalog.dto` (not inside `application/`). Effective price is computed at read time by joining active price list overrides.

**sales-service (Port 8083):**
- Domain: Customers, orders, order items, order line services
- Root package: `com.anotame.sales`
- Application entry: implied (`SalesServiceApplication.java` pattern)
- Tables: `tco_customer`, `tco_order`, `tco_order_item`, `tco_order_item_service`, `tco_order_history`
- Key domain models: `Customer`, `Order`, `OrderItem`, `OrderItemService`
- Key services: `SalesService`, `CustomerServiceImpl`
- Key controllers: `OrdersResource` (`/orders/*`), `CustomerResource`
- Port interfaces: `OrderRepositoryPort`, `CustomerRepositoryPort`
- Notes: Resolves or creates a customer inline during order creation (`resolveCustomer()`). Does not call catalog-service over HTTP; pricing is denormalized into `OrderItemService.unitPrice` at write time.

**operations-service (Port 8084):**
- Domain: Establishments, scheduling (work days, shifts, holidays), work orders
- Root package: `com.anotame.operations`
- Application entry: `anotame-api/backend/operations-service/src/main/java/com/anotame/operations/OperationsServiceApplication.java`
- Tables: `tce_establishment`, `tce_branch`, `tce_employee_assignment`, `top_work_day`, `top_holiday`, `top_shift`
- Key domain models: `Establishment`, `WorkDay`, `WorkShift`, `Holiday`, `WorkOrder`, `WorkOrderItem`
- Key services: `EstablishmentService`, `ScheduleService`, `OperationsService`
- Key controllers: `EstablishmentController`, `ScheduleController`, `OperationsController`
- Port interfaces: `EstablishmentRepositoryPort`, `ScheduleRepositoryPort`, `WorkOrderRepositoryPort`
- Notes: JPA entity suffix is `Jpa` (e.g., `EstablishmentJpa`) rather than `Entity` used in other services.

## Hexagonal Architecture Layers

Each backend service follows identical layering. The dependency rule is strict: inner layers never import from outer layers.

**Domain Layer (innermost):**
- Purpose: Core business objects and domain exceptions — zero framework dependencies
- Location: `{service}/src/main/java/com/anotame/{module}/domain/model/`
- Contains: POJOs annotated with Lombok (`@Data`, `@Builder`, etc.)
- Domain exceptions: `{service}/src/main/java/com/anotame/{module}/domain/exception/`
- Example: `anotame-api/backend/sales-service/src/main/java/com/anotame/sales/domain/model/Order.java`
- Depends on: Nothing (pure Java)

**Application Layer:**
- Purpose: Use cases, business orchestration, and output port definitions
- Location: `{service}/src/main/java/com/anotame/{module}/application/`
- Contains:
  - `service/` — application service classes (`@ApplicationScoped`)
  - `port/output/` — repository port interfaces (e.g., `OrderRepositoryPort`)
  - `dto/` — request/response data transfer objects
- Depends on: Domain layer only
- Example: `anotame-api/backend/sales-service/src/main/java/com/anotame/sales/application/service/SalesService.java`

**Infrastructure Layer (outermost):**
- Purpose: Framework adapters — REST, JPA, security, configuration
- Location: `{service}/src/main/java/com/anotame/{module}/infrastructure/`
- Contains:
  - `web/controller/` — JAX-RS REST resources (`@Path`, `@Authenticated`)
  - `web/exception/` — `@Provider` exception mappers (`GlobalExceptionHandler`)
  - `persistence/entity/` — JPA entities (annotated `@Entity`, `@SQLDelete`, `@SQLRestriction`)
  - `persistence/repository/` — Panache repositories extending `PanacheRepository`
  - `persistence/adapter/` — persistence adapters implementing repository port interfaces
  - `config/` — Quarkus configuration beans
- Depends on: Application and domain layers, Quarkus/JPA/Panache framework

**Key Port Implementation Pattern:**
```java
// application/port/output/CustomerRepositoryPort.java (interface in application layer)
public interface CustomerRepositoryPort {
    Optional<Customer> findById(UUID id);
    Optional<Customer> findByPhoneNumber(String phone);
    Customer save(Customer customer);
    void deleteById(UUID id);
}

// infrastructure/persistence/adapter/CustomerPersistenceAdapter.java (implementation)
@ApplicationScoped
public class CustomerPersistenceAdapter implements CustomerRepositoryPort {
    @Inject CustomerRepository customerRepository;
    // Maps CustomerEntity <-> Customer domain model
}
```

## Frontend Architecture

**Framework:** SvelteKit 5 with Svelte 5 runes (`$state`, `$derived`, `$effect`)

**BFF Proxy:**
- All backend API calls pass through `anotame-web/src/routes/api/[...path]/+server.ts`
- The proxy routes `/api/identity` → port 8081, `/api/catalog` → 8082, `/api/sales` → 8083, `/api/operations` → 8084
- This keeps backend service URLs server-side only; browser only ever calls `/api/*`
- Environment variables: `PUBLIC_IDENTITY_URL`, `PUBLIC_CATALOG_URL`, `PUBLIC_SALES_URL`, `PUBLIC_OPERATIONS_URL`

**Service Layer (`src/lib/services/`):**
- `api.svelte.ts` — base `ApiService` class with unified error handling, `credentials: "include"` for HttpOnly cookies, 401 redirect logic
- `auth.svelte.ts` — `AuthService` singleton using `runed`'s `PersistedState` to persist user object in localStorage; HttpOnly JWT cookie managed by browser automatically
- `orders/OrderWizardState.svelte.ts` — `OrderWizardState` singleton using `PersistedState` for draft order persistence across page reloads

**State Management:**
- Global singletons exported as module-level constants (`export const authService = new AuthService()`)
- Local component state: Svelte 5 `$state()` runes
- Derived/computed values: `$derived` and `$derived.by()`
- Side effects: `$effect()`
- Persisted cross-session state: `runed` `PersistedState` (wraps localStorage)

**Route Groups:**
- `(app)/` — authenticated route group; `+layout.svelte` calls `useAuthGuard('/login')` which redirects unauthenticated users
- Public routes (`/login`, `/register`) — `useGuestGuard('/dashboard')` redirects authenticated users away

**Auth Guards (`src/lib/guards/index.svelte.ts`):**
```typescript
export function useAuthGuard(redirectTo = '/login') { ... }  // For protected pages
export function useGuestGuard(redirectTo = '/dashboard') { ... }  // For public-only pages
```

**Adaptive UI Layer (`src/lib/components/ui/responsive/`):**
- `adaptive-confirm.svelte` — renders `AlertDialog` on desktop, calls native `confirm()` on mobile
- `adaptive-select.svelte` — renders shadcn `Select` on desktop, native `<select>` on mobile
- `adaptive-date-picker.svelte` — `Popover + Calendar` on desktop, `<input type="date">` on mobile
- `adaptive-datetime-picker.svelte` — same as above for datetime-local
- `confirm-state.svelte.ts` — module-level singleton state for `AdaptiveConfirm`; import `adaptiveConfirm()` from here
- `hooks/use-mobile.svelte.ts` — `useIsMobile()` reactive hook using `matchMedia` at 768px breakpoint
- `AdaptiveConfirm` is mounted globally in `anotame-web/src/routes/+layout.svelte`

## Data Flow

**Authentication Flow:**
1. Frontend POST to `/api/identity/auth/login` → proxy forwards to identity-service:8081
2. `AuthController.login()` validates credentials, calls `JwtUtils.generateToken()`
3. Response sets `Set-Cookie: jwt=<token>; HttpOnly; SameSite=Lax; Path=/; Max-Age=86400`
4. Response body returns `UserResponse` (no token in body)
5. `AuthService` (frontend) stores `UserResponse` in `PersistedState` (localStorage)
6. Subsequent requests include JWT cookie automatically; services validate via SmallRye JWT

**Create Order Flow:**
1. Frontend POST to `/api/sales/orders` → proxy forwards to sales-service:8083
2. `OrdersResource.createOrder()` receives `CreateOrderRequest`, extracts `X-User-Name` header
3. `SalesService.createOrder()` calls `resolveCustomer()` — looks up by phone or creates new
4. Builds `Order` with `OrderItem` and `OrderItemService` domain objects (pricing is denormalized from wizard)
5. `OrderRepositoryPort.save()` → `OrderPersistenceAdapter` → Panache JPA persist
6. Returns `Order` domain object directly (note: no DTO mapping on create path)

**Order Wizard Flow (Frontend):**
1. `orderWizardState.createEmptyDraft()` initializes a new `DraftOrder` with UUID
2. Steps: Customer selection → Items + services → Payment details
3. Each step calls `orderWizardState.updateActiveDraft()` which auto-saves to localStorage
4. On submit, wizard assembles `CreateOrderRequest` and POSTs via `apiService.request()`
5. On success, `orderWizardState.deleteDraft()` clears the draft

**Dashboard Metrics Flow:**
1. Frontend GET `/api/sales/orders/kpi/dashboard`
2. `SalesService.getDashboardMetrics()` runs multiple `OrderRepositoryPort` queries:
   - Workload counts by deadline range and status
   - Revenue sums for today and current month
   - Weekly revenue chart data (7 days)
   - Daily workload in minutes (30 days)
3. Returns `DashboardMetricsResponse` with nested `WorkloadMetrics`, `FinanceMetrics`, `WeeklyChartPoint[]`, `WorkloadDayPoint[]`

## Authentication Architecture

**Token lifecycle:**
- Issued by: `identity-service` via `JwtUtils.generateToken()`
- Algorithm: RS256 (RSA private/public key pair)
- Private key: `privateKey.pem` (identity-service only)
- Public key: `publicKey.pem` (all services — used for verification)
- Config: `mp.jwt.token.header=Cookie`, `mp.jwt.token.cookie=jwt`
- Expiry: 24 hours (matches cookie `Max-Age=86400`)

**Cookie security config (configurable via `application.properties`):**
- `anotame.auth.cookie.secure` — `false` in dev, `true` in prod
- `anotame.auth.cookie.same-site` — `Lax` in dev, `None` in prod (cross-origin)

**Per-service authorization:**
- All non-public endpoints use `@io.quarkus.security.Authenticated`
- Role-based endpoints use `@RolesAllowed({"ADMIN"})` where needed
- identity-service public paths: `/auth/*` (permit all), `/users/*` (authenticated)

**Frontend auth state:**
- `authService.isAuthenticated` checks if `PersistedState<User>` is non-null
- No client-side JWT expiry check — expiry enforced by 401 response from backend → redirect to `/login`

## Error Handling

**Backend Error Response Contract:**
- Format 1 — Generic error: `{"error": "Message string"}` → HTTP 4xx/5xx
- Format 2 — Field validation error: `{"fieldName": "Error message"}` → HTTP 400
- Format 3 — Multiple field violations: `{"field1": "...", "field2": "..."}` → HTTP 400

**Backend Exception Handler (`GlobalExceptionHandler.java` — sales-service pattern):**
```java
@Provider
public class GlobalExceptionHandler implements ExceptionMapper<Exception> {
    // 1. ConstraintViolationException  → 400 + field map
    // 2. FieldValidationException       → 400 + {field: message}
    // 3. WebApplicationException        → original status + {error: msg}
    // 4. PersistenceException           → 409 + {error: "foreign key message"}
    // 5. Unknown                        → 500 + {error: msg}
}
```

**Frontend Error Handling (`api.svelte.ts`):**
- 401 responses: redirect to `/login` (unless `skipAuthRedirect: true`)
- `{"error": "..."}` format: throws `Error(backendMessage)`
- Field map format: throws `ApiValidationError` with `validationErrors: Record<string, string>`
- `ApiValidationError` is caught in form handlers to display per-field errors
- All user-facing success/error messages use `toast` from `svelte-sonner`

## Cross-Cutting Concerns

**Logging:**
- Backend: SLF4J via Quarkus (JBoss LogManager)
- SQL logging enabled in dev: `quarkus.hibernate-orm.log.sql=true`

**Validation:**
- Backend: Hibernate Validator annotations on DTOs (`@NotBlank`, `@Email`, `@Valid`)
- Frontend: Zod schemas with `sveltekit-superforms` for form validation

**CORS:**
- Configured per service in `application.properties`
- Allowed origins include `http://localhost:3000` and production Railway URL
- Custom headers allowed: `x-user-name`, `x-user-id`, `x-user-role`

**Soft Deletes:**
- JPA entities use `@SQLDelete` and `@SQLRestriction("is_deleted = false")`
- Domain standard: `deleted_at` (LocalDateTime) + `is_deleted` (boolean) on all transactional tables

**Audit Fields:**
- `created_at` via `@CreationTimestamp`
- `updated_at` via `@UpdateTimestamp`
- All transactional tables must carry both fields

**Internationalization:**
- Frontend uses Paraglide for i18n
- Translation files: `anotame-web/messages/`

---

*Architecture analysis: 2026-03-31*
