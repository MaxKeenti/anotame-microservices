# Phase 0 Prerequisites and Evidence Sources

This runbook identifies where each Phase 0 input comes from. Repository facts
can be implemented immediately. Railway and business inputs must be recorded as
evidence before the corresponding exit gate is claimed.

| Prerequisite | Source of truth | Current state / action |
|---|---|---|
| Branch ownership | `docs/adr/0001-service-owned-databases-and-flyway.md`, ADR 0006, and Operations migration `V1__baseline.sql` | Operations owns `tce_employee_assignment`. Identity obtains branch context through a private Operations API. |
| Branch-context rule | ADR 0007 | Multiple Branches may be active, and a User may be assigned to more than one. Every authenticated staff session carries exactly one selected `branch_id`. The current single-Branch flow auto-selects the only assignment; branch selection is required before a second production Branch opens. |
| Multi-assigned users | Production `Operations-DB`, table `tce_employee_assignment` | The 2026-07-14 query found zero Users with multiple active, date-valid assignments. This is a readiness baseline, not evidence for a unique constraint on User. |
| Internal service authentication | Railway variables on `anotame-identity-service` and `anotame-operations-service` | Staging has a shared generated `ANOTAME_INTERNAL_SERVICE_TOKEN`; production remains unset until its rollout. Do not reuse the JWT signing key or copy the staging token to production. |
| Operations base URL | Identity variable `ANOTAME_OPERATIONS_BASE_URL` | Staging uses the private Operations service on port 8080. Production remains unset until the Phase 0 rollout. Local default remains `http://localhost:8084`; do not use the auto-generated bare public hostname as a REST-client URI. |
| Cost and subscription | Railway Workspace **Usage** page and monthly invoice | Closed for baseline purposes. The 2026-06-08 through 2026-07-08 invoice totals `$26.18` after the `$20.00` included-usage credit. The 2026-07-14 production dashboard shows `$3.68` current and `$21.23` estimated usage. See the cost evidence below. |
| CPU, memory, disk, and network | Railway service Metrics, Railway MCP `service_metrics`, and invoice | A completed billing period and the current production breakdown are recorded below. Preserve comparable before/after windows for each experiment. |
| HTTP counts, errors, and latency | Structured `http_access` lines in Railway deploy logs | Staging proves the log shape, but Railway MCP currently finds no production HTTP logs. Route normalization, production rollout, aggregation, and a representative observation window remain open; follow the detailed observability plan. |
| JVM and total process memory | Railway container metrics plus protected Quarkus JVM/datasource metrics | `-Xmx` covers only Java object memory, while Railway bills the whole process. Measure heap, metaspace, buffers, threads, total container memory, restarts, and connection waits in staging before lowering memory. |
| SLO and rollback thresholds | Initial engineering guardrails, product owner, and observed production baseline | The observability plan supplies starting thresholds. Confirm or revise user-facing targets after the telemetry-only production baseline. |
| Release rehearsal environment | Railway project environments | `staging` was created on 2026-07-12, restored from the backup, and connected to Git branch `staging`. Production remains connected to `main`. |

## Staging environment

Created on 2026-07-12 in Railway project `anotame-production`:

- Environment: `staging` (`d80a136e-ae9d-4ea6-9ac1-7cc0ed42ff1d`), forked from production configuration.
- Source backup: `/Users/moonstone/Downloads/anotame-production-db-backup-20260711T015530Z`.
- Restored databases: `Identity-DB`, `Catalog-DB`, `Sales-DB`, and `Operations-DB`, using `pg_restore --clean --if-exists --no-owner --no-privileges` against staging-only connection URLs.
- Isolation: staging-specific JWT keypair, staging-only CORS origin, staging frontend API URLs, and a separate Identity/Operations internal token.
- Private branch lookup: Identity uses `http://${{anotame-operations-service.RAILWAY_PRIVATE_DOMAIN}}:8080` in Railway. Port 8084 remains the local-development default.
- Test fixture: the backup contained one establishment but no branches or assignments, so staging adds one `Staging Architecture Test` branch and one active assignment for each of the four restored users.

All five staging application services follow Git branch `staging` and were
source-deployed successfully from commit
`1272408f41cdf8702e8b32fb8789febb41e25653`. The five production application
services follow `main` and run commit
`067fededa74085300c75776474c3f1288b9920f3`. Future pushes use the corresponding
environment branch trigger.

Validation completed on 2026-07-12:

- All nine staging services reached Railway `SUCCESS` with one running replica each.
- The frontend and its Identity, Catalog, Sales, and Operations proxy health paths returned HTTP 200.
- Operations returned 200 for the shared internal credential and 401 for an invalid credential.
- Identity login resolved the seeded Operations assignment, returned 200, and its cookie authenticated `/auth/me`.
- The staging JWT validates with the staging public key and does not validate with the production public key.
- Sales accepted the valid staging token and rejected an otherwise valid re-signed token without `branch_id` with HTTP 400.
- Temporary password changes used by the smoke tests were restored immediately; no test credential was retained.
- During branch-trigger setup, Railway briefly queued the staging commit for the shared production services. Environment-scoped branch patches immediately restored production to `main`; all nine production services finished `SUCCESS` on the main commit above.
- A Railway MCP recheck on 2026-07-14 found all nine services in both `production` and `staging` at `SUCCESS`.

