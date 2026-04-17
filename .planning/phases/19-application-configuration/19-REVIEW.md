---
phase: 19-application-configuration
reviewed: 2026-04-16T00:00:00Z
depth: standard
files_reviewed: 4
files_reviewed_list:
  - anotame-api/backend/identity-service/src/main/resources/application.properties
  - anotame-api/backend/catalog-service/src/main/resources/application.properties
  - anotame-api/backend/sales-service/src/main/resources/application.properties
  - anotame-api/backend/operations-service/src/main/resources/application.properties
findings:
  critical: 3
  warning: 2
  info: 2
  total: 7
status: issues_found
---

# Phase 19: Code Review Report

**Reviewed:** 2026-04-16T00:00:00Z
**Depth:** standard
**Files Reviewed:** 4
**Status:** issues_found

## Summary

All four service `application.properties` files follow the same structural pattern: profile-aware Flyway, a `%prod` DDL-none override, and JWT delivered via environment variables. The configuration is largely consistent and intentional. However, three critical risks were found: insecure credential fallbacks that silently activate when env vars are absent, a DDL `update` setting that applies to any profile where `%prod` is not explicitly activated, and inconsistent CORS custom-header exposure across services that will cause browser preflight failures for some service-frontend interactions.

## Critical Issues

### CR-01: Insecure Hardcoded Credential Fallbacks in Default Profile

**File:** `anotame-api/backend/identity-service/src/main/resources/application.properties:9-10`
(Same pattern on identical lines in catalog-service, sales-service, and operations-service)

**Issue:** The datasource username and password use environment variable references with insecure inline defaults:
```properties
quarkus.datasource.username=${QUARKUS_DATASOURCE_USERNAME:admin}
quarkus.datasource.password=${QUARKUS_DATASOURCE_PASSWORD:password}
```
These defaults (`admin` / `password`) are active in every profile — including `%prod` — whenever the environment variables are not set. If a deployment environment fails to inject these variables (e.g., misconfigured Railway service, CI environment, or a new service instance), the application silently connects using the insecure defaults. There is no startup failure, no log warning, and no indication that credentials fell back.

**Fix:** Remove the fallback values so that missing variables cause an immediate startup failure with a clear error:
```properties
quarkus.datasource.username=${QUARKUS_DATASOURCE_USERNAME}
quarkus.datasource.password=${QUARKUS_DATASOURCE_PASSWORD}
```
For local dev, set these variables in `.env` (gitignored) or use a dev-profile-scoped override with dev-appropriate values:
```properties
%dev.quarkus.datasource.username=${QUARKUS_DATASOURCE_USERNAME:dev_user}
%dev.quarkus.datasource.password=${QUARKUS_DATASOURCE_PASSWORD:dev_pass}
```
This way the fallback is scoped to the dev profile only and cannot silently activate in production.

---

### CR-02: Hibernate DDL `update` Active by Default — Not Profile-Gated

**File:** `anotame-api/backend/identity-service/src/main/resources/application.properties:13`
(Same pattern on identical lines in catalog-service, sales-service, and operations-service)

**Issue:**
```properties
quarkus.hibernate-orm.database.generation=update
```
This setting applies to the default (unprofile-qualified) configuration, which means it is active in any profile where `%prod.quarkus.hibernate-orm.database.generation=none` does not take effect. Quarkus activates `%prod` overrides only when the application is started with `-Dquarkus.profile=prod` or the `QUARKUS_PROFILE=prod` environment variable. If a production-built JAR is started without this environment variable (e.g., during an incident recovery, a test deployment, or a misconfigured rollout), Hibernate will attempt DDL mutation against the live database — potentially dropping or altering columns.

**Fix:** Gate the `update` value to the `%dev` profile only, and make the default safe:
```properties
# Safe default: no DDL mutation
quarkus.hibernate-orm.database.generation=none

# Dev override: allow Hibernate to update schema locally
%dev.quarkus.hibernate-orm.database.generation=update

# Prod explicit: redundant but documents intent
%prod.quarkus.hibernate-orm.database.generation=none
```
Flyway handles all schema changes; Hibernate DDL should never be `update` outside a local dev environment.

---

### CR-03: Auth Cookie `secure=false` in Default Profile (Identity-Service Only)

**File:** `anotame-api/backend/identity-service/src/main/resources/application.properties:46`

