# Phase 7: Operational Reliability & Housekeeping - Research

**Researched:** 2026-04-02
**Domain:** Quarkus SmallRye Health, Docker Compose healthchecks, repository housekeeping
**Confidence:** HIGH

---

## Summary

Phase 7 is the final milestone phase, covering two parallel workstreams: health check infrastructure for all 4 backend services, and repository housekeeping (stale env vars, legacy build artifacts, a missing CORS header). Both workstreams are well-understood and mechanically straightforward — no new architecture is introduced.

The health check work follows the standard Quarkus pattern: add `quarkus-smallrye-health` to each service's pom.xml (one `<dependency>` block), and the Agroal datasource integration automatically registers a `/q/health/ready` check that validates DB connectivity. No custom Java code is required. Docker Compose healthchecks then reference this endpoint using `wget` (available in the `eclipse-temurin:21-jre-alpine` base images used by all 4 Dockerfiles). All 4 backend services currently use `eclipse-temurin:21-jre-alpine` as their runtime stage, confirming `wget` is the correct tool.

The housekeeping work is three atomic file-level changes: (1) replace 3 `NEXT_PUBLIC_*` lines in `.env.example` with `PUBLIC_*` equivalents matching the SvelteKit convention already in use elsewhere in the repo, (2) delete `anotame-web-legacy/node_modules/` and `anotame-web-legacy/.next/` (both exist on disk but are not git-tracked), and add path-scoped `.gitignore` rules to block future re-entry, (3) append `x-user-name` to the `quarkus.http.cors.headers` property in `sales-service/src/main/resources/application.properties`.

**Primary recommendation:** Add `quarkus-smallrye-health` to all 4 service pom.xml files, wire `wget`-based Docker Compose healthchecks, then execute the 3 housekeeping file edits. Total scope is narrow and low-risk.

---

## Project Constraints (from CLAUDE.md / AI_RULES.md)

The project `CLAUDE.md` delegates to `AI_RULES.md`. Constraints relevant to this phase:

- **Build verification:** Always run `bun run build` (exit code 0) before committing (frontend only; no frontend changes in this phase).
- **Docker verification:** Verify end-to-end via `docker compose up --build` — the health check integration should be validated this way.
- **Hexagonal Architecture layers:** Backend-only changes in this phase stay in the infrastructure layer (pom.xml dependency + properties config). No domain or application layer files are touched.
- **Monorepo structure:** `anotame-api` is backend; `anotame-web` is frontend (SvelteKit); `anotame-web-legacy` is deprecated Next.js. Housekeeping targets `anotame-web-legacy` artifacts and root `.env.example`.
- **Respect existing module boundaries:** Health extension is additive — no existing classes modified.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| OPS-01 | All 4 backend services have Docker Compose `healthcheck` entries using `/q/health/ready` | Docker Compose healthcheck syntax documented; `wget` confirmed available in alpine base images; Quarkus port per service confirmed |
| OPS-02 | `quarkus-smallrye-health` extension added to all 4 services | Extension artifact ID confirmed (`io.quarkus:quarkus-smallrye-health`); Agroal auto-registers DB readiness check; no Java code required |
| HOUSE-01 | `.env.example` updated — all `NEXT_PUBLIC_*` references replaced with `PUBLIC_*` | Confirmed: 3 occurrences in `.env.example`; `PUBLIC_*` naming already used in `docker-compose.yml` for SvelteKit frontend |
| HOUSE-02 | `anotame-web-legacy/node_modules/` and `anotame-web-legacy/.next/` deleted and added to `.gitignore` | Confirmed: both directories exist on disk; neither is git-tracked; web-legacy's own `.gitignore` already has `/node_modules` and `/.next/` scoped locally; root `.gitignore` needs explicit `anotame-web-legacy/` path-scoped entries to be safe |
| HOUSE-03 | `x-user-name` header added to `sales-service` CORS `allowed-headers` config | Confirmed: current `quarkus.http.cors.headers` in sales-service omits `x-user-name`; identity-service already has it as reference pattern |
</phase_requirements>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `io.quarkus:quarkus-smallrye-health` | Managed by Quarkus BOM 3.27.2 | Exposes `/q/health/ready`, `/q/health/live`, `/q/health` endpoints | Official Quarkus extension; Agroal integration auto-registers DB readiness check with zero custom code |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `quarkus-agroal` | Already present (transitive via `quarkus-jdbc-postgresql`) | Registers DB readiness check automatically when `quarkus-smallrye-health` is on classpath | Always — no explicit dependency needed; already present in all 4 services |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `wget` in Docker healthcheck | `curl` | Alpine images include `wget` (busybox) by default; `curl` requires explicit `apk add`. `wget` is correct choice for these Dockerfiles. |
| Extension auto-registered DB check | Custom `@Readiness HealthCheck` Java class | Custom class gives finer-grained messaging but is unnecessary here — Agroal's built-in check tests actual datasource connectivity, which is all that is required |

