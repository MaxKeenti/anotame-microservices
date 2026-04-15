# Phase 19: Application Configuration - Research

**Researched:** 2026-04-15
**Domain:** Quarkus 3.x configuration — environment variable mapping, profile syntax, datasource externalization
**Confidence:** HIGH

---

## Summary

Phase 19 makes all 4 Quarkus services fully configurable via environment variables. The changes are limited to `application.properties` in each service — no Java source changes are required. The work is mechanical and low-risk: 3 property lines change per service (12 edits total across 4 files), plus Phase 18's cleanup of `baseline-on-migrate` and `flyway.table` (those are DB phase, not this phase).

The key architectural insight: Quarkus environment variables have ordinal 300, which is HIGHER than application.properties (ordinal 250). This means `QUARKUS_DATASOURCE_JDBC_URL` set in the environment automatically wins over anything written in application.properties — no explicit `${...}` placeholder is required to pick it up at runtime. However, to provide a local-dev fallback without the env var being set, the `%dev` profile override in application.properties is the correct mechanism.

**Primary recommendation:** For each service, replace the hardcoded `quarkus.datasource.jdbc.url` line with a `%dev`-scoped fallback and rely on automatic env var mapping for production. Use `quarkus.http.port=${PORT:808x}` for port wiring. Credentials are already using the correct `${ENV_VAR:fallback}` pattern — keep them as-is for dev convenience.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CFG-01 | Each service reads its database URL from QUARKUS_DATASOURCE_JDBC_URL env var, with %dev profile fallback to localhost:543{1-4}/{service} | Quarkus env var mapping (ordinal 300) handles prod automatically; %dev.quarkus.datasource.jdbc.url provides local fallback |
| CFG-02 | Each service configures quarkus.http.port=${PORT:808x} so Railway's injected PORT env var is respected | Standard Quarkus property expression syntax; ${PORT:8081} resolves PORT env var with fallback |
| CFG-03 | Datasource credentials injected via QUARKUS_DATASOURCE_USERNAME and QUARKUS_DATASOURCE_PASSWORD, no hardcoded credentials | Existing pattern `${QUARKUS_DATASOURCE_USERNAME:admin}` already complies; only the URL needs the same treatment |
</phase_requirements>

---

## Project Constraints (from CLAUDE.md / AI_RULES.md)

- Backend: Java Quarkus Microservices (Hexagonal Architecture + DDD)
- All changes must be verifiable via `docker compose up --build`
- No framework-specific leakage into domain layer
- Respect existing module boundaries

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Quarkus BOM | 3.27.2 | All 4 services use this exact version [VERIFIED: pom.xml grep] | Single version across all services |
| quarkus-jdbc-postgresql | (from BOM) | JDBC datasource driver | Already present in all 4 pom.xml files |
| quarkus-flyway | (from BOM) | Schema migration | Already configured in all 4 services |

**No new dependencies are required for this phase.** Configuration changes only.

---

## Architecture Patterns

### Quarkus Environment Variable to Property Mapping

[VERIFIED: quarkus.io/guides/config-reference]

Quarkus automatically maps environment variables to config properties using these conversion rules:
- Convert to lowercase
- Replace `_` with `.`
- Example: `QUARKUS_DATASOURCE_JDBC_URL` maps to `quarkus.datasource.jdbc.url`
- Example: `QUARKUS_DATASOURCE_USERNAME` maps to `quarkus.datasource.username`
- Example: `QUARKUS_DATASOURCE_PASSWORD` maps to `quarkus.datasource.password`

This means setting `QUARKUS_DATASOURCE_JDBC_URL` in the environment at runtime **automatically overrides** any value written in application.properties — no `${...}` placeholder is needed in the file for the production path to work.

### Configuration Source Priority (ordinals)

[VERIFIED: quarkus.io/guides/config-reference]

```
400 - System properties (-Dkey=val)
300 - Environment variables                  ← QUARKUS_DATASOURCE_JDBC_URL wins here
295 - .env file
260 - config/application.properties (external)
250 - application.properties (classpath)     ← %dev.quarkus.datasource.jdbc.url lives here
100 - META-INF/microprofile-config.properties
```

**Consequence for this phase:**
- In Railway production: `QUARKUS_DATASOURCE_JDBC_URL` is set as an env var → ordinal 300 wins → no fallback needed in the file
- In local dev without env vars: `%dev.quarkus.datasource.jdbc.url` at ordinal 250 provides the fallback → developer sees localhost DB

