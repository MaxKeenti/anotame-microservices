# Requirements: Anotame — Milestone 1 (Code Quality & Security)

**Defined:** 2026-03-31
**Core Value:** A laundry business staff member can take a complete order — from walk-in to ticket — without confusion, on any device, in under two minutes.

---

## Milestone 1 Requirements

All items below represent the "full audit cleared" goal from `docs/standardization_plan.md`.
Ordered by delivery sequence: WIP close → security → data integrity → quality → operations → housekeeping.

### WIP Closure

- [x] **WIP-01**: `feat--ui-color-standardization` branch is completed and merged to main

### Security

- [x] **SEC-01**: Database credentials are not hardcoded in any `application.properties` — resolved via env vars (`QUARKUS_DATASOURCE_USERNAME`, `QUARKUS_DATASOURCE_PASSWORD`) across all 4 services
- [x] **SEC-02**: JWT private key is not present in the repository — PEM files excluded via `.gitignore`, key rotated, new key injected via env var (`SMALLRYE_JWT_SIGN_KEY`, `MP_JWT_VERIFY_PUBLICKEY`)
- [x] **SEC-03**: Auth cookie `secure` flag is `true` in production — `%prod.anotame.auth.cookie.secure=true` in identity-service; `%dev` override allows `false` for local development
- [x] **SEC-04**: `OperationsController` and `ScheduleController` are protected with `@Authenticated` at class level
- [x] **SEC-05**: `UserController` (identity-service) is protected with `@Authenticated` + `@RolesAllowed("ADMIN")` on management endpoints
- [x] **SEC-06**: PgAdmin password is not a hardcoded literal in `docker-compose.yml` — moved to `.env` file

### Data Integrity

- [x] **DATA-01**: Order `branchId` is resolved from the authenticated user's JWT claims — not a hardcoded UUID
- [x] **DATA-02**: Order ticket numbers are generated from a PostgreSQL sequence — no collision under concurrent order creation
- [x] **DATA-03**: Order `createdBy` field stores the user's actual UUID from the JWT — not a `UUID.nameUUIDFromBytes` hash

### Code Quality & Consistency

- [x] **QUAL-01**: All 4 services return a consistent JSON error shape `{ "message": "...", "details": [] }` for all error responses — `GlobalExceptionHandler` present in identity, catalog, and operations services
- [x] **QUAL-02**: Identity-service throws typed domain exceptions (`InvalidCredentialsException`, `UserAlreadyExistsException`) instead of bare `RuntimeException`
- [x] **QUAL-03**: SQL query logging is gated to the `%dev` profile in all 4 services — production logs are clean
- [x] **QUAL-04**: Frontend `DataTableWrapper` component exists wrapping TanStack Table — used by at least orders and customers pages
- [ ] **QUAL-05**: All form/dialog components use `sveltekit-superforms` — order wizard steps, schedule page, and settings page migrated

### Database Migrations

- [ ] **DB-01**: `quarkus-flyway` extension added to all 4 services — `database.generation=update` replaced with `validate` in production
- [ ] **DB-02**: Each service has a `V1__baseline.sql` generated from the live database schema using `pg_dump --schema-only`
- [ ] **DB-03**: `migration.sql` at repo root converted to `V2__add_unit_price_to_order_item.sql` in sales-service Flyway migrations
- [ ] **DB-04**: Each service uses an independent Flyway history table (`flyway_schema_history_{service}`)

### Operational Reliability

- [ ] **OPS-01**: All 4 backend services have Docker Compose `healthcheck` entries using `/q/health/ready`
- [ ] **OPS-02**: `quarkus-smallrye-health` extension added to all 4 services

### Housekeeping

- [ ] **HOUSE-01**: `.env.example` updated — all `NEXT_PUBLIC_*` references replaced with `PUBLIC_*`
- [ ] **HOUSE-02**: `anotame-web-legacy/node_modules/` and `anotame-web-legacy/.next/` deleted and added to `.gitignore`
- [ ] **HOUSE-03**: `x-user-name` header added to `sales-service` CORS `allowed-headers` config

---

## Future Milestone Requirements (Deferred)

### Theming & Customization (needs design phase)

- **THEME-01**: Each tenant can configure font and primary color palette via an in-app settings screen
- **THEME-02**: Theme preferences are persisted per user/tenant and applied on next login

### KPI Intelligence (needs design phase)

- **KPI-01**: Dashboard shows order completion forecast based on historical throughput
- **KPI-02**: Budget tracking view showing revenue vs projected costs per period
- **KPI-03**: Order load prediction — flagging dates with high scheduled volume

### Testing Baseline (deferred)

- **TEST-01**: `@QuarkusTest` coverage for `SalesService` — order creation and dashboard metrics
- **TEST-02**: `@QuarkusTest` coverage for `AuthService` — login, register, invalid credentials
- **TEST-03**: Vitest + `@testing-library/svelte` setup for frontend
- **TEST-04**: Frontend test coverage for auth guard, API service, and order wizard steps

### Architecture (deferred)

- **ARCH-01**: Server-side auth validation in SvelteKit `hooks.server.ts` before SSR render
- **ARCH-02**: `+error.svelte` pages at `(app)` layout level with retry/graceful degradation

---

## Out of Scope (Milestone 1)

| Feature | Reason |
|---------|--------|
| Automated test suite | Deferred — structural fixes must land before tests are worth writing |
| API gateway (Nginx/Traefik) | Future scale concern; SvelteKit BFF proxy is sufficient now |
| Multi-tenancy at DB level | Future architecture concern; single DB is an accepted trade-off |
| IBM requirements documentation | Technical debt, not Milestone 1 priority |
| Inter-service event bus | Catalog name denormalization is acceptable for now |
| i18n / Paraglide rollout | All strings hardcoded Spanish; large effort deferred to dedicated phase |

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| WIP-01 | Phase 1 | Complete |
| SEC-01 | Phase 2 | Complete |
| SEC-02 | Phase 2 | Complete |
| SEC-03 | Phase 2 | Complete |
| SEC-04 | Phase 2 | Complete |
| SEC-05 | Phase 2 | Complete |
| SEC-06 | Phase 2 | Complete |
| DATA-01 | Phase 3 | Complete |
| DATA-02 | Phase 3 | Complete |
| DATA-03 | Phase 3 | Complete |
| QUAL-01 | Phase 4 | Complete |
| QUAL-02 | Phase 4 | Complete |
| QUAL-03 | Phase 4 | Complete |
| QUAL-04 | Phase 5 | Complete |
| QUAL-05 | Phase 5 | Pending |
| DB-01 | Phase 6 | Pending |
| DB-02 | Phase 6 | Pending |
| DB-03 | Phase 6 | Pending |
| DB-04 | Phase 6 | Pending |
| OPS-01 | Phase 7 | Pending |
| OPS-02 | Phase 7 | Pending |
| HOUSE-01 | Phase 7 | Pending |
| HOUSE-02 | Phase 7 | Pending |
| HOUSE-03 | Phase 7 | Pending |

**Coverage:**
- Milestone 1 requirements: 24 total
- Mapped to phases: 24
- Unmapped: 0

---
*Requirements defined: 2026-03-31*
*Last updated: 2026-03-31 after initialization*
