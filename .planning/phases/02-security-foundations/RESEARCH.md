# Phase 2 Research: Security Foundations

**Date**: 2026-03-31
**Status**: Complete
**Confidence**: HIGH — all findings are from direct codebase reads against committed files

---

## 1. DB Credentials — Current State

All four services use the same two property keys with identical plaintext values:

| Service | Property key | Current value | Needs change? |
|---|---|---|---|
| identity-service | `quarkus.datasource.username` | `admin` | No (env var already overrides in Railway) |
| identity-service | `quarkus.datasource.password` | `password` | No (env var already overrides in Railway) |
| catalog-service | `quarkus.datasource.username` | `admin` | No |
| catalog-service | `quarkus.datasource.password` | `password` | No |
| sales-service | `quarkus.datasource.username` | `admin` | No |
| sales-service | `quarkus.datasource.password` | `password` | No |
| operations-service | `quarkus.datasource.username` | `admin` | No |
| operations-service | `quarkus.datasource.password` | `password` | No |

**Key finding:** The property key used is `quarkus.datasource.username` / `quarkus.datasource.password`
(not `quarkus.datasource.jdbc.username`). The env var equivalents are therefore
`QUARKUS_DATASOURCE_USERNAME` / `QUARKUS_DATASOURCE_PASSWORD`.

**Current .env state (CRITICAL FINDING):** The `.env` file is **committed to git and tracked**.
It contains `QUARKUS_DATASOURCE_PASSWORD=password`, `POSTGRES_PASSWORD=password`, and
`ANOTAME_AUTH_COOKIE_SECURE=false`. This is the docker-compose env override file that Docker
reads at startup. The file has been committed through at least 3 commits (earliest:
`647d7b1`). The plaintext `password` value is less severe because it is the local dev
password, not the production one — but the tracked `.env` must be gitignored and removed
from tracking.

**What success criteria SEC-01 actually requires:** The values in `application.properties`
are already `admin`/`password` as local fallbacks, and `QUARKUS_DATASOURCE_USERNAME` /
`QUARKUS_DATASOURCE_PASSWORD` env vars are already defined in `.env` and `.env.example`.
The Railway deployment already sets these env vars. The remaining work for SEC-01 is:

1. Untrack `.env` from git (`git rm --cached .env`) and add `.env` to `.gitignore` explicitly
   (currently only `.env*.local` is gitignored — plain `.env` is NOT covered)
2. Optionally add `${...}` placeholder syntax to `application.properties` to make it clear
   the values must come from env, though this is cosmetic since env vars already override

---

## 2. JWT Key Files — Current State

**Files present on disk (NOT tracked by git):**

```
identity-service/src/main/resources/privateKey.pem   1704 bytes  (RSA private key)
identity-service/src/main/resources/publicKey.pem     451 bytes  (RSA public key)
```

**Git tracking status:** `git ls-files` confirms both `.pem` files are NOT tracked. Git log
shows zero commits that ever added them. The files exist locally but were never committed.

**`.gitignore` coverage for `.pem`:**
The `.gitignore` contains `*.pem` on line 440 — this comes from the NextJS section of the
gitignore template. It IS present and IS effective. However, it sits inside a section labeled
`### NextJS ###`, which means it could be confused with frontend-only. The rule is global and
correctly prevents PEM commits.

**Current JWT key properties in identity-service `application.properties`:**

```properties
smallrye.jwt.sign.key.location=privateKey.pem
mp.jwt.verify.publickey.location=publicKey.pem
```

**Current JWT key properties in catalog-service, sales-service, operations-service:**

```properties
mp.jwt.verify.publickey.location=publicKey.pem
```

**What this means:** All 4 services are configured with `.location` (file path) variants.
Each service's Docker build must include the `publicKey.pem` in `src/main/resources/` at
build time, OR the files must be present when `quarkus:dev` runs. Since the files exist
locally but are gitignored, CI/Railway builds will fail unless the key is available via
environment variable.

**Target for SEC-02:**
- Remove `smallrye.jwt.sign.key.location=privateKey.pem` from identity-service
- Remove `mp.jwt.verify.publickey.location=publicKey.pem` from all 4 services
- Add `mp.jwt.verify.publickey=${MP_JWT_VERIFY_PUBLICKEY}` to all 4 services
- Set `SMALLRYE_JWT_SIGN_KEY` and `MP_JWT_VERIFY_PUBLICKEY` in Railway
- Generate a new key pair (the local keys were never committed but should be rotated
  as a precaution since they exist in plain sight on developer machines)