### Profile Syntax in application.properties

[VERIFIED: quarkus.io/guides/config-reference]

```properties
# Base value (used in prod if env var not set — should not be reachable after this phase)
# quarkus.datasource.jdbc.url=jdbc:postgresql://...  ← REMOVE THIS LINE

# Dev profile fallback (only used when QUARKUS_DATASOURCE_JDBC_URL is absent)
%dev.quarkus.datasource.jdbc.url=jdbc:postgresql://localhost:5431/identity
```

Quarkus activates `%dev` automatically when running `quarkus:dev` or `mvn quarkus:dev`.
Quarkus activates `%test` automatically when running tests.
Quarkus activates `%prod` for production deployments.

A `%dev`-scoped property does NOT conflict with an env var — the env var at ordinal 300 always wins over any profile-scoped property at ordinal 250. This means: if a developer sets `QUARKUS_DATASOURCE_JDBC_URL` locally, it will override even the `%dev` fallback. That is the expected behavior.

### Property Expression Syntax

[VERIFIED: quarkus.io/guides/config-reference]

```properties
# Syntax: ${ENV_VAR_NAME:default_value}
# The default_value is used only when ENV_VAR_NAME is unset or empty.
quarkus.http.port=${PORT:8081}
quarkus.datasource.username=${QUARKUS_DATASOURCE_USERNAME:admin}
quarkus.datasource.password=${QUARKUS_DATASOURCE_PASSWORD:password}
```

This is the correct syntax for CFG-02 and CFG-03. The `%dev` profile approach for the JDBC URL (CFG-01) is different — it uses a profile-scoped key, not a default value expression, because the dev fallback is a completely different host/port/database string.

### Recommended Pattern Per Service

The final `application.properties` datasource block for each service:

**identity-service (port 8081, local DB port 5431):**
```properties
# Database Configuration
quarkus.datasource.db-kind=postgresql
# Production: QUARKUS_DATASOURCE_JDBC_URL env var is set by Railway (ordinal 300, wins automatically)
# Local dev fallback: used when no QUARKUS_DATASOURCE_JDBC_URL env var is present
%dev.quarkus.datasource.jdbc.url=jdbc:postgresql://localhost:5431/identity
quarkus.datasource.username=${QUARKUS_DATASOURCE_USERNAME:admin}
quarkus.datasource.password=${QUARKUS_DATASOURCE_PASSWORD:password}
```

**catalog-service (port 8082, local DB port 5432):**
```properties
quarkus.datasource.db-kind=postgresql
%dev.quarkus.datasource.jdbc.url=jdbc:postgresql://localhost:5432/catalog
quarkus.datasource.username=${QUARKUS_DATASOURCE_USERNAME:admin}
quarkus.datasource.password=${QUARKUS_DATASOURCE_PASSWORD:password}
```

**sales-service (port 8083, local DB port 5433):**
```properties
quarkus.datasource.db-kind=postgresql
%dev.quarkus.datasource.jdbc.url=jdbc:postgresql://localhost:5433/sales
quarkus.datasource.username=${QUARKUS_DATASOURCE_USERNAME:admin}
quarkus.datasource.password=${QUARKUS_DATASOURCE_PASSWORD:password}
```

**operations-service (port 8084, local DB port 5434):**
```properties
quarkus.datasource.db-kind=postgresql
%dev.quarkus.datasource.jdbc.url=jdbc:postgresql://localhost:5434/operations
quarkus.datasource.username=${QUARKUS_DATASOURCE_USERNAME:admin}
quarkus.datasource.password=${QUARKUS_DATASOURCE_PASSWORD:password}
```

**Port wiring (same for all 4 services, different fallback port):**
```properties
# identity-service
quarkus.http.port=${PORT:8081}

# catalog-service
quarkus.http.port=${PORT:8082}

# sales-service
quarkus.http.port=${PORT:8083}

# operations-service
quarkus.http.port=${PORT:8084}
```

> Note: The local dev DB port numbers (5431–5434) are established by Phase 21 (DEV-01). Phase 19 writes the `%dev` profiles assuming those ports; Phase 21 provisions the containers. The values must match. This is the documented dependency in STATE.md: "Phase 19 before Phase 21 (%dev profiles depend on per-service port assignments)."

---

## Current State Audit

### What Each application.properties Has Today

