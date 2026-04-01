# External Integrations

**Analysis Date:** 2026-03-31

---

## Service Topology Overview

```
Browser
  └── anotame-web (SvelteKit, port 3000)
        └── /api/* proxy routes (src/routes/api/[...path]/+server.ts)
              ├── /api/identity  → identity-service  (port 8081)
              ├── /api/catalog   → catalog-service   (port 8082)
              ├── /api/sales     → sales-service     (port 8083)
              └── /api/operations → operations-service (port 8084)

All backend services
  └── anotame-db (PostgreSQL 16, port 5432 internal / 5433 host)
```

No API gateway, load balancer, or service mesh is present. The SvelteKit server itself acts as the sole reverse proxy.

---

## Docker Networking

**Network name:** `anotame-network` (bridge driver)

All containers (database, all four backend services, frontend) are on the same bridge network, enabling direct DNS-based hostname resolution.

| Container | Internal hostname | Exposed port |
|-----------|------------------|--------------|
| `anotame-db` | `anotame-db` | `5433:5432` |
| `identity-service` | `identity-service` | `8081:8081` |
| `catalog-service` | `catalog-service` | `8082:8082` |
| `sales-service` | `sales-service` | `8083:8083` |
| `operations-service` | `operations-service` | `8084:8084` |
| `anotame-web` | `anotame-web` | `3000:3000` |
| `anotame-pgadmin` | `anotame-pgadmin` | `5050:80` |

**Start-up dependency order** (from `docker-compose.yml`):
1. `anotame-db` (health-checked: `pg_isready`)
2. `identity-service`, `catalog-service`, `sales-service` (wait for `anotame-db` healthy)
3. `sales-service` additionally waits for `identity-service` and `catalog-service` to start
4. `operations-service` waits for `anotame-db` healthy + `sales-service` started
5. `anotame-web` waits for `identity-service`, `catalog-service`, `sales-service` to start

---

## Frontend → Backend: API Proxy

**Implementation:** `anotame-web/src/routes/api/[...path]/+server.ts`

The SvelteKit server exposes a catch-all route at `/api/[...path]` that proxies all HTTP methods (GET, POST, PUT, PATCH, DELETE) to backend services. URL prefix routing determines the target:

| Frontend path prefix | Proxied to | Env var |
|---------------------|-----------|---------|
| `/api/identity/*` | `identity-service:8081` | `PUBLIC_IDENTITY_URL` |
| `/api/catalog/*` | `catalog-service:8082` | `PUBLIC_CATALOG_URL` |
| `/api/sales/*` | `sales-service:8083` | `PUBLIC_SALES_URL` |
| `/api/operations/*` | `operations-service:8084` | `PUBLIC_OPERATIONS_URL` |

The prefix segment is stripped before forwarding (e.g., `/api/identity/auth/login` → `http://identity-service:8081/auth/login`).

**Headers forwarded:** All original request headers including `Cookie` (carries the `jwt` HttpOnly cookie for authentication). The `host` header is rewritten to match the target service host.

**Client-side API service:** `anotame-web/src/lib/services/api.svelte.ts` — singleton `ApiService` class with:
- Automatic `Content-Type: application/json` header injection
- `credentials: "include"` on all requests (required for HttpOnly cookie forwarding)
- 401 auto-redirect to `/login`
- Dual error format parsing: `{"error": "message"}` (runtime exceptions) or `{field: "message"}` (validation constraint violations)

**Auth service wrapper:** `anotame-web/src/lib/services/auth.svelte.ts` — manages login/logout state using `runed`'s `PersistedState` backed by `localStorage` under key `auth_user`.

---

## Authentication & Authorization Flow

**Mechanism:** MicroProfile JWT (SmallRye JWT), token transported via HttpOnly cookie named `jwt`.

### Login Flow

1. Frontend POSTs credentials to `/api/identity/auth/login`
2. Proxy forwards to `identity-service:8081/auth/login`
3. `identity-service` validates credentials, calls `JwtUtils.generateToken(username, roles)` using SmallRye JWT builder
4. JWT is signed with RSA private key (`privateKey.pem`) — 24-hour expiry, issuer `anotame-identity`
5. Response sets HttpOnly cookie `jwt` (path `/`, `SameSite=Lax` in dev, `maxAge=86400`)
6. Frontend receives only the user object (not the token); token is invisible to JS

**JWT generation code:** `anotame-api/backend/identity-service/src/main/java/com/anotame/identity/infrastructure/security/JwtUtils.java`
**Auth controller:** `anotame-api/backend/identity-service/src/main/java/com/anotame/identity/infrastructure/web/controller/AuthController.java`

### Token Verification (Non-Identity Services)

All services other than identity-service verify the JWT using the shared RSA public key (`publicKey.pem`):

```properties
# All services (catalog, sales, operations)
mp.jwt.verify.publickey.location=publicKey.pem
mp.jwt.verify.issuer=anotame-identity
mp.jwt.token.header=Cookie
mp.jwt.token.cookie=jwt
```

Endpoints annotated with `@io.quarkus.security.Authenticated` reject requests without a valid `jwt` cookie.

### Security Path Configuration (Identity Service)

