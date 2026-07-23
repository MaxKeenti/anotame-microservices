# Phase 0 Runtime and Request Baseline — 2026-07-22

This document records the controlled Railway staging run completed on
2026-07-22 America/Mexico_City (`2026-07-23` UTC), the preceding passive
production baseline, and the production telemetry rollout used to evaluate the
Phase 0 optimization gates.

It is evidence for
[HTTP Access Log Normalization and Validation Plan](./http-access-log-observability-plan.md).
It does not authorize a production resource change.

## Scope and isolation

- Railway project: `anotame-production`
  (`24284ef2-e5c6-41c8-a425-2b6e6d1f3f32`).
- Controlled traffic and branch-contract validation: `staging`
  (`d80a136e-ae9d-4ea6-9ac1-7cc0ed42ff1d`) only.
- The initial production baseline used passive metrics, deployment-state, and
  HTTP aggregate reads. The later production rollout changed only reviewed
  telemetry source and the Identity/Operations private integration variables;
  it made no production data, resource-limit, pool-size, or synthetic-traffic
  change.
- The four staging APIs exposed Quarkus JVM and Agroal metrics on the separate
  management port `9000`. Public `/q/metrics` returned `404` while public live
  health remained `200`.
- Test records were explicit staging fixtures. The Operations assignment was
  deleted before the Identity user, and both exact-key verification queries
  returned zero remaining rows.

## Telemetry deployment

The staging-only deployment added:

- the Quarkus Micrometer Prometheus registry to all four API services;
- JVM, system, and datasource metrics on the separate management interface;
- no HTTP-server metric labels, avoiding a second high-cardinality request
  telemetry stream; and
- one `runtime_limits` startup event containing safe JVM limits and runtime
  facts without credentials, tokens, headers, or customer data.

Successful staging deployment IDs:

| Service | Deployment |
|---|---|
| Identity | `80b005c2-d446-46d3-bc3e-1fb0f81ee839` |
| Catalog | `f56ffd6c-d1b2-4b0f-b332-a25f63f855b6` |
| Sales | `e9e5cd98-fc3a-42d3-87de-71930c803342` |
| Operations | `a2683347-4710-4b34-8af4-2d1a79c4ec3d` |

The complete Maven reactor passed with 19 tests before deployment.

## Controlled staging request sample

Each critical route received 1,000 measured requests at concurrency four.
All 6,000 valid requests returned the expected `200` response.

| Service and route | Success | p50 | p95 | p99 | Maximum |
|---|---:|---:|---:|---:|---:|
| Identity `POST /auth/login` | 1,000/1,000 | 154 ms | 172 ms | 194 ms | 309 ms |
| Identity `GET /auth/me` | 1,000/1,000 | 70 ms | 77 ms | 84 ms | 255 ms |
| Catalog `GET /catalog/garments` | 1,000/1,000 | 76 ms | 123 ms | 158 ms | 731 ms |
| Catalog `GET /catalog/services` | 1,000/1,000 | 187 ms | 254 ms | 321 ms | 898 ms |
| Sales `GET /orders/summary` | 1,000/1,000 | 86 ms | 94 ms | 111 ms | 305 ms |
| Operations `GET /schedule/config` | 1,000/1,000 | 71 ms | 80 ms | 90 ms | 830 ms |

The successful samples meet the initial guardrails:

- warm login p95 at or below 1.5 seconds;
- warm critical-read p95 at or below 1 second; and
- no unexpected 5xx.

An initial Sales probe used the obsolete plural path `/orders/summaries`.
Its 1,000 expected `404` responses are excluded from the valid sample above.
The current controller and frontend both use `/orders/summary`. The invalid
probe also generated enough warning logs to trigger one Railway log-rate notice;
it did not produce a 5xx, OOM, or failed deployment.

## Full staging scenario matrix

The Phase 0 closeout ran the repository-pinned staging harness on 2026-07-22
local (`2026-07-23` UTC). It created deterministic synthetic Identity,
Operations, and Sales fixtures, exercised 21 caller scenarios, correlated 25
service access events, and deleted every fixture by exact key.

| Service | Scenarios and observed status |
|---|---|
| Identity | login `200`; bad credentials `401`; current session `200`; no assignment `403`; multiple assignments `409`; Operations unavailable `503`; recovery login `200` |
| Catalog | price-list list `200`; detail `200`; malformed write `400`; missing detail `404` |
| Sales | order list `200`; valid write `200`; detail `200`; invalid write `400`; JWT without `branch_id` `400`; missing detail `404` |
| Operations | valid internal lookup `200`; invalid token `401`; no assignment `404`; multiple assignments `409` |

