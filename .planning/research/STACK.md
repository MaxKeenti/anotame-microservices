# Technology Stack: Security Hardening Patterns

**Project:** Anotame — Quarkus 3.27.2 microservices
**Milestone:** Security hardening + code quality cleanup
**Researched:** 2026-03-31
**Confidence:** HIGH — all patterns verified against Quarkus 3.x / SmallRye JWT source code
and training data aligned with Quarkus 3.15+ behavior (cutoff August 2025).

---

## 1. Externalizing Secrets via Environment Variables (MicroProfile Config)

### How Quarkus config source priority works

MicroProfile Config in Quarkus resolves properties in this order (highest wins):

1. System properties (`-D` flags)
2. Environment variables
3. `.env` file in project root (dev only, never committed)
4. `application.properties` / `application.yaml`

**Any property in `application.properties` is overridden by an environment variable with the
same name converted to UPPERCASE_UNDERSCORE form.**

The conversion rule: dots and hyphens become underscores, all letters uppercase.

```
quarkus.datasource.username       -> QUARKUS_DATASOURCE_USERNAME
quarkus.datasource.password       -> QUARKUS_DATASOURCE_PASSWORD
quarkus.datasource.jdbc.url       -> QUARKUS_DATASOURCE_JDBC_URL
```

### Recommended pattern — keep fallback defaults in application.properties, override in env

```properties
# application.properties — safe defaults for local Docker Compose
quarkus.datasource.username=admin
quarkus.datasource.password=password
quarkus.datasource.jdbc.url=jdbc:postgresql://anotame-db:5432/anotame
```

In Railway, set:
```
QUARKUS_DATASOURCE_USERNAME=<prod_user>
QUARKUS_DATASOURCE_PASSWORD=<prod_secret>
QUARKUS_DATASOURCE_JDBC_URL=jdbc:postgresql://<host>:5432/anotame
```

No code changes required — MicroProfile Config env var override is automatic.

### .env file for local dev (do not commit)

```bash
# .env  — gitignored, lives in project root or per-service dir
QUARKUS_DATASOURCE_PASSWORD=localpassword
MP_JWT_VERIFY_PUBLICKEY=<inline PEM content>
```

Quarkus reads `.env` automatically at startup in dev/test mode. Add `.env` to `.gitignore`.

### @ConfigProperty injection pattern (no change needed)

```java
@ConfigProperty(name = "anotame.auth.cookie.secure", defaultValue = "true")
boolean cookieSecure;
```

This already works. The env var equivalent is `ANOTAME_AUTH_COOKIE_SECURE=true`.

---

## 2. JWT Key Management — SmallRye JWT via Environment Variable

### Current state (risky)

`privateKey.pem` and `publicKey.pem` are bundled in `src/main/resources` and committed to the
repository. The private key being in version control is a critical security issue.

### Recommended fix — inline key via environment variable

SmallRye JWT supports supplying PEM content **directly as a string** rather than a file path.
Use different property names to switch from file location to inline content.

#### identity-service (signs tokens — needs private key)

```properties
# application.properties — remove file-based property
# smallrye.jwt.sign.key.location=privateKey.pem   <-- REMOVE

# Use inline key via env var instead:
# Set SMALLRYE_JWT_SIGN_KEY in Railway with the raw PEM content (newlines replaced with \n)
```

Set in Railway:
```
SMALLRYE_JWT_SIGN_KEY=-----BEGIN PRIVATE KEY-----\nMIIEvg...\n-----END PRIVATE KEY-----
```

The property name is `smallrye.jwt.sign.key` (not `.location`). When this property is set,
SmallRye JWT uses it as the literal key content rather than a file path.

#### All services (verify tokens — need public key)

```properties
# application.properties — remove file-based property
# mp.jwt.verify.publickey.location=publicKey.pem   <-- REMOVE

# Inline content alternative:
mp.jwt.verify.publickey=${MP_JWT_VERIFY_PUBLICKEY}
```

Or rely on env var name conversion:

```
MP_JWT_VERIFY_PUBLICKEY=-----BEGIN PUBLIC KEY-----\nMIIBIjAN...\n-----END PUBLIC KEY-----
```

`MP_JWT_VERIFY_PUBLICKEY` (env var) automatically maps to `mp.jwt.verify.publickey` (property).

**Important:** The PEM content in an env var must preserve newlines. Two ways to do this:
- Store with literal `\n` escape sequences (SmallRye JWT handles this automatically)
- In Railway, use the multi-line secret editor which preserves actual newlines

### Priority rule: inline vs location

