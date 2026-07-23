# Documentation Sources of Truth

This repository keeps current, maintained documentation only. Historical planning artifacts and GSD runtime files live outside the repo and should not be treated as source material unless explicitly referenced for archaeology.

## Current Documents

- [README.md](../README.md) — local setup, service topology, and deployment environment overview.
- [AI_RULES.md](../AI_RULES.md) — engineering standards for agents and contributors.
- [CONTEXT.md](../CONTEXT.md) — domain glossary and canonical business language.
- [SETUP_JWT_KEYS.md](../SETUP_JWT_KEYS.md) — JWT key setup for deployed services.
- [anotame-api/backend/README.md](../anotame-api/backend/README.md) — backend service workflow.
- [anotame-web/README.md](../anotame-web/README.md) — frontend workflow.
- [workflow.md](./workflow.md) — agent workflow and historical GSD archive pointer.
- [backend-consolidation-client-access-plan.html](./backend-consolidation-client-access-plan.html) — cost reduction, database consolidation, and client access rollout plan.
- [phase-0-prerequisites.md](./phase-0-prerequisites.md) — Phase 0 evidence sources, unresolved external inputs, and branch-contract deployment order.
- [http-access-log-observability-plan.md](./http-access-log-observability-plan.md) — normalized HTTP event contract, staging validation, runtime memory evidence, and staging-first promotion policy.
- [phase-0-runtime-baseline-2026-07-22.md](./phase-0-runtime-baseline-2026-07-22.md) — controlled 1,000-request staging samples, protected JVM/datasource telemetry, passive production baseline, and the resulting optimization-gate decision.
- [adr/](./adr/) — durable decisions that are hard to reverse or surprising without context.
- [archive/](./archive/) — non-canonical extracts from historical planning systems.

## Archive Policy

The GSD archive at `/Users/moonstone/.gsd/projects/b45d29e5a30d` is read-only context. Use it to reconstruct why work happened, then capture only durable conclusions in `CONTEXT.md`, `docs/adr/`, or the relevant README.

Do not reintroduce generated GSD bundles, MCP configs, one-off migration scripts, or stale roadmap documents as current documentation. If historical context must live in the repo, keep it under `docs/archive/` and mark it non-canonical.
