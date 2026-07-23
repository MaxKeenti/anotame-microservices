#!/usr/bin/env bash

set -Eeuo pipefail

readonly PROJECT="24284ef2-e5c6-41c8-a425-2b6e6d1f3f32"
readonly ENVIRONMENT="staging"
readonly IDENTITY_SERVICE="b829c889-0efa-4da8-9664-a970b897ae34"
readonly CATALOG_SERVICE="6cc99630-15c3-43aa-ac85-28fc6cc8fb17"
readonly SALES_SERVICE="7b00831d-dc56-4ea7-88bd-4ae19d1f299a"
readonly OPERATIONS_SERVICE="4761dab7-e106-48d2-a8bf-218fc492bc8f"
readonly IDENTITY_DB="fdbdfcb7-8f3d-4fa1-9326-b094ce69a096"
readonly CATALOG_DB="164ab437-084a-4237-ba6e-4cff19cd7508"
readonly SALES_DB="17b608da-9b13-42ea-8c5a-79ef9be64bc0"
readonly OPERATIONS_DB="6b51c8f2-2cdd-4fc7-a138-7f4b0380dd80"

readonly IDENTITY_URL="https://anotame-identity-service-staging.up.railway.app"
readonly CATALOG_URL="https://anotame-catalog-service-staging.up.railway.app"
readonly SALES_URL="https://anotame-sales-service-staging.up.railway.app"
readonly OPERATIONS_URL="https://anotame-operations-service-staging.up.railway.app"

readonly USER_ONE="72000000-0000-4000-8000-000000000001"
readonly USER_ZERO="72000000-0000-4000-8000-000000000002"
readonly USER_MULTI="72000000-0000-4000-8000-000000000003"
readonly BRANCH_B="72000000-0000-4000-8000-000000000101"
readonly ASSIGN_ONE="72000000-0000-4000-8000-000000000201"
readonly ASSIGN_MULTI_A="72000000-0000-4000-8000-000000000202"
readonly ASSIGN_MULTI_B="72000000-0000-4000-8000-000000000203"
readonly MISSING_ID="72000000-0000-4000-8000-000000000999"
readonly FIXTURE_PHONE="+520000007220"

export RAILWAY_CALLER="skill:use-railway@1.3.6"
export RAILWAY_AGENT_SESSION="railway-skill-1753224000-phase0-closeout"

for command in railway jq psql curl openssl htpasswd bun uuidgen; do
  command -v "$command" >/dev/null || {
    echo "Missing required command: $command" >&2
    exit 1
  }
done

run_dir="$(mktemp -d "${TMPDIR:-/tmp}/anotame-phase0.XXXXXX")"
identity_db_url=""
catalog_db_url=""
sales_db_url=""
operations_db_url=""
original_operations_url=""
identity_config_dirty=false
fixtures_created=false
cleanup_complete=false
identity_deployments=()

safe_remove_run_dir() {
  case "$run_dir" in
    "${TMPDIR:-/tmp}"/anotame-phase0.*)
      find "$run_dir" -type f -delete 2>/dev/null || true
      rmdir "$run_dir" 2>/dev/null || true
      ;;
    *)
      echo "Refusing to clean unexpected temporary path" >&2
      return 1
      ;;
  esac
}

latest_identity_deployment() {
  railway deployment list \
    --project "$PROJECT" \
    --environment "$ENVIRONMENT" \
    --service "$IDENTITY_SERVICE" \
    --limit 1 \
    --json |
    jq -er '.[0].id'
}

redeploy_identity() {
  local before
  local after
  local status
  before="$(latest_identity_deployment)"
  railway redeploy \
    --project "$PROJECT" \
    --environment "$ENVIRONMENT" \
    --service "$IDENTITY_SERVICE" \
    --yes \
    --json >/dev/null

  for _ in $(seq 1 60); do
    after="$(latest_identity_deployment)"
    if [[ "$after" == "$before" ]]; then
      sleep 5
      continue
    fi

    status="$(
      railway deployment list \
        --project "$PROJECT" \
        --environment "$ENVIRONMENT" \
        --service "$IDENTITY_SERVICE" \
        --limit 10 \
        --json |
        jq -r --arg id "$after" '.[] | select(.id==$id) | .status'
    )"
    case "$status" in
      SUCCESS)
        identity_deployments+=("$after")
        return
        ;;
      FAILED|CRASHED|NEEDS_APPROVAL|SKIPPED|REMOVED|REMOVING)
        echo "Identity deployment $after reached $status" >&2
        return 1
        ;;
    esac
    sleep 5
  done

  echo "Identity redeploy did not reach SUCCESS" >&2
  return 1
}

