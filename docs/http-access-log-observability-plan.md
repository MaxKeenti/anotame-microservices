# HTTP Access Log Normalization and Validation Plan

This plan turns the Phase 0 access events into evidence that can safely compare
staging and production before and after a runtime change.

## Why the current event is insufficient

All four Quarkus APIs currently use this access-log shape:

```json
{"event":"http_access","method":"GET","path":"/orders/2f8...","status":200,"duration_ms":83}
```

It proves that request timing is available, but it has four limitations:

1. `path` is the literal request path. IDs create one group per Order, Customer,
   or User and may put business identifiers in logs.
2. The JSON is embedded in the Quarkus console message rather than guaranteed
   to be top-level structured fields in Railway.
3. The event does not identify the service, environment, deployment, or request
   correlation ID.
4. Railway's public HTTP-log helpers do not see private service-to-service
   requests, so application events must remain the source for backend route
   measurements.

Health checks stay excluded. Query strings, request/response bodies, headers,
cookies, JWTs, internal tokens, User IDs, Branch IDs, and customer data must
never be included.

## Target event contract

One completed backend request emits one event with this logical shape:

```json
{
  "event": "http_access",
  "service": "anotame-sales-service",
  "environment": "staging",
  "deployment_id": "railway-deployment-id",
  "request_id": "server-generated-uuid",
  "method": "GET",
  "route": "/orders/{orderId}",
  "status": 200,
  "duration_ms": 83
}
```

- `route` is the matched JAX-RS route template, never the literal path. An
  unmatched route uses a fixed value such as `_unmatched`.
- Railway-provided variables populate `service`, `environment`, and
  `deployment_id`, with safe `local` defaults outside Railway.
- The first Anotame service receiving a request generates a bounded UUID request
  ID, returns it in `X-Request-ID`, and propagates it to downstream Anotame
  services. Arbitrary unvalidated client values are not accepted.
- Status classes and percentiles are derived by aggregation rather than added
  as redundant event fields.
- Counts remain per service. A frontend request that reaches Sales and then
  Operations is expected to produce separate events and must not be presented
  as one global request count.

## Implementation slices

### Slice A: normalized events

1. Replace the built-in raw-path access pattern with a request/response filter
   that obtains the matched class and method `@Path` templates.
2. Add and propagate the request ID using request context/MDC.
3. Emit actual structured JSON so Railway can filter numeric and string fields,
   not only search a JSON substring inside a console message.
4. Apply the same field contract to Identity, Catalog, Sales, and Operations.
   Keep a shared contract test to prevent drift; do not introduce a new runtime
   service merely for logging.
5. Preserve the current health-path exclusion and add explicit tests proving
   secrets and identifiers are absent.

### Slice B: aggregation

Add a repository Bun script that accepts bounded Railway JSON-log exports and
groups by:

```text
environment + service + deployment + commit + method + normalized route
```

For each group it produces:

- request count;
- 2xx, 3xx, 4xx, and 5xx counts;
- 4xx and 5xx rates reported separately;
- p50, p95, p99, and maximum duration;
- the observation start/end timestamps and sample size.

Expected authentication and validation failures remain visible as 4xx; they are
not mixed with 5xx application failures. Raw production logs remain outside Git.
Only aggregate, identifier-free experiment evidence may be retained in the
repository.

## Validation stages

### Local contract validation

- Two different concrete IDs resolve to one route template.
- Query strings never change the route group and never appear in the event.
- Exactly one access event is emitted for each completed request.
- 2xx, 4xx, 5xx, and unmatched routes retain the expected status and fixed
  route name.
- A generated request ID is returned and propagated to a mocked downstream
  service.
- A malicious or oversized incoming request ID is replaced.
- Authorization, cookies, bodies, tokens, User IDs, Branch IDs, and customer
  fields are absent from serialized events.

### Staging validation

Deploy the instrumentation through the `staging` branch and exercise at least:

