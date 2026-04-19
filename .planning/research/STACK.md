# Stack Research — v1.5 Bilingual Launch + KPI Intelligence

**Domain:** Garment-repair / alteration shop SaaS (Anotame — adding bilingual UX, payment ledger, KPIs, workload calendar)
**Researched:** 2026-04-19
**Confidence:** HIGH (all libraries verified against current ecosystem; versions checked against npm/Maven BOM)

**Scope boundaries:**
- Already in the stack, NOT re-researched: Quarkus 3.27.2, SvelteKit 5, Svelte 5 runes, PostgreSQL, Flyway, shadcn-svelte, TanStack Table, Tailwind CSS v4, sveltekit-superforms, formsnap.
- In scope: stack additions/changes needed for Paraglide i18n, chart rendering, calendar UI, payment ledger backend.

---

## Recommended Stack Additions

### Core Technologies (NEW for v1.5)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| `@inlang/paraglide-js` | `^2.x` (latest) | Compile-time i18n for SvelteKit — message extraction, tree-shaking, type-safe keys | Already selected per AI_RULES.md. Compile-time approach eliminates runtime bundle overhead; tree-shakes unused messages per route. The specialized SvelteKit adapter is deprecated — use core package + `paraglideVitePlugin` directly. |
| `chart.js` | `^4.4` | Revenue trend, service profitability, delta charts | De-facto standard for canvas-based charts in JS; Svelte 5 integration via native `$effect` rune + `bind:this` on `<canvas>`. No Svelte-specific wrapper needed — direct Chart.js is more flexible and avoids stale wrapper deps. Tree-shake by registering only needed controllers/scales. |

### Supporting Libraries (NEW for v1.5)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@inlang/paraglide-js` CLI | (bundled) | `npx @inlang/paraglide-js init` scaffolds message files, `project.inlang/`, and Vite plugin config | One-time setup at start of i18n phase |
| `svelte-chartjs` | `^3.x` | Optional Chart.js Svelte wrapper providing `<Line>`, `<Bar>`, `<Doughnut>` components | **Alternative to native integration** — use if team prefers declarative chart components over imperative Chart.js API. Adds ~2KB. Evaluate against native approach during plan-phase. |
| Custom Svelte calendar grid | N/A (hand-rolled) | Month-view calendar with color-coded day cells + popover | **Preferred over FullCalendar** — we need colored cells with popovers, not time-slot event blocks. FullCalendar is 90KB+ for features we won't use. Custom grid is ~200 lines of Svelte, uses existing shadcn `Popover` component. |

### Development Tools (NEW for v1.5)

| Tool | Purpose | Notes |
|------|---------|-------|
| Paraglide VS Code extension (`inlang.vs-code-extension`) | Autocomplete for message keys, inline previews | Install alongside Paraglide init; provides `m.order.createWizard.title` autocomplete in `.svelte` files |
| Message key lint regex | Enforce 3-segment `domain.component.purpose` convention | Add to CI or pre-commit: `/^[a-z][a-zA-Z]*(\.[a-z][a-zA-Z]*){1,2}$/` — see FEATURES.md §5 |

---

## Installation

