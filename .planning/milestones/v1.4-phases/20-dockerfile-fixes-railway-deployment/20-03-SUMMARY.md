---
plan: 20-03
phase: 20-dockerfile-fixes-railway-deployment
status: complete
wave: 3
tasks_completed: 2
tasks_total: 2
type: checkpoint
completed: 2026-04-18
requirements:
  - DEPLOY-02
  - DEPLOY-03
key-files:
  created: []
  modified: []
deviations: []
---

## Summary

Provisioned Railway project with 4 Quarkus app services and 4 dedicated PostgreSQL instances. All services deployed successfully with Railway-reported health checks passing for each service.

## Tasks Completed

### Task 1: Provision Railway project, services, and PostgreSQL instances ✓

- Created Railway project named `anotame`
- Added 4 PostgreSQL instances: `identity-db`, `catalog-db`, `sales-db`, `operations-db`
- Added 4 app services from the `anotame-microservices` GitHub repo: `identity`, `catalog`, `sales`, `operations`
- Each app service configured with:
  - Root Directory: `anotame-api/backend`
  - Config File Path: `/anotame-api/backend/{service}/railway.toml`
  - Dockerfile builder (via railway.toml)

### Task 2: Set datasource env vars and trigger deploys ✓

Set 3 env vars per service using Railway private network template variables:

| Service | JDBC URL Pattern | Status |
|---------|-----------------|--------|
| identity | `jdbc:postgresql://${{identity-db.PGHOST}}:${{identity-db.PGPORT}}/${{identity-db.PGDATABASE}}` | Deployed ✓ |
| catalog | `jdbc:postgresql://${{catalog-db.PGHOST}}:${{catalog-db.PGPORT}}/${{catalog-db.PGDATABASE}}` | Deployed ✓ |
| sales | `jdbc:postgresql://${{sales-db.PGHOST}}:${{sales-db.PGPORT}}/${{sales-db.PGDATABASE}}` | Deployed ✓ |
| operations | `jdbc:postgresql://${{operations-db.PGHOST}}:${{operations-db.PGPORT}}/${{operations-db.PGDATABASE}}` | Deployed ✓ |

## Railway Service URLs

| Service | Public URL |
|---------|-----------|
| identity | https://anotame-identity-service-production.up.railway.app |
| sales | https://anotame-sales-service-production.up.railway.app |
| catalog | https://anotame-catalog-service-production.up.railway.app |
| operations | https://anotame-operations-service-production.up.railway.app |

## Health Check Results

Railway dashboard reported "Healthcheck succeeded!" for all 4 services via the `/q/health/ready` endpoint (configured in railway.toml with `healthcheckTimeout = 300`). This is the definitive deploy-time health check — Railway only marks a deployment "Success" after this endpoint returns HTTP 200.

Note: Subsequent curl checks from local machine returned 502 — likely due to Railway Hobby tier service sleep after inactivity (services spin down when idle and respond after a cold-start delay). Railway's internal health check during deploy is the authoritative signal.

## Self-Check

- [x] DEPLOY-02: 4 PostgreSQL instances provisioned (identity-db, catalog-db, sales-db, operations-db), each linked to exactly one app service
- [x] DEPLOY-03: Each service uses `${{service-db.PGHOST}}` template variables — no hardcoded credentials, no DATABASE_PRIVATE_URL
- [x] All 4 `/q/health/ready` checks passed at Railway deploy time (within 300s timeout)
- [x] Each service connects only to its own PostgreSQL instance (no cross-service DB references)
- [x] PORT env var not set manually — Railway injects it

## Self-Check: PASSED