restore_identity_config() {
  if [[ "$identity_config_dirty" != true || -z "$original_operations_url" ]]; then
    return
  fi
  printf "%s" "$original_operations_url" |
    railway variable set ANOTAME_OPERATIONS_BASE_URL \
      --stdin \
      --skip-deploys \
      --project "$PROJECT" \
      --environment "$ENVIRONMENT" \
      --service "$IDENTITY_SERVICE" >/dev/null
  redeploy_identity
  identity_config_dirty=false
}

delete_fixtures() {
  if [[ "$fixtures_created" != true ]]; then
    return
  fi

  psql "$sales_db_url" \
    -v phone="$FIXTURE_PHONE" \
    -v ON_ERROR_STOP=1 \
    -q <<'SQL'
DELETE FROM tco_order_payment
WHERE id_order IN (
  SELECT id_order FROM tco_order
  WHERE id_customer IN (
    SELECT id_customer FROM tco_customer WHERE phone_number = :'phone'
  )
);
DELETE FROM tco_order_audit_log
WHERE id_order IN (
  SELECT id_order FROM tco_order
  WHERE id_customer IN (
    SELECT id_customer FROM tco_customer WHERE phone_number = :'phone'
  )
);
DELETE FROM tco_order_history
WHERE id_order IN (
  SELECT id_order FROM tco_order
  WHERE id_customer IN (
    SELECT id_customer FROM tco_customer WHERE phone_number = :'phone'
  )
);
DELETE FROM tco_order
WHERE id_customer IN (
  SELECT id_customer FROM tco_customer WHERE phone_number = :'phone'
);
DELETE FROM tco_customer WHERE phone_number = :'phone';
SQL

  psql "$operations_db_url" \
    -v user_one="$USER_ONE" \
    -v user_zero="$USER_ZERO" \
    -v user_multi="$USER_MULTI" \
    -v branch_b="$BRANCH_B" \
    -v ON_ERROR_STOP=1 \
    -q <<'SQL'
DELETE FROM tce_employee_assignment
WHERE id_user IN (
  :'user_one'::uuid,
  :'user_zero'::uuid,
  :'user_multi'::uuid
);
DELETE FROM tce_branch WHERE id_branch = :'branch_b'::uuid;
SQL

  psql "$identity_db_url" \
    -v user_one="$USER_ONE" \
    -v user_zero="$USER_ZERO" \
    -v user_multi="$USER_MULTI" \
    -v ON_ERROR_STOP=1 \
    -q <<'SQL'
DELETE FROM tca_user
WHERE id_user IN (
  :'user_one'::uuid,
  :'user_zero'::uuid,
  :'user_multi'::uuid
);
SQL
  fixtures_created=false
}

cleanup() {
  local exit_code=$?
  set +e
  restore_identity_config
  delete_fixtures
  safe_remove_run_dir
  if [[ "$cleanup_complete" != true && "$exit_code" -ne 0 ]]; then
    echo "Phase 0 staging validation failed; cleanup was attempted." >&2
  fi
  exit "$exit_code"
}
trap cleanup EXIT

railway_variables() {
  railway variable list \
    --project "$PROJECT" \
    --environment "$ENVIRONMENT" \
    --service "$1" \
    --json
}

