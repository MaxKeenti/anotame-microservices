---
phase: 21-local-dev-docker-compose
reviewed: 2026-04-18T18:17:07Z
depth: standard
files_reviewed: 2
files_reviewed_list:
  - docker-compose.yml
  - README.md
findings:
  critical: 0
  warning: 3
  info: 2
  total: 5
status: issues_found
---

# Phase 21: Code Review Report

**Reviewed:** 2026-04-18T18:17:07Z
**Depth:** standard
**Files Reviewed:** 2
**Status:** issues_found

## Summary

Both files are well-structured and serve their stated purpose: `docker-compose.yml` provides 4 isolated PostgreSQL containers for local development, and `README.md` documents the workflow clearly. The compose file is clean and consistent across all 4 service definitions with proper healthchecks and named volumes.

Three warnings were found: hardcoded credentials across all containers (acceptable for local dev but worth noting the risk of misuse), an ambiguous instruction in the README's `.env` section, and a missing prerequisite in the README. Two info items cover the PgAdmin partial `depends_on` and the `restart: always` policy choice.

No critical issues were found.

## Warnings

### WR-01: Hardcoded credentials in docker-compose.yml

**File:** `docker-compose.yml:8, 26, 44, 62, 81-82`
**Issue:** All PostgreSQL containers use `POSTGRES_PASSWORD: password` and PgAdmin uses `PGADMIN_DEFAULT_PASSWORD: admin`. These are plaintext secrets committed to the repository. While this is a local-dev-only file, the same `docker-compose.yml` could be inadvertently used in a CI pipeline or staging environment without credential substitution, exposing databases with trivial passwords.
**Fix:** Introduce environment variable references with defaults for local dev, so that CI/staging can override them without code changes:

```yaml
environment:
  POSTGRES_USER: ${IDENTITY_DB_USER:-admin}
  POSTGRES_PASSWORD: ${IDENTITY_DB_PASSWORD:-password}
  POSTGRES_DB: identity
```

Apply the same pattern to all 4 database services and PgAdmin. Document the variables in `.env` (already committed for dev) and in the production env var list in `README.md`.

---

### WR-02: README `.env` copy instruction is self-referential

**File:** `README.md:102`
**Issue:** The instruction "Copy `.env` to a local `.env` file" tells the developer to copy a file onto itself, which is a no-op. If `.env` is already committed with dev values, the instruction should either be removed (with an explanation that dev values are pre-populated) or it should reference a `.env.example` template file. As written it will confuse new contributors.
**Fix:** Choose one of two approaches depending on intent:

- **If `.env` is committed with dev defaults** (current state): Replace the instruction with:
  > The `.env` file is pre-populated with local development values. No action is needed for local dev. For production, set the variables listed below as environment variables in your deployment platform.

- **If a `.env.example` template should exist**: Rename the committed file to `.env.example`, add `.env` to `.gitignore`, and update the instruction to:
  ```bash
  cp .env.example .env
  # Edit .env and populate JWT_SIGN_KEY and MP_JWT_VERIFY_PUBLICKEY
  ```

---

### WR-03: Missing Bun prerequisite in README

**File:** `README.md:19-23`
**Issue:** The Prerequisites section lists Docker Desktop, Java 21, and Maven, but the frontend setup steps (lines 70-73) use `bun install` and `bun run dev`. A developer following the README from scratch will hit a `command not found: bun` error without knowing they need to install Bun.
**Fix:** Add Bun to the prerequisites list:

```markdown
## Prerequisites

- Docker Desktop (for local database containers)
- Java 21
- Maven (or use the `./mvnw` wrapper in each service directory)
- [Bun](https://bun.sh) (for the SvelteKit frontend)
```

---

## Info

### IN-01: PgAdmin depends_on only identity-db

**File:** `docker-compose.yml:85-88`
**Issue:** The `anotame-pgadmin` service declares `depends_on: identity-db` with `condition: service_healthy`, but PgAdmin is expected to connect to all 4 databases. The other 3 databases (catalog-db, sales-db, operations-db) may still be initializing when PgAdmin starts. This does not cause PgAdmin to crash — it will simply fail to auto-connect to those databases until they are ready — but it can produce confusing "connection refused" errors in the PgAdmin UI on first launch.
**Fix:** Add all 4 databases as `depends_on` conditions to guarantee they are healthy before PgAdmin starts:

```yaml
depends_on:
  identity-db:
    condition: service_healthy
  catalog-db:
    condition: service_healthy
  sales-db:
    condition: service_healthy
  operations-db:
    condition: service_healthy
```

---

### IN-02: restart: always on all containers may obscure startup failures

**File:** `docker-compose.yml:5, 23, 41, 59, 79`
**Issue:** All 5 services use `restart: always`. In a local dev context, if a container fails during initialization (e.g., volume permission error, port already in use), Docker will restart it in a tight loop, making it harder to read the failure logs and diagnose the root cause.
**Fix:** Consider `restart: unless-stopped` for local dev, which restarts after host reboots (same as `always`) but does not restart a container that exits with a non-zero code — surfacing failures more clearly:

```yaml
restart: unless-stopped
```

This is a low-priority suggestion; `restart: always` is a defensible choice for dev databases.

---

_Reviewed: 2026-04-18T18:17:07Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
