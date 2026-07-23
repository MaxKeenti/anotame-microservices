# HTTP Access Log Aggregation

`aggregate-http-access-logs.ts` converts bounded Railway JSON-log exports into
deterministic, identifier-free Phase 0 evidence.

Export one deployment or another bounded window, then attribute records to the
reviewed commit because Railway application-log exports do not include a Git
commit field:

```bash
railway logs \
  --project <project-id> \
  --environment <environment-id> \
  --service <service-id> \
  --since 1h \
  --filter '@event:http_access' \
  --json \
  | bun scripts/observability/aggregate-http-access-logs.ts \
      --commit <reviewed-commit> \
  > /tmp/http-access-aggregate.json
```

For an export containing several deployments, use a JSON object that maps each
deployment ID to its commit:

```json
{
  "deployment-a": "0123abcd",
  "deployment-b": "4567efgh"
}
```

```bash
bun scripts/observability/aggregate-http-access-logs.ts \
  --commit-map /tmp/deployment-commits.json \
  /tmp/railway-logs.jsonl
```

The CLI accepts Railway's JSON Lines output or a JSON array. It groups records
by environment, service, deployment, commit, method, and normalized route. Each
group includes request and status-class counts, separate 4xx/5xx rates,
nearest-rank p50/p95/p99 and maximum duration, and the observation bounds.

Non-`http_access` records are ignored. Malformed access records, query strings
in route values, unsafe commit labels, and unattributed commits fail closed.
Raw log exports and commit-map scratch files must stay outside Git.

Run the tests with:

```bash
bun test scripts/observability/aggregate-http-access-logs.test.ts
```

## Staging scenario matrix

`validate-phase0-staging.sh` runs the complete Phase 0 success, expected-failure,
branch-correlation, and upstream-unavailable matrix against the pinned Railway
staging environment. It creates only deterministic synthetic database fixtures,
uses a generated short-lived password, and deletes every fixture by exact key.
It also temporarily points staging Identity at an unreachable Operations URL,
redeploys the existing reviewed Identity image, verifies fail-closed `503`
behavior, restores the original value, redeploys the same image again, and
verifies recovery.

The script never prints database URLs, internal credentials, JWT keys, cookies,
tokens, request IDs, or response bodies. Raw logs are held in a private
temporary directory and deleted after the assertions finish.

```bash
./scripts/observability/validate-phase0-staging.sh
```

The project, environment, service IDs, public staging domains, and deterministic
fixture keys are intentionally pinned. Review the script if Railway resources
are recreated.
