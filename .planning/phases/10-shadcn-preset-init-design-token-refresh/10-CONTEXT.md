# Phase 10: shadcn Preset Init & Design Token Refresh - Context

**Gathered:** 2026-04-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Apply the shadcn-svelte preset `b4akO6QUQs` to refresh design tokens (colors, radii, spacing) across the frontend. Selectively merge the preset's palette with existing custom semantic tokens. Accept component regeneration and debug any breakages. Verify no visual regressions across all production pages.

</domain>

<decisions>
## Implementation Decisions

### Preset Conflict Resolution
- **D-01:** Selectively merge the preset's design tokens with the existing `layout.css`. Accept the preset's core palette (--primary, --secondary, --background, --foreground, --card, --popover, --muted, --accent, --border, --input, --ring, --chart-*) but **preserve** the existing custom semantic tokens (--warning, --warning-foreground, --warning-muted, --warning-text, --success, --success-foreground, --success-muted, --success-text, --info, --info-foreground, --info-muted, --info-text, --destructive-muted, --destructive-text) which were manually tuned for WCAG compliance in both light and dark modes.
- **D-02:** After running the preset init, manually diff the generated `layout.css` against the current version. Copy preset core tokens, keep custom semantic tokens intact, and reconcile any conflicts (e.g., if the preset redefines --destructive).

### Component Regeneration
- **D-03:** Accept full component regeneration from the preset. The 15 existing shadcn components (button, card, dialog, form, input, select, table, etc.) will be overwritten with the preset's versions.
- **D-04:** After regeneration, test all pages to identify and fix any breakages. Custom components built ON TOP of shadcn (DataTableWrapper, adaptive components in responsive/) are NOT regenerated — they import from shadcn components, so they may need adjustments if component APIs changed.

### Regression Verification
- **D-05:** Systematic regression check required — live production client. Walk through all 7 data table pages, order wizard, KPI dashboard, and all dialogs in both light and dark modes. Build verification (`bun run build`) must pass with zero errors.

### Agent's Discretion
- Exact order of operations for merging layout.css (backup → run preset → diff → manual merge)
- Whether to run `bun x shadcn-svelte init` or `bun x shadcn-svelte@latest init` for the latest CLI version

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design System
- `anotame-web/src/routes/layout.css` — Current design tokens (oklch values, semantic colors, Tailwind v4 theme)
- `anotame-web/src/lib/components/ui/` — All 15 shadcn-svelte components that will be regenerated

### Codebase Maps
- `.planning/codebase/STACK.md` — Tailwind v4, bits-ui, shadcn-svelte versions
- `.planning/codebase/CONVENTIONS.md` — Existing frontend patterns

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `anotame-web/src/routes/layout.css` — 233 lines, contains :root and .dark token blocks, @theme inline block, @layer base, and custom variants
- `anotame-web/src/lib/components/ui/` — 15 shadcn components: alert-dialog, button, calendar, card, dialog, form, input, label, popover, responsive, select, separator, sonner, table, textarea
- `anotame-web/src/lib/components/ui/DataTableWrapper.svelte` — Custom wrapper around @tanstack/table-core, imports from shadcn table/input/button
- `anotame-web/src/lib/components/ui/responsive/` — Custom adaptive components (date pickers, confirm dialog) built on top of shadcn

### Established Patterns
- Tailwind CSS v4 via `@tailwindcss/vite` — no `tailwind.config.js`, tokens defined inline in layout.css
- oklch color space used for all design tokens
- `@custom-variant dark` for dark mode scoping
- `mode-watcher` for theme switching
- `@fontsource-variable/inter` as the sans font

### Integration Points
- All route pages import from `$lib/components/ui/*`
- DataTableWrapper is used across 6 management pages
- Order wizard uses form, input, select, button, calendar, popover components
- KPI dashboard uses card components

</code_context>

<specifics>
## Specific Ideas

- Preset ID: `b4akO6QUQs` — this is the specific shadcn preset the user wants applied
- The user wants to debug breakages after regeneration rather than prevent them upfront — accept the risk and fix forward

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 10-shadcn-preset-init-design-token-refresh*
*Context gathered: 2026-04-04*
