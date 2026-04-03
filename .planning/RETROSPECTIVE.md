# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

---

## Milestone: v1.0 — Code Quality & Security

**Shipped:** 2026-04-03
**Phases:** 7 | **Plans:** 21 | **Sessions:** ~6

### What Was Built

- Per-user color palette customization with PersistedState store and CSS variable injection
- Full security hardening — DB credentials, JWT private key, and PgAdmin password externalized to env vars; `@Authenticated` + `@RolesAllowed` added to all unguarded controllers
- Data integrity restored in sales-service — `branchId` from JWT claims, PostgreSQL sequence for ticket numbers, real user UUID in `createdBy`
- Standardized JSON error shape `{ message, details }` across all 4 services via `GlobalExceptionHandler` + typed domain exceptions (`InvalidCredentialsException`, `UserAlreadyExistsException`, `ResourceNotFoundException`)
- `DataTableWrapper` component (TanStack Table) and `sveltekit-superforms` migration across all major frontend pages
- Flyway migration framework — `quarkus-flyway` on all 4 services, V1 baseline from live `pg_dump`, V2 unit_price migration, per-service history tables preventing cross-service collision
- SmallRye Health (`/q/health/ready`) on all 4 services; Docker Compose healthchecks with `service_healthy` dependencies

### What Worked

- **Plan checker iteration** — catching wave number errors, frontmatter mismatches, and false positive type errors before execution saved re-execution cycles
- **Research-first approach** — Phase 6 research identified the schema drift (missing `tco_work_order`, `tco_ticket_number_seq`) before planning, which prevented a broken baseline
- **Parallel Wave 1 execution** — running 07-01 (health extension) and 07-03 (housekeeping) in parallel with isolation=worktree worked cleanly with no conflicts
- **Checkpoint:human-verify gates** — the Docker Compose smoke test gate in 07-02 caught actual runtime behavior (all 4 containers confirmed healthy before marking complete)
- **Concrete plan actions** — plans with exact property values, XML blocks, and file line references produced clean execution with no re-do cycles

### What Was Inefficient

- **init.sql sync discovered late** — the `anotame-web-legacy` node_modules deletion and `init.sql` schema drift were found during Phase 6 execution rather than during research. A pre-phase codebase scan step would catch this earlier.
- **Rate limit interruptions** — two rate limit hits during Phase 6 required fresh agent continuations. Context re-serialization (completed_tasks table in continuation prompt) was effective but added overhead.
- **Docker Compose env var override limitation** — the staging validate step in Phase 6 discovered that CLI-level env vars don't override service-level definitions in docker-compose.yml. This required accepting dev DB as equivalent staging — a process gap that needs a docker-compose override file approach for next time.
- **Plan checker false positive** — one checker flagged a real SQL type mismatch that turned out to be based on stale facts in the checker prompt. Manual verification of the actual file was needed. The checker's critical_facts input needs to be file-verified, not assumed.

### Patterns Established

- **Per-service Flyway history tables** — when all services share one PostgreSQL DB, unique `quarkus.flyway.table` names per service are mandatory. Pattern: `flyway_schema_history_{service}`.
- **`baseline-on-migrate=true` + `baseline-version=1`** — for retrofitting Flyway onto existing databases; V1 is stamped as already applied without executing, only V2+ run against production.
- **Profile-gated DDL** — `%prod.quarkus.hibernate-orm.database.generation=none` with bare `update` kept for dev local bring-up. This pattern should be applied to all new Quarkus services.
- **`wget --spider` for Alpine healthchecks** — curl is absent from `eclipse-temurin:21-jre-alpine`; busybox `wget` with `--spider` is the correct tool and exits non-zero on HTTP errors.
- **`start_period: 30s`** for Quarkus healthchecks — Flyway `migrate-at-start=true` adds JVM startup time; 30s grace period prevents false unhealthy during normal startup.

### Key Lessons

1. **Schema drift audit before planning any DB phase** — run `pg_dump` against the live DB and diff against `init.sql` at research time, not discovery time. Missing tables and sequences in init.sql caused mid-plan corrections in Phase 6.
2. **Staging isolation needs a docker-compose override file** — CLI env var overrides don't work against service-defined environment blocks. Create `docker-compose.staging.yml` with DB URL overrides for true isolation.
3. **Plan checker facts must be file-verified** — when the checker is given critical_facts about existing code, those facts should be grep-verified against the actual files before being included in the checker prompt. Stale facts produce false positives.
4. **Worktree isolation for parallel plans works** — `isolation=worktree` in parallel Wave 1 execution produces clean separation. No merge conflicts observed. This pattern is reliable for plans modifying non-overlapping file sets.
5. **`branch_id` JWT claim rollout** — when adding a new JWT claim that may be null for existing sessions, always plan a fallback removal task as a follow-on. The fallback lived as a TODO comment through multiple phases.

### Cost Observations

- Model mix: ~100% Sonnet 4.6 (orchestrator + all subagents)
- Sessions: ~6 across 3 days
- Notable: Parallel Wave 1 execution (two agents simultaneously) completed in ~3 minutes total vs ~6 minutes sequential — halved wall time for independent plans. Worthwhile for waves with 2+ independent plans.

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.0 | ~6 | 7 | First milestone with GSD workflow; established all core patterns |

### Cumulative Quality

| Milestone | Test Coverage | Zero-Dep Additions | Migrations |
|-----------|-------------|-------------------|------------|
| v1.0 | 0% (deferred) | quarkus-flyway, quarkus-smallrye-health, sveltekit-superforms | 2 (V1 baseline, V2 unit_price) |
