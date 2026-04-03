# Plan 03-02 Summary

**Status**: Complete
**Completed**: 2026-04-01

## What was done

- Created `db/sequence-migration.sql` with `CREATE SEQUENCE IF NOT EXISTS tco_ticket_number_seq` (idempotent, must be applied before deploying updated service)
- Added `nextTicketNumber()` method signature to `OrderRepositoryPort` (domain port interface — no framework dependencies)
- Implemented `nextTicketNumber()` in `OrderPersistenceAdapter` via `SELECT nextval('tco_ticket_number_seq')` native query; `((Number) ...).longValue()` cast handles both `Long` and `BigInteger` that the JDBC driver may return
- Replaced `"ORD-" + System.currentTimeMillis() % 10000` in `SalesService.createOrder()` with `orderRepository.nextTicketNumber()`
- `folio_branch` now derives from the same sequence value as `ticketNumber` (e.g., `"ORD-00042"` -> `42`) for consistency

## Files modified

- `anotame-api/backend/sales-service/src/main/resources/db/sequence-migration.sql` (new)
- `anotame-api/backend/sales-service/src/main/java/com/anotame/sales/application/port/output/OrderRepositoryPort.java`
- `anotame-api/backend/sales-service/src/main/java/com/anotame/sales/infrastructure/persistence/adapter/OrderPersistenceAdapter.java`
- `anotame-api/backend/sales-service/src/main/java/com/anotame/sales/application/service/SalesService.java`

## Commit

65dde30: feat(03-02): replace millis-based ticket number with PostgreSQL sequence

## Deviations from Plan

None - plan executed exactly as written.

## Deployment note

Apply `sequence-migration.sql` against the database BEFORE deploying the updated service:

```bash
docker compose exec postgres psql -U postgres -d anotame_db \
  -c "CREATE SEQUENCE IF NOT EXISTS tco_ticket_number_seq START WITH 1 INCREMENT BY 1 NO CYCLE;"
```

Confirm the sequence exists:

```bash
docker compose exec postgres psql -U postgres -d anotame_db \
  -c "SELECT sequencename FROM pg_sequences WHERE sequencename = 'tco_ticket_number_seq';"
```

## Self-Check

- [x] `sequence-migration.sql` — created at `anotame-api/backend/sales-service/src/main/resources/db/sequence-migration.sql`
- [x] `OrderRepositoryPort.java` — `nextTicketNumber()` added
- [x] `OrderPersistenceAdapter.java` — `EntityManager em` injected, `nextTicketNumber()` implemented
- [x] `SalesService.java` — millis-based generation replaced with `orderRepository.nextTicketNumber()`
- [x] Commit `65dde30` exists

## Self-Check: PASSED