identity_db_url="$(railway_variables "$IDENTITY_DB" | jq -er '.DATABASE_PUBLIC_URL')"
catalog_db_url="$(railway_variables "$CATALOG_DB" | jq -er '.DATABASE_PUBLIC_URL')"
sales_db_url="$(railway_variables "$SALES_DB" | jq -er '.DATABASE_PUBLIC_URL')"
operations_db_url="$(railway_variables "$OPERATIONS_DB" | jq -er '.DATABASE_PUBLIC_URL')"
internal_token="$(railway_variables "$OPERATIONS_SERVICE" | jq -er '.ANOTAME_INTERNAL_SERVICE_TOKEN')"
identity_variables="$(railway_variables "$IDENTITY_SERVICE")"
jwt_private_key="$(jq -er '.SMALLRYE_JWT_SIGN_KEY' <<<"$identity_variables")"
original_operations_url="$(jq -er '.ANOTAME_OPERATIONS_BASE_URL' <<<"$identity_variables")"
unset identity_variables
identity_deployments+=("$(latest_identity_deployment)")

fixture_count="$(
  psql "$identity_db_url" -Atqc \
    "SELECT count(*) FROM tca_user WHERE id_user IN ('$USER_ONE','$USER_ZERO','$USER_MULTI')"
)"
assignment_count="$(
  psql "$operations_db_url" -Atqc \
    "SELECT count(*) FROM tce_employee_assignment WHERE id_user IN ('$USER_ONE','$USER_ZERO','$USER_MULTI')"
)"
branch_count="$(
  psql "$operations_db_url" -Atqc \
    "SELECT count(*) FROM tce_branch WHERE id_branch='$BRANCH_B'"
)"
customer_count="$(
  psql "$sales_db_url" -Atqc \
    "SELECT count(*) FROM tco_customer WHERE phone_number='$FIXTURE_PHONE'"
)"
[[ "$fixture_count" == 0 && "$assignment_count" == 0 && "$branch_count" == 0 && "$customer_count" == 0 ]] || {
  echo "A deterministic fixture key is already present; refusing to overwrite it." >&2
  exit 1
}

test_password="$(openssl rand -hex 18)"
test_hash="$(htpasswd -bnBC 10 phase0 "$test_password" | cut -d: -f2 | tr -d '\n')"

psql "$identity_db_url" \
  -v user_one="$USER_ONE" \
  -v user_zero="$USER_ZERO" \
  -v user_multi="$USER_MULTI" \
  -v password_hash="$test_hash" \
  -v ON_ERROR_STOP=1 \
  -q <<'SQL'
WITH role AS (
  SELECT id_role
  FROM cca_role
  WHERE is_active=true AND is_deleted=false
  ORDER BY code
  LIMIT 1
)
INSERT INTO tca_user (
  id_user,
  id_role,
  username,
  email,
  password_hash,
  first_name,
  last_name,
  is_active,
  is_deleted
)
SELECT :'user_one'::uuid, id_role, 'phase0-single-20260722', NULL,
       :'password_hash', 'Phase0', 'Single', true, false
FROM role
UNION ALL
SELECT :'user_zero'::uuid, id_role, 'phase0-zero-20260722', NULL,
       :'password_hash', 'Phase0', 'Zero', true, false
FROM role
UNION ALL
SELECT :'user_multi'::uuid, id_role, 'phase0-multi-20260722', NULL,
       :'password_hash', 'Phase0', 'Multi', true, false
FROM role;
SQL
fixtures_created=true

psql "$operations_db_url" \
  -v user_one="$USER_ONE" \
  -v user_multi="$USER_MULTI" \
  -v branch_b="$BRANCH_B" \
  -v assign_one="$ASSIGN_ONE" \
  -v assign_multi_a="$ASSIGN_MULTI_A" \
  -v assign_multi_b="$ASSIGN_MULTI_B" \
  -v ON_ERROR_STOP=1 \
  -q <<'SQL'
