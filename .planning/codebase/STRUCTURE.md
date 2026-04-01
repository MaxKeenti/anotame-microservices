# Codebase Structure

**Analysis Date:** 2026-03-31

## Directory Layout

```
anotame-microservices/
├── anotame-api/                        # Backend monorepo
│   └── backend/                        # All Quarkus services + parent POM
│       ├── identity-service/           # Auth & user management (8081)
│       ├── catalog-service/            # Garments, services, pricing (8082)
│       ├── sales-service/              # Customers, orders (8083)
│       ├── operations-service/         # Establishments, scheduling (8084)
│       ├── pom.xml                     # Parent Maven POM (modules list)
│       └── .mvn/wrapper/               # Maven wrapper
├── anotame-web/                        # SvelteKit 5 frontend (port 3000)
│   ├── src/
│   │   ├── lib/                        # Shared library code
│   │   └── routes/                     # SvelteKit file-based routes
│   ├── static/                         # Static assets
│   ├── messages/                       # Paraglide i18n translation files
│   ├── svelte.config.js
│   └── package.json
├── anotame-web-legacy/                 # Deprecated Next.js frontend (do not modify)
├── anotame-db/
│   ├── init.sql                        # PostgreSQL schema + seed data
│   └── Dockerfile                      # Postgres container definition
├── docs/                               # Project documentation and roadmap
├── .agent/                             # AI agent workflow definitions (all agents)
├── .claude/                            # Claude-specific agent config
├── .gemini/                            # Gemini-specific agent config
├── .planning/                          # GSD workflow artifacts (phases, plans, docs)
├── docker-compose.yml                  # Multi-container orchestration
├── AI_RULES.md                         # Development standards (source of truth)
└── CLAUDE.md                           # Claude entry point (references AI_RULES.md)
```

## Backend Service Internal Structure

Every service follows the same package layout. `{module}` matches the bounded context name (e.g., `identity`, `catalog`, `sales`, `operations`).

```
{service}/src/main/java/com/anotame/{module}/
├── {Module}Application.java                    # Quarkus main/entry point
├── domain/
│   ├── model/                                  # Pure domain entities (Lombok POJOs)
│   └── exception/                              # Domain-specific exceptions
├── application/
│   ├── service/                                # Application services (@ApplicationScoped)
│   ├── dto/                                    # Request/response DTOs
│   └── port/
│       └── output/                             # Repository port interfaces
└── infrastructure/
    ├── config/                                 # Framework configuration beans
    ├── persistence/
    │   ├── entity/                             # JPA entities (@Entity)
    │   ├── repository/                         # Panache repositories
    │   └── adapter/                            # Port implementation adapters
    └── web/
        ├── controller/                         # JAX-RS REST resources
        ├── exception/                          # @Provider ExceptionMapper
        └── dto/                                # Web-layer DTOs (where they exist separately)
```

**Important divergences from the standard structure:**
- `catalog-service`: DTOs live at `com.anotame.catalog.dto` (top-level beside `domain/`, `application/`, `infrastructure/`), not inside `application/dto/`
- `operations-service`: JPA entity class suffix is `Jpa` (e.g., `EstablishmentJpa`) instead of `Entity` used in other services
- `identity-service`: No dedicated persistence adapter layer — `AuthService` and `UserService` directly inject Panache repositories

**Configuration files:**
- `{service}/src/main/resources/application.properties` — Quarkus config (DB, CORS, JWT, HTTP port)
- `{service}/src/main/resources/privateKey.pem` / `publicKey.pem` — JWT signing keys

## Frontend Source Structure

