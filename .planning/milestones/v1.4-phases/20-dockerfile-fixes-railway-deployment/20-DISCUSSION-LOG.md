# Phase 20: Dockerfile Fixes + Railway Deployment - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-15
**Phase:** 20-dockerfile-fixes-railway-deployment
**Areas discussed:** anotame-db/ disposition, MAVEN_OPTS merge strategy, railway.toml completeness, Railway manual steps vs code

---

## anotame-db/ disposition

| Option | Description | Selected |
|--------|-------------|----------|
| Delete entirely | git rm -r anotame-db/ — clean break, git history preserves it | ✓ |
| Keep with deprecation README | Add README.md marking it deprecated | |
| Archive to a git tag | Tag current state before deletion | |

**User's choice:** Delete entirely
**Notes:** Same decision applied to `build_and_push.sh` — deleted entirely (DEPLOY-04/DEPLOY-05).

---

## MAVEN_OPTS merge strategy

### identity-service and catalog-service (no existing MAVEN_OPTS)

| Option | Description | Selected |
|--------|-------------|----------|
| Just -Xmx512m | Add ENV MAVEN_OPTS="-Xmx512m" only — DOCKER-02 requirement | ✓ |
| Add --add-opens too | Match sales/operations for consistency — defensive | |

**User's choice:** Just -Xmx512m

### sales-service and operations-service (existing --add-opens MAVEN_OPTS)

| Option | Description | Selected |
|--------|-------------|----------|
| Append to existing value | Preserve --add-opens flags, append -Xmx512m | ✓ |
| Replace with -Xmx512m only | Drop --add-opens, clean value | |
| Use separate ARG | Invalid Docker — second ENV overwrites first | |

**User's choice:** Append to existing value

---

## railway.toml completeness

### File location

| Option | Description | Selected |
|--------|-------------|----------|
| Each service subdirectory | anotame-api/backend/{service}/railway.toml | ✓ |
| Repo root per service | railway.identity.toml etc. at root level | |

**User's choice:** Each service subdirectory

### Content scope

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal: build + health check only | Dockerfile path, healthcheckPath, healthcheckTimeout | ✓ |
| Include restart policy | ON_FAILURE with maxRestarts | |
| Include start command override | Explicit startCommand in [deploy] | |

**User's choice:** Minimal

---

## Railway manual steps vs code

### Project state

| Option | Description | Selected |
|--------|-------------|----------|
| Existing Railway project | Switching deploy method from GHCR to native | |
| Fresh Railway project | Starting from scratch — full setup in plans | ✓ |

**User's choice:** Fresh Railway project

### Manual step handling

| Option | Description | Selected |
|--------|-------------|----------|
| Inline manual checklist in plan tasks | [MANUAL] tasks with autonomous: false | ✓ |
| Separate deployment runbook document | Code changes only in plans, runbook separate | |
| Reference Railway docs only | Lightweight, risks being skipped | |

**User's choice:** Inline manual checklist with autonomous: false

### JDBC URL composition

| Option | Description | Selected |
|--------|-------------|----------|
| Railway private network template vars | ${{identity-db.PGHOST}} etc. | ✓ |
| Full example values in plans | Sample values with template syntax shown | |

**User's choice:** Railway private network template vars (as specified in DEPLOY-03)

---

## Claude's Discretion

- Dockerfile layer ordering and caching strategy
- Exact railway.toml TOML key names (planner to verify against Railway docs)
- Plan wave ordering (Dockerfile fixes vs. railway.toml creation vs. file deletion)