Identity login, no-assignment, multiple-assignment, and recovery calls propagated
the same canonical request ID into Operations. Parameterized events used
`/pricelists/{id}`, `/orders/{id}`, and
`/internal/employee-assignments/users/{userId}/active-branch`; fixture UUIDs and
query strings did not appear in route fields. No unexpected 5xx occurred.

For the upstream-unavailable case, the harness temporarily changed only the
staging Identity Operations URL, redeployed the existing reviewed image,
observed the expected `503`, restored the original URL, redeployed the same
image, and observed a recovery `200`. The final restored Identity deployment
was `4292d317-3089-4a8b-bac4-a4e55ce5b75c` at `SUCCESS`. Identity,
Operations, and Sales exact-key fixture checks all returned zero.

The deterministic Slice B aggregator passed five Bun tests and a bounded live
Railway JSON-export compatibility check. It retains only route-level aggregates;
raw request events, cookies, JWTs, database URLs, credentials, and customer
fields remain outside Git.

## Reviewed source and production telemetry rollout

Production was running `main` commit `12765490` when the rollout began. The
complete Phase 0 source was reconciled with that commit as
`c558410f` on `fix/optimization`. The full Maven reactor passed 27 tests, the
Bun aggregator passed five tests, and the frontend production build passed
before promotion.

A production data-readiness check found four active Identity users but zero
active Operations branches and zero active employee assignments. Enabling
strict branch resolution in Identity and removing Sales' temporary default
branch fallback would therefore block login and order creation. No production
Branch or assignment was invented without an approved business mapping.

The production-safe telemetry subset was cut from the current production
source as commit `22d26c55` on `fix/phase0-production-telemetry`. It adds the
shared normalized access filter, startup limits event, private management-port
metrics, and required image dependencies to Identity and Sales while preserving
their current branch behavior. Its complete Maven reactor passed 15 tests. The
exact subset was staged first:

| Service | Staging deployment | Verification |
|---|---|---|
| Identity | `88801bb0-5a9b-47c7-862b-fa0c2a14c442` | health `200`, public metrics `404`, private metrics `200`, startup event, correlated `/auth/me` `401` |
| Sales | `27dc9029-d085-4c34-beb2-f835b6535630` | health `200`, public metrics `404`, private metrics `200`, startup event, correlated `/orders` `401` |

The four production API deployments then reached `SUCCESS`:

| Service | Source scope | Production deployment |
|---|---|---|
| Operations | Full Phase 0 telemetry and private branch endpoint | `baf35a07-ff83-4f38-b343-81835db63a8a` |
| Catalog | Full Phase 0 telemetry | `6d16af27-6de0-4b40-89b8-53d0a9aa25c4` |
| Identity | Production-safe telemetry subset | `589a6248-d284-40c6-b442-84ee2427a4f5` |
| Sales | Production-safe telemetry subset | `c4f53474-a520-4cda-b217-6fcfb121b21a` |

Every production API returned live health `200`, kept public `/q/metrics` at
`404`, exposed JVM metrics only through its private management port, and
emitted one matching `runtime_limits` event. Read-only smoke probes produced
the expected normalized and correlated events: Operations returned `404` for
a valid-token lookup with no assignment and `401` for an invalid token;
Identity `/auth/me` and Sales `/orders` returned `401`. Catalog remained
healthy and private-metrics-only.

A production-specific internal token is configured on Identity and Operations,
and Identity's Operations base URL uses the private service domain on port
8080. The token value was generated independently from staging and was never
printed or stored in Git. These variables prepare the later branch-contract
cutover but do not activate it in the production-safe Identity build.

No production memory limit, CPU limit, JVM option, datasource pool size, sleep
setting, replica count, or database configuration was changed. In particular,
Catalog's pool-four and 512 MB experiments remain staging-only. After the
production rollout, staging Identity and Sales were restored to full
`c558410f` branch-contract source as deployments
`b0f549d4-749d-4681-b852-54a84aa00407` and
`0809d6ce-ba6a-4db6-8688-c02339218724`; both returned health `200`, public
metrics `404`, private metrics `200`, and a startup limits event.

## JVM, database-pool, and container evidence

The JVM peaks below came from private management-port scrapes during the
matching route samples. Container peaks use the controlled workload window and
exclude the Catalog deployment-overlap peak.