```
anotame-web/src/
├── app.d.ts                            # SvelteKit app type declarations
├── lib/
│   ├── assets/                         # Static assets imported by components (favicon, etc.)
│   ├── components/
│   │   ├── catalog/                    # Catalog feature components
│   │   │   ├── garment-dialog.svelte
│   │   │   └── service-dialog.svelte
│   │   ├── customers/
│   │   │   └── customer-dialog.svelte
│   │   ├── dashboard/
│   │   │   └── WorkloadCalendar.svelte
│   │   ├── layout/
│   │   │   └── menu-modal.svelte       # Modal navigation (replaces sidebar)
│   │   ├── orders/
│   │   │   └── wizard/                 # Multi-step order creation wizard
│   │   │       ├── customer-step.svelte
│   │   │       ├── items-step.svelte
│   │   │       ├── item-sub-wizard.svelte
│   │   │       └── payment-step.svelte
│   │   ├── users/
│   │   └── ui/                         # shadcn-svelte base components + adaptive wrappers
│   │       ├── alert-dialog/
│   │       ├── button/
│   │       ├── calendar/
│   │       ├── card/
│   │       ├── dialog/
│   │       ├── form/
│   │       ├── input/
│   │       ├── label/
│   │       ├── popover/
│   │       ├── responsive/             # Adaptive UI wrapper components
│   │       │   ├── adaptive-confirm.svelte
│   │       │   ├── adaptive-select.svelte
│   │       │   ├── adaptive-date-picker.svelte
│   │       │   ├── adaptive-datetime-picker.svelte
│   │       │   ├── confirm-state.svelte.ts   # Singleton state for AdaptiveConfirm
│   │       │   └── index.ts
│   │       ├── select/
│   │       ├── separator/
│   │       ├── sonner/
│   │       ├── table/
│   │       └── textarea/
│   ├── config/
│   │   └── menu.ts                     # Navigation menu configuration
│   ├── guards/
│   │   └── index.svelte.ts             # useAuthGuard, useGuestGuard
│   ├── hooks/
│   │   └── use-mobile.svelte.ts        # useIsMobile() reactive hook (768px breakpoint)
│   ├── services/
│   │   ├── api.svelte.ts               # Base ApiService class + API_* URL constants
│   │   ├── auth.svelte.ts              # AuthService singleton (PersistedState)
│   │   └── orders/
│   │       └── OrderWizardState.svelte.ts  # Order draft wizard state (PersistedState)
│   ├── types/
│   │   └── dtos.ts                     # All TypeScript interface definitions for API DTOs
│   ├── utils/
│   │   ├── formatUtils.ts              # Currency, date, number formatters
│   │   ├── statusUtils.ts              # Order status display helpers
│   │   └── receipt-generator.ts        # Receipt/print generation utility
│   ├── utils.ts                        # General utility functions (cn, etc.)
│   └── index.ts                        # Barrel re-export for $lib
└── routes/
    ├── +layout.svelte                  # Root layout: Toaster, AdaptiveConfirm, ModeWatcher
    ├── +page.svelte                    # Landing page (public)
    ├── login/
    │   └── +page.svelte                # Login page (useGuestGuard)
    ├── register/
    │   └── +page.svelte                # Registration page (useGuestGuard)
    ├── api/
    │   └── [...path]/
    │       └── +server.ts              # SvelteKit catch-all API proxy to backend services
    └── (app)/                          # Authenticated route group
        ├── +layout.svelte              # App shell: useAuthGuard + top nav + MenuModal
        └── dashboard/
            ├── +page.svelte            # Dashboard home (KPI metrics, workload calendar)
            ├── customers/
            │   └── +page.svelte
            ├── orders/
            │   ├── +page.svelte        # Orders list with status filters
            │   ├── new/
            │   │   └── +page.svelte    # Multi-step order creation wizard
            │   └── [id]/
            │       └── +page.svelte    # Order detail / edit view
            ├── catalog/
            │   ├── garments/
            │   │   └── +page.svelte
            │   ├── services/
            │   │   └── +page.svelte
            │   └── pricelists/
            │       ├── +page.svelte    # Price lists index
            │       ├── new/
            │       │   └── +page.svelte
            │       └── [id]/
            │           └── +page.svelte
            ├── operations/
            │   └── +page.svelte
            ├── settings/
            │   └── +page.svelte        # User settings / change credentials
            └── admin/
                ├── kpi/
                │   └── +page.svelte
                ├── schedule/
                │   └── +page.svelte
                ├── settings/
                │   └── +page.svelte
                └── users/
                    └── +page.svelte
```

## Key File Locations

