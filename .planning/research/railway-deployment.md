# Railway Deployment Research: anotame-microservices

**Researched:** 2026-04-14
**Context:** Migrating 4 Quarkus 3.27.2 JVM services from docker-compose (single shared PostgreSQL) to Railway per-service Dockerfile deploys with 4 independent PostgreSQL instances.
**Confidence note:** WebFetch and WebSearch were unavailable during this research session. Findings are drawn from Railway documentation as of my August 2025 training cutoff, cross-referenced against the project's existing files. Items marked LOW confidence must be verified against https://docs.railway.com before implementation.

---

## 1. Railway Service Model — Monorepo with Multiple Services

**Confidence: HIGH** (core Railway concept, stable since 2023)

### How Railway structures a project

Railway organizes everything inside a **Project**. A project contains one or more **Services**. Each service is independently deployable and has its own:
- Build configuration (source root, Dockerfile path, build command)
- Runtime environment variables
- Deploy settings (health checks, restart policy, replicas)
- Network exposure (public domain or private only)

This maps cleanly to anotame-microservices: one Railway project, five services (identity, catalog, sales, operations, plus the SvelteKit frontend), plus four PostgreSQL database services.

### Root directory per service (monorepo configuration)

When all four Dockerfiles live under `anotame-api/backend/<service>/Dockerfile` and each one copies from the `anotame-api/backend/` build context, Railway must know two things per service:

1. **Watch path / root directory** — which subdirectory to watch for changes that trigger a rebuild. Set this to the service subdirectory (e.g. `anotame-api/backend/identity-service`) in the Railway dashboard under Service > Settings > Source > Root Directory.

2. **Dockerfile path** — path to the Dockerfile, relative to the **root directory**. If root directory is `anotame-api/backend/identity-service`, then Dockerfile path is `Dockerfile`. If root directory is `anotame-api/backend`, then Dockerfile path is `identity-service/Dockerfile`.

**IMPORTANT for this project:** The Dockerfiles use `COPY pom.xml .` and copy all four module POMs from the backend root, meaning the **build context must be `anotame-api/backend/`**, not the individual service subdirectory. Railway's root directory concept controls two separate things: the **watch path** (which file changes trigger a rebuild) and the **build context** sent to Docker. As of mid-2025, Railway uses the root directory as the Docker build context. This means you must set root directory to `anotame-api/backend` for all four services, and specify each Dockerfile path individually (`identity-service/Dockerfile`, `catalog-service/Dockerfile`, etc.).

Configure per service in the Railway dashboard:
- Service Settings > Source > Root Directory: `anotame-api/backend`
- Service Settings > Source > Dockerfile Path: `identity-service/Dockerfile` (varies per service)

Or via `railway.toml` (see Section 3).

### Nixpacks vs Dockerfile auto-detection

Railway checks the root directory for a `Dockerfile` (exact name, case-sensitive). If found, it uses Docker. If not, it falls back to Nixpacks. Since the Dockerfiles are inside subdirectories (`identity-service/Dockerfile`, not `Dockerfile` at the root), Railway will NOT auto-detect them — you must explicitly set the Dockerfile path in service settings or via `railway.toml`. Do not rely on auto-detection for this project.

---

## 2. Railway PostgreSQL Provisioning

**Confidence: HIGH** for provisioning multiple instances; MEDIUM for exact private networking DNS syntax

### Multiple PostgreSQL instances in one project

Railway supports adding multiple PostgreSQL database services to a single project with no hard limit documented at the project level. Each instance is a fully independent service with its own storage volume, credentials, connection URL, and private network address. Four PostgreSQL instances (one per app service) is a supported, common pattern.

To add each instance:
- Dashboard > Project > New Service > Database > PostgreSQL

Name them clearly: `identity-db`, `catalog-db`, `sales-db`, `operations-db`. Railway uses the service name as the prefix for auto-generated variable references.

### Private networking between services

Railway runs all services in a project on an internal private network. Services communicate via **Railway's private DNS**. The hostname format is:

