#!/usr/bin/env bash
set -euo pipefail

# ---------------------------------------------------------------------------
# Anotame Integration Health Check
# Checks all four Quarkus microservices via /q/health/ready
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

HEALTH_PATH="/q/health/ready"

# --- Header -----------------------------------------------------------------
echo "Anotame Integration Health Check"
if [[ "$LOCAL" == "true" ]]; then
  echo "Mode: local"
else
  echo "Mode: production"
fi
echo "Services: identity catalog sales operations"
echo ""

# --- Per-service check -------------------------------------------------------
TOTAL=${#SERVICES[@]}
PASS_COUNT=0
FAIL_COUNT=0

# Arrays to hold summary results
declare -a RESULT_NAMES
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
    URL="http://localhost:${PORT}${HEALTH_PATH}"
  else
    URL="${PROD_BASE}${HEALTH_PATH}"
  fi

  printf "[%d/%d] %-12s ... checking %s\n" "$IDX" "$TOTAL" "$NAME" "$URL"

  STATUS="FAIL"
  LAST_HTTP="000"
  ATTEMPT=0

  for ((attempt = 1; attempt <= RETRIES; attempt++)); do
    ATTEMPT=$attempt
    TMP_BODY="/tmp/health_body_${NAME}"

    # Capture HTTP status; do NOT let curl's exit code stop the script
    HTTP_CODE=$(curl -s -o "$TMP_BODY" -w "%{http_code}" --max-time "$TIMEOUT" "$URL" 2>/dev/null || true)
    LAST_HTTP="$HTTP_CODE"

    if [[ "$HTTP_CODE" == "200" ]]; then
      printf "  attempt %d/%d: HTTP %s - OK\n" "$attempt" "$RETRIES" "$HTTP_CODE"
      STATUS="PASS"
      break
    else
      if [[ $attempt -lt $RETRIES ]]; then
        printf "  attempt %d/%d: HTTP %s - retrying in %ds...\n" \
          "$attempt" "$RETRIES" "$HTTP_CODE" "$DELAY"
        sleep "$DELAY"
      else
        printf "  attempt %d/%d: HTTP %s - failed\n" "$attempt" "$RETRIES" "$HTTP_CODE"
      fi
    fi
  done

  RESULT_NAMES+=("$NAME")
  RESULT_STATUSES+=("$STATUS")
  RESULT_ATTEMPTS+=("$ATTEMPT")
  RESULT_LAST_HTTP+=("$LAST_HTTP")

  if [[ "$STATUS" == "PASS" ]]; then
    PASS_COUNT=$((PASS_COUNT + 1))
  else
    FAIL_COUNT=$((FAIL_COUNT + 1))
  fi
done

# --- Summary table -----------------------------------------------------------
echo ""
echo "--------------------------------------------------"
echo " SUMMARY"
echo "--------------------------------------------------"

for i in "${!RESULT_NAMES[@]}"; do
  SVC_NAME="${RESULT_NAMES[$i]}"
  SVC_STATUS="${RESULT_STATUSES[$i]}"
  SVC_ATTEMPTS="${RESULT_ATTEMPTS[$i]}"
  SVC_LAST_HTTP="${RESULT_LAST_HTTP[$i]}"

  if [[ "$SVC_ATTEMPTS" == "1" ]]; then
    ATTEMPT_LABEL="1 attempt"
  else
    ATTEMPT_LABEL="${SVC_ATTEMPTS} attempts"
  fi

  if [[ "$SVC_STATUS" == "PASS" ]]; then
    printf " %-12s PASS   (%s)\n" "$SVC_NAME" "$ATTEMPT_LABEL"
  else
    printf " %-12s FAIL   (%s, last HTTP: %s)\n" "$SVC_NAME" "$ATTEMPT_LABEL" "$SVC_LAST_HTTP"
  fi
done

echo "--------------------------------------------------"
printf " Result: %d/%d passed\n" "$PASS_COUNT" "$TOTAL"
echo "--------------------------------------------------"

# --- Exit code ---------------------------------------------------------------
if [[ $FAIL_COUNT -gt 0 ]]; then
  exit 1
fi
exit 0
