# GSD Merged Findings Archive

Source archive: `/Users/moonstone/.gsd/projects/b45d29e5a30d`

This is a curated archive extract, not a raw GSD runtime copy. The source directory contains 228 markdown files plus runtime JSON, execution metadata, and forensic logs. This file merges the durable content needed for future planning and records a scan against the current repo state.

## Source Material Included

| Area | Source files inspected | Archive result |
|---|---|---|
| Project state | `PROJECT.md`, `STATE.md`, `QUEUE.md`, `REQUIREMENTS.md`, `last-snapshot.md` | Current milestone state and known deferred debt extracted. |
| Decisions | `DECISIONS.md`, milestone summaries, M003 learnings | Durable decisions promoted separately into ADRs where still current. |
| Milestones | `milestones/M001`, `milestones/M002`, `milestones/M003`, `milestones/M004/M004-ROADMAP.md` | Delivery state and validation gaps summarized below. |
| Quick tasks | `quick/*/*-SUMMARY.md` | Completed tactical fixes reviewed for unresolved follow-ups. |
| Forensics | `forensics/*.md` | Workflow failures separated from product work. |
| Decisions register | `DECISIONS.md`, `KNOWLEDGE.md` | Indexed but not transcribed — most entries are codebase-derivable (component imports, framework gotchas, prop conventions); durable items already covered by ADRs or AI_RULES.md. |
| Milestone learnings | `milestones/M003/M003-LEARNINGS.md` | Indexed but not transcribed — see "Promoted Or Dropped From Learnings" below. |

## Completed Work From Archive

The following archive claims were checked against current files and appear completed or superseded:

- Service-owned PostgreSQL databases with Flyway per service are current. See `docs/adr/0001-service-owned-databases-and-flyway.md`.
- GSD runtime/scaffold artifacts are intentionally removed from the repo. See `docs/adr/0002-current-docs-only.md`.
- Strings-only localization is current policy. See `docs/adr/0003-strings-only-localization.md`.
- Mobile data grids use `CardGridWrapper` on mobile and `DataTableWrapper` on desktop. See `docs/adr/0004-responsive-data-grids.md`.
- M002 payment ledger, financial KPI panel, and workload calendar are present in current code.
- M003 at-risk customers, repeat rate, revenue per minute, configurable thresholds, and mobile card grids are present in current code.
- The duplicate `FinancialKpiResource` advisory from M003 no longer appears in the sales-service controller directory.
- `messages/es.json` and `messages/en.json` currently have key parity: 792 keys each, no missing keys on either side. (M001 shipped with 410 keys; M002 and M003 grew the dictionary to 792 in lockstep.)
- M004 is only an empty placeholder in the archive and does not contain planned work.

## Pending Work Scan

These are the items that still look meaningful after comparing archive findings with the current repo.

### 1. Localize Remaining Raw Toast Strings

Archive source: `M001-VALIDATION.md` flagged 52 of 91 toast calls as raw non-accented Spanish. The S23 grep gate missed them because it keyed on accented characters (`á é í ó ú ñ`); strings without diacritics slipped through.

The source also called out pricelist routes (`anotame-web/src/routes/(app)/dashboard/catalog/pricelists/*`) but those have since been fully extracted — every `toast.*` call there now resolves through `m["catalog.pricelist.*"]()`. The pending residue is confined to component files.

Current scan still finds raw toast strings in:

- `anotame-web/src/lib/components/orders/wizard/price-list-step.svelte`
- `anotame-web/src/lib/components/customers/customer-dialog.svelte`
- `anotame-web/src/lib/components/orders/wizard/customer-step.svelte`
- `anotame-web/src/lib/components/users/user-dialog.svelte`
- `anotame-web/src/lib/components/orders/wizard/payment-step.svelte`
- `anotame-web/src/lib/components/orders/wizard/items-step.svelte`
- `anotame-web/src/lib/components/orders/wizard/item-sub-wizard.svelte`
- `anotame-web/src/lib/components/catalog/garment-dialog.svelte`
- `anotame-web/src/lib/components/catalog/service-dialog.svelte`

Recommended completion: add Paraglide keys to both message files, replace raw toast strings with `m["..."]()`, then run `bun run lint:i18n`, a key-parity check, and `bun run build`.

### 2. Finish Backend Error-Code Contract

Archive source: `M001-VALIDATION.md` flagged I18N-05 as partial. Note: the source `REQUIREMENTS.md` simultaneously marked I18N-05 as `validated`. The two source documents disagree; this archive follows the VALIDATION report as the conservative read because no `errorCode` field is emitted by Quarkus services today.

Current state is mixed:

- Most services now have `ErrorResponse` DTOs with an `errorCode` field.
- `anotame-web/src/lib/services/api.svelte.ts` extracts `errorCode`.
- Some sales-service code still returns legacy bodies such as `Map.of("error", "...")`.
- Many UI catch blocks still display `e.message` before falling back to localized messages.

Recommended completion: define a small shared frontend resolver from `errorCode` to Paraglide keys, standardize backend error payloads across all services, and stop surfacing backend prose directly in toasts.

### 3. Add I18n Key-Parity Automation

