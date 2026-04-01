# Pitfalls Research

**Domain:** Quarkus 3.x security hardening — production safety for live-client microservices
**Milestone:** Security + code quality cleanup with one live business client
**Confidence:** HIGH — derived from known Quarkus/JWT/Railway behaviors and audit findings

---

## 1. JWT Private Key Rotation — Sessions Will Break

### Pitfall
Deleting `privateKey.pem` from the repo does NOT invalidate the key. Git history preserves it. The key is compromised the moment it was ever committed.

### What happens to logged-in users on rotation?
All existing JWT tokens become invalid immediately when the public key changes. Users will be silently logged out and see a 401 on their next API call. The SvelteKit auth guard will redirect them to `/login`.

### Prevention
1. Generate a new RSA key pair: `openssl genrsa -out privateKey.pem 2048 && openssl rsa -in privateKey.pem -pubout -out publicKey.pem`
2. Set the new private key as an env var (`SMALLRYE_JWT_SIGN_KEY`) in Railway **before** deploying
3. Set the new public key as an env var (`MP_JWT_VERIFY_PUBLICKEY`) in ALL 4 services simultaneously
4. Deploy all services in the same release window — stagger = some services reject tokens from others
5. Add `*.pem` to `.gitignore` immediately; then consider running `git filter-repo` or BFG to scrub history
6. Accept a brief forced re-login for all users — communicate to client

### Warning signs
- `401 Unauthorized` spike after deploy
- Auth cookie present but JWT validation failing in logs

---

## 2. Environment Variable Injection — MicroProfile Config Naming

### Pitfall
MicroProfile Config env var override uses a specific naming convention that is easy to get wrong.

### Rules
- Dots (`.`) become underscores (`_`)
- Hyphens (`-`) become underscores (`_`)
- Everything is UPPERCASED

### Examples

| `application.properties` key | Environment variable |
|-------------------------------|---------------------|
| `quarkus.datasource.jdbc.url` | `QUARKUS_DATASOURCE_JDBC_URL` |
| `quarkus.datasource.username` | `QUARKUS_DATASOURCE_USERNAME` |
| `quarkus.datasource.password` | `QUARKUS_DATASOURCE_PASSWORD` |
| `mp.jwt.verify.publickey` | `MP_JWT_VERIFY_PUBLICKEY` |
| `smallrye.jwt.sign.key` | `SMALLRYE_JWT_SIGN_KEY` |
| `anotame.auth.cookie.secure` | `ANOTAME_AUTH_COOKIE_SECURE` |

### Railway-specific pitfall
Railway injects env vars at container start. If `application.properties` still has a hardcoded value AND the env var is set, the env var wins — but if the env var is missing for any reason, the hardcoded fallback silently takes over. After migrating to env vars, remove the hardcoded defaults from `application.properties` entirely (or use `${DB_PASSWORD}` with no default).

### Multi-line env vars (PEM keys in Railway)
Railway supports multi-line secrets in its dashboard. However, SmallRye JWT's `mp.jwt.verify.publickey` expects the full PEM string including `-----BEGIN PUBLIC KEY-----` headers. Test locally with `export MP_JWT_VERIFY_PUBLICKEY="$(cat publicKey.pem)"` before deploying to Railway.

---

## 3. `@Authenticated` on Controllers — CDI Proxy Edge Cases

### Pitfall
`@Authenticated` works via CDI interceptor. If the class is not a CDI bean, the annotation is silently ignored.

### Check
All Quarkus REST resource classes are CDI beans by default in Quarkus REST (`quarkus-rest`). As long as the class has no explicit `@RequestScoped` / `@ApplicationScoped` conflicts, `@Authenticated` at the class level works correctly.

### `@PermitAll` override
If a controller needs some public and some secured endpoints, apply `@Authenticated` at class level and `@PermitAll` at the method level for public methods. This is the pattern used by `AuthController` (login/register are `@PermitAll`).

### Operations service specific risk
`OperationsController` and `ScheduleController` have JWT config present but no security annotations. Adding `@Authenticated` means any request without a valid JWT cookie is rejected. Verify the SvelteKit frontend always sends the cookie for these routes before deploying — otherwise legitimate users get 401s.

---

## 4. Cookie `secure=true` — Breaks Local Dev Without HTTPS