WITH source_branch AS (
  SELECT id_branch, id_establishment
  FROM tce_branch
  WHERE deleted_at IS NULL
  ORDER BY created_at
  LIMIT 1
), inserted_branch AS (
  INSERT INTO tce_branch (
    id_branch,
    id_establishment,
    name,
    timezone,
    is_active
  )
  SELECT :'branch_b'::uuid, id_establishment, 'Phase 0 Synthetic Branch',
         'America/Mexico_City', true
  FROM source_branch
  RETURNING id_branch
)
INSERT INTO tce_employee_assignment (
  id_assignment,
  id_user,
  id_branch,
  start_date,
  is_active
)
SELECT :'assign_one'::uuid, :'user_one'::uuid, id_branch, CURRENT_DATE, true
FROM source_branch
UNION ALL
SELECT :'assign_multi_a'::uuid, :'user_multi'::uuid, id_branch, CURRENT_DATE, true
FROM source_branch
UNION ALL
SELECT :'assign_multi_b'::uuid, :'user_multi'::uuid, id_branch, CURRENT_DATE, true
FROM inserted_branch;
SQL

price_list_id="$(
  psql "$catalog_db_url" -Atqc \
    "SELECT id_price_list FROM tcc_price_list WHERE deleted_at IS NULL ORDER BY created_at LIMIT 1"
)"
[[ -n "$price_list_id" ]]

request_id() {
  uuidgen | tr '[:upper:]' '[:lower:]'
}

r_login="$(request_id)"
r_bad="$(request_id)"
r_me="$(request_id)"
r_zero="$(request_id)"
r_multi="$(request_id)"
r_unavailable="$(request_id)"
r_recovered="$(request_id)"
r_op_valid="$(request_id)"
r_op_bad="$(request_id)"
r_op_zero="$(request_id)"
r_op_multi="$(request_id)"
r_cat_list="$(request_id)"
r_cat_detail="$(request_id)"
r_cat_invalid="$(request_id)"
r_cat_missing="$(request_id)"
r_sales_list="$(request_id)"
r_sales_create="$(request_id)"
r_sales_detail="$(request_id)"
r_sales_invalid="$(request_id)"
r_sales_no_branch="$(request_id)"
r_sales_missing="$(request_id)"

request() {
  local scenario="$1"
  local expected="$2"
  shift 2
  local actual
  actual="$(
    curl \
      --silent \
      --show-error \
      --output "$run_dir/response.json" \
      --write-out '%{http_code}' \
      "$@"
  )"
  printf '%s=%s\n' "$scenario" "$actual"
  [[ "$actual" == "$expected" ]]
}

login_body="$(
  jq -nc \
    --arg username "phase0-single-20260722" \
    --arg password "$test_password" \
    '{username:$username,password:$password}'
)"
request identity_login 200 \
  -c "$run_dir/cookies" \
  -H "Content-Type: application/json" \
  -H "X-Request-ID: $r_login" \
  --data "$login_body" \
  "$IDENTITY_URL/auth/login"
jwt_token="$(awk '$6=="jwt" {print $7}' "$run_dir/cookies" | tail -n 1)"
[[ -n "$jwt_token" ]]

bad_body="$(
  jq -nc \
    --arg username "phase0-single-20260722" \
    '{username:$username,password:"incorrect-phase0-password"}'
)"
request identity_bad_credentials 401 \
  -H "Content-Type: application/json" \
  -H "X-Request-ID: $r_bad" \
  --data "$bad_body" \
  "$IDENTITY_URL/auth/login"
request identity_me 200 \
  -b "$run_dir/cookies" \
  -H "X-Request-ID: $r_me" \
  "$IDENTITY_URL/auth/me"

zero_body="$(
  jq -nc \
    --arg username "phase0-zero-20260722" \
    --arg password "$test_password" \
    '{username:$username,password:$password}'
)"
multi_body="$(
  jq -nc \
    --arg username "phase0-multi-20260722" \
    --arg password "$test_password" \
    '{username:$username,password:$password}'
)"
request identity_zero_assignment 403 \
  -H "Content-Type: application/json" \
  -H "X-Request-ID: $r_zero" \
  --data "$zero_body" \
  "$IDENTITY_URL/auth/login"
request identity_multiple_assignments 409 \
  -H "Content-Type: application/json" \
  -H "X-Request-ID: $r_multi" \
  --data "$multi_body" \
  "$IDENTITY_URL/auth/login"

request operations_valid 200 \
  -H "X-Internal-Service-Token: $internal_token" \
  -H "X-Request-ID: $r_op_valid" \
  "$OPERATIONS_URL/internal/employee-assignments/users/$USER_ONE/active-branch"