```properties
quarkus.http.auth.permission.public.paths=/auth/*
quarkus.http.auth.permission.public.policy=permit
quarkus.http.auth.permission.users.paths=/users/*
quarkus.http.auth.permission.users.policy=authenticated
```

Other services do not define granular path permissions — all endpoints use `@Authenticated` annotation directly.

### Auth Endpoints

| Endpoint | Method | Auth Required | Description |
|----------|--------|--------------|-------------|
| `/auth/login` | POST | No | Authenticate, set jwt cookie |
| `/auth/register` | POST | No | Create account, set jwt cookie |
| `/auth/logout` | POST | No | Clear jwt cookie |
| `/auth/me` | GET | Yes | Return current user from JWT |
| `/auth/change-credentials` | POST | Yes | Update username/password |

---

## Database Connections

All four backend services connect to the **same** PostgreSQL instance (`anotame-db`) and the **same** database (`anotame`). There is no per-service database isolation.

| Service | JDBC URL | Schema tables used |
|---------|---------|-------------------|
| identity-service | `jdbc:postgresql://anotame-db:5432/anotame` | `tca_user`, `cca_role` |
| catalog-service | `jdbc:postgresql://anotame-db:5432/anotame` | `cci_garment_type`, `cci_service`, `tcc_price_list`, `tcc_price_list_item` |
| sales-service | `jdbc:postgresql://anotame-db:5432/anotame` | `tco_order`, `tco_order_item`, `tco_customer` (inferred from domain models) |
| operations-service | `jdbc:postgresql://anotame-db:5432/anotame` | `tce_establishment`, work orders, schedules (inferred) |

**ORM:** Hibernate ORM via `quarkus-hibernate-orm-panache`. DDL mode is `update` in all services (`quarkus.hibernate-orm.database.generation=update`), meaning Hibernate alters tables on startup rather than using migrations.

**Credentials** (defaults, overridden by env vars):
- Username: `admin`
- Password: `password`
- Database: `anotame`

---

## REST API Endpoints

### identity-service — Port 8081

**Base:** `http://identity-service:8081`

| Path | Method | Auth | Description |
|------|--------|------|-------------|
| `/auth/login` | POST | No | Login |
| `/auth/register` | POST | No | Register |
| `/auth/logout` | POST | No | Logout |
| `/auth/me` | GET | Yes | Current user |
| `/auth/change-credentials` | POST | Yes | Update credentials |
| `/users/*` | * | Yes | User management (CRUD) |

Controller: `anotame-api/backend/identity-service/src/main/java/com/anotame/identity/infrastructure/web/controller/AuthController.java`
Controller: `anotame-api/backend/identity-service/src/main/java/com/anotame/identity/infrastructure/web/controller/UserController.java`

### catalog-service — Port 8082

**Base:** `http://catalog-service:8082`

| Path | Method | Auth | Description |
|------|--------|------|-------------|
| `/catalog/garments` | GET | Yes | List garment types |
| `/catalog/garments` | POST | Yes | Create garment type |
| `/catalog/garments/{id}` | PUT | Yes | Update garment type |
| `/catalog/garments/{id}` | DELETE | Yes | Delete garment type |
| `/catalog/services` | GET | Yes | List services (with effective prices) |
| `/catalog/services` | POST | Yes | Create service |
| `/catalog/services/{id}` | PUT | Yes | Update service |
| `/catalog/services/{id}` | DELETE | Yes | Delete service |
| `/pricing/*` | * | Yes | Pricing calculation endpoints |
| `/price-lists/*` | * | Yes | Price list CRUD |

Controller: `anotame-api/backend/catalog-service/src/main/java/com/anotame/catalog/infrastructure/web/controller/CatalogController.java`
Controller: `anotame-api/backend/catalog-service/src/main/java/com/anotame/catalog/infrastructure/web/controller/PriceListController.java`
Controller: `anotame-api/backend/catalog-service/src/main/java/com/anotame/catalog/infrastructure/web/controller/PricingController.java`

### sales-service — Port 8083

**Base:** `http://sales-service:8083`

| Path | Method | Auth | Description |
|------|--------|------|-------------|
| `/orders` | GET | Yes | List all orders |
| `/orders` | POST | Yes | Create order (reads `X-User-Name` header) |
| `/orders/kpi/dashboard` | GET | Yes | Dashboard metrics |
| `/orders/{id}` | GET | Yes | Get order by ID |
| `/orders/{id}` | PUT | Yes | Update order |
| `/orders/{id}` | DELETE | Yes | Delete order |
| `/orders/{id}/status` | PATCH | Yes | Update order status |
| `/customers/*` | * | Yes | Customer CRUD |

Controller: `anotame-api/backend/sales-service/src/main/java/com/anotame/sales/infrastructure/web/controller/OrdersResource.java`
Controller: `anotame-api/backend/sales-service/src/main/java/com/anotame/sales/infrastructure/web/controller/CustomerResource.java`

**Note:** The `createOrder` endpoint reads `X-User-Name` from a request header. This header must be populated by the proxy or caller. It is listed in identity-service's CORS allowed headers but not in catalog/sales CORS config — this may cause issues in cross-origin dev scenarios.