| Service | Container peak | Heap peak / max | Metaspace peak / max | Direct peak | Threads | Pool active peak | Pool awaiting peak | Blocking delta / acquisitions |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Identity | 317 MB | 40.6 / 247.5 MiB | 81.5 / 128 MiB | 1.52 MiB | 20 | 2 | 0 | 101 ms / 2,001 |
| Catalog | 308 MB | 60.1 / 247.5 MiB | 88.5 / 128 MiB | 1.95 MiB | 21 | 2 | **2** | **8,223 ms / 3,000** |
| Sales | 314 MB | 58.5 / 371.25 MiB | 89.9 / 160 MiB | 0.66 MiB | 19 | 1 | 0 | 220 ms / 1,000 |
| Operations | 234 MB | 35.1 / 247.5 MiB | 68.8 / 128 MiB | 0.49 MiB | 17 | 1 | 0 | 136 ms / 1,001 |

Derived average connection-blocking time was approximately 0.05 ms for
Identity, 2.74 ms for Catalog, 0.22 ms for Sales, and 0.14 ms for Operations.
Catalog is configured with a two-connection maximum, so concurrency four can
queue two callers. Its user-visible latency still passed, but the strict
no-connection-wait gate did not.

Railway's effective staging replica limits before the controlled limit
experiments were 24 GB for Identity and 8 GB for Catalog, Sales, and
Operations. Those broad ceilings are not useful proposed application limits.
To retain 25% headroom over the observed staging container peaks, a candidate
limit must be at least approximately:

| Service | Minimum from observed peak |
|---|---:|
| Identity | 423 MB |
| Catalog | 411 MB |
| Sales | 419 MB |
| Operations | 312 MB |

These are arithmetic floors, not recommended production settings. A proposed
limit must be tested as its own one-variable experiment and must also account
for production traffic and deployment overlap.

No staging API produced a `java.lang.OutOfMemoryError`, killed-process
signature, unexpected 5xx, or failed deployment. Sales stopped at
`03:19:20Z` and started at `03:22:33Z` because Railway application sleeping was
enabled; the deployment instance did not crash. Its database remained awake.

## Passive production baseline

The production observation window was 2026-07-09 through 2026-07-23 UTC.
Railway HTTP data was read in four-hour buckets because the CLI's combined
long-window percentile summary was not reliable. Status counts are bucket
sums; latency percentiles are interpreted only when the documented sample
threshold is met.

| Critical route | Requests | 2xx | 4xx | 5xx | Interpretation |
|---|---:|---:|---:|---:|---|
| Login | 33 | 32 | 1 | 0 | Below the 100-request p95 threshold |
| Current session | 83 | 78 | 5 | 0 | Below the 100-request p95 threshold |
| Catalog garments | 884 | 877 | 7 | 0 | p95 interpretable and within guardrail |
| Catalog services | 306 | 306 | 0 | 0 | p95 interpretable and within guardrail |
| Order summaries | 3,917 | 3,907 | 10 | 0 | p95 and p99 interpretable and within guardrail |
| Schedule configuration | 4 | 4 | 0 | 0 | Below the 100-request p95 threshold |

Low-volume routes remain under passive observation for up to 30 days. The
window contained no critical-route 5xx and no failed or crashed API deployment.

The comparable post-telemetry observation window begins after the final
production API deployment on 2026-07-23 UTC. It must cover at least 14 calendar
days, through 2026-08-06 UTC, and may extend through 2026-08-22 UTC for routes
that remain below 100 requests. No Phase 1 resource change should overlap this
window.

Production container memory over the same window:

| Service | Average | End of window | Maximum |
|---|---:|---:|---:|
| Identity | 237.55 MB | 232.44 MB | 502.52 MB |
| Catalog | 269.54 MB | 281.56 MB | 681.13 MB |
| Sales | 294.87 MB | 293.95 MB | 702.16 MB |
| Operations | 227.54 MB | 220.25 MB | 468.25 MB |
| Frontend | 113.80 MB | 117.99 MB | 206.15 MB |

The maximum series can include rollout overlap and startup, so it cannot be
treated as steady per-instance memory without grouping by deployment instance.

## Initial gate decision

Passed:

- all valid staging request counts and expected statuses;
- login and critical-read latency;
- public health and management-interface isolation;
- no unexpected staging 5xx, OOM, or failed deployment;
- safe staging-fixture cleanup; and
- production 5xx below 1% for all measured critical routes.

Open or failed at the end of the initial baseline:

- Catalog briefly queued two database callers, so the strict no-wait gate is
  open;
- no reduced memory limit has been tested, so the 25% candidate-limit gate is
  open; and
- three production routes remain below the p95 sample threshold.