## Multi-assignment readiness check

Use this read-only query to find Users who need branch selection because they
have more than one active, date-valid Employee Assignment:

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

The query was run against production `Operations-DB` on 2026-07-14 and returned
`(0 rows)`. No current User therefore needs the not-yet-built branch chooser.
Do not add a unique constraint on `id_user`: future multi-Branch staff are
allowed. The existing `UNIQUE (id_user, id_branch)` constraint already prevents
the same User from being assigned to the same Branch twice. Re-run this query
before the second production Branch opens and complete the ADR 0007 readiness
gate if it returns any rows.

## Cost evidence

The supplied Railway invoice covers 2026-06-08 through 2026-07-08:

- Invoice subtotal: `$46.18`; Pro plan line: `$20.00`; included-usage credit:
  `-$20.00`; amount due: `$26.18`.
- Visible usage lines include memory `$25.25`, Agent Usage `$0.48`, vCPU `$0.12`,
  network `$0.04`, and object storage `$0.00`. Memory is therefore the dominant
  recorded cost by a wide margin.
- The visible usage line amounts sum to `$25.89`, `$0.29` less than the invoice
  total. Treat the invoice total as authoritative and reconcile the missing
  line or rounding detail from the complete Railway ledger before accounting
  sign-off.

The production Usage page captured on 2026-07-14 reports:

| Category | Current | Estimated |
|---|---:|---:|
| Memory | `$3.54` | `$20.88` |
| CPU | `$0.03` | `$0.19` |
| Network egress | `$0.01` | `$0.04` |
| Volume | `$0.10` | `$0.12` |
| Backup | `$0.00` | `$0.00` |
| **Total** | **`$3.68`** | **`$21.23`** |

The current per-service rows total approximately `$2.7405` for the four APIs,
`$0.6217` for the four databases, `$0.2814` for the frontend, and `$0.0193` for
deleted-service volumes. Dashboard rounding explains the small difference from
the displayed `$3.68` total. This makes API memory the first Phase 1 target and
puts a low near-term ceiling on savings from merging databases.

If the `$21.23` estimate closes unchanged and no additional billable lines
accrue, only about `$1.23` sits above the Pro plan's `$20.00` included-usage
floor. Reductions below that floor create capacity headroom but do not reduce
the invoice below the plan minimum.

## Railway project boundary

Keep `production` and `staging` as isolated environments in the existing
`anotame-production` project for Phases 0 and 1. Railway private networks are
isolated by both project and environment, so splitting the APIs into separate
projects would remove private service discovery and force a public or otherwise
external integration path. The current environment split already prevents
staging from reaching production over private DNS.

A third Railway project is also unnecessary just to gather telemetry. Start by
querying each service through the environment Log Explorer/CLI. If longer
retention or traces become necessary, send telemetry to a managed external OTLP
endpoint, or run one collector per environment in the same project. Do not
create a cross-project collector that depends on Railway private networking.
See [How Private Networking Works](https://docs.railway.com/networking/private-networking/how-it-works)
and [Connect a Third-Party Observability Tool](https://docs.railway.com/guides/third-party-observability).

## HTTP measurement plan

The full event contract, implementation slices, staging scenarios, explanation
of JVM/total memory, production baseline, and staging-first promotion policy are
in [HTTP Access Log Normalization and Validation Plan](./http-access-log-observability-plan.md).

1. Before production rollout, replace the raw request path with a normalized
   route template such as `/orders/{id}` and add service, environment,
   deployment, and request/correlation identifiers. Keep query strings,
   headers, cookies, customer identifiers, and tokens out of logs.
2. In staging, exercise login, session validation, branch resolution, and the
   critical order flows. Confirm every API emits parseable `http_access` events
   for success, validation failure, authentication failure, and server failure;
   continue excluding health probes. Current smoke evidence contains four
   Identity events and two Sales events, but does not cover all routes.
3. Roll Phase 0 into production in the documented dependency order. Railway's
   built-in HTTP-log helpers currently return no production samples, so collect
   the application `http_access` deployment logs per service with bounded CLI
   or MCP queries.
4. Add a Bun aggregation script that groups by environment, service, deployment,
   commit, method, normalized route, and status class, then emits request count,
   4xx rate, 5xx rate, p50, p95, p99, and maximum duration. Store aggregates,
   not raw production request logs, with the experiment evidence.
5. Capture at least 14 calendar days spanning the normal weekly traffic cycle.
   Require at least 100 samples before interpreting a route p95 and 1,000 before
   interpreting p99; extend the window up to 30 days for low-volume routes.
6. Have the product owner approve numeric SLO and rollback thresholds. Compare
   the same routes and equivalent traffic windows before and after exactly one
   Phase 1 change.

## Deployment order for the branch contract

Run this complete sequence in staging first. Promote the same reviewed source
changes to production only after the staging smoke and measurement gates pass;
use production-specific credentials and repeat the production smoke checks.

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