Archive source: `last-snapshot.md` warns that message-file synchronization is manual.

Current state:

- `bun run lint:i18n` validates key naming only.
- The current ad-hoc parity check passes with 792 keys in each language.
- There is no package script or CI gate that fails when `es.json` and `en.json` drift.

Recommended completion: add a `lint:i18n:parity` script and include it in the normal frontend verification path.

### 4. Add App-Level Error Boundaries

Archive source: `PROJECT.md` deferred `+error.svelte` pages at the authenticated layout level.

Current scan found no `+error.svelte` files under `anotame-web/src/routes`.

Recommended completion: add localized `+error.svelte` handling for the public root and authenticated app layout with retry or navigation affordances.

### 5. Add Server-Side Auth Validation For Authenticated SSR

Archive source: `PROJECT.md` deferred server-side auth validation in SvelteKit hooks/layouts before SSR render.

Current state:

- `anotame-web/src/routes/(app)/dashboard/admin/+layout.server.ts` validates admin access server-side.
- The broader authenticated `(app)` layout still relies on client-side `useAuthGuard`.

Recommended completion: add an `(app)/+layout.server.ts` auth check or equivalent server-side guard so protected pages avoid SSR flashes or stale client-only authorization assumptions.

### 6. Add A Real Test Baseline

Archive source: `PROJECT.md` deferred automated backend and frontend tests.

Current scan found no backend `src/test` files and no frontend Vitest config or app test files. Only generated target directories and dependency tests exist.

Recommended completion: start with high-value regression tests around `SalesService`, `AuthService`, API error mapping, and the order wizard save/update flow.

### 7. Surface Capacity Defaults Explicitly

Archive source: `M003-VALIDATION.md` advisory.

Current state:

- UI components still silently fall back to `480` minutes when establishment capacity is absent.
- `daily_capacity_minutes` is nullable in the operations-service V1 baseline.
- Threshold columns have SQL defaults; daily capacity does not.

Recommended completion: either make the 480-minute default explicit in DB/API responses or show a clear "using default capacity" state in settings/KPI/calendar surfaces.

### 8. Decide Whether Catalog Import/Duplicate Analysis Still Matters

Archive source: quick tasks `1-*` and `3-*` created catalog import/data-migration tooling and deferred duplicate analysis.

Current state:

- Repo-local one-off scripts have been removed.
- Normal schema/data lifecycle is Flyway.

Recommended completion: treat this as inactive unless the business still needs another paper-price-sheet import. If it returns, create a fresh small workflow from current API/Flyway reality rather than restoring old scripts wholesale.

## Known Deferred Debt From PROJECT.md

The source `PROJECT.md` listed four explicit deferred-debt items separate from milestone scope. Re-scanned against the current repo:

- **`branch_id` JWT fallback in sales-service** — still present at `anotame-api/backend/sales-service/src/main/java/com/anotame/sales/infrastructure/web/controller/OrdersResource.java:37-48`. Comment marks it as intentional backward compatibility; was meant to be removed after all active sessions re-logged in post-v1.0.
- **Staging Flyway validate isolation** — operational task. Re-run `flyway validate` against a true isolated staging container before the first Railway deploy that introduces a migration beyond V2. Cannot be verified from code alone.
- **`statusUtils.ts` cleanup** — **resolved**. No references to `statusUtils` exist in `anotame-web/src` today; the CSS-based status badge migration appears complete.
- **EMPLOYEE per-step readonly props in wizard** — still deferred. `customer-step.svelte` and `items-step.svelte` have no `readonly` or `isAdmin` props; the locked-status wrapper (`pointer-events-none + opacity-60`) is the only client-side defense-in-depth. Backend already enforces role restrictions, so this remains a defense-in-depth nice-to-have, not a security gap.

## Promoted Or Dropped From Learnings

`M003-LEARNINGS.md` recorded decisions, lessons, patterns, and surprises. Their fate in the durable repo docs:

- Responsive view switching (CardGridWrapper + DataTableWrapper via `useIsMobile()`) → **promoted** to `docs/adr/0004-responsive-data-grids.md`.
- Flyway `DEFAULT` values for capacity threshold backfill → **kept as code**; the V2 migration is self-documenting.
- Establishment API consumed directly with safe defaults → **kept as code**; relevant to pending item #7 (capacity defaults).
- Svelte 5 named-snippet requirement; `getRowSelectionRowModel` non-export; arrow-function-with-type-annotation Svelte template gotcha → **dropped from durable docs** as codebase-derivable framework gotchas. Belong in commit history or AI_RULES.md if they recur.
- Duplicate `FinancialKpiResource` discovery → **closed**; the duplicate is gone from the current sales-service controller directory.
- Orders page T05/T06 wiring incident → **dropped** as transient workflow noise, not a durable lesson.

## Workflow Findings Not Product Work

The GSD forensics files describe stuck state, missing summary artifacts, and an incorrect `bun run build --dir anotame-web` verification command. These explain why GSD was unreliable, but they do not create app backlog items. The durable workflow conclusion is already captured by `docs/adr/0002-current-docs-only.md` and `docs/workflow.md`.