| Service | Required scenarios |
|---|---|
| Identity | successful login, bad credentials, `/auth/me`, and Operations unavailable |
| Catalog | list, detail, validation failure, and missing resource |
| Sales | order list/detail, valid write, invalid write, missing `branch_id`, and missing resource |
| Operations | valid internal branch lookup, invalid internal token, no assignment, and multiple assignments |

For test records, use explicit staging fixtures and clean them up after the run.
Then send a repeatable low-concurrency sample through every critical route:

- at least 100 measured requests for an initial p95;
- at least 1,000 before interpreting p99;
- a separate first-request-after-sleep sample when Serverless is evaluated.

The staging gate passes only when:

- sent request counts equal aggregated counts for each service and route;
- every expected status is observed and no unexpected 5xx occurs;
- different IDs aggregate under the same route template;
- no excluded identifier or secret appears;
- cross-service request IDs match;
- the aggregation output is deterministic for the same input; and
- all services remain healthy with no OOM or unexpected restart.

## What the JVM and native-memory gate means

Railway bills the whole running process/container, not only Java's object heap.
`-Xmx256m` caps one part of memory; the JVM also uses metaspace for loaded
classes, thread stacks, code cache, direct buffers, garbage-collector state,
and native libraries. That is why a service can use more RAM than its `-Xmx`.

For each staging API, capture:

- Railway container memory: idle average, test maximum, and post-test recovery;
- JVM heap: used, committed, and maximum;
- metaspace and direct-buffer usage;
- live thread count;
- database-pool active/max connections and wait count/time; and
- OOM events, container restarts, and JVM uptime.

Add JVM and datasource metrics through Quarkus management telemetry protected
by private networking or the internal service credential. Also emit one startup
event with effective heap/metaspace limits so SSH or `jcmd` is not required for
the basic check. Precise Native Memory Tracking can remain a staging-only deeper
diagnostic if the container total cannot be explained by the normal metrics.

This gate means: do not lower memory merely because the Dockerfile says
`-Xmx256m`. First prove under staging traffic that the service keeps at least
25% memory headroom, has no OOM/restart, and does not make requests wait for a
database connection.

## What a representative production baseline means

Staging proves safety with controlled traffic; it cannot show how real staff use
the application. A representative baseline is a passive observation of normal
production traffic after the telemetry-only Phase 0 release and before a Phase
1 resource change.

Capture at least 14 calendar days so weekdays and weekends are included. Extend
up to 30 days when a critical route has fewer than 100 requests. The baseline
records route volume, 4xx/5xx rates, latency percentiles, memory, restarts, and
database waits. It contains no customer payloads or identifiers.

Initial engineering guardrails, subject to revision after the baseline, are:

- no unexpected 5xx in the staging critical-flow suite;
- production 5xx rate below 1%;
- no OOM or unexplained restart;
- no sustained database-connection wait;
- warm login p95 at or below 1.5 seconds;
- warm critical read p95 at or below 1 second; and
- at least 25% memory headroom at observed peak.

These are rollout safety defaults, not a claim that current production already
meets them. The product owner may tighten or relax user-facing latency targets
after seeing the baseline.

## Staging-first promotion policy

Every phase and every one-variable Phase 1 experiment follows the same path:

1. Implement and review the source change.
2. Deploy it from Git branch `staging` to the isolated Railway staging
   environment.
3. Run automated tests, database/fixture checks, critical-flow smoke tests, and
   the phase-specific measurement gate.
4. Correct failures in staging; do not patch production independently.
5. Promote the reviewed source change to `main` only after staging passes.
6. Wait for every affected production deployment to reach `SUCCESS`, run a
   production smoke test, and observe the defined rollback window.
7. Roll back the production deployment if an approved error, latency, memory,
   restart, or database-wait threshold is crossed.

For Phase 1 specifically, promote telemetry first without changing resource
behavior, collect the production baseline, then repeat the staging-to-production
path for one change at a time. A successful staging experiment authorizes a
controlled production trial; it does not eliminate post-deployment observation.
