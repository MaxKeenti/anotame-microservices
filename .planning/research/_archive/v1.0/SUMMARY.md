# Research Summary

**Project:** Anotame — Quarkus 3.27.2 microservices
**Milestone:** Security hardening + code quality cleanup
**Researched:** 2026-03-31
**Confidence:** HIGH

---

## Stack Recommendations

| Technology | Purpose | Rationale |
|---|---|---|
| MicroProfile Config env var overrides | Secret externalization | Automatic, no code changes — dots/hyphens become underscores, all caps |
| `mp.jwt.verify.publickey` (inline) | JWT public key injection | Preferred over `.location`; inline takes priority; supports multi-line PEM via Railway |
| `smallrye.jwt.sign.key` | JWT private key injection | Replaces file-based `privateKey.pem`; set via `SMALLRYE_JWT_SIGN_KEY` env var |
| Quarkus profiles (`%dev.`, `%prod.`) | Environment-specific config | Railway runs packaged JAR = `prod` profile; correct-by-default without extra env vars |
| `quarkus-flyway` | Schema management | Replace `hibernate-orm.database.generation=update`; per-service history tables prevent conflicts on shared DB |
| `quarkus-smallrye-health` | Service health endpoints | Zero-code DB health check; enables Docker Compose `depends_on: condition: service_healthy` |
| `@ServerExceptionMapper` | Structured error responses | Quarkus REST preferred pattern over `ExceptionMapper<T>`; sales-service already has the template |

**Key version notes:** Flyway is BOM-managed (no explicit version). `quarkus-flyway` requires `baseline-on-migrate=true` for the live production DB.

---

## Table Stakes

These are non-negotiable for this milestone. All exist as patterns in the codebase or Quarkus core — effort is low.

1. **JWT keys out of version control** — `privateKey.pem` and `publicKey.pem` committed to repo are a critical exposure. Delete, rotate, and inject via env vars before any other security work.
2. **`@Authenticated` at class level on all unguarded controllers** — `UserController`, `OperationsController`, `ScheduleController`, and `EstablishmentController` currently have no auth guard. Apply class-level annotation; use `@PermitAll` to carve out public methods.
3. **Consistent JSON error shape across all 4 services** — `{ "message": "...", "details": [] }`. sales-service's `GlobalExceptionHandler` is the reference implementation. Copy it to identity, catalog, and operations.
4. **Typed domain exceptions in identity-service** — `AuthService` throws bare `RuntimeException` for invalid credentials and duplicate usernames. Wrap in `InvalidCredentialsException` / `UserAlreadyExistsException` extending `DomainException`.
5. **`%prod.anotame.auth.cookie.secure=true`** — cookie secure flag must be `true` in production. Profile-gate it so local HTTP dev still works.
6. **`quarkus.hibernate-orm.database.generation=none` + Flyway** — all 4 services must stop using ORM-managed DDL in production. Each service needs a `db/migration/` directory and per-service Flyway history table.
7. **Profile-gated SQL logging** — `%dev.quarkus.hibernate-orm.log.sql=true`, off in prod. Trivial property change.

---

## Watch Out For

1. **JWT key rotation breaks active sessions (certain)** — all logged-in users get 401s immediately. Deploy all 4 services in a single release window after setting env vars in Railway. Communicate forced re-login to the client in advance.

2. **Multi-line PEM in Railway env var** — SmallRye JWT expects full PEM headers. Test with `export MP_JWT_VERIFY_PUBLICKEY="$(cat publicKey.pem)"` locally before pushing to Railway. Missing or malformed key = every request returns 401.

3. **Flyway V1 must come from `pg_dump`, not hand-written** — if V1 DDL diverges from what `hibernate update` actually created in production, Flyway will fail on checksum or "table already exists." Run `pg_dump --schema-only` per service to generate V1.

4. **`SameSite=Strict` blocks cross-origin Railway calls** — if the SvelteKit frontend and backend land on different Railway subdomains, `Strict` will silently drop the cookie. Use `Lax` (same-domain BFF proxy) or `None`+`Secure` (fully different domains). Verify Railway deployment topology before choosing.

