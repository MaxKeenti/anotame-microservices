# Railway Database Refresh

`refresh-development-databases.sh` replaces the data in Anotame's Railway
`development` PostgreSQL databases with snapshots from `production`.

The script is project-specific and is pinned to the current Railway project,
environment, and database service IDs. This is intentional: if an environment
or service is recreated, the script fails until its constants are reviewed and
updated.

## Current Scope

| Context | Production source | Development target |
| --- | --- | --- |
| Identity | `Identity-DB` | `Identity-DB` |
| Catalog | `Catalog-DB` | `Catalog-DB` |
| Sales | `Sales-DB` | `Sales-DB` |
| Operations | `Operations-DB` | `Operations-DB` |

The source databases are never mutated. The script changes database contents in
the Railway `development` environment only. It does not change Railway
variables, service configuration, deployments, or production data.

## Data-Security Warning

This is a full data copy. It includes production customer PII, order notes,
payment records, staff accounts, and password hashes. After refresh, production
credentials may work against development.

Before running it:

- Confirm development access is restricted to trusted people.
- Confirm development email, SMS, payment, and webhook integrations are disabled
  or use non-production credentials.
- Keep development application services sleeping or otherwise stop development
  traffic for the refresh window.
- Do not retain dump files unless they are required for controlled recovery.

The script does not anonymize data. Add a separately reviewed sanitization step
if development must not retain production PII.

## Requirements

- Authenticated Railway CLI with access to `anotame-production`.
- `jq`, `psql`, `pg_dump`, and `pg_restore` on `PATH`.
- A `pg_dump` major version at least as new as production and matching the
  development PostgreSQL major version.
- At least 512 MiB free in the local temporary directory.

The inspected environment currently uses PostgreSQL 18 and the local Homebrew
client is PostgreSQL 18.4.

## Preflight

Run the read-only preflight first:

```bash
./scripts/railway/refresh-development-databases.sh preflight
```

For one bounded context:

```bash
./scripts/railway/refresh-development-databases.sh preflight --database sales
```

Preflight verifies:

- Railway project, environment, and service identities.
- Distinct production and development PostgreSQL clusters.
- Public connection availability, including wake-up retries for sleeping DBs.
- PostgreSQL client/server compatibility.
- Expected `public`-only schema layout.
- Target privileges, sizes, and active development sessions.

Preflight reads metadata only and does not inspect application rows.

## Execute

Refresh all four databases:

```bash
./scripts/railway/refresh-development-databases.sh execute \
  --confirm-target development \
  --accept-production-data-risk
```

Refresh one database:

```bash
./scripts/railway/refresh-development-databases.sh execute \
  --database sales \
  --confirm-target development \
  --accept-production-data-risk
```

If development has active database sessions, the script aborts. Prefer stopping
development traffic. When interruption is acceptable, it can terminate those
sessions explicitly:

```bash
./scripts/railway/refresh-development-databases.sh execute \
  --confirm-target development \
  --accept-production-data-risk \
  --terminate-target-sessions
```

## Workflow and Guarantees

Before changing development, the script:

1. Resolves connection URLs from Railway at runtime without printing them.
2. Verifies fixed project, environment, and service identities.
3. Creates private production snapshots for every selected database.
4. Creates private snapshots of the current development databases for rollback.
5. Calculates per-table content and sequence fingerprints before and after each
   dump.
6. Aborts before any replacement if production or development changed during a
   dump.

Each development database replacement is wrapped in one PostgreSQL transaction:
the existing `public` schema is dropped, recreated, and restored before commit.
A failure rolls that database back automatically.

The four databases cannot participate in one distributed transaction. If a later
database fails after earlier databases committed, the script restores the
earlier databases from their pre-refresh snapshots and verifies their
fingerprints. This is a best-effort cross-database rollback; a machine or network
failure during rollback still requires operator recovery from the retained
archives.

After each restore, the script runs `ANALYZE`, verifies schema/table/extension
counts, and compares exact per-table content fingerprints when the production
source remained stable during its dump.

## Live Production Writes

`pg_dump` produces a transactionally consistent snapshot of each individual
database. The four database dumps are taken sequentially, so they are not a
single cross-database snapshot.

By default, the script aborts before modifying development when it detects that
a production database changed while its dump was running. For an intentionally
live source, use:

```bash
./scripts/railway/refresh-development-databases.sh execute \
  --confirm-target development \
  --accept-production-data-risk \
  --allow-live-source-changes
```

That option retains the consistency guarantee of each `pg_dump`, but exact
source-versus-target content checksum verification is skipped for databases that
changed during their dump. Use a production write freeze when cross-service
snapshot consistency is required.

## Dump Retention

Temporary archives are created with owner-only permissions and deleted on normal
completion or handled failure. To retain them deliberately:

```bash
./scripts/railway/refresh-development-databases.sh execute \
  --confirm-target development \
  --accept-production-data-risk \
  --keep-dumps
```

The script prints their private temporary directory. Those files contain raw
production data and must be removed securely after use.