**Backend Entry Points:**
- `anotame-api/backend/identity-service/src/main/java/com/anotame/identity/IdentityServiceApplication.java`
- `anotame-api/backend/catalog-service/src/main/java/com/anotame/catalog/CatalogServiceApplication.java`
- `anotame-api/backend/operations-service/src/main/java/com/anotame/operations/OperationsServiceApplication.java`

**Backend Configuration:**
- `anotame-api/backend/{service}/src/main/resources/application.properties` — DB, CORS, JWT, HTTP port

**Core Backend Logic:**
- Domain models: `{service}/src/main/java/com/anotame/{module}/domain/model/`
- Application services: `{service}/src/main/java/com/anotame/{module}/application/service/`
- Repository ports: `{service}/src/main/java/com/anotame/{module}/application/port/output/`
- REST controllers: `{service}/src/main/java/com/anotame/{module}/infrastructure/web/controller/`
- Exception handlers: `{service}/src/main/java/com/anotame/{module}/infrastructure/web/exception/GlobalExceptionHandler.java`

**Frontend Entry Points:**
- `anotame-web/src/routes/+layout.svelte` — Root layout (global providers)
- `anotame-web/src/routes/(app)/+layout.svelte` — Authenticated shell with auth guard
- `anotame-web/src/routes/api/[...path]/+server.ts` — API proxy (critical infrastructure)

**Frontend Core Services:**
- `anotame-web/src/lib/services/api.svelte.ts` — Base HTTP client + error handling
- `anotame-web/src/lib/services/auth.svelte.ts` — Auth singleton
- `anotame-web/src/lib/guards/index.svelte.ts` — Route protection hooks
- `anotame-web/src/lib/types/dtos.ts` — All API type definitions

**Database Schema:**
- `anotame-db/init.sql` — Full PostgreSQL schema + seed data

## Naming Conventions

**Backend Files:**
- Java classes: PascalCase (`CustomerPersistenceAdapter.java`)
- Packages: lowercase dot-separated (`com.anotame.sales.domain.model`)
- Repository port interfaces: `{Entity}RepositoryPort.java`
- Persistence adapters: `{Entity}PersistenceAdapter.java`
- JPA entities: `{Entity}Entity.java` (sales, catalog) or `{Entity}Jpa.java` (operations)
- Panache repositories: `{Entity}Repository.java`
- REST controllers: `{Entity}Resource.java` (sales) or `{Entity}Controller.java` (catalog, operations, identity)
- Application services: `{Domain}Service.java` or `{Entity}ServiceImpl.java`
- Tests: `{Class}Test.java`

**Frontend Files:**
- Svelte components: kebab-case (`menu-modal.svelte`, `customer-dialog.svelte`)
- Stateful service files: camelCase with `.svelte.ts` extension (`auth.svelte.ts`, `OrderWizardState.svelte.ts`)
- Plain TypeScript utilities: camelCase with `.ts` extension (`formatUtils.ts`, `statusUtils.ts`)
- Route segments: lowercase with `[params]` for dynamic (`[id]`)
- Route groups: parentheses `(app)` (invisible in URL)

**Database:**
- Tables: `snake_case` with domain prefix
  - `tca_` — identity (transactional user/auth)
  - `cci_` — catalog catalog items (reference/config)
  - `cca_` — catalog config/auth items
  - `tcc_` — catalog transactional (price lists)
  - `tco_` — sales transactional (orders, customers)
  - `tce_` — operations establishment config
  - `top_` — operations transactional (work days, shifts)
- Columns: `snake_case` (`first_name`, `created_at`, `is_deleted`)
- Primary keys: UUID v4 exclusively

## Module Package Structure (Canonical Pattern)

```
com.anotame.{module}/
├── {Module}Application.java
├── domain/
│   ├── model/
│   │   └── {Entity}.java               # Pure POJO with Lombok annotations
│   └── exception/
│       └── FieldValidationException.java
├── application/
│   ├── service/
│   │   └── {Domain}Service.java        # @ApplicationScoped, @RequiredArgsConstructor
│   ├── dto/
│   │   ├── Create{Entity}Request.java
│   │   └── {Entity}Response.java
│   └── port/
│       └── output/
│           └── {Entity}RepositoryPort.java   # Interface only
└── infrastructure/
    ├── config/
    ├── persistence/
    │   ├── entity/
    │   │   └── {Entity}Entity.java     # @Entity, @SQLDelete, @SQLRestriction
    │   ├── repository/
    │   │   └── {Entity}Repository.java # extends PanacheRepository<{Entity}Entity>
    │   └── adapter/
    │       └── {Entity}PersistenceAdapter.java  # implements {Entity}RepositoryPort
    └── web/
        ├── controller/
        │   └── {Entity}Resource.java   # @Path, @Authenticated, @Inject service
        └── exception/
            └── GlobalExceptionHandler.java  # @Provider ExceptionMapper<Exception>
```