**Installation (per service pom.xml):**
```xml
<dependency>
    <groupId>io.quarkus</groupId>
    <artifactId>quarkus-smallrye-health</artifactId>
</dependency>
```
No version tag — managed by `quarkus-bom` at 3.27.2 (already in parent pom).

---

## Architecture Patterns

### Health Endpoint Behavior
When `quarkus-smallrye-health` is added and a datasource is configured:
- `GET /q/health/ready` returns HTTP 200 with `{ "status": "UP", "checks": [...] }` when DB is reachable
- `GET /q/health/ready` returns HTTP 503 with `{ "status": "DOWN", "checks": [...] }` when DB is unreachable
- The Agroal check appears in the `checks` array automatically — no Java code required

### Pattern 1: Docker Compose healthcheck for Quarkus on Alpine
**What:** Uses `wget --spider` which is available in `eclipse-temurin:21-jre-alpine` (busybox wget)
**When to use:** All 4 backend services (all use alpine runtime)
**Example:**
```yaml
# Source: https://quarkus.io/guides/smallrye-health + Docker Compose healthcheck docs
healthcheck:
  test: ["CMD-SHELL", "wget -q --spider http://localhost:${SERVICE_PORT}/q/health/ready || exit 1"]
  interval: 10s
  timeout: 5s
  retries: 5
  start_period: 30s
```

Concrete per-service versions (ports from docker-compose.yml and application.properties):
```yaml
# identity-service (port 8081)
healthcheck:
  test: ["CMD-SHELL", "wget -q --spider http://localhost:8081/q/health/ready || exit 1"]
  interval: 10s
  timeout: 5s
  retries: 5
  start_period: 30s

# catalog-service (port 8082)
healthcheck:
  test: ["CMD-SHELL", "wget -q --spider http://localhost:8082/q/health/ready || exit 1"]
  interval: 10s
  timeout: 5s
  retries: 5
  start_period: 30s

# sales-service (port 8083)
healthcheck:
  test: ["CMD-SHELL", "wget -q --spider http://localhost:8083/q/health/ready || exit 1"]
  interval: 10s
  timeout: 5s
  retries: 5
  start_period: 30s

# operations-service (port 8084)
healthcheck:
  test: ["CMD-SHELL", "wget -q --spider http://localhost:8084/q/health/ready || exit 1"]
  interval: 10s
  timeout: 5s
  retries: 5
  start_period: 30s
```

### Pattern 2: depends_on with condition: service_healthy
**What:** Upgrade `condition: service_started` to `condition: service_healthy` for services that depend on another backend service
**When to use:** After adding healthchecks, any service that uses `depends_on` with backend services
**Current state in docker-compose.yml:**
- `sales-service` depends on `identity-service` and `catalog-service` with `condition: service_started`
- `operations-service` depends on `sales-service` with `condition: service_started`
- `anotame-web` depends on identity, catalog, sales with no condition (just service names — implicit `service_started`)

**After change:**
```yaml
sales-service:
  depends_on:
    anotame-db:
      condition: service_healthy
    identity-service:
      condition: service_healthy
    catalog-service:
      condition: service_healthy

operations-service:
  depends_on:
    anotame-db:
      condition: service_healthy
    sales-service:
      condition: service_healthy

anotame-web:
  depends_on:
    identity-service:
      condition: service_healthy
    catalog-service:
      condition: service_healthy
    sales-service:
      condition: service_healthy
```

### Pattern 3: CORS header append (HOUSE-03)
**What:** Append `x-user-name` to the existing `quarkus.http.cors.headers` property in sales-service
**Reference pattern:** identity-service already has `x-user-name` in its CORS headers

Current sales-service value:
```properties
quarkus.http.cors.headers=accept, authorization, content-type, x-requested-with
```

