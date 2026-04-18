#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${REPO_ROOT}"

PID_FILE="/tmp/anotame-dev.pids"

DB_CONTAINERS=("identity-db" "catalog-db" "sales-db" "operations-db")

SERVICES=(
  "identity-service:8081"
  "catalog-service:8082"
  "sales-service:8083"
  "operations-service:8084"
)

LOG_DIR="/tmp"

# ---------------------------------------------------------------------------
# stop: kill all tracked background PIDs and stop Docker containers
# ---------------------------------------------------------------------------
stop() {
  echo ""
  echo "Stopping all Anotame dev processes..."

  if [[ -f "${PID_FILE}" ]]; then
    while IFS= read -r pid; do
      if [[ -n "${pid}" ]] && kill -0 "${pid}" 2>/dev/null; then
        echo "  Killing PID ${pid}"
        kill "${pid}" 2>/dev/null || true
      fi
    done < "${PID_FILE}"
    rm -f "${PID_FILE}"
  fi

  echo "Stopping Docker Compose services..."
  docker compose stop || true

  echo "Done."
}

# ---------------------------------------------------------------------------
# Subcommand: stop
# ---------------------------------------------------------------------------
if [[ "${1:-}" == "stop" ]]; then
  stop
  exit 0
fi

# ---------------------------------------------------------------------------
# Trap Ctrl+C / EXIT to run stop
# ---------------------------------------------------------------------------
trap 'stop; exit 0' INT TERM

# ---------------------------------------------------------------------------
# Step 1: Start Docker Compose DBs
# ---------------------------------------------------------------------------
echo "Starting Docker Compose DBs..."
docker compose up -d

# ---------------------------------------------------------------------------
# Step 2: Wait for all 4 DBs to be healthy
# ---------------------------------------------------------------------------
echo "Waiting for DB containers to become healthy (up to 60s)..."
TIMEOUT=60
INTERVAL=3
ELAPSED=0

wait_for_dbs() {
  while true; do
    ALL_HEALTHY=true
    for container in "${DB_CONTAINERS[@]}"; do
      STATUS=$(docker inspect --format='{{.State.Health.Status}}' "${container}" 2>/dev/null || echo "missing")
      if [[ "${STATUS}" != "healthy" ]]; then
        ALL_HEALTHY=false
        break
      fi
    done

    if [[ "${ALL_HEALTHY}" == "true" ]]; then
      echo "All DB containers are healthy."
      return 0
    fi

    if [[ "${ELAPSED}" -ge "${TIMEOUT}" ]]; then
      echo ""
      echo "ERROR: DB containers did not become healthy within ${TIMEOUT}s."
      for container in "${DB_CONTAINERS[@]}"; do
        STATUS=$(docker inspect --format='{{.State.Health.Status}}' "${container}" 2>/dev/null || echo "missing")
        echo "  ${container}: ${STATUS}"
      done
      docker compose stop || true
      exit 1
    fi

    echo "  Waiting... (${ELAPSED}/${TIMEOUT}s elapsed)"
    sleep "${INTERVAL}"
    ELAPSED=$((ELAPSED + INTERVAL))
  done
}

wait_for_dbs

# ---------------------------------------------------------------------------
# Step 3: Launch Quarkus services in background
# ---------------------------------------------------------------------------
echo ""
echo "Launching Quarkus services..."
> "${PID_FILE}"

BACKEND_DIR="${REPO_ROOT}/anotame-api/backend"

for entry in "${SERVICES[@]}"; do
  SERVICE_NAME="${entry%%:*}"
  PORT="${entry##*:}"
  LOG_FILE="${LOG_DIR}/anotame-${SERVICE_NAME}.log"

  echo "  Starting ${SERVICE_NAME} on port ${PORT} -> ${LOG_FILE}"
  (
    cd "${BACKEND_DIR}"
    ./mvnw quarkus:dev -pl "${SERVICE_NAME}" "-Dquarkus.http.port=${PORT}" \
      > "${LOG_FILE}" 2>&1
  ) &
  echo "$!" >> "${PID_FILE}"
done

# ---------------------------------------------------------------------------
# Step 4: Launch SvelteKit frontend in background
# ---------------------------------------------------------------------------
FRONTEND_LOG="${LOG_DIR}/anotame-frontend.log"
echo "  Starting SvelteKit frontend on port 5173 -> ${FRONTEND_LOG}"
(
  cd "${REPO_ROOT}/anotame-web"
  bun run dev > "${FRONTEND_LOG}" 2>&1
) &
echo "$!" >> "${PID_FILE}"

# ---------------------------------------------------------------------------
# Step 5: Print summary table
# ---------------------------------------------------------------------------
echo ""
echo "┌─────────────────────────────────────────────────────────────────────────┐"
echo "│                    Anotame Dev Environment                              │"
echo "├────────────────────────┬───────────────────────────┬────────────────────┤"
echo "│ Service                │ URL                       │ Log file           │"
echo "├────────────────────────┼───────────────────────────┼────────────────────┤"
printf "│ %-22s │ %-25s │ %-18s │\n" "identity-service"   "http://localhost:8081" "/tmp/anotame-identity-service.log"
printf "│ %-22s │ %-25s │ %-18s │\n" "catalog-service"    "http://localhost:8082" "/tmp/anotame-catalog-service.log"
printf "│ %-22s │ %-25s │ %-18s │\n" "sales-service"      "http://localhost:8083" "/tmp/anotame-sales-service.log"
printf "│ %-22s │ %-25s │ %-18s │\n" "operations-service" "http://localhost:8084" "/tmp/anotame-operations-service.log"
printf "│ %-22s │ %-25s │ %-18s │\n" "frontend (SvelteKit)" "http://localhost:5173" "/tmp/anotame-frontend.log"
echo "├────────────────────────┴───────────────────────────┴────────────────────┤"
echo "│ Press Ctrl+C to stop all services.                                      │"
echo "│ Or run: ./dev.sh stop                                                   │"
echo "└─────────────────────────────────────────────────────────────────────────┘"
echo ""

# ---------------------------------------------------------------------------
# Step 6: Tail all log files (combined output)
# ---------------------------------------------------------------------------
LOG_FILES=(
  "${LOG_DIR}/anotame-identity-service.log"
  "${LOG_DIR}/anotame-catalog-service.log"
  "${LOG_DIR}/anotame-sales-service.log"
  "${LOG_DIR}/anotame-operations-service.log"
  "${FRONTEND_LOG}"
)

# Give processes a moment to create their log files
sleep 1

# Ensure log files exist before tailing
for log in "${LOG_FILES[@]}"; do
  touch "${log}"
done

echo "=== Combined log output (Ctrl+C to stop) ==="
tail -f "${LOG_FILES[@]}"