### Pitfall
Enabling `anotame.auth.cookie.secure=true` unconditionally will break local development because `localhost` is HTTP. The browser will silently drop secure cookies on HTTP connections.

### Solution
Use Quarkus profiles:
```properties
# Default: secure in production (Railway uses HTTPS)
anotame.auth.cookie.secure=true

# Override for local dev (HTTP localhost)
%dev.anotame.auth.cookie.secure=false
```

### SameSite concern
`SameSite=Strict` blocks cookies on cross-origin requests. If the Railway frontend (e.g., `anotame-web.up.railway.app`) calls the backend (e.g., `anotame-api.up.railway.app`) as a different origin, `Strict` will block the cookie. Use `SameSite=Lax` for Railway cross-subdomain deploys, or `None` with `Secure=true` for fully different domains.

---

## 5. Hardcoded Branch UUID — Safe Migration Path

### Pitfall
`SalesService` has `branchId = UUID.fromString("ea22f4a4-...")` hardcoded. The live client has orders tied to this UUID. Changing the resolution logic must NOT change which branch UUID gets assigned to new orders — or historical orders become orphaned.

### Safe migration
1. First verify: does `ea22f4a4-...` actually exist in `tce_branch`? If yes, it's the live branch.
2. Add `branch_id` as a claim in the JWT (identity-service → `AuthService` must look up user's branch at login)
3. Deploy identity-service with the new claim first
4. Then deploy sales-service to read from the claim — fallback to the hardcoded UUID temporarily during rollout
5. Only remove the hardcoded fallback after verifying the claim is present in all active sessions

### Ticket number collision
`"ORD-" + System.currentTimeMillis() % 10000` wraps every ~10 seconds and collides under concurrency. This is a display-only field (not a DB PK), so changing it does not affect existing data. A DB sequence is the correct fix. Can be done as a schema migration (additive).

---

## 6. Flyway Baseline on Live DB — Must Match Reality

### Pitfall
If `V1__baseline.sql` is generated by hand or from an ORM schema dump, it may not match what Hibernate `update` actually created in production. This causes Flyway to fail on the next deploy with a checksum error or "table already exists."

### Prevention
- Generate V1 with `pg_dump --schema-only` from the live DB, not from entity annotations
- Run `flyway validate` in a staging environment before deploying to production
- The `baseline-on-migrate=true` flag skips running V1 on existing DBs (marks it as applied) but still checks the checksum on future runs

### Per-service migration table
Each service must use its own Flyway history table to prevent conflicts:
```properties
quarkus.flyway.table=flyway_schema_history_identity   # identity-service
quarkus.flyway.table=flyway_schema_history_catalog    # catalog-service
quarkus.flyway.table=flyway_schema_history_sales      # sales-service
quarkus.flyway.table=flyway_schema_history_operations # operations-service
```

---

## 7. Removing `anotame-web-legacy` Artifacts

### Pitfall
If `anotame-web-legacy/node_modules/` is committed, `npm audit` / security scanners will flag CVEs against the entire repo. CI pipelines that scan dependencies at the root level will be polluted.

### Safe removal
```bash
rm -rf anotame-web-legacy/node_modules anotame-web-legacy/.next
echo "anotame-web-legacy/node_modules/" >> .gitignore
echo "anotame-web-legacy/.next/" >> .gitignore
git rm -r --cached anotame-web-legacy/node_modules anotame-web-legacy/.next
```
No impact on the live client — these are build artifacts, not source.

---

## Summary Risk Matrix

| Risk | Severity | Likelihood | Phase |
|------|----------|-----------|-------|
| JWT key rotation forces re-login | HIGH | Certain | Phase 1 |
| `@Authenticated` silently ignored if not CDI bean | MEDIUM | Low (Quarkus REST auto-CDI) | Phase 1 |
| Multi-line PEM in Railway env var breaks JWT | HIGH | Medium | Phase 1 |
| `SameSite=Strict` blocks cross-origin Railway calls | MEDIUM | High if different domains | Phase 1 |
| Flyway V1 mismatch with live schema | HIGH | Medium | Phase 3 |
| Branch UUID change orphans live orders | HIGH | Certain if not migrated carefully | Phase 2 |

---
*Research date: 2026-03-31*