Target value:
```properties
quarkus.http.cors.headers=accept, authorization, content-type, x-requested-with, x-user-name
```

### Pattern 4: .env.example NEXT_PUBLIC_ → PUBLIC_ rename (HOUSE-01)
**What:** The 3 `NEXT_PUBLIC_*` vars in `.env.example` reference the deprecated Next.js naming convention. The current SvelteKit frontend uses `PUBLIC_*`. The `docker-compose.yml` already uses `PUBLIC_*` in build args and environment section.

Current `.env.example` lines to replace:
```
NEXT_PUBLIC_IDENTITY_URL=https://identity-service-production.up.railway.app
NEXT_PUBLIC_CATALOG_URL=https://catalog-service-production.up.railway.app
NEXT_PUBLIC_SALES_URL=https://sales-service-production.up.railway.app
```

Replacement lines:
```
PUBLIC_IDENTITY_URL=https://identity-service-production.up.railway.app
PUBLIC_CATALOG_URL=https://catalog-service-production.up.railway.app
PUBLIC_SALES_URL=https://sales-service-production.up.railway.app
PUBLIC_OPERATIONS_URL=https://operations-service-production.up.railway.app
```

Note: `docker-compose.yml` also sets `PUBLIC_OPERATIONS_URL` but `.env.example` currently has no entry for it. Adding it is the correct completion.

### Pattern 5: Legacy artifact removal (HOUSE-02)
**What:** `anotame-web-legacy/node_modules/` and `anotame-web-legacy/.next/` exist on disk but are not git-tracked (confirmed via `git ls-files`). They are large build artifacts that should be deleted locally and blocked by `.gitignore`.

**Key finding:** `anotame-web-legacy/.gitignore` already contains `/node_modules` and `/.next/` — but those are relative to the `anotame-web-legacy/` directory and only apply when git processes that subdirectory as if it were a repo root. The root `.gitignore` does NOT contain `anotame-web-legacy/node_modules` or `anotame-web-legacy/.next/`. The success criterion says to add them to `.gitignore` — meaning the root `.gitignore` should get these entries.

Root `.gitignore` additions needed:
```
# Legacy Next.js build artifacts (anotame-web-legacy is deprecated — block build dirs)
anotame-web-legacy/node_modules/
anotame-web-legacy/.next/
```

The directories themselves should be deleted from the working tree (they are untracked, so `rm -rf` is safe — no `git rm` needed).

### Anti-Patterns to Avoid
- **Do NOT add `quarkus.smallrye-health.enabled=false` in any profile** — this would defeat the purpose; the extension should be enabled globally.
- **Do NOT use `curl` in Docker healthchecks for alpine images** — curl is not installed by default; wget is the correct tool.
- **Do NOT implement a custom `@Readiness HealthCheck` Java class** — Agroal's auto-registered check already covers the DB connectivity requirement. Custom code adds unnecessary complexity.
- **Do NOT use `condition: service_started` for backend-to-backend depends_on** — once healthchecks exist, `service_healthy` is the correct condition and stronger guarantee.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| DB connectivity check | Custom SQL ping class with `@Readiness` annotation | `quarkus-smallrye-health` + Agroal auto-registration | Agroal already validates datasource pool on startup and re-validates on each health check cycle; custom code duplicates this |
| HTTP health probe in Docker | Shell script or Java-based health binary | `wget --spider` in CMD-SHELL | One-liner; no extra files; busybox wget is always present on alpine |

---

## Runtime State Inventory

> Included because HOUSE-01 involves renaming environment variable keys. Assessed below.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — `NEXT_PUBLIC_*` are only present in `.env.example` (documentation file); no database stores them | None |
| Live service config | None — `NEXT_PUBLIC_*` keys are not used by any running backend service; SvelteKit frontend already uses `PUBLIC_*` | None |
| OS-registered state | None — no OS-level registrations of these variable names | None |
| Secrets/env vars | `.env.example` has 3 `NEXT_PUBLIC_*` lines (confirmed). Actual `.env` file (gitignored) may also have these names on the developer's machine — developers should update their local `.env` manually after this change | Code edit to `.env.example`; developer-action note in plan |
| Build artifacts | `anotame-web-legacy/node_modules/` (295 dirs, ~500 files per ls output) and `anotame-web-legacy/.next/` (27 items) exist on disk, are untracked by git | `rm -rf` locally; root `.gitignore` additions |