**Issue:**
```properties
anotame.auth.cookie.secure=false
%prod.anotame.auth.cookie.secure=true
```
The `Secure` cookie flag is disabled in the default profile. The `%prod` override correctly sets it to `true`, but as with CR-02, this only activates when the `prod` profile is explicitly set. If the service starts without the `%prod` profile (e.g., during incident recovery or a staging environment that does not set `QUARKUS_PROFILE=prod`), JWT cookies are issued without the `Secure` flag, making them transmissible over plain HTTP and exposing session tokens to interception.

**Fix:** Flip the default to `true` and override for dev:
```properties
# Secure by default
anotame.auth.cookie.secure=true

# Dev override: allow HTTP localhost
%dev.anotame.auth.cookie.secure=false
```
This follows the principle of secure-by-default — production safety should not depend on a profile flag being correctly set.

---

## Warnings

### WR-01: Inconsistent CORS Custom Header Exposure Across Services

**File:** Multiple files — lines noted below

**Issue:** The `x-user-name`, `x-user-id`, and `x-user-role` custom headers are included in the CORS `headers` allowlist inconsistently:

| Service | x-user-name | x-user-id | x-user-role |
|---|---|---|---|
| identity-service (line 24) | yes | yes | yes |
| catalog-service (line 25) | no | no | no |
| sales-service (line 24) | yes | no | no |
| operations-service (line 25) | no | no | no |

If the frontend sends these headers in preflight requests to catalog-service or operations-service (e.g., when a request propagates user context), the browser will reject the preflight with a CORS error. This is a silent runtime failure that is hard to diagnose.

**Fix:** Audit which services receive requests with these headers from the frontend or API gateway. For any service that receives them, add the full set to its CORS headers list:
```properties
quarkus.http.cors.headers=accept, authorization, content-type, x-requested-with, x-user-name, x-user-id, x-user-role
```
Alternatively, standardize all four services to the same header allowlist to prevent future inconsistencies.

---

### WR-02: No Startup Validation for Missing JWT Public Key

**File:** `anotame-api/backend/catalog-service/src/main/resources/application.properties:31`
(Same pattern in sales-service:31 and operations-service:31)

**Issue:**
```properties
mp.jwt.verify.publickey=${MP_JWT_VERIFY_PUBLICKEY}
```
If `MP_JWT_VERIFY_PUBLICKEY` is not set in the environment, Quarkus will resolve the value as the literal string `${MP_JWT_VERIFY_PUBLICKEY}`, which is not a valid RSA/EC public key. The application will start successfully but all JWT verification will fail at runtime, returning 401 for every authenticated request. There is no fail-fast behavior.

**Fix:** There is no built-in Quarkus mechanism to fail-fast on missing MicroProfile JWT config, but the risk can be mitigated with a startup bean that validates the key is present and parseable:
```java
@ApplicationScoped
public class JwtConfigValidator {
    @ConfigProperty(name = "mp.jwt.verify.publickey")
    String publicKey;

    void onStart(@Observes StartupEvent ev) {
        if (publicKey == null || publicKey.isBlank() || publicKey.startsWith("${")) {
            throw new IllegalStateException(
                "mp.jwt.verify.publickey is not configured. Set MP_JWT_VERIFY_PUBLICKEY env var.");
        }
    }
}
```
This converts a silent runtime failure into a clear startup crash with an actionable message.

---

## Info

### IN-01: `quarkus.jackson.write-dates-as-timestamps=false` Missing from Identity-Service

**File:** `anotame-api/backend/identity-service/src/main/resources/application.properties`

**Issue:** All three consumer services (catalog, sales, operations) set `quarkus.jackson.write-dates-as-timestamps=false`, ensuring dates serialize as ISO-8601 strings. Identity-service does not include this setting. If any identity-service endpoint returns a date field (e.g., `created_at`, `updated_at`, token expiry), it will serialize as a numeric timestamp, producing inconsistent API responses across services.

**Fix:** Add the setting to identity-service for consistency:
```properties
quarkus.jackson.write-dates-as-timestamps=false
```

---

### IN-02: No Production Logging Configuration

**File:** All four `application.properties` files

**Issue:** None of the services configure structured or leveled logging for production. Railway aggregates container stdout, so unformatted Quarkus text logs are harder to query and filter. There is no `%prod.quarkus.log.console.json=true` or equivalent.

**Fix:** Add production-scoped structured logging to each service:
```properties
# Production: emit JSON logs for Railway aggregation
%prod.quarkus.log.console.json=true
%prod.quarkus.log.level=INFO
%prod.quarkus.log.category."io.quarkus".level=WARN
```
This is a quality-of-life improvement for incident diagnosis rather than a correctness issue.

---

_Reviewed: 2026-04-16T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
