# Phase 0 Prerequisites and Evidence Sources

This runbook identifies where each Phase 0 input comes from. Repository facts
can be implemented immediately. Railway and business inputs must be recorded as
evidence before the corresponding exit gate is claimed.

| Prerequisite | Source of truth | Current state / action |
|---|---|---|
| Branch ownership | `docs/adr/0001-service-owned-databases-and-flyway.md` and Operations migration `V1__baseline.sql` | Operations owns `tce_employee_assignment`. ADR 0006 selects a private Operations API. |
| Active-branch rule | ADR 0006 and product owner | Phase 0 currently requires exactly one active, date-valid assignment for every staff user. Product approval is still required if administrators or multi-branch staff need different behavior. |
| Existing duplicate assignments | Production `Operations-DB`, table `tce_employee_assignment` | Run the read-only query below before adding a partial unique index. Railway SSH inspection is currently blocked because the account has no registered SSH key. |
| Internal service authentication | Railway variables on `anotame-identity-service` and `anotame-operations-service` | Staging has a shared generated `ANOTAME_INTERNAL_SERVICE_TOKEN`; production remains unset until its rollout. Do not reuse the JWT signing key or copy the staging token to production. |
| Operations base URL | Identity variable `ANOTAME_OPERATIONS_BASE_URL` | In Railway, set it to `http://${{anotame-operations-service.RAILWAY_PRIVATE_DOMAIN}}:8080` because Railway injects container port 8080. Local default remains `http://localhost:8084`; do not use the auto-generated bare public hostname as a REST-client URI. |
| Cost and subscription | Railway Workspace **Usage** page and monthly invoice | MCP provides resource metrics but not the workspace plan or invoice. Record subscription minimum, per-service usage, backups, and egress. |
| CPU, memory, disk, and network | Railway service Metrics and Railway MCP `service_metrics` | A 24-hour snapshot is in the consolidation plan. Retain at least one representative billing period before topology decisions. |
| HTTP counts, errors, and latency | Structured `http_access` lines in Railway deploy logs | Phase 0 enables method, path, status, and duration logging without query strings, headers, or cookies. Define normalization, retention, and the query method before claiming route-level p95/p99 evidence. |
| JVM heap and native memory | Running JVM command plus JVM metrics | Production currently uses Railpack, so repository Dockerfile heap flags are not authoritative. Inspect effective JVM flags before setting limits. |
| SLO and rollback thresholds | Product owner plus observed production baseline | No repository or Railway default can decide acceptable login, order, or cold-start latency. Record numeric thresholds and an approver. |
| Release rehearsal environment | Railway project environments | `staging` was created on 2026-07-12 from production configuration and restored from the four-database backup. Keep it isolated and anchor its local uploads to a review branch before team testing. |

## Staging environment

Created on 2026-07-12 in Railway project `anotame-production`:

- Environment: `staging` (`d80a136e-ae9d-4ea6-9ac1-7cc0ed42ff1d`), forked from production configuration.
- Source backup: `/Users/moonstone/Downloads/anotame-production-db-backup-20260711T015530Z`.
- Restored databases: `Identity-DB`, `Catalog-DB`, `Sales-DB`, and `Operations-DB`, using `pg_restore --clean --if-exists --no-owner --no-privileges` against staging-only connection URLs.
- Isolation: staging-specific JWT keypair, staging-only CORS origin, staging frontend API URLs, and a separate Identity/Operations internal token.
- Private branch lookup: Identity uses `http://${{anotame-operations-service.RAILWAY_PRIVATE_DOMAIN}}:8080` in Railway. Port 8084 remains the local-development default.
- Test fixture: the backup contained one establishment but no branches or assignments, so staging adds one `Staging Architecture Test` branch and one active assignment for each of the four restored users.

The Phase 0 backend is deployed to staging from the local workspace. These local
uploads are not yet anchored to a Git commit; a later source-triggered redeploy
can replace them with the repository branch version. Before team testing, commit
the Phase 0 changes to a review branch and connect staging deployments to that
branch.

Validation completed on 2026-07-12:

- All nine staging services reached Railway `SUCCESS` with one running replica each.
- The frontend and its Identity, Catalog, Sales, and Operations proxy health paths returned HTTP 200.
- Operations returned 200 for the shared internal credential and 401 for an invalid credential.
- Identity login resolved the seeded Operations assignment, returned 200, and its cookie authenticated `/auth/me`.
- The staging JWT validates with the staging public key and does not validate with the production public key.
- Sales accepted the valid staging token and rejected an otherwise valid re-signed token without `branch_id` with HTTP 400.
- Temporary password changes used by the smoke tests were restored immediately; no test credential was retained.
- All nine production services remained in Railway `SUCCESS` throughout the staging work.

## Duplicate active-assignment check

Run this read-only query against production Operations-DB before introducing a
unique constraint:

```sql
SELECT id_user, COUNT(*) AS active_assignment_count,
       ARRAY_AGG(id_branch ORDER BY id_branch) AS branch_ids
FROM tce_employee_assignment
WHERE is_active = true
  AND (start_date IS NULL OR start_date <= CURRENT_DATE)
  AND (end_date IS NULL OR end_date >= CURRENT_DATE)
GROUP BY id_user
HAVING COUNT(*) > 1;
```

The duplicate check was completed against the restored staging copy and found
no duplicate active users. Direct Railway SSH inspection of production still
reports no registered key. The available setup paths are `railway ssh keys add`
for a local public key or `railway ssh keys github` to import one. Registering a
key changes account access and should be completed by the account owner before
rerunning the check against production.

## Deployment order for the branch contract

1. Generate one internal token and set it on Operations and Identity without
   deploying Identity first.
2. Deploy Operations and verify the internal active-branch endpoint with users
   representing zero, one, and multiple active assignments.
3. Deploy Identity and verify login fails closed for zero/multiple assignments
   and upstream unavailability.
4. Deploy Sales after verifying order creation rejects a JWT without
   `branch_id`; the default branch fallback has been removed.
5. Retain the previous deployments until login and order-creation smoke tests
   pass in the release-gate environment.