**Conclusion:** The `NEXT_PUBLIC_*` rename is purely a documentation file edit. No runtime system stores or uses these keys. The only follow-up action for developers is updating their local `.env` file if they have one matching `.env.example`.

---

## Common Pitfalls

### Pitfall 1: `wget` exits 0 even on non-200 status (without --spider)
**What goes wrong:** `wget -q http://localhost:8081/q/health/ready -O /dev/null` exits 0 even if the server returns 503, because wget considers the HTTP response a success if it received it.
**Why it happens:** wget's default exit code reflects network connectivity, not HTTP status code.
**How to avoid:** Use `wget --spider` which does exit non-zero on HTTP errors (4xx, 5xx). The `--spider` flag makes wget send a HEAD request and fail on non-2xx responses.
**Warning signs:** Healthcheck passes even when DB is down.

### Pitfall 2: start_period too short for Quarkus JVM startup
**What goes wrong:** Quarkus JVM startup (especially with Flyway migrations running at start) takes 15-25 seconds. If `start_period` is too short, Docker marks the service unhealthy before it finishes starting, and dependent services never start.
**Why it happens:** Flyway `migrate-at-start=true` is enabled in all 4 services — this adds time before the HTTP port opens.
**How to avoid:** Use `start_period: 30s` to give a generous startup window. Failures during `start_period` do not count toward `retries`.
**Warning signs:** Services marked `unhealthy` immediately after startup; dependent services never start.

### Pitfall 3: operations-service pom.xml lacks quarkus-smallrye-jwt
**What goes wrong:** Operations-service does not have `quarkus-smallrye-jwt` in its pom.xml (unlike the other 3 services). This is pre-existing and not introduced by Phase 7. Do not accidentally add the JWT dependency while adding the health dependency.
**Why it happens:** Operations-service may not require JWT auth directly (or it was not added during Phase 2).
**How to avoid:** Add only `quarkus-smallrye-health` to operations-service pom.xml. Leave out JWT.

### Pitfall 4: CORS header property is case/space-sensitive
**What goes wrong:** Adding `X-User-Name` (capitalized) instead of `x-user-name` (lowercase) to CORS config may cause inconsistent behavior with some browsers/clients.
**Why it happens:** HTTP/2 spec requires lowercase headers; Quarkus CORS matching may be case-sensitive depending on the client.
**How to avoid:** Use lowercase `x-user-name` matching the existing entries in identity-service's CORS config (verified: `x-user-name, x-user-id, x-user-role`).

### Pitfall 5: anotame-web-legacy node_modules deletion scope
**What goes wrong:** `rm -rf anotame-web-legacy/node_modules` is a large operation (~295 subdirectories). Running it from the wrong directory could delete the wrong tree.
**Why it happens:** Path confusion in shell.
**How to avoid:** Always use absolute paths or verify cwd before running. Confirm `git status` shows untracked changes (not staged deletions of tracked files) after deletion.

---

## Code Examples

### Add quarkus-smallrye-health to a service pom.xml
```xml
<!-- Source: https://quarkus.io/extensions/io.quarkus/quarkus-smallrye-health/ -->
<!-- Add inside <dependencies> block, after existing quarkus-* entries -->
<dependency>
    <groupId>io.quarkus</groupId>
    <artifactId>quarkus-smallrye-health</artifactId>
</dependency>
```

### Docker Compose healthcheck (wget, alpine)
```yaml
# Source: https://quarkus.io/guides/smallrye-health + Docker Compose healthcheck docs
healthcheck:
  test: ["CMD-SHELL", "wget -q --spider http://localhost:8081/q/health/ready || exit 1"]
  interval: 10s
  timeout: 5s
  retries: 5
  start_period: 30s
```

### depends_on with service_healthy condition
```yaml
# Source: Docker Compose v3 spec — condition: service_healthy
depends_on:
  identity-service:
    condition: service_healthy
  catalog-service:
    condition: service_healthy
```

### Expected /q/health/ready response (UP state)
```json
{
  "status": "UP",
  "checks": [
    {
      "name": "Database connections health check",
      "status": "UP"
    }
  ]
}
```

### Expected /q/health/ready response (DOWN state)
```json
{
  "status": "DOWN",
  "checks": [
    {
      "name": "Database connections health check",
      "status": "DOWN",
      "data": {
        "default": "Unable to acquire JDBC Connection"
      }
    }
  ]
}
```