- Add `.env.example` entries for the new JWT env vars

---

## 3. Controller Annotations — Current State

### OperationsController (`/operations/work-orders`)

**Current class-level annotations:**
```java
@Path("/operations/work-orders")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RequiredArgsConstructor
```

No security annotation. Zero `@Authenticated`, `@RolesAllowed`, or `@PermitAll` anywhere in
the class. All 5 endpoints (POST, GET `/{id}`, PATCH `/{id}/status`, GET, DELETE `/{id}`)
are completely unauthenticated.

**Also unguarded in same service:**
`EstablishmentController` (`/establishment`) — `@GET` and `@PUT` — no security annotations.
`ScheduleController` (`/schedule`) — see below.

### ScheduleController (`/schedule`)

**Current class-level annotations:**
```java
@Path("/schedule")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RequiredArgsConstructor
```

No security annotation. All 6 endpoints are unauthenticated:
- `GET /schedule/config`
- `PUT /schedule/config`
- `GET /schedule/holidays`
- `POST /schedule/holidays`
- `DELETE /schedule/holidays/{id}`
- `GET /schedule/check`

**Note on `GET /schedule/check`:** This is a read-only availability check. It may be
legitimately public (frontend booking widget). The planner should decide whether to exempt
it with `@PermitAll`. For now, treat all as needing `@Authenticated` per SEC-03.

### UserController (`/users`)

**Current class-level annotations:**
```java
@Path("/users")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RequiredArgsConstructor
```

No security annotation. All 5 endpoints are unauthenticated:
- `GET /users` (list all users)
- `POST /users` (create user)
- `GET /users/{id}`
- `PUT /users/{id}`
- `DELETE /users/{id}`

**CONFLICT WITH property-based security in identity-service `application.properties`:**

```properties
quarkus.http.auth.permission.public.paths=/auth/*
quarkus.http.auth.permission.public.policy=permit
quarkus.http.auth.permission.users.paths=/users/*
quarkus.http.auth.permission.users.policy=authenticated
```

`/users/*` is ALREADY protected via Quarkus HTTP permission policy set to `authenticated`.
This means the current `UserController` is actually authenticated at the HTTP layer — but
via properties, not annotations. Adding `@Authenticated` at the class level would be
redundant but harmless (defense in depth). Adding `@RolesAllowed("ADMIN")` is the
remaining work for SEC-04.

**Role claim in JWT:** `JwtUtils.generateToken()` calls `.groups(roles)` where `roles` is
a `Set<String>` containing the user's role code (e.g., `"ADMIN"`, `"EMPLOYEE"`).
`@RolesAllowed("ADMIN")` matches against the `groups` claim — this will work correctly.

### OrdersResource (`/orders`) — reference pattern

```java
@io.quarkus.security.Authenticated
public class OrdersResource {
```

Class-level `@Authenticated` via fully-qualified name. This is the correct existing pattern
to replicate.

---

## 4. Cookie Secure Flag — Current State

**Properties in identity-service `application.properties`:**

```properties
anotame.auth.cookie.secure=false
anotame.auth.cookie.same-site=Lax
```

**Not profile-gated.** There is no `%prod.` prefix. The value is hardcoded to `false`
(insecure) regardless of environment.

**How it's used in `AuthController.java`:**

```java
@ConfigProperty(name = "anotame.auth.cookie.secure", defaultValue = "true")
boolean cookieSecure;

@ConfigProperty(name = "anotame.auth.cookie.same-site", defaultValue = "None")
String cookieSameSite;
```

The `defaultValue = "true"` on the annotation would be overridden by the explicit `false`
in `application.properties`. The `defaultValue = "None"` on `cookieSameSite` is also
overridden by `Lax`.

**Cookie construction in `createCookieResponse()`:**

```java
NewCookie cookie = new NewCookie.Builder("jwt")
        .value(authResponse.getToken())
        .path("/")
        .httpOnly(true)
        .secure(cookieSecure)                                       // from @ConfigProperty
        .sameSite(NewCookie.SameSite.valueOf(cookieSameSite.toUpperCase()))  // from @ConfigProperty
        .maxAge(86400)
        .build();
```

The same builder is used in `logout()` as well. `cookieSameSite.toUpperCase()` is passed to
`NewCookie.SameSite.valueOf()` — which requires exact enum name match (`LAX`, `STRICT`,
`NONE`). Current value `"Lax"` → `.toUpperCase()` → `"LAX"` — valid.

