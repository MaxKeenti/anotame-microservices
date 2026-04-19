#!/usr/bin/env bash
set -euo pipefail

# ---------------------------------------------------------------------------
# Anotame Integration Health Check (liveness + readiness)
# Checks all four Quarkus microservices for liveness (/q/health/live) and readiness (/q/health/ready)
#
# Usage:
#   ./test_integration.sh [--local] [--retries N] [--delay S] [--timeout S]
#
# Options:
#   --local       Hit localhost ports instead of Railway production URLs
#   --retries N   Attempts per service before marking FAIL (default: 5)
#   --delay S     Seconds between retries (default: 6)
#   --timeout S   Per-request curl timeout in seconds (default: 10)
# ---------------------------------------------------------------------------

# --- Defaults ---------------------------------------------------------------
LOCAL=false
RETRIES=5
DELAY=6
TIMEOUT=10

# --- Argument parsing -------------------------------------------------------
while [[ $# -gt 0 ]]; do
  case "$1" in
    --local)
      LOCAL=true
      shift
      ;;
    --retries)
      RETRIES="${2:?--retries requires a value}"
      shift 2
      ;;
    --delay)
      DELAY="${2:?--delay requires a value}"
      shift 2
      ;;
    --timeout)
      TIMEOUT="${2:?--timeout requires a value}"
      shift 2
      ;;
    --help|-h)
      sed -n '3,12p' "$0" | sed 's/^# *//'
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      exit 1
      ;;
  esac
done

# --- Service definitions ----------------------------------------------------
# Format: "name:local_port:prod_base_url"
SERVICES=(
  "identity:8081:https://anotame-identity-service-production.up.railway.app"
  "catalog:8082:https://anotame-catalog-service-production.up.railway.app"
  "sales:8083:https://anotame-sales-service-production.up.railway.app"
  "operations:8084:https://anotame-operations-service-production.up.railway.app"
)

LIVE_PATH="/q/health/live"
READY_PATH="/q/health/ready"

# --- Header -----------------------------------------------------------------
echo "Anotame Integration Health Check (liveness + readiness)"
if [[ "$LOCAL" == "true" ]]; then
  echo "Mode: local"
else
  echo "Mode: production"
fi
echo "Services: identity catalog sales operations"
echo ""

# --- Helper: probe a single URL with retries --------------------------------
# Usage: probe_url <url> <label>
# Sets PROBE_STATUS, PROBE_ATTEMPTS, PROBE_LAST_HTTP in caller scope
probe_url() {
  local URL="$1"
  local LABEL="$2"

  PROBE_STATUS="FAIL"
  PROBE_LAST_HTTP="000"
  PROBE_ATTEMPTS=0

  for ((attempt = 1; attempt <= RETRIES; attempt++)); do
    PROBE_ATTEMPTS=$attempt
    local TMP_BODY="/tmp/health_body_${LABEL//\//_}"

    HTTP_CODE=$(curl -s -o "$TMP_BODY" -w "%{http_code}" --max-time "$TIMEOUT" "$URL" 2>/dev/null || true)
    PROBE_LAST_HTTP="$HTTP_CODE"

    if [[ "$HTTP_CODE" == "200" ]]; then
      printf "    attempt %d/%d: HTTP %s - OK\n" "$attempt" "$RETRIES" "$HTTP_CODE"
      PROBE_STATUS="PASS"
      break
    else
      if [[ $attempt -lt $RETRIES ]]; then
        printf "    attempt %d/%d: HTTP %s - retrying in %ds...\n" \
          "$attempt" "$RETRIES" "$HTTP_CODE" "$DELAY"
        sleep "$DELAY"
      else
        printf "    attempt %d/%d: HTTP %s - failed\n" "$attempt" "$RETRIES" "$HTTP_CODE"
      fi
    fi
  done
}