### Sales-service CORS headers after HOUSE-03 fix
```properties
# File: anotame-api/backend/sales-service/src/main/resources/application.properties
quarkus.http.cors.headers=accept, authorization, content-type, x-requested-with, x-user-name
```

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Docker + Docker Compose | Health check validation (`docker compose up --build`) | Assumed available (used in prior phases) | — | — |
| `wget` in `eclipse-temurin:21-jre-alpine` | Docker healthcheck CMD-SHELL | Available (busybox wget built into Alpine) | busybox | Use `curl` if apk-added, but not needed |
| Maven (via Docker build stage) | pom.xml dependency resolution | Available (maven:3.9.6-eclipse-temurin-21-alpine in Dockerfile build stage) | 3.9.6 | — |

**Missing dependencies with no fallback:** None.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None (no automated test suite in scope — TEST-01..04 are deferred requirements) |
| Config file | none |
| Quick run command | `docker compose up --build` then `curl http://localhost:808X/q/health/ready` per service |
| Full suite command | All 4 health endpoints return 200; `docker ps` shows all containers `healthy` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| OPS-01 | Docker Compose healthcheck entries present and functional | smoke | `docker compose up -d && sleep 45 && docker ps --format '{{.Names}} {{.Status}}' \| grep healthy` | N/A — runtime check |
| OPS-02 | `/q/health/ready` returns HTTP 200 on all 4 services | smoke | `curl -s -o /dev/null -w "%{http_code}" http://localhost:808X/q/health/ready` | N/A — runtime check |
| HOUSE-01 | No `NEXT_PUBLIC_*` in `.env.example` | file check | `grep -c "NEXT_PUBLIC_" .env.example` should return 0 | ✅ file exists |
| HOUSE-02 | `node_modules/` and `.next/` absent from web-legacy | file check | `ls anotame-web-legacy/node_modules 2>&1 \| grep "No such file"` | ✅ file system check |
| HOUSE-03 | `x-user-name` in sales-service CORS headers | file check | `grep "x-user-name" anotame-api/backend/sales-service/src/main/resources/application.properties` | ✅ file exists |

### Wave 0 Gaps
None — no test files need creation. Validation is via runtime smoke checks and file-content assertions, not automated test suites.

---

## Sources

### Primary (HIGH confidence)
- [Quarkus SmallRye Health guide](https://quarkus.io/guides/smallrye-health) — endpoint paths, Agroal auto-registration, configuration properties, JSON response format
- [Quarkus SmallRye Health extension page](https://quarkus.io/extensions/io.quarkus/quarkus-smallrye-health/) — artifact ID, BOM-managed versioning
- Project codebase inspection — confirmed: all 4 Dockerfiles use `eclipse-temurin:21-jre-alpine`, Quarkus BOM version 3.27.2, zero existing health extension in any pom.xml, sales-service CORS headers missing `x-user-name`, `.env.example` has 3 `NEXT_PUBLIC_*` lines, both `anotame-web-legacy/node_modules/` and `.next/` exist on disk and are untracked

### Secondary (MEDIUM confidence)
- Docker Compose healthcheck documentation (Docker official) — `condition: service_healthy`, `start_period` semantics, CMD-SHELL form
- [Docker health checks practical guide](https://www.tvaidyan.com/2025/02/13/health-checks-in-docker-compose-a-practical-guide/) — confirmed `start_period` and `retries` parameter guidance

### Tertiary (LOW confidence)
- Community examples for `wget --spider` in alpine health checks — consistent across multiple sources, verified against alpine busybox behavior

---

## Metadata

**Confidence breakdown:**
- Standard stack (SmallRye Health): HIGH — verified via official Quarkus docs
- Architecture (healthcheck patterns): HIGH — verified against codebase Dockerfiles confirming alpine base; confirmed wget availability
- Pitfalls: HIGH — pitfall 1 (wget exit codes) and pitfall 2 (start_period) verified from docs; pitfall 3 confirmed by pom.xml inspection
- Housekeeping findings: HIGH — confirmed via direct file inspection (git ls-files, cat .env.example, grep application.properties)

**Research date:** 2026-04-02
**Valid until:** 2026-05-02 (stable APIs — 30 day window appropriate)