| Property | identity | catalog | sales | operations | Status |
|----------|----------|---------|-------|------------|--------|
| `quarkus.http.port` | `8081` (hardcoded) | `8082` (hardcoded) | `8083` (hardcoded) | `8084` (hardcoded) | MUST CHANGE (CFG-02) |
| `quarkus.datasource.jdbc.url` | `jdbc:postgresql://anotame-db:5432/anotame` | same | same | same | MUST CHANGE (CFG-01) |
| `quarkus.datasource.username` | `${QUARKUS_DATASOURCE_USERNAME:admin}` | same | same | same | COMPLIANT (CFG-03 met) |
| `quarkus.datasource.password` | `${QUARKUS_DATASOURCE_PASSWORD:password}` | same | same | same | COMPLIANT (CFG-03 met) |
| `quarkus.flyway.baseline-on-migrate` | `true` | `true` | `true` | `true` | Phase 18 removes these |
| `quarkus.flyway.table` | per-service name | per-service name | per-service name | per-service name | Phase 18 removes these |

### Exact Lines to Change Per Service

**identity-service:**
- Line 2: `quarkus.http.port=8081` → `quarkus.http.port=${PORT:8081}`
- Line 6: `quarkus.datasource.jdbc.url=jdbc:postgresql://anotame-db:5432/anotame` → remove line, add `%dev.quarkus.datasource.jdbc.url=jdbc:postgresql://localhost:5431/identity`

**catalog-service:**
- Line 2: `quarkus.http.port=8082` → `quarkus.http.port=${PORT:8082}`
- Line 7: `quarkus.datasource.jdbc.url=...` → remove, add `%dev.quarkus.datasource.jdbc.url=jdbc:postgresql://localhost:5432/catalog`

**sales-service:**
- Line 2: `quarkus.http.port=8083` → `quarkus.http.port=${PORT:8083}`
- Line 6: `quarkus.datasource.jdbc.url=...` → remove, add `%dev.quarkus.datasource.jdbc.url=jdbc:postgresql://localhost:5433/sales`

**operations-service:**
- Line 2: `quarkus.http.port=8084` → `quarkus.http.port=${PORT:8084}`
- Line 7: `quarkus.datasource.jdbc.url=...` → remove, add `%dev.quarkus.datasource.jdbc.url=jdbc:postgresql://localhost:5434/operations`

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Env var → property mapping | Custom @ConfigProperty injection or parsing code | Quarkus automatic MicroProfile env var mapping | Built into the framework; ordinal 300 applies automatically |
| Profile-specific config | Separate application-dev.properties files | `%dev.` prefix in single application.properties | Quarkus supports multi-profile single-file — cleaner |
| JDBC URL construction from parts | Application startup code that concatenates PGHOST+PGPORT+PGDATABASE | Single `QUARKUS_DATASOURCE_JDBC_URL` env var set in Railway | Railway sets the composed URL in DEPLOY-03 (Phase 20) |

**Key insight:** The CFG-01 requirement says "QUARKUS_DATASOURCE_JDBC_URL composed from Railway PGHOST/PGPORT/PGDATABASE parts" — this composition happens in Railway's service configuration UI (Phase 20), not in application.properties. application.properties simply trusts that the env var is set correctly by the deployment platform.

---

## Common Pitfalls

### Pitfall 1: Leaving a base (unprefixed) quarkus.datasource.jdbc.url in the file
**What goes wrong:** If both a hardcoded base `quarkus.datasource.jdbc.url` AND a `%dev.quarkus.datasource.jdbc.url` exist, running in dev mode uses the `%dev` value (correct), but running in prod WITHOUT the env var falls back to the hardcoded `anotame-db` URL which is wrong. The intent of this phase is that prod MUST fail visibly if `QUARKUS_DATASOURCE_JDBC_URL` is not set.
**Why it happens:** Leaving the old line as a "just in case" safety net.
**How to avoid:** Delete the hardcoded `quarkus.datasource.jdbc.url` line entirely. Only the `%dev.` scoped line remains.
**Warning signs:** App starts in prod without the env var set and connects to some unexpected host.

### Pitfall 2: Using `${QUARKUS_DATASOURCE_JDBC_URL:fallback}` expression syntax for the URL
**What goes wrong:** Technically works, but is semantically wrong for this use case. The fallback in expression syntax would need to be a full URL string, meaning you'd embed the dev URL as a default, which makes the "no fallback in prod" guarantee unclear.
**Why it happens:** Copying the pattern from username/password lines.
**How to avoid:** Use `%dev.quarkus.datasource.jdbc.url=...` for the dev fallback. This is profile-scoped, not expression-defaulted, and makes the environment boundary explicit.
**Warning signs:** The URL uses `${QUARKUS_DATASOURCE_JDBC_URL:jdbc:postgresql://...}` syntax.

