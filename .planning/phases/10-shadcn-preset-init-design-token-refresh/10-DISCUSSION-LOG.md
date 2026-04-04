# Phase 10: shadcn Preset Init & Design Token Refresh - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-04
**Phase:** 10-shadcn-preset-init-design-token-refresh
**Areas discussed:** Preset conflict resolution, Component regeneration, Regression verification scope

---

## Preset Conflict Resolution

| Option | Description | Selected |
|--------|-------------|----------|
| Accept preset wholesale | Replace all current tokens with preset output | |
| Selectively merge | Keep custom semantic tokens, adopt preset core palette | ✓ |

**User's choice:** Selectively merge — preserve custom semantic tokens (--warning, --success, --info variants) which were manually tuned for WCAG compliance, accept preset's core palette tokens.
**Notes:** The user has 30+ custom design tokens in layout.css. The semantic color system (warning/success/info/destructive with -foreground/-muted/-text variants) was carefully tuned for contrast in both light and dark modes and should not be overwritten.

---

## Component Regeneration

| Option | Description | Selected |
|--------|-------------|----------|
| Accept regeneration | Run preset init, let it overwrite all 15 components, debug breakages | ✓ |
| Preserve current components | Only update tokens, skip component regeneration | |

**User's choice:** Accept regeneration and debug breakages — fix-forward approach.
**Notes:** Custom components built on top of shadcn (DataTableWrapper, adaptive components) are not regenerated but may need adjustments if shadcn component APIs change.

---

## Regression Verification Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Quick smoke test | Check key pages briefly | |
| Systematic walkthrough | All 7 data table pages + wizard + KPI + all dialogs, both themes | ✓ |

**User's choice:** Systematic — live production client means visual regressions are immediately visible.
**Notes:** Build verification (bun run build) must also pass with zero errors.

---

## Agent's Discretion

- Exact merge workflow for layout.css (backup → run → diff → merge)
- CLI version choice for shadcn-svelte init

## Deferred Ideas

None
