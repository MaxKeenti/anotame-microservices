# Phase 20: Dockerfile Fixes + Railway Deployment - Research

**Researched:** 2026-04-15
**Domain:** Docker multi-stage builds (Quarkus JVM), Railway Dockerfile deployments, Railway PostgreSQL private networking
**Confidence:** MEDIUM (Railway docs verified via WebFetch; PostgreSQL private networking details partially inferred from multiple community sources; Dockerfile changes verified against source files directly)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Delete `anotame-db/` directory entirely via `git rm -r` — no deprecation README, no archive. Git history preserves it if recovery is ever needed.
- **D-02:** Delete `build_and_push.sh` from repo root via `git rm` — Railway native Dockerfile builds fully replace the GHCR push pipeline.
- **D-03:** For `identity-service` and `catalog-service` (no existing `MAVEN_OPTS`): add a new `ENV MAVEN_OPTS="-Xmx512m"` line to the build stage only. Do NOT add `--add-opens` compiler flags — they are not needed for these services.
- **D-04:** For `sales-service` and `operations-service` (existing `MAVEN_OPTS` with 9 `--add-opens` compiler unlock flags): append `-Xmx512m` to the existing value. Preserve all `--add-opens` flags. Result: `ENV MAVEN_OPTS="--add-opens=... -Xmx512m"`.
- **D-05:** Each service gets its own `railway.toml` in its service subdirectory: `anotame-api/backend/{service}/railway.toml`. Railway root directory for each service is `anotame-api/backend`.
- **D-06:** `railway.toml` content is minimal: `[build]` section (Dockerfile path) + `[deploy]` section (healthcheckPath = `/q/health/ready`, healthcheckTimeout = 300). No restart policy override, no start command override — Railway defaults handle the rest.
- **D-07:** Fresh Railway project — starting from scratch. Plans must cover full setup: project creation, adding 4 app services, adding 4 PostgreSQL plugin instances, linking variables.
- **D-08:** All Railway dashboard steps that cannot be automated go inline in plan tasks as `[MANUAL]` tasks with `autonomous: false`. Executor flags these for human action before continuing.
- **D-09:** `QUARKUS_DATASOURCE_JDBC_URL` is composed using Railway private network template variables — NOT `DATABASE_PRIVATE_URL`. Pattern per service:
  - identity: `jdbc:postgresql://${{identity-db.PGHOST}}:${{identity-db.PGPORT}}/${{identity-db.PGDATABASE}}`
  - catalog: `jdbc:postgresql://${{catalog-db.PGHOST}}:${{catalog-db.PGPORT}}/${{catalog-db.PGDATABASE}}`
  - sales: `jdbc:postgresql://${{sales-db.PGHOST}}:${{sales-db.PGPORT}}/${{sales-db.PGDATABASE}}`
  - operations: `jdbc:postgresql://${{operations-db.PGHOST}}:${{operations-db.PGPORT}}/${{operations-db.PGDATABASE}}`

### Claude's Discretion

- Dockerfile layer ordering and caching strategy beyond what DOCKER-01–04 specify
- Exact `railway.toml` TOML syntax and key names (planner should verify against Railway docs)
- Order of plan waves (Dockerfile fixes vs. railway.toml creation vs. file deletion)

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DOCKER-01 | All 4 Dockerfiles replace `maven-dependency-plugin:go-offline` with `dependency:resolve` + `dependency:resolve-plugins` | Verified in source Dockerfiles — current line is `org.apache.maven.plugins:maven-dependency-plugin:3.6.1:go-offline`; replacement targets two separate goals |
| DOCKER-02 | All 4 Dockerfiles add `MAVEN_OPTS=-Xmx512m` to build stage | D-03/D-04 locked; identity/catalog add new ENV, sales/ops append to existing 9-flag value |
| DOCKER-03 | All 4 Dockerfiles add `-Djava.util.logging.manager=org.jboss.logmanager.LogManager` to runtime ENTRYPOINT | Currently absent from all 4 Dockerfiles; must be added as JVM arg in ENTRYPOINT array |
| DOCKER-04 | catalog-service ENTRYPOINT path made consistent with other services | catalog-service uses `/app/quarkus-run.jar` (absolute); identity/sales use `quarkus-run.jar` (relative); WORKDIR=/app makes both equivalent — decision is to standardize to relative |
| DEPLOY-01 | Each service has a `railway.toml` checked into its directory | 4 files to create; railway.toml location is relative to repo root — Railway dashboard Root Directory setting determines what Railway treats as service root |
| DEPLOY-02 | Railway project has 4 PostgreSQL service instances linked to app services | Manual — Railway dashboard provisioning; PostgreSQL service names must match: `identity-db`, `catalog-db`, `sales-db`, `operations-db` |
| DEPLOY-03 | Each Railway app service has `QUARKUS_DATASOURCE_JDBC_URL` from private network variables | Manual — Railway dashboard env var setup; uses `${{service-db.PGHOST}}` template syntax |
| DEPLOY-04 | `build_and_push.sh` deleted | `git rm build_and_push.sh` at repo root (file confirmed present) |
| DEPLOY-05 | `anotame-db/` directory removed | `git rm -r anotame-db/` at repo root (directory confirmed present with Dockerfile + init.sql) |
</phase_requirements>