**In `.env` (committed, tracked):**

```
ANOTAME_AUTH_COOKIE_SECURE=false
ANOTAME_AUTH_COOKIE_SAME_SITE=lax
```

The env var `ANOTAME_AUTH_COOKIE_SAME_SITE` maps to `anotame.auth.cookie.same-site` via
MicroProfile Config's conversion. However, the hyphen in `same-site` → underscore in the
env var name, so the key would be `ANOTAME_AUTH_COOKIE_SAME_SITE`. This is consistent with
what is already in `.env`.

**Target for SEC-05:**

```properties
# application.properties
anotame.auth.cookie.secure=false
%prod.anotame.auth.cookie.secure=true
```

The `same-site` value does not require profile-gating for the current Railway topology
(SvelteKit BFF proxies server-side, so `Lax` is correct in both environments).

---

## 5. Docker-compose / .env — Current State

**`PGADMIN_DEFAULT_PASSWORD` in `docker-compose.yml` (line 38):**

```yaml
environment:
  PGADMIN_DEFAULT_EMAIL: admin@anotame.com
  PGADMIN_DEFAULT_PASSWORD: password
```

Hardcoded. Not referenced to an env var. No `env_file:` directive on `anotame-pgadmin` service
(unlike all other services which DO have `env_file: - .env`).

**`env_file:` directives:** Present on `anotame-db`, `identity-service`, `catalog-service`,
`sales-service`, `operations-service`, `anotame-web`. **Absent on `anotame-pgadmin`.**

**`.env` file:** Exists at project root. **Tracked by git** — this is incorrect. It contains:
- `POSTGRES_PASSWORD=password`
- `QUARKUS_DATASOURCE_PASSWORD=password`
- `ANOTAME_AUTH_COOKIE_SECURE=false`
- Service internal URLs

**`.env.example` file:** Exists at project root. Tracked by git (intentional). Contains
similar content but with placeholder comments. Missing `PGADMIN_DEFAULT_PASSWORD` entry.
Missing `SMALLRYE_JWT_SIGN_KEY` and `MP_JWT_VERIFY_PUBLICKEY` entries.

**Target for SEC-06:**

```yaml
# docker-compose.yml
anotame-pgadmin:
  environment:
    PGADMIN_DEFAULT_EMAIL: admin@anotame.com
    PGADMIN_DEFAULT_PASSWORD: ${PGADMIN_DEFAULT_PASSWORD}
  env_file:
    - .env
```

Add `PGADMIN_DEFAULT_PASSWORD=password` to `.env` and `.env.example`.

---

## 6. Auth Cookie Construction — Current State

**Location:** `AuthController.java` lines 44-51 (logout) and 77-85 (createCookieResponse).

**SameSite value:** `NewCookie.SameSite.valueOf(cookieSameSite.toUpperCase())` where
`cookieSameSite` is injected from `anotame.auth.cookie.same-site` which is currently `"Lax"`.
Result: `NewCookie.SameSite.LAX`.

**Secure flag:** `cookieSecure` is injected from `anotame.auth.cookie.secure` which is
currently `false`. All cookies are set with `secure=false` in all environments.

**HttpOnly:** `true` — hardcoded. Correct.

**MaxAge:** `86400` — hardcoded (24 hours). Matches JWT expiry in `JwtUtils`.

**No `domain` attribute set** — the cookie will scope to the response's host automatically,
which is correct for both localhost and Railway.

**Railway topology note (from PITFALLS.md):** If frontend and backend are on different
subdomains (e.g., `anotame-web.up.railway.app` vs `anotame-api.up.railway.app`), `SameSite=Lax`
is correct because the SvelteKit BFF makes server-side requests. Cross-origin browser
requests with `SameSite=Strict` would drop the cookie. Current `Lax` is correct — no change
to SameSite value is needed.

---

## Key Risks (Planner Must Account For)

### Risk 1: `.env` is committed to git — treat as compromised

The `.env` file has been committed multiple times (at least since commit `647d7b1`). Anyone
with repo access has the local dev passwords. The values are local dev defaults (`password`),
not production credentials — so the blast radius is low, but the practice must be corrected.
The fix requires both `git rm --cached .env` AND adding an explicit `.env` rule to
`.gitignore` (current rule only covers `.env*.local`).

### Risk 2: Railway builds will fail without JWT key env vars