```bash
# Frontend — i18n
npx @inlang/paraglide-js@latest init
# (follow prompts to select es-MX + en as languages)

# Frontend — charts
cd anotame-web
bun add chart.js

# Frontend — calendar
# No external dep needed — custom Svelte component using existing shadcn Popover + Tailwind grid

# Backend — no new deps required for v1.5
# Quarkus i18n approach: error CODES from backend, text from frontend Paraglide catalog
# No @MessageBundle or quarkus-qute needed (see ARCHITECTURE.md)
```

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| `@inlang/paraglide-js` (core) | `@inlang/paraglide-sveltekit` adapter | **Never** — adapter is deprecated; core package handles SvelteKit natively via Vite plugin |
| `chart.js` (native integration) | `svelte-chartjs` wrapper | If declarative `<Line {data} />` syntax is strongly preferred; wrapper handles lifecycle but adds dependency risk |
| `chart.js` (native) | LayerChart (D3-based Svelte) | If we need highly custom, SVG-based visualizations. Overkill for standard line/bar charts; consider for v2+ if KPIs need interactive drill-down |
| Custom Svelte calendar grid | FullCalendar (`@fullcalendar/core` + `@fullcalendar/daygrid`) | If we later need time-slot scheduling (e.g., hourly appointments). For v1.5's color-coded-cells-with-popover model, FullCalendar is 90KB+ of unused complexity |
| Custom Svelte calendar grid | `svelte-calendar` / `date-picker-svelte` | These are date *pickers*, not workload-display calendars. Wrong tool. |
| Error codes from backend / frontend resolves | Quarkus `@MessageBundle` i18n | If we had dozens of backend-rendered HTML pages; for a REST API + SPA architecture, error codes keep the translation catalog in one place (the frontend) |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `@inlang/paraglide-sveltekit` | Deprecated — functionality folded into core `@inlang/paraglide-js` | `@inlang/paraglide-js` with `paraglideVitePlugin` in `vite.config.ts` |
| `i18next` / `svelte-i18next` | Runtime-only i18n — no tree-shaking, no compile-time type safety, larger bundle | `@inlang/paraglide-js` — compile-time, zero-runtime for unused messages |
| FullCalendar for v1.5 | 90KB+ for features we won't use (time-slot events, drag-drop); month-grid with color cells is custom-trivial | Custom ~200-line Svelte grid component using `shadcn Popover` + Tailwind CSS grid |
| `svelte-chartjs` older versions (<3.x) | Svelte 4 only; breaks with Svelte 5 runes | Either `svelte-chartjs@3+` (Svelte 5 compatible) or native Chart.js with `$effect` |
| WebSocket for dashboard | Nobody at a garment shop stares at live dashboards; reload-on-visit is sufficient | Server-rendered values on page load; optional "last updated" timestamp |
| Quarkus `@MessageBundle` for error text | Duplicates translation catalog between backend `.properties` and frontend Paraglide messages | Backend returns error code strings (e.g., `ERR.ORDER.LOCKED`); frontend resolves to localized text via Paraglide |

---

## Stack Patterns by Variant

**If Paraglide extraction produces 1000+ keys:**
- Use `domain.component.purpose` naming (max 3 segments) — see FEATURES.md §5
- Enable the lint regex in CI to prevent convention decay
- Consider splitting messages into per-domain files if Paraglide supports it (check docs at init time)

**If Chart.js performance is sluggish on 12-month revenue charts:**
- Register only needed modules (no `chart.js/auto`): `LineController`, `BarController`, `LinearScale`, `CategoryScale`, `PointElement`, `LineElement`, `BarElement`, `Tooltip`, `Legend`
- Limit data points to 12 buckets (already planned) — not raw daily data

**If calendar grid needs week-view later (v2+):**
- Refactor custom grid to accept `viewMode: 'month' | 'week'` prop
- If week-view requires hour-blocks, then evaluate FullCalendar at that point — not before

---

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| `@inlang/paraglide-js@^2` | SvelteKit 5 + Vite 6 | Uses `paraglideVitePlugin` — drop into existing `vite.config.ts` alongside `sveltekit()` |
| `chart.js@^4.4` | Svelte 5 | No framework-specific adapter needed; uses `<canvas>` + `$effect` lifecycle |
| `svelte-chartjs@^3` | `chart.js@^4` + Svelte 5 | Verify Svelte 5 runes compatibility at install time |
| Quarkus 3.27.2 | No new backend deps | Error codes approach means no new i18n library on backend |

---

## Sources

- [Paraglide JS — inlang GitHub](https://github.com/opral/monorepo/tree/main/inlang/packages/paraglide) — Vite plugin setup, SvelteKit integration pattern
- [Paraglide JS — inlang docs](https://inlang.com/m/gerre34r/library-inlang-paraglideJs) — message keys, tree-shaking, locale switching
- [Chart.js — official docs](https://www.chartjs.org/docs/latest/) — v4.x API, tree-shaking guide, responsive configuration
- [Svelte 5 + Chart.js integration](https://dev.to/svelte-chart-integration) — `$effect` + `bind:this` pattern for canvas charts
- [Quarkus i18n guide](https://quarkus.io/guides/qute-reference#type-safe-message-bundles) — `@MessageBundle` approach (considered and rejected for SPA architecture)
- [Locize — i18n key naming guide](https://www.locize.com/blog/guide-to-i18n-key-naming/) — domain-based namespacing, max 2-3 levels

---
*Stack research for: garment-repair shop SaaS (Anotame / El hilvan) — v1.5 additions*
*Researched: 2026-04-19*