request operations_invalid_token 401 \
  -H "X-Internal-Service-Token: invalid-phase0-token" \
  -H "X-Request-ID: $r_op_bad" \
  "$OPERATIONS_URL/internal/employee-assignments/users/$USER_ONE/active-branch"
request operations_zero_assignment 404 \
  -H "X-Internal-Service-Token: $internal_token" \
  -H "X-Request-ID: $r_op_zero" \
  "$OPERATIONS_URL/internal/employee-assignments/users/$USER_ZERO/active-branch"
request operations_multiple_assignments 409 \
  -H "X-Internal-Service-Token: $internal_token" \
  -H "X-Request-ID: $r_op_multi" \
  "$OPERATIONS_URL/internal/employee-assignments/users/$USER_MULTI/active-branch"

request catalog_list 200 \
  -b "jwt=$jwt_token" \
  -H "X-Request-ID: $r_cat_list" \
  "$CATALOG_URL/pricelists"
request catalog_detail 200 \
  -b "jwt=$jwt_token" \
  -H "X-Request-ID: $r_cat_detail" \
  "$CATALOG_URL/pricelists/$price_list_id"
request catalog_validation 400 \
  -b "jwt=$jwt_token" \
  -H "Content-Type: application/json" \
  -H "X-Request-ID: $r_cat_invalid" \
  --data "{" \
  "$CATALOG_URL/catalog/garments"
request catalog_missing 404 \
  -b "jwt=$jwt_token" \
  -H "X-Request-ID: $r_cat_missing" \
  "$CATALOG_URL/pricelists/$MISSING_ID"

request sales_list 200 \
  -b "jwt=$jwt_token" \
  -H "X-Request-ID: $r_sales_list" \
  "$SALES_URL/orders"
create_body="$(
  jq -nc \
    --arg phone "$FIXTURE_PHONE" \
    '{
      customer:{
        firstName:"Phase0",
        lastName:"Synthetic",
        phoneNumber:$phone
      },
      items:[{
        garmentTypeId:"72000000-0000-4000-8000-000000000301",
        garmentName:"Synthetic",
        quantity:1,
        services:[{
          serviceId:"72000000-0000-4000-8000-000000000302",
          serviceName:"Synthetic",
          unitPrice:1,
          adjustmentAmount:0,
          durationMin:1
        }]
      }],
      committedDeadline:"2099-12-31T18:00:00Z",
      notes:"Phase0 synthetic fixture",
      amountPaid:0,
      paymentMethod:"CASH"
    }'
)"
request sales_valid_write 200 \
  -b "jwt=$jwt_token" \
  -H "Content-Type: application/json" \
  -H "X-Request-ID: $r_sales_create" \
  --data "$create_body" \
  "$SALES_URL/orders"
order_id="$(jq -er '.id' "$run_dir/response.json")"
request sales_detail 200 \
  -b "jwt=$jwt_token" \
  -H "X-Request-ID: $r_sales_detail" \
  "$SALES_URL/orders/$order_id"
invalid_body='{"customer":{"firstName":"","phoneNumber":""},"items":[]}'
request sales_invalid_write 400 \
  -b "jwt=$jwt_token" \
  -H "Content-Type: application/json" \
  -H "X-Request-ID: $r_sales_invalid" \
  --data "$invalid_body" \
  "$SALES_URL/orders"

no_branch_token="$(
  JWT_SOURCE="$jwt_token" JWT_PRIVATE_KEY="$jwt_private_key" bun -e '
    const crypto = await import("node:crypto");
    const [header, payload] = process.env.JWT_SOURCE.split(".");
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    delete claims.branch_id;
    claims.iat = Math.floor(Date.now() / 1000);
    claims.exp = claims.iat + 300;
    const body = `${header}.${Buffer.from(JSON.stringify(claims)).toString("base64url")}`;
    const key = process.env.JWT_PRIVATE_KEY.replace(/\\n/g, "\n");
    const signature = crypto
      .sign("RSA-SHA256", Buffer.from(body), key)
      .toString("base64url");
    process.stdout.write(`${body}.${signature}`);
  '
)"
request sales_missing_branch 400 \
  -b "jwt=$no_branch_token" \
  -H "Content-Type: application/json" \
  -H "X-Request-ID: $r_sales_no_branch" \
  --data "$create_body" \
  "$SALES_URL/orders"