```
<service-name>.railway.internal
```

For example, if your PostgreSQL service is named `identity-db`, the app service reaches it at:
```
identity-db.railway.internal:5432
```

This means the `quarkus.datasource.jdbc.url` property needs to be overridden per environment. The current hardcoded value `jdbc:postgresql://anotame-db:5432/anotame` works only in the docker-compose network. On Railway, each service needs:

```
QUARKUS_DATASOURCE_JDBC_URL=jdbc:postgresql://identity-db.railway.internal:5432/anotame_identity
```

(The database name and service hostname will match what you set up when creating each PostgreSQL service.)

### Variable reference syntax for linked services

Railway can auto-inject database credentials into an app service by **linking** the database service. When you link `identity-db` to `identity-service`, Railway makes the database's generated variables available inside the app service using reference syntax:

```
${{identity-db.DATABASE_URL}}
${{identity-db.DATABASE_PRIVATE_URL}}
${{identity-db.PGHOST}}
${{identity-db.PGPORT}}
${{identity-db.PGDATABASE}}
${{identity-db.PGUSER}}
${{identity-db.PGPASSWORD}}
```

The variable `DATABASE_PRIVATE_URL` is Railway's pre-composed private-network JDBC/psql URL using the `.railway.internal` hostname. This is the one to use — it avoids the public internet and costs nothing extra in egress.

**Preferred approach for this project:** Set the following env var on each app service, using Railway's variable reference:

For `identity-service`:
```
QUARKUS_DATASOURCE_JDBC_URL=${{identity-db.DATABASE_PRIVATE_URL}}
QUARKUS_DATASOURCE_USERNAME=${{identity-db.PGUSER}}
QUARKUS_DATASOURCE_PASSWORD=${{identity-db.PGPASSWORD}}
```

`DATABASE_PRIVATE_URL` from Railway's PostgreSQL plugin is a `postgresql://` scheme URL (not `jdbc:postgresql://`). Quarkus requires the JDBC URL scheme. You have two options:

**Option A (recommended):** Set `QUARKUS_DATASOURCE_JDBC_URL` manually in each app service using Railway's individual PG vars:
```
QUARKUS_DATASOURCE_JDBC_URL=jdbc:postgresql://${{identity-db.PGHOST}}:${{identity-db.PGPORT}}/${{identity-db.PGDATABASE}}
QUARKUS_DATASOURCE_USERNAME=${{identity-db.PGUSER}}
QUARKUS_DATASOURCE_PASSWORD=${{identity-db.PGPASSWORD}}
```

**Option B:** Use `DATABASE_PRIVATE_URL` and strip the scheme prefix in a wrapper script — this is fragile and not recommended.

**Option C (LOW confidence):** Quarkus's `quarkus.datasource.reactive.url` and some JDBC URL handlers may accept `postgresql://` directly. Verify this against Quarkus 3.27.2 docs before relying on it.

### Cost/config for 4 PostgreSQL instances