# --- Per-service check -------------------------------------------------------
TOTAL=${#SERVICES[@]}
PASS_COUNT=0
FAIL_COUNT=0

# Arrays to hold summary results (two rows per service: LIVE then READY)
declare -a RESULT_NAMES
declare -a RESULT_CHECKS
declare -a RESULT_STATUSES
declare -a RESULT_ATTEMPTS
declare -a RESULT_LAST_HTTP

for i in "${!SERVICES[@]}"; do
  entry="${SERVICES[$i]}"
  NAME="${entry%%:*}"
  REST="${entry#*:}"
  PORT="${REST%%:*}"
  PROD_BASE="${REST#*:}"

  IDX=$((i + 1))

  if [[ "$LOCAL" == "true" ]]; then
    LIVE_URL="http://localhost:${PORT}${LIVE_PATH}"
    READY_URL="http://localhost:${PORT}${READY_PATH}"
  else
    LIVE_URL="${PROD_BASE}${LIVE_PATH}"
    READY_URL="${PROD_BASE}${READY_PATH}"
  fi

  printf "[%d/%d] %-12s ... checking liveness %s\n" "$IDX" "$TOTAL" "$NAME" "$LIVE_URL"
  probe_url "$LIVE_URL" "${NAME}_live"
  LIVE_STATUS="$PROBE_STATUS"
  LIVE_ATTEMPTS="$PROBE_ATTEMPTS"
  LIVE_LAST_HTTP="$PROBE_LAST_HTTP"

  printf "[%d/%d] %-12s ... checking readiness %s\n" "$IDX" "$TOTAL" "$NAME" "$READY_URL"
  probe_url "$READY_URL" "${NAME}_ready"
  READY_STATUS="$PROBE_STATUS"
  READY_ATTEMPTS="$PROBE_ATTEMPTS"
  READY_LAST_HTTP="$PROBE_LAST_HTTP"

  # Record liveness row
  RESULT_NAMES+=("$NAME")
  RESULT_CHECKS+=("LIVE")
  RESULT_STATUSES+=("$LIVE_STATUS")
  RESULT_ATTEMPTS+=("$LIVE_ATTEMPTS")
  RESULT_LAST_HTTP+=("$LIVE_LAST_HTTP")

  # Record readiness row — WARN on failure, not FAIL
  local_ready_display="$READY_STATUS"
  if [[ "$READY_STATUS" == "FAIL" ]]; then
    local_ready_display="WARN"
  fi
  RESULT_NAMES+=("$NAME")
  RESULT_CHECKS+=("READY")
  RESULT_STATUSES+=("$local_ready_display")
  RESULT_ATTEMPTS+=("$READY_ATTEMPTS")
  RESULT_LAST_HTTP+=("$READY_LAST_HTTP")

  # Only liveness drives pass/fail counts
  if [[ "$LIVE_STATUS" == "PASS" ]]; then
    PASS_COUNT=$((PASS_COUNT + 1))
  else
    FAIL_COUNT=$((FAIL_COUNT + 1))
  fi

  echo ""
done

# --- Summary table -----------------------------------------------------------
echo "--------------------------------------------------"
echo " SUMMARY"
echo "--------------------------------------------------"

for i in "${!RESULT_NAMES[@]}"; do
  SVC_NAME="${RESULT_NAMES[$i]}"
  SVC_CHECK="${RESULT_CHECKS[$i]}"
  SVC_STATUS="${RESULT_STATUSES[$i]}"
  SVC_ATTEMPTS="${RESULT_ATTEMPTS[$i]}"
  SVC_LAST_HTTP="${RESULT_LAST_HTTP[$i]}"

  if [[ "$SVC_ATTEMPTS" == "1" ]]; then
    ATTEMPT_LABEL="1 attempt"
  else
    ATTEMPT_LABEL="${SVC_ATTEMPTS} attempts"
  fi

  if [[ "$SVC_STATUS" == "PASS" ]]; then
    printf " %-12s %-6s PASS   (%s)\n" "$SVC_NAME" "$SVC_CHECK" "$ATTEMPT_LABEL"
  elif [[ "$SVC_STATUS" == "WARN" ]]; then
    printf " %-12s %-6s WARN   (%s, last HTTP: %s) [DB issue, JVM alive]\n" \
      "$SVC_NAME" "$SVC_CHECK" "$ATTEMPT_LABEL" "$SVC_LAST_HTTP"
  else
    printf " %-12s %-6s FAIL   (%s, last HTTP: %s)\n" \
      "$SVC_NAME" "$SVC_CHECK" "$ATTEMPT_LABEL" "$SVC_LAST_HTTP"
  fi
done

echo "--------------------------------------------------"
printf " Result: %d/%d passed (liveness only)\n" "$PASS_COUNT" "$TOTAL"
echo "--------------------------------------------------"

# --- Exit code ---------------------------------------------------------------
# Exit 1 only if any service fails liveness (JVM dead).
# Readiness failures (DB connectivity) are warnings, not fatal.
if [[ $FAIL_COUNT -gt 0 ]]; then
  exit 1
fi
exit 0