request sales_missing_resource 404 \
  -b "jwt=$jwt_token" \
  -H "X-Request-ID: $r_sales_missing" \
  "$SALES_URL/orders/$MISSING_ID"

printf "%s" "http://127.0.0.1:1" |
  railway variable set ANOTAME_OPERATIONS_BASE_URL \
    --stdin \
    --skip-deploys \
    --project "$PROJECT" \
    --environment "$ENVIRONMENT" \
    --service "$IDENTITY_SERVICE" >/dev/null
identity_config_dirty=true
redeploy_identity
request identity_operations_unavailable 503 \
  -H "Content-Type: application/json" \
  -H "X-Request-ID: $r_unavailable" \
  --data "$login_body" \
  "$IDENTITY_URL/auth/login"

restore_identity_config
request identity_recovered 200 \
  -H "Content-Type: application/json" \
  -H "X-Request-ID: $r_recovered" \
  --data "$login_body" \
  "$IDENTITY_URL/auth/login"
restored_operations_url="$(
  railway_variables "$IDENTITY_SERVICE" |
    jq -er '.ANOTAME_OPERATIONS_BASE_URL'
)"
[[ "$restored_operations_url" == "$original_operations_url" ]]

jq -n \
  --arg a "$r_login" \
  --arg b "$r_bad" \
  --arg c "$r_me" \
  --arg d "$r_zero" \
  --arg e "$r_multi" \
  --arg f "$r_unavailable" \
  --arg g "$r_recovered" \
  --arg h "$r_op_valid" \
  --arg i "$r_op_bad" \
  --arg j "$r_op_zero" \
  --arg k "$r_op_multi" \
  --arg l "$r_cat_list" \
  --arg m "$r_cat_detail" \
  --arg n "$r_cat_invalid" \
  --arg o "$r_cat_missing" \
  --arg p "$r_sales_list" \
  --arg q "$r_sales_create" \
  --arg r "$r_sales_detail" \
  --arg s "$r_sales_invalid" \
  --arg t "$r_sales_no_branch" \
  --arg u "$r_sales_missing" \
  '[
    {scenario:"identity_login",request_id:$a},
    {scenario:"identity_bad_credentials",request_id:$b},
    {scenario:"identity_me",request_id:$c},
    {scenario:"identity_zero_assignment",request_id:$d},
    {scenario:"identity_multiple_assignments",request_id:$e},
    {scenario:"identity_operations_unavailable",request_id:$f},
    {scenario:"identity_recovered",request_id:$g},
    {scenario:"operations_valid",request_id:$h},
    {scenario:"operations_invalid_token",request_id:$i},
    {scenario:"operations_zero_assignment",request_id:$j},
    {scenario:"operations_multiple_assignments",request_id:$k},
    {scenario:"catalog_list",request_id:$l},
    {scenario:"catalog_detail",request_id:$m},
    {scenario:"catalog_validation",request_id:$n},
    {scenario:"catalog_missing",request_id:$o},
    {scenario:"sales_list",request_id:$p},
    {scenario:"sales_valid_write",request_id:$q},
    {scenario:"sales_detail",request_id:$r},
    {scenario:"sales_invalid_write",request_id:$s},
    {scenario:"sales_missing_branch",request_id:$t},
    {scenario:"sales_missing_resource",request_id:$u}
  ]' >"$run_dir/scenarios.json"

sleep 5
>"$run_dir/identity.jsonl"
for deployment_id in "${identity_deployments[@]}"; do
  railway logs "$deployment_id" \
    --project "$PROJECT" \
    --environment "$ENVIRONMENT" \
    --service "$IDENTITY_SERVICE" \
    --since 30m \
    --lines 700 \
    --filter "@event:http_access" \
    --json >>"$run_dir/identity.jsonl"
done