---

## Summary

Phase 20 has two distinct workstreams: (1) code changes to all 4 Dockerfiles and creation of 4 `railway.toml` files, and (2) manual Railway dashboard provisioning. The code changes are mechanical and well-defined by locked decisions D-01 through D-06. The Railway provisioning is entirely manual — there is no Railway CLI automation path for creating services and PostgreSQL instances that doesn't require authentication.

The most important architectural decision is that Railway's Root Directory for each service must be set to `anotame-api/backend` — not the individual service subdirectory. This is because the Dockerfiles copy the parent `pom.xml` from `COPY pom.xml .`, which requires the build context to include the parent directory. The `dockerfilePath` in `railway.toml` must then specify the path to the Dockerfile relative to that root (e.g., `identity-service/Dockerfile`). The `railway.toml` file itself lives in the service subdirectory but is registered with Railway by its absolute repo path.

The `${{service-db.PGHOST}}` template variable syntax is confirmed — Railway's PostgreSQL service exposes `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, and `PGPASSWORD`, and the `${{ServiceName.VARIABLE}}` cross-service reference syntax is the standard way to consume them. `PGHOST` on Railway now defaults to the private network hostname (`.railway.internal` format), so no `_PRIVATE` suffix is needed for private networking when referencing via template variables.

**Primary recommendation:** Execute in 3 sequential waves: Wave 1 — fix all 4 Dockerfiles; Wave 2 — create 4 `railway.toml` files and delete legacy files; Wave 3 — all Railway dashboard provisioning steps (manual).

---

## Current Dockerfile State (Verified)

All 4 Dockerfiles read directly from codebase. [VERIFIED: codebase read]

### identity-service (`anotame-api/backend/identity-service/Dockerfile`)
- Build image: `maven:3.9.6-eclipse-temurin-21-alpine`
- Run image: `eclipse-temurin:21-jre-alpine`, `WORKDIR /app`
- Dependency cache line: `RUN mvn -B -e -C org.apache.maven.plugins:maven-dependency-plugin:3.6.1:go-offline -DexcludeArtifactIds=anotame-parent` **(DOCKER-01 target)**
- `MAVEN_OPTS`: **absent** **(D-03: add new ENV line)**
- ENTRYPOINT: `["java", "-jar", "quarkus-run.jar"]` — relative path **(DOCKER-03: add -D flag; DOCKER-04: not applicable — this is already the consistent form)**
- EXPOSE: 8081

### catalog-service (`anotame-api/backend/catalog-service/Dockerfile`)
- Same base images as identity-service
- Dependency cache line: same `go-offline` invocation **(DOCKER-01 target)**
- `MAVEN_OPTS`: **absent** **(D-03: add new ENV line)**
- ENTRYPOINT: `["java", "-jar", "/app/quarkus-run.jar"]` — absolute path **(DOCKER-03: add -D flag; DOCKER-04: change to relative `quarkus-run.jar`)**
- EXPOSE: 8082

### sales-service (`anotame-api/backend/sales-service/Dockerfile`)
- Same base images
- Dependency cache line: same `go-offline` invocation **(DOCKER-01 target)**
- `MAVEN_OPTS`: **present** — 9 `--add-opens=jdk.compiler/...=ALL-UNNAMED` flags **(D-04: append `-Xmx512m`)**
- ENTRYPOINT: `["java", "-jar", "quarkus-run.jar"]` — relative **(DOCKER-03: add -D flag)**
- EXPOSE: 8083
- Note: `COPY --from=build /app/sales-service/target/quarkus-app /app/` (no trailing slash on source — consistent)

### operations-service (`anotame-api/backend/operations-service/Dockerfile`)
- Same base images
- Dependency cache line: same `go-offline` invocation **(DOCKER-01 target)**
- `MAVEN_OPTS`: **present** — same 9 `--add-opens` flags **(D-04: append `-Xmx512m`)**
- ENTRYPOINT: `["java", "-jar", "/app/quarkus-run.jar"]` — absolute path **(DOCKER-03: add -D flag; DOCKER-04: change to relative `quarkus-run.jar`)**
- EXPOSE: 8084

### Legacy Files to Delete (Confirmed Present)
- `/Users/moonstone/Source/Personal/anotame-microservices/build_and_push.sh` — confirmed at repo root [VERIFIED: ls]
- `/Users/moonstone/Source/Personal/anotame-microservices/anotame-db/` — confirmed present with `Dockerfile` + `init.sql` + `docs/` [VERIFIED: ls]

---

## Standard Stack

### Core
| Component | Version | Purpose | Source |
|-----------|---------|---------|--------|
| maven:3.9.6-eclipse-temurin-21-alpine | 3.9.6 | Dockerfile build stage base image | [VERIFIED: codebase read] |
| eclipse-temurin:21-jre-alpine | 21 JRE | Dockerfile run stage base image | [VERIFIED: codebase read] |
| Railway platform | — | Dockerfile-native build + deploy host | [VERIFIED: docs.railway.com] |
| railway CLI | 4.37.2 | Local Railway project management | [VERIFIED: `railway --version`] |