5. **Hardcoded branch UUID in SalesService** — `UUID.fromString("ea22f4a4-...")` is tied to live client data. Any refactoring of branch resolution must fall back to this UUID during rollout; remove the fallback only after JWT claims carry the branch ID and all active sessions have refreshed.

---

## Phase Implications

Research points to three natural phases based on risk, dependency order, and effort:

### Phase 1: Security Foundations (critical path, do first)
Keys out of git, auth annotations on all controllers, cookie config. This is the highest-severity work and unblocks everything else. Requires coordinated Railway deploy of all 4 services simultaneously due to JWT key rotation.

- Remove `privateKey.pem` / `publicKey.pem` from resources; rotate key pair
- Inject keys via `SMALLRYE_JWT_SIGN_KEY` + `MP_JWT_VERIFY_PUBLICKEY` env vars
- Add `@Authenticated` (class-level) to all unguarded controllers
- Add `.env.example` at repo root documenting required vars
- `%prod.anotame.auth.cookie.secure=true`; verify `SameSite` for Railway topology

**Research flag:** Standard patterns, no additional research needed.

### Phase 2: Code Quality + Error Handling
Typed exceptions and consistent error responses across services. Low-risk (no schema changes, no auth changes), can be done service-by-service without coordinated deploy.

- Port `GlobalExceptionHandler` from sales-service to identity, catalog, operations
- Introduce `DomainException` hierarchy in identity-service
- Profile-gate SQL logging and cookie flags
- Address hardcoded branch UUID in SalesService (add JWT claim → gradual rollout)

**Research flag:** Branch UUID migration needs a careful rollout plan. Consider `/gsd:research-phase` if the JWT claim shape is uncertain.

### Phase 3: Flyway Migration
Schema management is architecturally independent but operationally the most dangerous step with a live client. Do it after security and code quality are stable.

- Add `quarkus-flyway` to all 4 services
- Generate V1 DDL via `pg_dump` per service (not hand-written)
- Configure per-service history tables (`flyway_schema_history_{service}`)
- Set `baseline-on-migrate=true` for the live DB
- Move `migration.sql` → sales-service `V2__add_unit_price_to_order_item.sql`
- Add SmallRye Health + Docker Compose health checks (natural companion to this phase)

**Research flag:** Validate against staging before touching production. V1 generation and `flyway validate` must pass in a staging environment first.

### Phase ordering rationale

- Phase 1 before Phase 2: auth annotations and secret management are immediate security risks; they must be addressed before code quality cleanup to avoid false assurance.
- Phase 2 before Phase 3: code quality changes are zero-downtime and low-risk; completing them simplifies the Flyway phase by keeping infra changes isolated.
- Phase 3 last: Flyway on a live DB is the highest-risk infrastructure change. Batching it last means the codebase is stable when the migration runs.

---

## Open Questions

These need answers before or during planning — research did not resolve them:

1. **Railway deployment topology** — are the SvelteKit frontend and Quarkus backends on the same Railway subdomain? This determines whether `SameSite=Lax` or `SameSite=None` is correct. Wrong choice = cookies silently dropped in production.

2. **Staging environment availability** — Flyway `baseline-on-migrate` must be validated against a copy of the live schema before touching production. Does a staging DB exist, or does one need to be provisioned?

3. **JWT claim shape for branch** — identity-service needs to add `branchId` to the JWT payload during Phase 2. What is the source of truth for user-to-branch mapping? Is there a `tca_user_branch` join table or is it a direct FK on `tca_user`?

4. **`anotame-web-legacy` status** — `node_modules/` may be committed, polluting security scans. Confirm whether this directory is active or can be removed entirely. If only legacy, archive or delete.

5. **Client re-login communication** — Phase 1 will force all active sessions to log out. Is there a maintenance window or communication channel to notify the live client before the JWT key rotation deploy?

---

*Research completed: 2026-03-31*
*Ready for roadmap: yes*