for service_pair in \
  "catalog:$CATALOG_SERVICE" \
  "sales:$SALES_SERVICE" \
  "operations:$OPERATIONS_SERVICE"; do
  service_name="${service_pair%%:*}"
  service_id="${service_pair#*:}"
  railway logs \
    --project "$PROJECT" \
    --environment "$ENVIRONMENT" \
    --service "$service_id" \
    --since 30m \
    --lines 700 \
    --filter "@event:http_access" \
    --json >"$run_dir/$service_name.jsonl"
done

jq -s '.' \
  "$run_dir/identity.jsonl" \
  "$run_dir/catalog.jsonl" \
  "$run_dir/sales.jsonl" \
  "$run_dir/operations.jsonl" >"$run_dir/all-logs.json"

jq -n \
  --slurpfile scenarios "$run_dir/scenarios.json" \
  --slurpfile logs "$run_dir/all-logs.json" '
    ($scenarios[0]) as $scenarios |
    ($logs[0] | flatten |
      map(select(
        .event=="http_access" and
        (.request_id as $id | [$scenarios[].request_id] | index($id))
      ))) as $events |
    [
      $scenarios[] as $scenario |
      $events[] |
      select(.request_id==$scenario.request_id) |
      {
        scenario:$scenario.scenario,
        service,
        route,
        status
      }
    ] |
    sort_by(.scenario,.service,.route,.status)
  ' >"$run_dir/report.json"

jq -c '.[]' "$run_dir/report.json"

expected_scenarios="$(jq 'length' "$run_dir/scenarios.json")"
observed_scenarios="$(jq '[.[].scenario] | unique | length' "$run_dir/report.json")"
[[ "$observed_scenarios" == "$expected_scenarios" ]]

if jq -e \
  'group_by(.scenario,.service,.route,.status) | any(length != 1)' \
  "$run_dir/report.json" >/dev/null; then
  echo "A scenario produced duplicate access events" >&2
  exit 1
fi
if jq -e \
  'any(.route | test("72000000|phase0|\\?";"i"))' \
  "$run_dir/report.json" >/dev/null; then
  echo "A route contains a fixture identifier or query string" >&2
  exit 1
fi
if jq -e \
  'any(.status >= 500 and .scenario != "identity_operations_unavailable")' \
  "$run_dir/report.json" >/dev/null; then
  echo "An unexpected 5xx occurred" >&2
  exit 1
fi
if ! jq -e '
  [.[] | select(.scenario=="identity_login")] |
  length==2 and
  ([.[].service] | sort)==[
    "anotame-identity-service",
    "anotame-operations-service"
  ]
' "$run_dir/report.json" >/dev/null; then
  echo "The login request ID did not correlate Identity and Operations" >&2
  exit 1
fi

fixture_events="$(jq 'length' "$run_dir/report.json")"
delete_fixtures

identity_remaining="$(
  psql "$identity_db_url" -Atqc \
    "SELECT count(*) FROM tca_user WHERE id_user IN ('$USER_ONE','$USER_ZERO','$USER_MULTI')"
)"
operations_remaining="$(
  psql "$operations_db_url" -Atqc \
    "SELECT (
      (SELECT count(*) FROM tce_employee_assignment WHERE id_user IN ('$USER_ONE','$USER_ZERO','$USER_MULTI')) +
      (SELECT count(*) FROM tce_branch WHERE id_branch='$BRANCH_B')
    )"
)"
sales_remaining="$(
  psql "$sales_db_url" -Atqc \
    "SELECT (
      (SELECT count(*) FROM tco_customer WHERE phone_number='$FIXTURE_PHONE') +
      (SELECT count(*) FROM tco_order WHERE id_customer IN (
        SELECT id_customer FROM tco_customer WHERE phone_number='$FIXTURE_PHONE'
      ))
    )"
)"
[[ "$identity_remaining" == 0 && "$operations_remaining" == 0 && "$sales_remaining" == 0 ]]

cleanup_complete=true
printf \
  'scenario_count=%s correlated_access_events=%s cross_service_login=true config_restored=true fixture_rows_remaining=0\n' \
  "$expected_scenarios" \
  "$fixture_events"