When both `mp.jwt.verify.publickey` (inline) and `mp.jwt.verify.publickey.location` (file) are
set, **inline takes priority**. Remove the `.location` property once the env var is in place.

### After migration checklist

- Delete `privateKey.pem` from `src/main/resources` and rotate the key pair (the committed key
  is already compromised — generate a new key pair entirely)
- Delete `publicKey.pem` from `src/main/resources` in all services
- Update `.gitignore` to block `*.pem` from ever being committed again

---

## 3. Security Annotations — `@Authenticated` and `@RolesAllowed`

### Class-level annotation (preferred pattern)

Placing `@Authenticated` or `@RolesAllowed` at the class level protects **all methods** by
default. This is the correct approach for controllers where every endpoint requires auth.

```java
@Path("/users")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Authenticated                          // protects ALL methods in this class
public class UserController {
    // all @GET, @POST, @PUT, @DELETE methods inherit the guard
}
```

This is what `CatalogController` already does correctly. Apply the same pattern to
`UserController`, `OperationsController`, and `ScheduleController`.

### Method-level override

When one endpoint in a protected class must be public, use `@PermitAll` on that specific method:

```java
@Authenticated              // class-level: all methods require auth
public class AuthController {

    @POST
    @Path("/login")
    @PermitAll              // method-level: overrides class @Authenticated
    public Response login(LoginRequest request) { ... }

    @GET
    @Path("/me")
    // inherits @Authenticated from class — no annotation needed here
    public Response me(...) { ... }
}
```

`@PermitAll` is from `jakarta.annotation.security.PermitAll`. It is the standard way to carve
out public endpoints inside an otherwise-secured class.

### `@RolesAllowed` for role-specific endpoints

```java
@PUT
@Path("/{id}")
@RolesAllowed("ADMIN")      // only users with ADMIN role can call this
public UserResponse updateUser(...) { ... }
```

`@RolesAllowed` is from `jakarta.annotation.security.RolesAllowed`. SmallRye JWT populates roles
from the `groups` claim in the JWT. Ensure tokens include `"groups": ["ADMIN"]` or
`"groups": ["OPERATOR"]`.

### CDI interaction — important note for Quarkus REST

Quarkus REST controllers are **CDI beans** (application-scoped by default). Security annotations
on CDI beans are intercepted by the Quarkus Security CDI interceptor. This works correctly when:

- The class is a CDI-managed bean (no `new` instantiation)
- `quarkus-smallrye-jwt` or another security extension is on the classpath

With Lombok `@RequiredArgsConstructor`, Quarkus injects via the generated constructor — CDI
security interception still applies. No special configuration needed.

**One caveat:** When using `@RequiredArgsConstructor` (Lombok), ensure the field is not `final`
if it causes proxy generation issues. In practice this is not an issue with Quarkus 3.x since
it uses build-time proxies.

### Current state vs target

| Controller | Current | Target |
|---|---|---|
| `AuthController` | Mixed (method-level only on some) | `@PermitAll` on `/login`, `/register`, `/logout`; `@Authenticated` at class |
| `UserController` | No guard at all | `@Authenticated` at class |
| `OperationsController` | No guard at all | `@Authenticated` at class |
| `ScheduleController` | No guard at all | `@Authenticated` at class |
| `EstablishmentController` | Unknown | `@Authenticated` at class |
| `CatalogController` | `@Authenticated` at class (correct) | No change needed |

---

## 4. Profile-Based Property Overrides (`%dev.`, `%prod.`)

### How Quarkus profiles work

Quarkus has three built-in profiles: `dev`, `test`, `prod`. The active profile is determined by
how the app starts:

- `quarkus:dev` → `dev` profile
- Running packaged JAR → `prod` profile (default)
- Test execution → `test` profile

Profile-prefixed properties override the base property for that profile only:

```properties
# application.properties

# Base value (applies to all profiles unless overridden)
anotame.auth.cookie.secure=false

# Prod override — applied when running packaged (Railway)
%prod.anotame.auth.cookie.secure=true

# Dev override — applied during quarkus:dev
%dev.anotame.auth.cookie.secure=false
```

### Recommended pattern for this project

```properties
# application.properties — identity-service

# Cookie secure: false locally, true in prod
anotame.auth.cookie.secure=false
%prod.anotame.auth.cookie.secure=true

# SQL logging: enabled locally, disabled in prod
quarkus.hibernate-orm.log.sql=true
%prod.quarkus.hibernate-orm.log.sql=false

# DB URL: Docker Compose default locally, env var in prod
quarkus.datasource.jdbc.url=jdbc:postgresql://anotame-db:5432/anotame
%prod.quarkus.datasource.jdbc.url=${DATABASE_URL:jdbc:postgresql://anotame-db:5432/anotame}
```