`publicKey.pem` is gitignored and not committed. Every service's Docker build (`quarkus
package`) that compiles with `mp.jwt.verify.publickey.location=publicKey.pem` will fail
unless the file is available. Currently the file is baked into the build context from the
developer's local filesystem. When moving to env var delivery (SEC-02), this `.location`
property must be removed BEFORE or SIMULTANEOUSLY with setting the Railway env vars — there
is no safe partial state.

**Safe migration sequence (from PITFALLS.md):**
1. Generate new RSA key pair locally
2. Set `SMALLRYE_JWT_SIGN_KEY` and `MP_JWT_VERIFY_PUBLICKEY` in Railway for all 4 services
3. Update all 4 `application.properties` to remove `.location` and add inline property
4. Deploy all 4 services in the same release — staggered deploy = JWT verification failures

### Risk 3: `quarkus.http.auth.permission.users` conflicts with `@RolesAllowed` approach

Identity-service already has a URL-based auth policy for `/users/*` (set to `authenticated`).
Adding `@RolesAllowed("ADMIN")` on individual methods works at the CDI level, layered on top
of the HTTP-level `authenticated` policy. Both constraints apply — a non-authenticated request
is rejected at the HTTP layer before CDI annotations are evaluated. This is correct but the
planner should document why both mechanisms exist (HTTP policy = coarse guard, CDI annotation
= fine-grained RBAC).

### Risk 4: `GET /schedule/check` may need `@PermitAll` for the booking widget

`ScheduleController.getCheckAvailability()` returns open/closed status for a given datetime.
If the SvelteKit frontend's guest-facing booking page calls this endpoint without a JWT,
adding `@Authenticated` at class level will break it. The planner must decide: either
add `@PermitAll` on `GET /schedule/check` explicitly, or confirm no unauthenticated consumer
exists before applying class-level protection.

---

## Recommended Plan Structure

Four plan files matching the `02-01..02-04` outline:

### 02-01: Untrack `.env` and add `.gitignore` rules

**Tasks:**
1. Add `.env` (exact match, not pattern) to `.gitignore` explicitly, distinct from `.env*.local`
2. `git rm --cached .env` to stop tracking without deleting the local file
3. Add `*.pem` annotation comment to clarify the existing rule covers all PEM files
4. Add `PGADMIN_DEFAULT_PASSWORD=password` to `.env` and `.env.example`
5. Add `SMALLRYE_JWT_SIGN_KEY=` and `MP_JWT_VERIFY_PUBLICKEY=` placeholder lines to `.env.example`
6. Commit the `.gitignore` change and the `git rm --cached` result

**Verification:** `git status` shows `.env` as untracked; `git ls-files .env` returns empty.

### 02-02: Externalize JWT keys via env vars (SEC-02)

**Tasks:**
1. Generate new RSA-2048 key pair:
   `openssl genrsa -out privateKey.pem 2048 && openssl rsa -in privateKey.pem -pubout -out publicKey.pem`
2. In identity-service `application.properties`:
   - Remove `smallrye.jwt.sign.key.location=privateKey.pem`
   - Remove `mp.jwt.verify.publickey.location=publicKey.pem`
   - Add `mp.jwt.verify.publickey=${MP_JWT_VERIFY_PUBLICKEY}`
3. In catalog-service, sales-service, operations-service `application.properties`:
   - Remove `mp.jwt.verify.publickey.location=publicKey.pem`
   - Add `mp.jwt.verify.publickey=${MP_JWT_VERIFY_PUBLICKEY}`
4. Add to `.env` (local dev): `SMALLRYE_JWT_SIGN_KEY=<base64-pem>` and `MP_JWT_VERIFY_PUBLICKEY=<base64-pem>`
5. Document Railway deployment steps in a `DEPLOY_NOTES.md` (set env vars before deploy)

**Verification:** Start services locally with `docker compose up --build`. Confirm login
produces a valid JWT that is accepted by catalog/sales/operations services.

### 02-03: Add security annotations to controllers (SEC-03, SEC-04)

**Tasks:**
1. Add `@io.quarkus.security.Authenticated` at class level to `OperationsController`
2. Add `@io.quarkus.security.Authenticated` at class level to `ScheduleController`
   — add `@jakarta.annotation.security.PermitAll` on `GET /schedule/check` if needed
3. Add `@io.quarkus.security.Authenticated` at class level to `EstablishmentController`
4. For `UserController` (SEC-04):
   - Add `@io.quarkus.security.Authenticated` at class level
   - Add `@jakarta.annotation.security.RolesAllowed("ADMIN")` on `POST`, `PUT`, `DELETE` methods
   - `GET` endpoints remain `@Authenticated` (any authenticated user can view)
5. For `AuthController`: verify `/auth/*` endpoints remain public (`@PermitAll` on login/register/logout,
   `@Authenticated` on `/auth/me` and `/auth/change-credentials`)

**Verification:** Using curl or Postman:
- `GET /operations/work-orders` without JWT → 401
- `GET /operations/work-orders` with EMPLOYEE JWT → 200
- `DELETE /users/{id}` with EMPLOYEE JWT → 403
- `DELETE /users/{id}` with ADMIN JWT → 200 (or 404)

### 02-04: Cookie secure flag + PgAdmin password externalization (SEC-05, SEC-06)

**Tasks:**
1. In identity-service `application.properties`, add:
   `%prod.anotame.auth.cookie.secure=true`
   (keep base value `anotame.auth.cookie.secure=false` for local dev)
2. Remove `ANOTAME_AUTH_COOKIE_SECURE=false` from `.env` (or leave as dev override — document intent)
3. In `docker-compose.yml` `anotame-pgadmin` service:
   - Change `PGADMIN_DEFAULT_PASSWORD: password` to `PGADMIN_DEFAULT_PASSWORD: ${PGADMIN_DEFAULT_PASSWORD}`
   - Add `env_file: - .env` directive to pgadmin service
4. Add `PGADMIN_DEFAULT_PASSWORD=password` to `.env`
5. Add `PGADMIN_DEFAULT_PASSWORD=<set-this>` to `.env.example`

**Verification:**
- Start with `%prod` profile active and confirm `Set-Cookie` header contains `Secure`
- Start with `%dev` profile and confirm `Set-Cookie` does NOT contain `Secure`
- Start pgadmin with `.env` only, no inline password → pgadmin accessible

---

## Addendum: Findings Not in Original Scope

### `.env` tracked by git

The `.gitignore` covers `.env*.local` (line 449) but NOT `.env` (bare name). The `.env` file
has been committed and has a git history. This must be treated as SEC-01 prerequisite work.

### EstablishmentController is also unguarded

`EstablishmentController` (`PUT /establishment` — updates business name, address, etc.) has
no security annotation. It was not listed in SEC-03 requirements but represents the same
exposure. The planner should include it in plan 02-03.

### `smallrye.jwt.sign.key` vs `smallrye.jwt.sign.key.location`

The current property name is `smallrye.jwt.sign.key.location` (file path). The env var for
inline content uses the property name `smallrye.jwt.sign.key` (no `.location`). These are
different properties. When migrating, remove `.location` and set `SMALLRYE_JWT_SIGN_KEY` (env
var) which maps to `smallrye.jwt.sign.key`. Do not set both or the behavior is
implementation-defined.

---

## Sources

All findings are from direct codebase reads (HIGH confidence):

- `identity-service/src/main/resources/application.properties` — lines 7-8, 25-26, 38-39
- `catalog-service/src/main/resources/application.properties` — lines 8-9, 26
- `sales-service/src/main/resources/application.properties` — lines 7-8, 25
- `operations-service/src/main/resources/application.properties` — lines 8-9, 26
- `OperationsController.java` — class declaration, no security imports
- `ScheduleController.java` — class declaration, no security imports
- `EstablishmentController.java` — class declaration, no security imports
- `UserController.java` — class declaration, no security imports
- `AuthController.java` — lines 21-26 (`@ConfigProperty`), lines 76-88 (`NewCookie.Builder`)
- `AuthService.java` — lines 62-68 (roles from `user.getRole().getCode()`)
- `JwtUtils.java` — line 19 (`.groups(roles)`)
- `OrdersResource.java` — line 19 (`@io.quarkus.security.Authenticated`)
- `docker-compose.yml` — lines 38-39 (`PGADMIN_DEFAULT_PASSWORD: password`)
- `.gitignore` — line 440 (`*.pem`), line 449 (`.env*.local`)
- `.env` — full file read, confirmed tracked by git
- `.env.example` — full file read
- `git log` — confirmed `.env` committed since `647d7b1`; PEM files never committed
- Prior research in `.planning/research/STACK.md`, `PITFALLS.md`, `FEATURES.md` (HIGH — project-specific)
