# Milestones

## v1.2 UI Standardization (Shipped: 2026-04-06)

**Phases completed:** 9 phases, 13 plans, 14 tasks

**Key accomplishments:**

- File:
- HTTP 409 FK constraint violations now show user-friendly Spanish toast messages on orders detail and operations pages, distinguishing constraint errors from network/server failures
- shadcn-svelte preset b4akO6QUQs applied with custom semantic tokens preserved, design system updated to v1.2 standards with oklch colors, Tailwind v4 integration, and build verified at code 0
- All pages and custom components verified working correctly after shadcn preset application—no API breakages, clean build, dev server running.
- Configurable filter visibility for DataTableWrapper with visual divider — eliminate duplicate filter UIs on Customers and Orders pages
- Status:
- Phase:
- Phase:
- Objective:
- Status:

---

## v1.0 Code Quality and Security (Shipped: 2026-04-03)

**Phases completed:** 7 phases, 21 plans, 22 tasks

**Key accomplishments:**

- Status
- Status
- Status
- Status
- Status
- One-liner:
- Status
- Status
- One-liner:
- InvalidCredentialsException (401), UserAlreadyExistsException (409), and ResourceNotFoundException (404) replace all 11 bare RuntimeException throws in AuthService and UserService — login now returns 401, duplicate registration returns 409
- SQL query logging disabled in production (default) and enabled only in Quarkus %dev profile across all 4 services, with property name corrected from silent `sql-formatting` to standard `log.format-sql`
- Generic DataTableWrapper component wrapping @tanstack/table-core with sorting/filter/pagination, migrating orders and customers pages from raw Table.Root to the new wrapper
- 1. [Rule 1 - Bug] Moved `balance` $derived below superForm initialization
- quarkus-flyway (BOM-managed) added to all 4 backend services with per-service history tables and prod DDL gate disabling Hibernate auto-DDL in production
- Four Flyway migration directories populated with 786-line V1__baseline.sql from live DB pg_dump, capturing auto-DDL tables (tco_work_order, tco_work_order_item) and Phase 3 sequence (tco_ticket_number_seq) absent from init.sql
- Flyway V2 migration for tco_order_item.unit_price column created in sales-service with idempotency guard; legacy repo-root migration.sql deleted
- Flyway startup validation confirmed on dev DB — 4 per-service history tables (flyway_schema_history_{identity,catalog,sales,operations}) created with zero cross-service collisions; DB-04 satisfied
- One-liner:
- wget-based /q/health/ready healthchecks added to all 4 Quarkus services; all depends_on conditions upgraded to service_healthy, eliminating race-condition startup failures

---