## Where to Add New Code

**New Domain Entity (Backend):**
1. Domain model: `{service}/src/main/java/com/anotame/{module}/domain/model/{Entity}.java`
2. Port interface: `{service}/src/main/java/com/anotame/{module}/application/port/output/{Entity}RepositoryPort.java`
3. DTOs: `{service}/src/main/java/com/anotame/{module}/application/dto/{Entity}Request.java` and `{Entity}Response.java`
4. JPA entity: `{service}/src/main/java/com/anotame/{module}/infrastructure/persistence/entity/{Entity}Entity.java`
5. Panache repository: `{service}/src/main/java/com/anotame/{module}/infrastructure/persistence/repository/{Entity}Repository.java`
6. Persistence adapter: `{service}/src/main/java/com/anotame/{module}/infrastructure/persistence/adapter/{Entity}PersistenceAdapter.java`
7. Database table: add to `anotame-db/init.sql`

**New REST Endpoint:**
1. Add method to existing service in `{service}/src/main/java/com/anotame/{module}/application/service/`
2. Add method to controller in `{service}/src/main/java/com/anotame/{module}/infrastructure/web/controller/`
3. Add DTO if needed in `application/dto/`
4. Add TypeScript interface to `anotame-web/src/lib/types/dtos.ts`

**New Frontend Feature/Page:**
1. Create page: `anotame-web/src/routes/(app)/dashboard/{feature}/+page.svelte`
2. Create components: `anotame-web/src/lib/components/{feature}/{component-name}.svelte`
3. Create service (if stateful): `anotame-web/src/lib/services/{feature}.svelte.ts`
4. Add types to: `anotame-web/src/lib/types/dtos.ts`
5. Add navigation entry to: `anotame-web/src/lib/config/menu.ts`

**New Frontend Route with Server Data:**
1. Add `+page.svelte` and `+page.server.ts` in the route directory
2. Server-side load functions run before client render (useful for SSR data fetching)

**New Adaptive UI Component:**
- Place in `anotame-web/src/lib/components/ui/responsive/`
- Export from `anotame-web/src/lib/components/ui/responsive/index.ts`
- Follow pattern: check `useIsMobile()`, render shadcn component on desktop, native element on mobile

**New Backend Microservice:**
1. Create directory: `anotame-api/backend/{new-service}/`
2. Add `pom.xml` following the pattern of existing services
3. Register in parent: `anotame-api/backend/pom.xml` `<modules>` list
4. Create hexagonal package structure under `src/main/java/com/anotame/{module}/`
5. Add `src/main/resources/application.properties` with unique port
6. Add Dockerfile and new service entry in `docker-compose.yml`

## Special Directories

**.agent/, .claude/, .gemini/:**
- Purpose: AI agent workflows, skills, and task prompts
- Generated: No (manually curated)
- Committed: Yes

**.planning/:**
- Purpose: GSD workflow artifacts (phases, implementation plans, codebase docs)
- Generated: Yes (by GSD commands)
- Committed: Yes (tracks planning history)

**anotame-web/messages/:**
- Purpose: Paraglide i18n translation JSON files
- Committed: Yes

**anotame-web/node_modules/:**
- Generated: Yes (`bun install`)
- Committed: No (gitignored)

**anotame-web/.svelte-kit/:**
- Generated: Yes (`bun run build` or `bun run dev`)
- Committed: No (gitignored)

**anotame-api/backend/{service}/target/:**
- Generated: Yes (`mvn compile` / `mvn package`)
- Committed: No (gitignored)

---

*Structure analysis: 2026-03-31*
