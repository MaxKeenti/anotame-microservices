---
phase: quick-260418-god
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - test_integration.sh
autonomous: true
requirements: []
must_haves:
  truths:
    - "Script exits non-zero if any service health check fails"
    - "Script retries failed checks with configurable attempts before giving up"
    - "Script supports --local flag to hit localhost ports instead of Railway URLs"
    - "Script validates HTTP 200 responses, not just TCP connectivity"
    - "Script prints a clear pass/fail summary table at the end"
    - "Script respects a per-attempt timeout so a hung service does not block indefinitely"
  artifacts:
    - path: "test_integration.sh"
      provides: "Robust integration health check for all four Quarkus microservices"
      contains: "retry loop, HTTP status validation, --local flag, summary table"
  key_links:
    - from: "test_integration.sh"
      to: "/q/health/ready"
      via: "curl HTTP 200 check"
      pattern: "curl.*q/health/ready"
---

<objective>
Rewrite test_integration.sh into a robust integration health-check script.

Purpose: The current 4-line script provides no retry logic, no HTTP-status validation, no local
mode, and no structured output. A failed deployment or flapping service is undetectable.

Output: A single executable shell script that checks all four Quarkus services (identity, catalog,
sales, operations) against either Railway production URLs or localhost ports, retries up to N times
with a sleep interval, validates HTTP 200 (not just TCP connectivity), and exits non-zero on any
failure with a clear summary.
</objective>

<execution_context>
@/Users/moonstone/Source/Personal/anotame-microservices/.claude/get-shit-done/workflows/execute-plan.md
@/Users/moonstone/Source/Personal/anotame-microservices/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@/Users/moonstone/Source/Personal/anotame-microservices/.planning/STATE.md
@/Users/moonstone/Source/Personal/anotame-microservices/docker-compose.yml

Current (broken) script — 4 lines, no retry, no status validation, production-only:
```bash
for svc in identity catalog sales operations; do
    echo "=== $svc ==="
    curl -sf --max-time 30 "https://anotame-${svc}-service-production.up.railway.app/q/health/ready"
  done
```

Services and their ports (from docker-compose.yml):
- identity-service  → localhost:8081  → https://anotame-identity-service-production.up.railway.app
- catalog-service   → localhost:8082  → https://anotame-catalog-service-production.up.railway.app
- sales-service     → localhost:8083  → https://anotame-sales-service-production.up.railway.app
- operations-service → localhost:8084 → https://anotame-operations-service-production.up.railway.app

Health endpoint on all Quarkus services: /q/health/ready
Expected: HTTP 200 with JSON body containing "status":"UP"
</context>

<tasks>

<task type="auto">
  <name>Task 1: Rewrite test_integration.sh with retry logic, HTTP validation, local mode, and summary</name>
  <files>test_integration.sh</files>
  <action>
Replace the entire content of test_integration.sh with a robust bash script. Requirements:

**Usage:**
```
./test_integration.sh [--local] [--retries N] [--delay S] [--timeout S]
```
- `--local`      Check localhost ports (8081-8084) instead of Railway URLs. Default: Railway URLs.
- `--retries N`  Number of attempts per service before marking as failed. Default: 5.
- `--delay S`    Seconds to wait between retries. Default: 6.
- `--timeout S`  Per-request curl timeout in seconds. Default: 10.

**Service map (hardcoded):**
```
identity:   local=8081  prod=https://anotame-identity-service-production.up.railway.app
catalog:    local=8082  prod=https://anotame-catalog-service-production.up.railway.app
sales:      local=8083  prod=https://anotame-sales-service-production.up.railway.app
operations: local=8084  prod=https://anotame-operations-service-production.up.railway.app
```
Health path: `/q/health/ready`

**Per-service check logic:**
1. Build URL: local mode → `http://localhost:PORT/q/health/ready`, prod → `RAILWAY_BASE/q/health/ready`
2. Attempt the check up to `--retries` times:
   - Use `curl -s -o /tmp/health_body_SVC -w "%{http_code}" --max-time TIMEOUT URL`
   - Capture HTTP status code in a variable
   - If HTTP 200: mark service PASS immediately, break retry loop
   - If not 200: print `  attempt N/N: HTTP STATUS - retrying in DELAY s...` (or "failed" on last attempt)
   - Sleep `--delay` seconds between attempts (skip sleep after last attempt)