### Pitfall 3: Wrong local dev port numbers in %dev fallbacks
**What goes wrong:** Phase 21 will provision containers on ports 5431–5434. If Phase 19 writes different port numbers (e.g., all using 5432), Phase 21's containers won't match and local dev will fail.
**Why it happens:** Port assignments are documented in REQUIREMENTS.md (DEV-01) but easy to copy-paste incorrectly.
**How to avoid:** Use the mapping: identity→5431, catalog→5432, sales→5433, operations→5434. Verify these match what Phase 21 will provision.
**Warning signs:** All 4 services have the same port number in their %dev fallback URL.

### Pitfall 4: Hardcoded port for quarkus.http.port
**What goes wrong:** Railway injects PORT env var per deployment. If the app ignores it and binds to 8081, Railway's health check router cannot find the service, causing health check failures and deployment rollbacks.
**Why it happens:** The current hardcoded `quarkus.http.port=8081` works locally but breaks Railway routing.
**How to avoid:** Change to `quarkus.http.port=${PORT:8081}`. Railway sets PORT; local dev uses the fallback.
**Warning signs:** Deployment succeeds but `/q/health/ready` returns 502 from the Railway reverse proxy.

### Pitfall 5: Forgetting the local dev DB names must match
**What goes wrong:** `%dev.quarkus.datasource.jdbc.url=jdbc:postgresql://localhost:5431/identity` — the database name segment (`/identity`) must match whatever Phase 21 configures as the PostgreSQL database name in the docker-compose container. If Phase 21 creates a container with `POSTGRES_DB=identity_db` but the URL says `/identity`, Flyway migration will fail with "database does not exist."
**Why it happens:** No validation until Phase 21 runs.
**How to avoid:** Use plain service names as DB names: `identity`, `catalog`, `sales`, `operations`. Document this choice clearly so Phase 21 uses the same names.

---

## Test Infrastructure Audit

**Finding:** No per-service Quarkus test directories exist. The only test file found is `/anotame-api/backend/src/test/java/com/anotame_api/backend/BackendApplicationTests.java` — this is a Spring Boot stub in the parent aggregator module, not a Quarkus test. It uses `@SpringBootTest` and is unrelated to Quarkus service testing. [VERIFIED: filesystem scan]

**Conclusion for CFG-01/02/03:** There are no `@QuarkusTest`-annotated tests, no `%test.quarkus.datasource.jdbc.url` overrides to update, and no `application-test.properties` files to audit. The test infrastructure gap does not block Phase 19, but does mean there is no automated test to verify the env var wiring works. The verification strategy must be manual startup smoke tests.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None (no Quarkus unit tests exist) |
| Config file | None |
| Quick run command | N/A — no automated tests for backend config |
| Full suite command | N/A |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CFG-01 | Service connects to DB via QUARKUS_DATASOURCE_JDBC_URL env var | smoke (manual) | Start service with env var set; check /q/health/ready | N/A — manual only |
| CFG-02 | Service binds to PORT env var value | smoke (manual) | Start service with PORT=9999; curl localhost:9999/q/health | N/A — manual only |
| CFG-03 | No hardcoded credentials in application.properties | static analysis | grep for hardcoded password strings | N/A — grep check |

### Sampling Rate
- **Per task commit:** grep check: `grep -r "password" */application.properties | grep -v '${' | grep -v '#'`
- **Per wave merge:** Start one service with test env vars; confirm /q/health/ready responds
- **Phase gate:** All 4 application.properties pass grep audit before `/gsd-verify-work`

### Wave 0 Gaps
None — this phase requires no new test infrastructure. Verification is property text audit + manual smoke test.

---

## Environment Availability

Step 2.6: This phase is code/config-only changes to application.properties files. No external tool dependencies beyond text editing. SKIPPED for tooling availability audit.

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Not changed in this phase |
| V3 Session Management | no | Not changed in this phase |
| V4 Access Control | no | Not changed in this phase |
| V5 Input Validation | no | Config file changes, no input parsing |
| V6 Cryptography | no | Not changed in this phase |
| V2.10 Secrets Management | yes | Remove hardcoded anotame-db credentials from plain text; rely on env vars injected by Railway |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Hardcoded DB URL in committed file | Information Disclosure | Replace with env var override (no fallback URL in prod path) |
| Hardcoded DB credentials in committed file | Credential Exposure | Already mitigated — credentials use `${ENV_VAR:dev-fallback}` pattern |
| Dev fallback credentials in application.properties | Information Disclosure (low risk) | Acceptable: dev fallbacks (`admin`/`password`) are for local development only; prod always uses injected env vars |