**Confidence: MEDIUM** (Railway pricing changes; verify current pricing at https://railway.com/pricing)

As of 2025, Railway's Hobby plan ($5/month) includes a usage credit. PostgreSQL instances on Railway are billed by:
- RAM (per service, idle PostgreSQL uses ~50-100MB)
- Storage ($0.25/GB/month approximately)
- CPU

Four idle PostgreSQL instances for a small app will typically consume well under the Hobby plan's included credit. Each PostgreSQL service is independently pauseable. There is no fixed per-instance fee — it's pure resource consumption billing. Four small instances is financially viable on the Hobby plan for low-traffic workloads.

---

## 3. Railway Dockerfile Deploy — Config Format

**Confidence: HIGH** for `railway.toml` format; MEDIUM for all field names (verify against docs — Railway updated config-as-code schema in late 2023/2024)

### Dockerfile detection

Railway checks for a file literally named `Dockerfile` in the configured root directory. If the Dockerfile is in a subdirectory relative to the root, you must configure `dockerfilePath` explicitly. Railway does NOT recursively scan for Dockerfiles.

### railway.toml format

`railway.toml` is placed at the **repository root** (not inside a service subdirectory). It uses TOML and scopes configuration to named services using `[services.<service-name>]` blocks. The service name in the TOML must match the service name in the Railway dashboard.

**Full example for this project:**

```toml
[build]
builder = "dockerfile"

[services.identity-service]
rootDirectory = "anotame-api/backend"
dockerfilePath = "identity-service/Dockerfile"
startCommand = "java -jar quarkus-run.jar"

[services.identity-service.deploy]
healthcheckPath = "/q/health/ready"
healthcheckTimeout = 300
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 3

[services.catalog-service]
rootDirectory = "anotame-api/backend"
dockerfilePath = "catalog-service/Dockerfile"
startCommand = "java -jar quarkus-run.jar"

[services.catalog-service.deploy]
healthcheckPath = "/q/health/ready"
healthcheckTimeout = 300
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 3

[services.sales-service]
rootDirectory = "anotame-api/backend"
dockerfilePath = "sales-service/Dockerfile"
startCommand = "java -jar quarkus-run.jar"

[services.sales-service.deploy]
healthcheckPath = "/q/health/ready"
healthcheckTimeout = 300
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 3

[services.operations-service]
rootDirectory = "anotame-api/backend"
dockerfilePath = "operations-service/Dockerfile"
startCommand = "java -jar quarkus-run.jar"

[services.operations-service.deploy]
healthcheckPath = "/q/health/ready"
healthcheckTimeout = 300
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 3
```

**LOW confidence note:** The exact TOML key names (`rootDirectory`, `dockerfilePath`, `healthcheckPath`, `healthcheckTimeout`) should be verified at https://docs.railway.com/reference/config-as-code. Railway has historically used both snake_case and camelCase across versions. The dashboard UI is authoritative if the TOML schema is unclear.

**Alternative: configure per-service in the dashboard only.** `railway.toml` is optional — all the same settings are available in the Railway dashboard per-service. For a 4-service project, either approach works. Dashboard-only is simpler to start with; `railway.toml` is better for reproducibility.

### Health check configuration for Quarkus

Quarkus Smallrye Health exposes:
- `/q/health` — combined liveness + readiness
- `/q/health/ready` — readiness only
- `/q/health/live` — liveness only

Use `/q/health/ready` as the Railway healthcheck path. This is what the docker-compose setup already uses.

Railway's health check behavior:
- The healthcheck URL is HTTP GET against the service's public or internal port
- Railway will retry until the timeout before marking the deploy failed
- Set `healthcheckTimeout` to at least 300 seconds for JVM cold-start (Maven build in Docker is slow; the JVM itself starts in ~3-5 seconds, but the build phase is where time is spent)
- Railway health checks happen after the container is running; build time is separate

**Port configuration:** Railway injects a `PORT` environment variable at runtime. Quarkus ignores this by default — it uses `quarkus.http.port` from `application.properties`. You must either:
1. Set `QUARKUS_HTTP_PORT=${{PORT}}` as a Railway env var on each service (preferred), or
2. Add `quarkus.http.port=${PORT:8081}` to each service's `application.properties`

Without this, Railway's reverse proxy cannot route to the service. The health check will fail. This is a critical migration step.

---

## 4. Environment Variable Management

**Confidence: HIGH** for isolation model; MEDIUM for exact UI steps

### Variable isolation between services

Railway environment variables are scoped to individual services by default. A variable set on `identity-service` is NOT visible to `catalog-service`. This is exactly what you want: each app service links only to its own database service.

### Linking a database service to an app service

In the Railway dashboard:
1. Open the app service (e.g. `identity-service`)
2. Go to Variables tab
3. Click "Add a Reference"
4. Select the database service (`identity-db`) and the variable name

This injects `${{identity-db.VARIABLE_NAME}}` as a live reference — Railway resolves it at deploy time. If the database's credentials rotate, the reference auto-updates without manual intervention.

### Managing 4 sets of DB credentials without cross-contamination

Because Railway variable scoping is per-service, the risk of credential leakage across services is low IF you use linked references rather than copying literal values. The recommended pattern:

| App Service | Links To | Variables Referenced |
|---|---|---|
| `identity-service` | `identity-db` | `${{identity-db.PGHOST}}`, `${{identity-db.PGPORT}}`, `${{identity-db.PGDATABASE}}`, `${{identity-db.PGUSER}}`, `${{identity-db.PGPASSWORD}}` |
| `catalog-service` | `catalog-db` | `${{catalog-db.PGHOST}}`, etc. |
| `sales-service` | `sales-db` | `${{sales-db.PGHOST}}`, etc. |
| `operations-service` | `operations-db` | `${{operations-db.PGHOST}}`, etc. |

Never copy the literal credential string from one service's variable panel into another service. Always use the `${{service.VAR}}` reference syntax.

### Shared variables (JWT keys, CORS origins)

Variables like `SMALLRYE_JWT_SIGN_KEY` and `MP_JWT_VERIFY_PUBLICKEY` are needed across services. Options:

**Option A: Shared variable service (recommended).** Create a Railway service named something like `shared-config` (it does not need to run any process — Railway supports "variable-only" services). Set the JWT keys on it, then reference them from each app service via `${{shared-config.SMALLRYE_JWT_SIGN_KEY}}`.

**Option B: Project-level variables.** Railway supports project-wide shared variables (as of mid-2024). These are visible to all services in the project. This is the simplest approach for cross-cutting concerns like JWT public keys. Set `MP_JWT_VERIFY_PUBLICKEY` at the project level; all services pick it up. Set `SMALLRYE_JWT_SIGN_KEY` only on `identity-service` (not project-wide).

**LOW confidence note:** Project-level variable scoping UI location has changed over Railway releases. Verify in the Railway dashboard under Project Settings > Variables.

### CORS origins update required

All four `application.properties` files hardcode:
```
quarkus.http.cors.origins=http://localhost:3000,https://anotame-microservices-production.up.railway.app
```

When services get independent Railway URLs, the frontend URL and each service's allowed origin list must be updated. Set `QUARKUS_HTTP_CORS_ORIGINS` as an env var on each service to avoid rebuilding images for CORS changes:

```
QUARKUS_HTTP_CORS_ORIGINS=http://localhost:3000,https://your-actual-frontend-domain.up.railway.app
```

Quarkus's MicroProfile config layering means env vars override `application.properties` values without recompile.

---

## 5. Known Gotchas

### Gotcha 1: PORT env var not wired to Quarkus (CRITICAL)

**Risk: Deployment silently succeeds but health check fails.**

Railway injects `PORT` at container startup (typically a random port like `8080` or `3000`). Quarkus listens on the port from `application.properties` (8081-8084). Railway's proxy routes to the `PORT` value, not the Quarkus port, so all traffic 404s or times out.

**Fix:** Add to each service's Railway env vars:
```
QUARKUS_HTTP_PORT=${{PORT}}
```

Or update each `application.properties`:
```properties
quarkus.http.port=${PORT:8081}
```

The `${PORT:8081}` syntax uses Railway's injected PORT with a fallback to 8081 for local dev.

### Gotcha 2: Build context is the full backend directory, not the service subdirectory

Each Dockerfile opens with:
```dockerfile
COPY pom.xml .
COPY identity-service/pom.xml identity-service/pom.xml
COPY catalog-service/pom.xml catalog-service/pom.xml
...
```

This means Docker's build context must be `anotame-api/backend/`, not `anotame-api/backend/identity-service/`. If Railway's root directory is set to the service subdirectory, the COPY commands will fail because `pom.xml` (the parent POM) and sibling module directories are outside the context.

**Fix:** Root directory = `anotame-api/backend` for all four services. Dockerfile path = `<service-name>/Dockerfile` for each.

### Gotcha 3: Maven dependency download on every build (build time ~8-15 min)

The Dockerfiles use `mvn -B -e -C ... go-offline` to download dependencies. Without Docker layer caching across builds, Railway rebuilds the full Maven dependency graph every time any source file changes. For a Quarkus project with all extensions, this is typically 8-15 minutes per service.

**Railway's build cache behavior (MEDIUM confidence):** Railway supports Docker layer caching for Dockerfile builds. It preserves the layer cache between builds for the same service. The `COPY pom.xml` + `RUN mvn go-offline` pattern (used in these Dockerfiles) is already structured to exploit layer caching — changes to source files after the dependency download step will reuse the cached Maven layer. This only works reliably when Railway persists the layer cache, which it does for paid plans. Verify this is working by checking build logs for "CACHED" on the `go-offline` layer.

### Gotcha 4: JDBC URL scheme mismatch

Railway's `DATABASE_PRIVATE_URL` (and `DATABASE_URL`) uses the `postgresql://` scheme. Quarkus's JDBC driver requires `jdbc:postgresql://`. Do not set `QUARKUS_DATASOURCE_JDBC_URL=${{identity-db.DATABASE_PRIVATE_URL}}` directly — it will fail at connection time with a scheme error.

Use the individual PG variables to compose the JDBC URL:
```
QUARKUS_DATASOURCE_JDBC_URL=jdbc:postgresql://${{identity-db.PGHOST}}:${{identity-db.PGPORT}}/${{identity-db.PGDATABASE}}
```

Alternatively, the Quarkus reactive datasource (`quarkus-reactive-pg-client`) accepts `postgresql://` scheme but the standard JDBC stack does not. These services use Hibernate ORM which requires JDBC.

### Gotcha 5: Flyway history tables and shared database assumptions

All four services currently connect to a single `anotame` database. They use separate Flyway history tables (`flyway_schema_history_identity`, `flyway_schema_history_catalog`, etc.) as a workaround. If migrating to four independent databases, the Flyway history table isolation is no longer necessary (each database has only one service's migrations) but it is also harmless to leave in place.

More importantly: if `%prod.quarkus.hibernate-orm.database.generation=none` is set (it is), Flyway is the only thing creating schema on first deploy. Ensure `quarkus.flyway.migrate-at-start=true` is set (it is in all four services). The database must exist before the service starts — Railway creates the PostgreSQL database as part of provisioning, so this is satisfied automatically.

### Gotcha 6: Health check timeout too short for JVM cold start

Railway's default healthcheck timeout may be as low as 60-120 seconds. The JVM itself starts in ~3-5 seconds after the container launches, but if Flyway runs migrations on startup (`migrate-at-start=true`) and the database has many migration files, startup can take 15-30 seconds. Set `healthcheckTimeout = 300` to be safe.

### Gotcha 7: CORS origin must include Railway-generated service domains

Each Railway service gets a unique generated domain like `identity-service-production.up.railway.app`. If the frontend calls backend services directly (rather than through an API gateway), each backend service must allow the frontend's Railway domain in its CORS config. Set `QUARKUS_HTTP_CORS_ORIGINS` as an env var rather than hardcoding in `application.properties` so domain changes don't require a rebuild.

### Gotcha 8: No docker-compose `depends_on` equivalent in Railway

Docker-compose `depends_on` with `condition: service_healthy` ensures services start in order. Railway does not have inter-service startup ordering. On first deploy:
- PostgreSQL services will provision before app services if you deploy databases first
- App services that run Flyway will fail if the database is not ready

**Mitigation:** Deploy database services first (Railway will provision them in seconds). Then deploy app services. On subsequent deploys, the databases are always already running so this is only a first-deploy concern.

Quarkus does not have built-in retry-until-DB-ready logic beyond Flyway's own retry. Consider adding `quarkus.datasource.jdbc.acquisition-timeout=60` to allow connection pool acquisition to wait rather than immediately fail if the DB is momentarily unavailable.

### Gotcha 9: Quarkus JVM mode image size

The Dockerfiles use `eclipse-temurin:21-jre-alpine` as the runtime base. A typical Quarkus JVM-mode app with Hibernate ORM + REST + JWT will produce an image in the 300-500MB range (the base JRE is ~90MB, Quarkus app with all libs adds 200-350MB). This is normal and not a problem for Railway — images are pulled from Railway's build cache.

Quarkus native compilation would reduce runtime image to ~60-100MB and cut startup time from ~3-5s to ~50-100ms, but requires GraalVM as the build image (`quarkus-bom` includes GraalVM metadata). Native builds take 5-10 minutes per service during the GraalVM compilation phase and require 4-8GB RAM during build. Railway's build environment supports this but the build memory ceiling (especially on Hobby plan) may cause OOM failures during native compilation. **Stick with JVM mode for Railway Dockerfile deploys.** The cold start difference is irrelevant for a low-traffic app with persistent containers.

---

## 6. Migration Checklist Summary

In recommended execution order:

1. Create 4 PostgreSQL services in Railway: `identity-db`, `catalog-db`, `sales-db`, `operations-db`
2. Create 4 app services, configure each:
   - Root Directory: `anotame-api/backend`
   - Dockerfile Path: `<service>/Dockerfile`
   - Link corresponding DB service
3. Set env vars on each app service:
   - `QUARKUS_HTTP_PORT=${{PORT}}`
   - `QUARKUS_DATASOURCE_JDBC_URL=jdbc:postgresql://${{<service>-db.PGHOST}}:${{<service>-db.PGPORT}}/${{<service>-db.PGDATABASE}}`
   - `QUARKUS_DATASOURCE_USERNAME=${{<service>-db.PGUSER}}`
   - `QUARKUS_DATASOURCE_PASSWORD=${{<service>-db.PGPASSWORD}}`
   - `QUARKUS_HTTP_CORS_ORIGINS=http://localhost:3000,https://<frontend-domain>.up.railway.app`
4. Set shared env vars at project level or via a shared-config service:
   - `MP_JWT_VERIFY_PUBLICKEY` (project-level, all services need it)
   - `SMALLRYE_JWT_SIGN_KEY` (identity-service only)
5. Set healthcheck path `/q/health/ready` and timeout 300s per service
6. Deploy databases first, then app services
7. Verify build logs show cached Maven dependency layer on second build
8. Update frontend service URL env vars to point to Railway internal hostnames for service-to-service calls

---

## 7. References

- Railway documentation (config-as-code): https://docs.railway.com/reference/config-as-code
- Railway documentation (services): https://docs.railway.com/guides/services
- Railway documentation (variables): https://docs.railway.com/guides/variables
- Railway documentation (private networking): https://docs.railway.com/guides/private-networking
- Railway documentation (PostgreSQL): https://docs.railway.com/databases/postgresql
- Quarkus configuration reference: https://quarkus.io/guides/config-reference (env var override naming)
- Quarkus health guide: https://quarkus.io/guides/smallrye-health

**Confidence summary:**

| Area | Confidence | Notes |
|---|---|---|
| Railway service model / monorepo | HIGH | Stable concept since 2023 |
| PostgreSQL multi-instance support | HIGH | Documented and common pattern |
| Private networking DNS format | MEDIUM | Verify `.railway.internal` hostname format in current docs |
| railway.toml field names | MEDIUM | Schema has changed; verify key names against current docs |
| Variable reference syntax `${{}}` | HIGH | Double-brace syntax stable since 2023 |
| PORT env var injection | HIGH | Universal Railway behavior |
| JDBC URL scheme mismatch | HIGH | Quarkus JDBC requires `jdbc:` prefix, Railway omits it |
| Build layer caching | MEDIUM | Depends on Railway plan and current implementation |
| PROJECT-level variables | LOW | UI location changes between Railway releases; verify |
| Native compilation feasibility | MEDIUM | Known to work but memory-constrained on Hobby plan |