3. After exhausting retries without a 200: mark service FAIL

**Output format:**

Print a header line at the start:
```
Anotame Integration Health Check
Mode: production | local
Services: identity catalog sales operations
```

During checks, print live progress per service:
```
[1/4] identity  ... checking https://...
  attempt 1/5: HTTP 200 - OK
[2/4] catalog   ... checking https://...
  attempt 1/5: HTTP 503 - retrying in 6s...
  attempt 2/5: HTTP 200 - OK
```

After all checks, print a summary table:
```
--------------------------------------------------
 SUMMARY
--------------------------------------------------
 identity    PASS   (1 attempt)
 catalog     PASS   (2 attempts)
 sales       FAIL   (5 attempts, last HTTP: 000)
 operations  PASS   (1 attempt)
--------------------------------------------------
 Result: 3/4 passed
--------------------------------------------------
```

**Exit code:** 0 if all services passed, 1 if any failed.

**Script header:** `#!/usr/bin/env bash` with `set -euo pipefail` EXCEPT inside the retry loop
where curl failures must be handled manually (use `|| true` on the curl call itself, check the
captured status code).

Make the script executable (chmod +x is not needed in the file content itself — the executor
should run `chmod +x test_integration.sh` as a final step).

Do NOT use colors/ANSI escape codes — keep output plain text for maximum CI/log compatibility.
  </action>
  <verify>
    <automated>
bash -n /Users/moonstone/Source/Personal/anotame-microservices/test_integration.sh && echo "Syntax OK"
# Also verify the --local flag is present:
grep -q "\-\-local" /Users/moonstone/Source/Personal/anotame-microservices/test_integration.sh && echo "--local flag found"
# Verify retry loop exists:
grep -q "retries" /Users/moonstone/Source/Personal/anotame-microservices/test_integration.sh && echo "retry logic found"
# Verify HTTP status capture:
grep -q "http_code" /Users/moonstone/Source/Personal/anotame-microservices/test_integration.sh && echo "HTTP status capture found"
    </automated>
  </verify>
  <done>
- test_integration.sh passes `bash -n` (no syntax errors)
- Script contains --local flag handling, retry loop, HTTP 200 validation, and summary table
- Script exits 0 when all services pass, 1 when any fail
- `chmod +x test_integration.sh` applied so script is directly executable
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| script → HTTP response | Curl responses from Railway or localhost are untrusted; script only reads HTTP status code |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-qgod-01 | Tampering | curl response body | accept | Body is written to /tmp and not executed; only HTTP status code drives pass/fail logic |
| T-qgod-02 | Denial of Service | --timeout flag | mitigate | Per-request timeout (default 10s) prevents a hung service from blocking the script indefinitely |
</threat_model>

<verification>
Run manually after execution:

1. Syntax check: `bash -n test_integration.sh` — must exit 0
2. Help/dry run (no network): `./test_integration.sh --help 2>&1 || true` — prints usage or runs
3. Local mode smoke test (services not running): `./test_integration.sh --local --retries 1 --delay 0`
   — must exit 1 and print FAIL for all services (connection refused = non-200)
4. Production smoke test: `./test_integration.sh --retries 2 --timeout 15`
   — must exit 0 and show PASS for all four Railway services
</verification>

<success_criteria>
- `bash -n test_integration.sh` exits 0 (no syntax errors)
- `./test_integration.sh --local --retries 1 --delay 0` exits 1 when no local services are running
- `./test_integration.sh` exits 0 against live Railway services with all four showing PASS
- Summary table printed at end of every run regardless of outcome
</success_criteria>

<output>
After completion, create `.planning/quick/260418-god-let-s-make-a-robust-test-integration-sh-/260418-god-SUMMARY.md`
</output>