### operations-service — Port 8084

**Base:** `http://operations-service:8084`

| Path | Method | Auth | Description |
|------|--------|------|-------------|
| `/operations/work-orders` | GET | No* | List all work orders |
| `/operations/work-orders` | POST | No* | Create work order |
| `/operations/work-orders/{id}` | GET | No* | Get work order |
| `/operations/work-orders/{id}` | PATCH (`?status=`) | No* | Update work order status |
| `/operations/work-orders/{id}` | DELETE | No* | Delete work order |
| `/operations/schedules/*` | * | - | Schedule management |
| `/operations/establishments/*` | * | - | Establishment CRUD |

*`operations-service` includes `quarkus-smallrye-jwt` in application.properties for JWT verification but the `OperationsController` does not apply `@Authenticated` — authentication enforcement may be inconsistent here.

Controller: `anotame-api/backend/operations-service/src/main/java/com/anotame/operations/infrastructure/web/controller/OperationsController.java`
Controller: `anotame-api/backend/operations-service/src/main/java/com/anotame/operations/infrastructure/web/controller/ScheduleController.java`
Controller: `anotame-api/backend/operations-service/src/main/java/com/anotame/operations/infrastructure/web/controller/EstablishmentController.java`

---

## Inter-Service Communication

**Pattern:** No direct service-to-service REST calls are detected. Services communicate indirectly through the shared database (same schema, same tables). There is no message broker, event bus, or synchronous service-to-service HTTP client.

The `docker-compose.yml` startup dependencies (`sales-service` waits for `identity-service` and `catalog-service`) suggest an intended runtime dependency, but no code evidence of direct HTTP calls between backend services was found.

---

## CORS Configuration

All services allow CORS from the same two origins:

```properties
quarkus.http.cors.origins=http://localhost:3000,https://anotame-microservices-production.up.railway.app
quarkus.http.cors.methods=GET,POST,PUT,DELETE,OPTIONS,PATCH
quarkus.http.cors.access-control-allow-credentials=true
```

**Allowed headers vary by service:**
- `identity-service`: `accept, authorization, content-type, x-requested-with, x-user-name, x-user-id, x-user-role`
- `catalog-service`, `sales-service`, `operations-service`: `accept, authorization, content-type, x-requested-with`

The `x-user-name` header used by `sales-service/OrdersResource.createOrder()` is only declared in the identity-service CORS config, not in the sales-service CORS config. This may cause CORS preflight failures when the frontend calls `POST /api/sales/orders` with that header.

---

## External Services

| Service | Purpose | Integration |
|---------|---------|-------------|
| **Railway** | Cloud deployment platform | Each microservice deployed as an independent Railway service; env vars set via Railway dashboard |

No third-party SaaS APIs, payment processors, email services, SMS gateways, object storage, or CDN integrations are detected in the codebase.

---

## Monitoring & Observability

**Spring Boot Actuator** (`spring-boot-starter-actuator`) is declared as a common dependency in the parent `anotame-api/backend/pom.xml`, but since individual services use Quarkus (not Spring Boot), this dependency has no effect at runtime. Quarkus provides health endpoints via SmallRye Health if added, but that extension is not present in any service POM.

**No monitoring stack** (Prometheus, Grafana, Sentry, Datadog, etc.) is configured.

**SQL logging** is enabled in all services:
```properties
quarkus.hibernate-orm.log.sql=true
quarkus.hibernate-orm.sql-formatting=true
```

---

## CI/CD & Deployment

**Local:** `docker-compose.yml` — single command brings up all services.

**Production:** Railway (referenced in CORS origins and `.env.example` comments). Deployment is per-service. A `build_and_push.sh` script exists at the repo root (likely for manual Docker image push workflows).

No CI pipeline configuration files (`.github/workflows/`, `.gitlab-ci.yml`, `Jenkinsfile`, etc.) were detected.

---

## Environment Variable Reference

| Variable | Consumed by | Purpose |
|----------|------------|---------|
| `POSTGRES_USER` | `anotame-db` | PostgreSQL superuser |
| `POSTGRES_PASSWORD` | `anotame-db` | PostgreSQL password |
| `POSTGRES_DB` | `anotame-db` | Database name |
| `QUARKUS_DATASOURCE_JDBC_URL` | All backend services | Override JDBC URL |
| `QUARKUS_DATASOURCE_USERNAME` | All backend services | Override DB username |
| `QUARKUS_DATASOURCE_PASSWORD` | All backend services | Override DB password |
| `PUBLIC_IDENTITY_URL` | `anotame-web` | identity-service base URL |
| `PUBLIC_CATALOG_URL` | `anotame-web` | catalog-service base URL |
| `PUBLIC_SALES_URL` | `anotame-web` | sales-service base URL |
| `PUBLIC_OPERATIONS_URL` | `anotame-web` | operations-service base URL |

**Secrets location:** `.env` file at project root (gitignored). `.env.example` documents required variables. JWT key pairs (`privateKey.pem`, `publicKey.pem`) are bundled inside service resources — not injected via environment variables.

---

*Integration audit: 2026-03-31*