### Railway Configuration
| Artifact | Per Service | Purpose |
|----------|-------------|---------|
| `railway.toml` | Yes (×4) | Declares builder, Dockerfile path, health check |
| Railway Root Directory (dashboard) | Yes (×4) | Must be `anotame-api/backend` for parent-POM access |
| PostgreSQL service instance | Yes (×4) | Dedicated DB per service |

---

## Architecture Patterns

### railway.toml Structure (verified against Railway docs and real-world examples)

[CITED: docs.railway.com/reference/config-as-code, github.com/vignesh07/clawdbot-railway-template]

```toml
[build]
builder = "dockerfile"
dockerfilePath = "identity-service/Dockerfile"

[deploy]
healthcheckPath = "/q/health/ready"
healthcheckTimeout = 300
```

**Key facts:**
- `builder` value is `"dockerfile"` (lowercase) [CITED: docs.railway.com/reference/config-as-code]
- `dockerfilePath` is relative to the Root Directory set in Railway dashboard [ASSUMED — docs don't explicitly state this relationship, but it is consistent with how Railway resolves all paths relative to root directory]
- `healthcheckTimeout` is in seconds (integer) [CITED: docs.railway.com/reference/config-as-code]
- No `restartPolicyType` in minimal config — Railway defaults to `ON_FAILURE` [ASSUMED — docs show `ON_FAILURE` as an option; default not explicitly documented]
- The railway.toml file location must be registered in Railway dashboard as an absolute repo path (e.g., `/anotame-api/backend/identity-service/railway.toml`) — config file location does NOT automatically follow Root Directory [CITED: docs.railway.com/guides/monorepo]

### Monorepo Root Directory Pattern

**The problem:** Each service Dockerfile copies `pom.xml` (the parent POM) from the build context root (`COPY pom.xml .`). If Railway root directory = individual service directory, this file is not in the build context and `docker build` fails.

**The solution:** Set Railway Root Directory = `anotame-api/backend` for every service. Then `dockerfilePath` in `railway.toml` specifies which service Dockerfile relative to that root.

[CITED: docs.railway.com/guides/monorepo — "When specified, all build and deploy commands will operate within the defined root directory"; "The Railway Config File does not follow the Root Directory path"]
[ASSUMED: `dockerfilePath` is resolved relative to Root Directory — not independently documented, but consistent with all path resolution in Railway]

```
Railway Service: "identity"
  Root Directory:  anotame-api/backend        ← set in Railway dashboard
  railway.toml at: anotame-api/backend/identity-service/railway.toml
                   (registered as /anotame-api/backend/identity-service/railway.toml)
  dockerfilePath:  identity-service/Dockerfile ← relative to root dir
  Build context:   anotame-api/backend/        ← entire parent directory is available
```

### DOCKER-01 Fix: go-offline Replacement

**Current (broken):**
```dockerfile
RUN mvn -B -e -C org.apache.maven.plugins:maven-dependency-plugin:3.6.1:go-offline \
    -DexcludeArtifactIds=anotame-parent
```

**Replacement:**
```dockerfile
RUN mvn -B dependency:resolve dependency:resolve-plugins -DincludeScope=compile
```

**Why `go-offline` fails with Quarkus:** `dependency:go-offline` in multi-module builds cannot resolve Quarkus deployment artifacts (the augmentation classpath). Quarkus requires deployment-scoped artifacts that `go-offline` skips or fails to resolve correctly — leading to augmentation build failure when the actual package step runs without internet. `dependency:resolve` + `dependency:resolve-plugins` resolves all declared dependencies and plugins without attempting the full offline mode resolution that triggers the Quarkus augmentation model. [CITED: github.com/quarkusio/quarkus/issues/27615 — "Maven `go-offline` goal fails in multi-module builds"]

**Note on flags:** `-DincludeScope=compile` is optional but reduces unnecessary test-scope resolution. The `-am` flag in the build step already ensures all module dependencies are resolved. A simpler replacement that mirrors current intent:

```dockerfile
RUN mvn -B dependency:resolve dependency:resolve-plugins -DexcludeArtifactIds=anotame-parent
```

### DOCKER-02 Fix: MAVEN_OPTS Heap Ceiling

**For identity-service and catalog-service** (add new ENV line in build stage, after WORKDIR):
```dockerfile
ENV MAVEN_OPTS="-Xmx512m"
```

**For sales-service and operations-service** (append to existing 9-flag value):
```dockerfile
ENV MAVEN_OPTS="--add-opens=jdk.compiler/com.sun.tools.javac.code=ALL-UNNAMED \
  --add-opens=jdk.compiler/com.sun.tools.javac.comp=ALL-UNNAMED \
  --add-opens=jdk.compiler/com.sun.tools.javac.file=ALL-UNNAMED \
  --add-opens=jdk.compiler/com.sun.tools.javac.main=ALL-UNNAMED \
  --add-opens=jdk.compiler/com.sun.tools.javac.model=ALL-UNNAMED \
  --add-opens=jdk.compiler/com.sun.tools.javac.parser=ALL-UNNAMED \
  --add-opens=jdk.compiler/com.sun.tools.javac.processing=ALL-UNNAMED \
  --add-opens=jdk.compiler/com.sun.tools.javac.tree=ALL-UNNAMED \
  --add-opens=jdk.compiler/com.sun.tools.javac.util=ALL-UNNAMED \
  -Xmx512m"
```

**Why 512m?** Railway Hobby plan allows up to 8GB per service. The Maven JVM build process needs headroom — but Railway build runners are separate from runtime containers. The `-Xmx512m` ceiling prevents Maven's JVM heap from competing with GraalVM-related Quarkus augmentation subprocesses. This is a JVM heap ceiling for Maven itself, not for the Quarkus augmentation subprocess (which has its own memory allocation). 512m is a conservative Maven heap ceiling appropriate for CI build runners. [ASSUMED — no Railway-specific Quarkus Xmx recommendation found; 512m is a common Maven CI recommendation based on community patterns]

**Important:** `-Xmx` is heap only. Total Maven process memory = `-Xmx512m` + Metaspace (typically 200–400m) + off-heap. Total Maven process may use 900m–1.2GB. This is well within Railway's build resource envelope. [ASSUMED — standard JVM memory model; no Railway-specific data]

### DOCKER-03 Fix: JVM Logging Manager

**Problem:** Without `-Djava.util.logging.manager=org.jboss.logmanager.LogManager`, the JVM defaults to the JUL (java.util.logging) handler. Quarkus uses JBoss LogManager internally. When quarkus-run.jar starts, the JBoss LogManager is initialized late, causing some early startup log lines to be emitted via the default JUL formatter (unstructured, garbled) and some via JBoss (structured). Result: duplicate/garbled logs.

**Fix:** Add the system property to the ENTRYPOINT `java` invocation before `-jar`:

```dockerfile
ENTRYPOINT ["java", "-Djava.util.logging.manager=org.jboss.logmanager.LogManager", "-jar", "quarkus-run.jar"]
```

The property must appear before `-jar` in the command array. [CITED: quarkus.io/guides/logging — "it is necessary to set the java.util.logging.manager system property to org.jboss.logmanager.LogManager early in the startup process"]

**Note on DOCKER-04:** Two services (catalog-service, operations-service) use `/app/quarkus-run.jar` (absolute). Two services (identity-service, sales-service) use `quarkus-run.jar` (relative). With `WORKDIR /app`, both forms resolve identically at runtime. The fix is to standardize to relative `quarkus-run.jar` for all 4 services. Apply as part of the same ENTRYPOINT edit that adds `-Djava.util.logging.manager`.

**Final ENTRYPOINT (all 4 services):**
```dockerfile
ENTRYPOINT ["java", "-Djava.util.logging.manager=org.jboss.logmanager.LogManager", "-jar", "quarkus-run.jar"]
```

---

## Railway PostgreSQL Variable Reference

### Variables Exposed by Railway PostgreSQL Service

[CITED: docs.railway.com/databases/postgresql]

| Variable | Description |
|----------|-------------|
| `PGHOST` | Hostname — resolves to private network (`.railway.internal`) for same-project services |
| `PGPORT` | Port number (5432 for PostgreSQL) |
| `PGDATABASE` | Database name |
| `PGUSER` | PostgreSQL username |
| `PGPASSWORD` | PostgreSQL password |
| `DATABASE_URL` | Full connection string (postgresql://user:pass@host:port/db) |

**Important:** As of 2025, Railway changed `PGHOST` to default to the private network hostname (`.railway.internal` format). There is no separate `PGHOST_PRIVATE` variable needed — `PGHOST` is already private. [CITED: station.railway.com/questions/an-actual-value-of-postgres-pghost-933b8b65 — "PGHOST now defaults to the private network host"]

### Cross-Service Reference Syntax

[CITED: docs.railway.com/variables#referencing-another-services-variable]

```
${{SERVICE_NAME.VARIABLE_NAME}}
```

Where `SERVICE_NAME` is the Railway service name exactly as shown in the Railway dashboard (case-sensitive).

**JDBC URL pattern (D-09 confirmed):**
```
QUARKUS_DATASOURCE_JDBC_URL = jdbc:postgresql://${{identity-db.PGHOST}}:${{identity-db.PGPORT}}/${{identity-db.PGDATABASE}}
```

**Additional variables needed per service (set in Railway dashboard):**
```
QUARKUS_DATASOURCE_USERNAME = ${{identity-db.PGUSER}}
QUARKUS_DATASOURCE_PASSWORD = ${{identity-db.PGPASSWORD}}
PORT = (Railway injects this automatically — no manual set needed)
```

### Private Network Caveat

Private network DNS is NOT available during the build phase. It is only available at runtime. The JDBC URL using `${{service-db.PGHOST}}` is a runtime env var — this is fine because Flyway and Hibernate connection establishment happens at application startup (runtime), not during `mvn package` (build). [CITED: community sources confirming "private network cannot be used in the build phase"]

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Health check routing | Custom health endpoint | Quarkus `/q/health/ready` (built-in) | Quarkus Smallrye Health extension already wired |
| DB connection string assembly | Manual string concat in code | Railway template variables in dashboard env var | Railway resolves at deploy time; no code change needed |
| PostgreSQL provisioning | Docker-managed shared DB | Railway PostgreSQL service instances | Platform-managed backup, scaling, TLS |
| Dockerfile ENTRYPOINT logging | Custom log handler | `-Djava.util.logging.manager` system property | Quarkus already bundles JBoss LogManager |

---

## Common Pitfalls

### Pitfall 1: Build Context Does Not Include Parent POM
**What goes wrong:** Railway root directory set to service subdirectory (e.g., `anotame-api/backend/identity-service`). Dockerfile's `COPY pom.xml .` copies identity-service's own pom.xml over the WORKDIR root, but then `COPY identity-service/pom.xml identity-service/pom.xml` fails — the path resolves relative to build context, and `identity-service/` doesn't exist inside the service directory.
**Why it happens:** Each Dockerfile begins with `COPY pom.xml .` intending to copy the *parent* pom.xml. This requires `anotame-api/backend/` as the build context root.
**How to avoid:** Set Railway dashboard Root Directory to `anotame-api/backend` (not the service subdirectory). `dockerfilePath` in `railway.toml` then points to `identity-service/Dockerfile`.
**Warning signs:** Build log shows `COPY failed: file not found in build context: pom.xml` or wrong pom.xml is copied (only service pom, not parent pom).

### Pitfall 2: railway.toml Location Not Registered Correctly
**What goes wrong:** `railway.toml` is committed at `anotame-api/backend/identity-service/railway.toml` but Railway dashboard is looking at root. Railway reads config from the registered path — if no path is registered, it looks at the Root Directory root.
**Why it happens:** Railway's config file resolution does NOT follow the Root Directory setting. The config file path must be explicitly set in Railway service settings as an absolute path (e.g., `/anotame-api/backend/identity-service/railway.toml`). [CITED: docs.railway.com/guides/monorepo]
**How to avoid:** After committing railway.toml files, in Railway dashboard → Service Settings → Source → Config File Path, set the absolute path for each service.
**Warning signs:** Railway ignores health check settings, builds with Nixpacks/Railpack instead of Dockerfile.

### Pitfall 3: go-offline Causes Augmentation Build Failure at Runtime Stage
**What goes wrong:** Dependency caching step appears to succeed, but `mvn clean package` later fails with "ClassNotFoundException" or "ArtifactDescriptorException" for Quarkus deployment artifacts.
**Why it happens:** `dependency:go-offline` does not resolve Quarkus's deployment-scoped artifacts (e.g., `quarkus-hibernate-orm-deployment`). When Maven runs offline, these are missing from the local repo cache.
**How to avoid:** Replace `go-offline` with `dependency:resolve dependency:resolve-plugins` (DOCKER-01).
**Warning signs:** Build log shows `Could not resolve ...quarkus-...-deployment` during package step.

### Pitfall 4: MAVEN_OPTS Append Breaks --add-opens Flags
**What goes wrong:** For sales/operations, if `-Xmx512m` is placed *before* `--add-opens` flags or the entire ENV value is replaced with only `-Xmx512m`, the 9 `--add-opens` flags are lost and the Maven compiler fails.
**Why it happens:** Careless edit replaces rather than appends.
**How to avoid:** The complete ENV line must preserve all 9 `--add-opens=...` flags and add `-Xmx512m` as the last token in the quoted string.
**Warning signs:** Build fails with `InaccessibleObjectException` or similar reflective access errors.

### Pitfall 5: Private Network Not Available During Build
**What goes wrong:** Health check fails at deploy time or app crashes on startup because the JDBC URL references a private network hostname that is resolved at build time.
**Why it happens:** The JDBC URL template variable is evaluated by Railway at container start, not at build time. However, if Quarkus attempts to validate datasource connectivity during `quarkus-maven-plugin:build` (augmentation), it would fail.
**How to avoid:** With `DskipTests` and no datasource-at-build-time configuration in `application.properties`, Quarkus does not attempt actual DB connections during augmentation. The env var is only resolved at runtime container start.
**Warning signs:** Build succeeds; runtime startup shows `FATAL Datasource 'default' cannot be started` within first 10 seconds.

### Pitfall 6: healthcheckTimeout Too Low for First Deploy
**What goes wrong:** Railway marks deployment unhealthy before Quarkus finishes augmentation + Flyway migration.
**Why it happens:** Cold JVM startup + Quarkus augmentation + Flyway baseline migration on a fresh DB can take 60–120 seconds on Railway. If healthcheckTimeout < that, Railway kills the container.
**How to avoid:** D-06 specifies 300 seconds — this is the correct value. Do not reduce it.
**Warning signs:** Railway deployment logs show "Health check timed out" before 5 minutes have elapsed.

### Pitfall 7: PORT Env Var Not Respected
**What goes wrong:** Railway deploys successfully but health check against `/q/health/ready` returns connection refused because the service is listening on its hardcoded port (8081–8084) while Railway routes traffic to its injected `PORT`.
**Why it happens:** Phase 19 wires `quarkus.http.port=${PORT:808x}`. If Phase 19 is incomplete before Phase 20 deploys, the PORT mismatch kills the health check.
**How to avoid:** Phase 20 depends on Phase 19 being complete. Do not deploy to Railway until Phase 19 env var wiring is committed.
**Warning signs:** Health check path `/q/health/ready` returns connection refused or 404; Railway logs show Quarkus started on port 808x but Railway tried to connect to a different port.

---

## Code Examples

### Complete Dockerfile Diff: identity-service (representative)

```dockerfile
# Build Stage
FROM maven:3.9.6-eclipse-temurin-21-alpine AS build
WORKDIR /app

# NEW (D-03): Add heap ceiling for Railway build runners
ENV MAVEN_OPTS="-Xmx512m"

# Copy Parent POM
COPY pom.xml .

# Copy Module POMs
COPY identity-service/pom.xml identity-service/pom.xml
COPY catalog-service/pom.xml catalog-service/pom.xml
COPY sales-service/pom.xml sales-service/pom.xml
COPY operations-service/pom.xml operations-service/pom.xml

# CHANGED (DOCKER-01): go-offline → dependency:resolve + dependency:resolve-plugins
RUN mvn -B dependency:resolve dependency:resolve-plugins -DexcludeArtifactIds=anotame-parent

# Copy Source Code
COPY identity-service/src identity-service/src

# Build Identity Service
RUN mvn clean package -pl identity-service -am -DskipTests

# Run Stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/identity-service/target/quarkus-app/ /app/
EXPOSE 8081
# CHANGED (DOCKER-03): add logging manager system property
ENTRYPOINT ["java", "-Djava.util.logging.manager=org.jboss.logmanager.LogManager", "-jar", "quarkus-run.jar"]
```

### railway.toml: identity-service
```toml
[build]
builder = "dockerfile"
dockerfilePath = "identity-service/Dockerfile"

[deploy]
healthcheckPath = "/q/health/ready"
healthcheckTimeout = 300
```

### railway.toml: catalog-service
```toml
[build]
builder = "dockerfile"
dockerfilePath = "catalog-service/Dockerfile"

[deploy]
healthcheckPath = "/q/health/ready"
healthcheckTimeout = 300
```

### railway.toml: sales-service
```toml
[build]
builder = "dockerfile"
dockerfilePath = "sales-service/Dockerfile"

[deploy]
healthcheckPath = "/q/health/ready"
healthcheckTimeout = 300
```

### railway.toml: operations-service
```toml
[build]
builder = "dockerfile"
dockerfilePath = "operations-service/Dockerfile"

[deploy]
healthcheckPath = "/q/health/ready"
healthcheckTimeout = 300
```

### Railway Dashboard: Environment Variable Setup (per service, example for identity)
```
QUARKUS_DATASOURCE_JDBC_URL    = jdbc:postgresql://${{identity-db.PGHOST}}:${{identity-db.PGPORT}}/${{identity-db.PGDATABASE}}
QUARKUS_DATASOURCE_USERNAME    = ${{identity-db.PGUSER}}
QUARKUS_DATASOURCE_PASSWORD    = ${{identity-db.PGPASSWORD}}
```
(PORT is injected automatically by Railway — do not set manually)

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Docker + curl (no automated test framework for Railway deploy validation) |
| Config file | none |
| Quick run command | `docker build --no-cache -f anotame-api/backend/identity-service/Dockerfile anotame-api/backend/ 2>&1 \| tail -20` |
| Full suite command | Run quick build for all 4 services |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DOCKER-01 | Dependency resolution succeeds without go-offline | smoke | `docker build --no-cache -f identity-service/Dockerfile . 2>&1 \| grep -E "BUILD SUCCESS\|ERROR"` (run from `anotame-api/backend/`) | ❌ Wave 1 |
| DOCKER-02 | Build completes without OOM kill | smoke | Build completes with exit 0 | ❌ Wave 1 |
| DOCKER-03 | Startup logs use JBoss format | smoke | `docker run --rm -e QUARKUS_DATASOURCE_JDBC_URL=... <image> 2>&1 \| head -20` — look for structured log | ❌ Wave 1 |
| DOCKER-04 | catalog-service ENTRYPOINT consistent | manual | `grep ENTRYPOINT anotame-api/backend/catalog-service/Dockerfile` | ❌ Wave 1 |
| DEPLOY-01 | railway.toml files committed | manual | `git status anotame-api/backend/*/railway.toml` | ❌ Wave 2 |
| DEPLOY-02 | 4 PostgreSQL instances visible in Railway | manual | Railway dashboard inspection | MANUAL |
| DEPLOY-03 | Services connect to their respective DBs | manual | Check Railway deploy logs for Flyway success | MANUAL |
| DEPLOY-04 | build_and_push.sh deleted | automated | `git log --diff-filter=D -- build_and_push.sh` | ❌ Wave 2 |
| DEPLOY-05 | anotame-db/ deleted | automated | `git log --diff-filter=D -- anotame-db/` | ❌ Wave 2 |

### Sampling Rate
- **Per task commit:** `docker build --no-cache -f <service>/Dockerfile . 2>&1 | tail -5` (from `anotame-api/backend/`)
- **Per wave merge:** All 4 docker builds succeed with exit 0
- **Phase gate:** At least one Railway service `/q/health/ready` returns HTTP 200 before `/gsd-verify-work`

### Local Docker Build Verification

```bash
# From anotame-api/backend/ directory — build context must include parent POM
cd anotame-api/backend/

# Test identity-service build (representative)
docker build --no-cache -f identity-service/Dockerfile . 2>&1 | tail -20

# Test all 4
for svc in identity-service catalog-service sales-service operations-service; do
  echo "=== Building $svc ==="
  docker build --no-cache -f $svc/Dockerfile . 2>&1 | tail -5
done
```

**Memory simulation:** On Apple Silicon with Docker Desktop, builds run with available host RAM. To simulate Railway's constraints, add `--memory=2g` to the docker build command. This is not exact but surfaces OOM failures early.

### Wave 0 Gaps
- No new test files to create — validation is via `docker build` (which already works locally) and Railway deployment health check (manual)
- No test framework install needed

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Docker CLI | DOCKER-01–04 local testing | ✓ | 29.4.0 | — |
| railway CLI | DEPLOY-01–05 provisioning guidance | ✓ | 4.37.2 | Dashboard only |
| Maven (local) | Not required by phase (builds happen in Docker) | ✓ | 3.9.14 | — |
| Railway account | DEPLOY-02–05 | Unknown | — | Must be created manually |
| Railway Hobby plan | DEPLOY-02 (4 PostgreSQL instances) | Unknown | — | Free tier limited to 1 PostgreSQL |

**Missing dependencies with no fallback:**
- Railway account and Hobby plan subscription — required before any DEPLOY-* tasks can execute. Must be created by human before Wave 3.

**Missing dependencies with fallback:**
- None

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `go-offline` Maven plugin | `dependency:resolve` + `dependency:resolve-plugins` | Quarkus 2.x+ multi-module breakage | Fixes augmentation build failures |
| GHCR push pipeline (`build_and_push.sh`) | Railway native Dockerfile builds | Phase 20 | Eliminates manual CI build step |
| Shared `anotame-db` container | Per-service Railway PostgreSQL instances | Phase 20 | Eliminates cross-service DB coupling |
| Nixpacks/Railpack auto-detect | Explicit `builder = "dockerfile"` in railway.toml | Phase 20 | Consistent, deterministic Railway builds |
| `DATABASE_PRIVATE_URL` for JDBC | `${{service.PGHOST}}:${{service.PGPORT}}/${{service.PGDATABASE}}` pattern | D-09 lock | Granular control; works with JDBC URL format |

**Deprecated/outdated:**
- `maven-dependency-plugin:go-offline`: Still functional for pure-Java projects but broken for Quarkus multi-module. Replaced by `dependency:resolve`.
- GHCR build pipeline via `build_and_push.sh`: Replaced by Railway native builds.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `dockerfilePath` in railway.toml is resolved relative to the Railway Root Directory | Architecture Patterns — railway.toml | If wrong, dockerfilePath must be an absolute repo path; executor must adjust path in all 4 railway.toml files |
| A2 | Railway's `restartPolicyType` defaults to `ON_FAILURE` when omitted from railway.toml | Architecture Patterns | Low risk — omitting it means Railway uses its platform default; behavior may differ but is non-critical |
| A3 | `-Xmx512m` is sufficient for Maven build phase without causing build slowdowns | Architecture Patterns (MAVEN_OPTS) | If too low, Maven GC pressure increases build time; not an OOM risk but may slow builds. Increase to 768m or 1024m if builds timeout |
| A4 | `PGHOST` from Railway PostgreSQL service already resolves to private network hostname (no `_PRIVATE` suffix needed) | Railway PostgreSQL Variable Reference | If wrong, the private hostname is under `PGHOST_PRIVATE` and PGHOST is the public proxy; JDBC URL would use public network (higher latency, egress costs) but would still work |
| A5 | `dependency:resolve dependency:resolve-plugins -DexcludeArtifactIds=anotame-parent` is the correct replacement for `go-offline` | DOCKER-01 fix | If insufficient, some Quarkus deployment artifacts may still be missing; executor would need to add `-DincludeScope=compile` or switch to Quarkus's own `quarkus:go-offline` goal |
| A6 | railway.toml files should live in service subdirectories and be registered in Railway dashboard by absolute path | Architecture Patterns — monorepo | If Railway auto-discovers railway.toml from Root Directory, files may need to be at `anotame-api/backend/railway.toml` instead; this would require separate railway.toml per-deploy or dashboard-only config |

---

## Open Questions

1. **Does `dockerfilePath` in railway.toml resolve relative to Root Directory or absolute from repo root?**
   - What we know: Railway docs say config file does NOT follow Root Directory; build/deploy commands DO follow Root Directory. The relationship of `dockerfilePath` to Root Directory is not explicitly documented.
   - What's unclear: Whether `dockerfilePath = "identity-service/Dockerfile"` (relative) or `dockerfilePath = "anotame-api/backend/identity-service/Dockerfile"` (absolute from repo root) is correct when Root Directory = `anotame-api/backend`.
   - Recommendation: Use relative path in railway.toml (`identity-service/Dockerfile`). On first deploy, check Railway build log — if Railway cannot find the Dockerfile, switch to absolute path from repo root. This is a one-line fix per file.

2. **Does Railway auto-discover railway.toml when it lives in a subdirectory?**
   - What we know: Railway dashboard has a "Config File Path" field. If not set, Railway looks at the Root Directory.
   - What's unclear: If railway.toml is at `anotame-api/backend/identity-service/railway.toml` and Root Directory is `anotame-api/backend`, does Railway find it automatically or does the absolute path need to be registered in dashboard?
   - Recommendation: Treat as a [MANUAL] step: after committing railway.toml files, set Config File Path in Railway dashboard to the absolute path for each service.

3. **Is Railway Hobby plan required for 4 simultaneous PostgreSQL instances?**
   - What we know: Railway's free tier has limits; Hobby plan is required for sustained workloads.
   - What's unclear: Whether 4 PostgreSQL instances simultaneously require Hobby plan or if the free tier allows it for the trial period.
   - Recommendation: Assume Hobby plan ($5/month as of 2025). Flag as a [MANUAL] prerequisite with `autonomous: false`.

---

## Project Constraints (from CLAUDE.md / AI_RULES.md)

Relevant constraints for this phase:

- **Hexagonal Architecture:** No framework leakage into domain layer — Phase 20 only touches Dockerfiles and infrastructure config; no Java code changes.
- **PostgreSQL:** All 4 services use PostgreSQL — consistent with Railway PostgreSQL service instances.
- **Containerization:** "All services are run via Docker" — Railway Dockerfile native builds align with this requirement.
- **Verification:** "Always verify changes via `bun run build` (exit code 0) before committing" — Not applicable to Dockerfile/railway.toml changes. Docker build verification replaces this check for Phase 20.
- **No frontend changes:** Phase 20 is backend Dockerfile + deployment config only.

---

## Sources

### Primary (HIGH confidence)
- [Railway Config as Code](https://docs.railway.com/reference/config-as-code) — railway.toml key names, types, builder values
- [Railway Dockerfiles](https://docs.railway.com/builds/dockerfiles) — builder auto-detection, RAILWAY_DOCKERFILE_PATH
- [Railway Monorepo Guide](https://docs.railway.com/guides/monorepo) — Root Directory behavior, config file path independence
- [Railway Variables Reference](https://docs.railway.com/variables#referencing-another-services-variable) — `${{SERVICE_NAME.VAR}}` cross-service syntax
- [Railway PostgreSQL Docs](https://docs.railway.com/databases/postgresql) — PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD variables
- [Railway Private Networking](https://docs.railway.com/reference/private-networking) — `.railway.internal` hostname format
- Codebase — all 4 Dockerfiles read directly
- `railway --version` — CLI 4.37.2 confirmed available
- `docker --version` — Docker 29.4.0 confirmed available

### Secondary (MEDIUM confidence)
- [Real-world railway.toml example](https://github.com/vignesh07/clawdbot-railway-template/blob/main/railway.toml) — `builder = "dockerfile"`, healthcheckPath, healthcheckTimeout confirmed via live file
- [Station: PGHOST changed to private](https://station.railway.com/questions/an-actual-value-of-postgres-pghost-933b8b65) — PGHOST now defaults to railway.internal
- [Quarkus Issue #27615](https://github.com/quarkusio/quarkus/issues/27615) — go-offline fails in Quarkus multi-module builds

### Tertiary (LOW confidence)
- Various Railway Help Station threads — private networking behavior, build memory limits
- Community consensus on `-Xmx512m` for Maven CI builds

---

## Metadata

**Confidence breakdown:**
- Dockerfile changes: HIGH — source files verified; changes are mechanical
- railway.toml syntax: HIGH — verified via official docs + real-world example
- Railway monorepo Root Directory pattern: MEDIUM — behavior partially inferred; `dockerfilePath` resolution relative to Root Directory is A1 assumption
- Railway PostgreSQL private variables: MEDIUM — PGHOST = private hostname confirmed via community source; official docs list variables but don't distinguish public/private
- MAVEN_OPTS -Xmx512m value: LOW — no Railway-specific Quarkus recommendation found; community best practice

**Research date:** 2026-04-15
**Valid until:** 2026-05-15 (Railway docs are stable; private networking behavior confirmed as of 2025)