After the production telemetry rollout, the repository implementation,
staging scenario/load matrix, deterministic aggregation, private runtime
telemetry, and production deployment checks are complete. The remaining Phase
0 exit gates require elapsed production observation or business input:

- collect the 14-day post-telemetry aggregate, extending low-volume routes up
  to 30 days where necessary;
- obtain product-owner approval for numeric SLO and rollback thresholds; and
- obtain an approved production Branch plus employee-to-Branch mappings before
  promoting strict Identity branch resolution and the Sales no-fallback
  behavior.

Until those gates close, Phase 1 production resource changes remain blocked.

## Follow-up experiment 1: Catalog pool maximum

The first follow-up experiment changed only the Catalog staging environment
override `QUARKUS_DATASOURCE_JDBC_MAX_SIZE` from absent, which uses the
source-controlled default of two, to four. Production and the other staging
services were unchanged. The verified local telemetry source was deployed as
Catalog deployment `390c12ce-73ed-4ce8-b6e2-54801def9283`.

The same two 1,000-request samples ran at concurrency four:

| Measurement | Pool 2 baseline | Pool 4 candidate | Change |
|---|---:|---:|---:|
| Garments p95 | 123 ms | 83 ms | -32.5% |
| Garments p99 | 158 ms | 102 ms | -35.4% |
| Services p95 | 254 ms | 380 ms | +49.6% |
| Services p99 | 321 ms | 431 ms | +34.3% |
| Pool awaiting peak | 2 | 0 | cleared |
| Scrapes with a waiter | not counted | 0 / 650 | none observed |
| Pool blocking delta | 8,223 ms | 652 ms | -92.1% |
| Acquisitions | 3,000 | 3,000 | equal |
| JVM heap peak | 60.1 MiB | 63.3 MiB | +3.2 MiB |
| Container peak | 308 MB | 354 MB | +14.9% |

All 2,000 candidate requests returned `200`; there was no 5xx, OOM signature,
or health failure. Public `/q/metrics` remained `404`. Pool four clears the
strict connection-wait gate and both route p95 values remain inside the
one-second read guardrail, but the services route latency and total container
memory regressed. Retain pool four in staging as the measured no-wait
configuration, but do not promote it to production until the mixed route
latency is confirmed against passive traffic.

At the new 354 MB observed peak, a 512 MB Catalog replica limit provides about
31% headroom and is above the 472 MB arithmetic floor for a 25% margin. The
next one-variable staging experiment changes only Catalog's Railway replica
memory limit from 8 GB to 512 MB while retaining the measured pool-four
configuration. Do not change heap, CPU, Serverless, or another service in the
same experiment.

## Follow-up experiment 2: Catalog 512 MB replica limit

The second follow-up retained the pool-four staging configuration and changed
only Catalog's Railway replica memory limit from 8 GB to 512 MB. Railway
reported the effective metric limit as `0.512 GB`. The verified telemetry source
ran as deployment `ae5b99eb-78f4-409e-b86b-c52b529a03a1`.

| Measurement | Pool 4 at 8 GB | Pool 4 at 512 MB |
|---|---:|---:|
| Garments success | 1,000/1,000 | 1,000/1,000 |
| Garments p95 / p99 / max | 83 / 102 / 828 ms | 80 / 93 / 681 ms |
| Services success | 1,000/1,000 | 1,000/1,000 |
| Services p95 / p99 / max | 380 / 431 / 1,118 ms | 374 / 446 / 902 ms |
| Pool awaiting peak | 0 | 0 |
| Scrapes with a waiter | 0 / 650 | 0 / 650 |
| Pool blocking delta | 652 ms | 562 ms |
| Acquisitions | 3,000 | 3,000 |
| JVM heap peak | 63.3 MiB | 65.3 MiB |
| JVM metaspace peak | 88.2 MiB | 87.6 MiB |
| Container peak | 354 MB | 358 MB |

The constrained run retained 30.1% container headroom at its 358 MB observed
peak. It produced no 5xx, OOM signature, restart, pool waiter, or health
failure; public `/q/metrics` remained `404`. Both disposable fixture rows were
deleted and exact-key verification returned zero.

The 512 MB Catalog limit passes the controlled staging safety gate and remains
configured in staging. It is a crash/spend guardrail, not a direct savings
mechanism: Railway bills the approximately 355–358 MB the process actually
uses, not the unused portion of the former 8 GB ceiling. Production remains
unchanged. Any promotion requires review of the mixed pool-four latency result
and a production-equivalent observation window; the next cost experiment must
target actual memory consumption as a separate variable.