**Note on dev credential fallbacks (CFG-03):** The current `${QUARKUS_DATASOURCE_USERNAME:admin}` / `${QUARKUS_DATASOURCE_PASSWORD:password}` pattern is already compliant with CFG-03 — no hardcoded credentials appear as plain values; they are expressions with weak local-dev defaults. CFG-03 does not require removing the dev fallback, only ensuring prod does not use hardcoded values. Since env vars at ordinal 300 override the defaults, prod is safe.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Local dev DB port assignments are identity→5431, catalog→5432, sales→5433, operations→5434 | Architecture Patterns | %dev URL fallbacks would point to wrong ports; local dev would fail until Phase 21 corrects it |
| A2 | Local dev DB names should match service names (identity, catalog, sales, operations) without suffix | Architecture Patterns | Phase 21 container POSTGRES_DB value must match; if they diverge, Flyway migration will fail on first local dev boot |

**A1 and A2 are the only assumptions.** All other claims are verified against official Quarkus documentation or the actual codebase. The port assignments come from REQUIREMENTS.md DEV-01 ("ports 5431–5434") and the service ordering is inferred from service declaration order in the parent pom.xml. The planner should confirm the identity→5431 assignment mapping before locking it.

---

## Open Questions

1. **Local dev DB name: service name or `{service}_db`?**
   - What we know: REQUIREMENTS.md DEV-01 says "4 independent PostgreSQL containers on distinct ports (5431–5434)" but does not specify POSTGRES_DB values
   - What's unclear: Should the DB name be `identity` or `identity_db`? Phase 21 will define this, but Phase 19 must write a consistent value
   - Recommendation: Use plain service names (`identity`, `catalog`, `sales`, `operations`) — simpler, matches application name convention already in `quarkus.application.name`

2. **Should %test profile have an explicit localhost URL?**
   - What we know: No test files exist. Quarkus Dev Services would normally auto-start a Testcontainers PostgreSQL for `%test` profile if no explicit URL is set
   - What's unclear: Are Dev Services (Testcontainers) available/desired for this project?
   - Recommendation: Since no tests exist, leave `%test` profile with no explicit datasource override. If tests are added in future, address then.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hardcoded `anotame-db:5432/anotame` URL for all services | Per-service env var + %dev profile fallback | Phase 19 | Services become independently deployable on any platform |
| Single shared DB `anotame` database | Per-service databases (`identity`, `catalog`, `sales`, `operations`) | Phase 18 baseline work + Phase 21 infra | Each service owns its schema |
| Hardcoded `quarkus.http.port=808x` | `quarkus.http.port=${PORT:808x}` | Phase 19 | Railway health check routing works correctly |

---

## Sources

### Primary (HIGH confidence)
- `quarkus.io/guides/config-reference` — environment variable ordinal priority (300 vs 250), profile syntax, expression default value syntax [VERIFIED via WebFetch]
- `quarkus.io/guides/datasource` — QUARKUS_DATASOURCE_JDBC_URL mapping to quarkus.datasource.jdbc.url [VERIFIED via WebFetch]
- `anotame-api/backend/*/pom.xml` — Quarkus version 3.27.2 confirmed across all 4 services [VERIFIED: grep]
- `anotame-api/backend/*/src/main/resources/application.properties` — current state of all 4 files [VERIFIED: Read tool]

### Secondary (MEDIUM confidence)
- `quarkus.io/guides/config-reference` (profile precedence section) — env var (300) wins over %dev-scoped application.properties (250) even in dev mode [VERIFIED via WebFetch]

### Tertiary (LOW confidence)
None.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all 4 pom.xml files confirmed, Quarkus 3.27.2 uniform
- Architecture: HIGH — Quarkus config priority verified from official docs; patterns verified against actual application.properties content
- Pitfalls: HIGH — derived from verified config priority rules and current file audit

**Research date:** 2026-04-15
**Valid until:** 2026-07-15 (Quarkus config API is stable; property names unchanged since Quarkus 3.0)
