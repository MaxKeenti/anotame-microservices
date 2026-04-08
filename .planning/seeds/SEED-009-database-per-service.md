---
id: SEED-009
status: dormant
planted: 2026-04-07
planted_during: v1.3 Advanced Operations
trigger_when: During architecture review
scope: Medium
---

# SEED-009: Database Per Service Architecture

## Why This Matters

Currently, the microservices architecture likely shares a unified database or monolithic data layer. Separating the database per service improves **resilience** — a database failure or schema issue in one service won't cascade to others. Each service can maintain independent schema versions, optimize for its specific data model, and scale independently without blocking other services.

This also enables:
- Independent service deployments without coordinating schema changes
- Easier horizontal scaling of high-volume services
- Clear data ownership boundaries
- Ability to choose different database technologies per service needs

## When to Surface

**Trigger:** During a planned architecture review or redesign phase

This seed should be presented during `/gsd-new-milestone` when the milestone scope includes:
- Database architecture refactoring
- Microservices scaling or resilience improvements
- Cross-service communication redesign
- Performance optimization at the data layer

## Scope Estimate

**Medium** — A phase or two

Breaking this down would likely involve:
- Phase 1: Schema analysis and data ownership mapping across services
- Phase 2: Database replication/migration strategy and implementation
- Phase 3: Update service connections and verify data consistency

Could potentially be combined with other architecture improvements in a larger milestone.

## Breadcrumbs

Related files in the current codebase:

- `./anotame-api/backend/README.md` — API service documentation
- `./anotame-db/docs/anotame-db.md` — Current database documentation
- `.planning/PROJECT.md` — Project context and requirements
- `.planning/ROADMAP.md` — Existing phase structure and completed work
- `.planning/STATE.md` — Decision history and architectural choices

## Notes

This idea emerged during work on Phase 15 (Order Lifecycle Improvements) discussions about managing order data across tenant boundaries. The benefits of per-service databases become increasingly apparent as the system scales with multiple tenants and higher operational complexity.

Consider: Would this be better as part of a v2.0 architectural overhaul, or can it be incremental per-service migration starting with services that would benefit most (e.g., operations-service, auth-service)?