The `${VAR:default}` syntax means: use env var `DATABASE_URL`, fall back to the default if
the env var is not set.

### Railway behavior

Railway runs the packaged JAR, so it always activates the `prod` profile. Setting
`%prod.anotame.auth.cookie.secure=true` in `application.properties` ensures `secure=true` in
production without any env var required. This is the safest approach — correct-by-default.

---

## 5. HttpOnly Cookie + CORS Configuration for JWT in Quarkus REST

### Current CORS config assessment

The existing CORS config is structurally correct but missing one important header for cookie
flows:

```properties
# Current (incomplete for cookie auth)
quarkus.http.cors.headers=accept, authorization, content-type, x-requested-with

# Required addition for cookie-based JWT
quarkus.http.cors.exposed-headers=Set-Cookie
```

Without `exposed-headers=Set-Cookie`, browsers may not surface the `Set-Cookie` response header
to JavaScript in cross-origin contexts — though for HttpOnly cookies this is less critical since
JS cannot access them anyway. Still recommended for correctness.

### Cookie security properties

```properties
# In application.properties
anotame.auth.cookie.secure=false
%prod.anotame.auth.cookie.secure=true
anotame.auth.cookie.same-site=Lax
%prod.anotame.auth.cookie.same-site=Strict
```

**SameSite guidance:**
- `Strict`: Cookie only sent for same-origin requests. Best security but breaks cross-origin
  API calls when frontend and backend are on different domains.
- `Lax`: Cookie sent on top-level navigations and same-site requests. Safe default.
- `None`: Requires `Secure=true`. Use only when frontend and backend are on different domains
  (e.g., `app.railway.app` frontend calling `api.railway.app` backend).

For Railway where the frontend SvelteKit BFF proxies API calls to the backend, `Lax` is correct
because the BFF makes server-side requests (not browser cross-origin calls).

### NewCookie construction (existing pattern is correct)

The `NewCookie.Builder` pattern in `AuthController` is the right approach for Quarkus REST:

```java
NewCookie cookie = new NewCookie.Builder("jwt")
    .value(token)
    .path("/")
    .httpOnly(true)
    .secure(cookieSecure)           // from @ConfigProperty
    .sameSite(NewCookie.SameSite.LAX)
    .maxAge(86400)
    .build();
```

No changes needed to the cookie construction code. Only the property values need to change
(`%prod.anotame.auth.cookie.secure=true`).

### CORS `access-control-allow-credentials`

`quarkus.http.cors.access-control-allow-credentials=true` is already set in all services and
is **required** for the browser to include cookies in cross-origin requests. Do not remove it.

When `allow-credentials=true`, the `origins` list must be explicit (wildcard `*` is rejected
by browsers). The current explicit origin list is correct.

---

## Summary: Concrete Changes Required

| Item | File | Change |
|---|---|---|
| Remove hardcoded DB password | all 4 `application.properties` | Use env var override; keep local defaults |
| Remove committed privateKey.pem | identity-service resources | Delete + rotate key pair |
| JWT sign key via env | identity-service `application.properties` | Remove `.location`, use `SMALLRYE_JWT_SIGN_KEY` env var |
| JWT verify key via env | all services `application.properties` | Remove `.location`, use `MP_JWT_VERIFY_PUBLICKEY` env var |
| Cookie secure in prod | identity-service `application.properties` | Add `%prod.anotame.auth.cookie.secure=true` |
| Disable SQL log in prod | all 4 `application.properties` | Add `%prod.quarkus.hibernate-orm.log.sql=false` |
| Add `@Authenticated` | `UserController`, `OperationsController`, `ScheduleController` | Class-level annotation |
| Add `.env.example` | repo root | Document required env vars without values |

---

## Sources

- Quarkus 3.27.2 BOM confirmed in `identity-service/pom.xml`
- MicroProfile Config 3.1 spec (env var override behavior) — HIGH confidence, stable spec
- SmallRye JWT 4.x behavior for inline key via `mp.jwt.verify.publickey` — HIGH confidence,
  stable API since SmallRye JWT 3.x
- Quarkus profile syntax (`%prod.`, `%dev.`) — HIGH confidence, unchanged since Quarkus 1.x
- JAX-RS `NewCookie.Builder` API — HIGH confidence, standard Jakarta EE 10
- `@Authenticated` / `@RolesAllowed` CDI interception in Quarkus REST — HIGH confidence
