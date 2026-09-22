# Anotame Microservices - Development Standards & Conventions

This document outlines the architectural, structural, and coding standards for the Anotame Microservices project. All AI assistants and developers must adhere to these guidelines to ensure consistency across the codebase.

## 1. Architecture Overview
- **Monorepo Structure**: Contains `anotame-api` (Backend), `anotame-web` (Frontend), and `docker-compose.yml` for local PostgreSQL databases.
- **Backend**: Java Quarkus Microservices (Identity, Catalog, Sales, Operations).
- **Frontend**: Svelte 5 + SvelteKit.
- **Database**: PostgreSQL.
- **Containerization**: All services are run via Docker using `docker-compose.yml`.

## 2. Backend Standards (Java Quarkus)
The backend strictly adheres to **Hexagonal Architecture** and **Domain-Driven Design (DDD)** principles.

### Architecture Layers
- **Domain**: Core business logic, entities, and models. Do not leak framework-specific dependencies here.
- **Application**: Service layer containing business use cases, orchestrating domain logic, and defining ports (interfaces).
- **Infrastructure**: Adapters for Persistence (JPA), Web (REST Controllers), and external services (Security, Email, etc.).

### Database & Entity Guidelines
- **Bounded Contexts**: Data is segregated by domain (e.g., Identity owns employees, Sales owns customers). Avoid massive shared tables; duplicate references if cross-context data is strictly needed or communicate via events/HTTP.
- **Primary Keys**: Use **UUID v4** exclusively for entity IDs.
- **Soft Deletes**: Use `deleted_at` (LocalDateTime) and `is_deleted` (boolean). Apply `@SQLDelete` and `@SQLRestriction("is_deleted = false")` on JPA entities.
- **Audit Fields**: Every transactional table must include `created_at` (`@CreationTimestamp`) and `updated_at` (`@UpdateTimestamp`).
- **Naming Conventions**: Use `snake_case` for database tables and columns (e.g., `tca_user`, `password_hash`).

## 3. Frontend Standards (Svelte 5 & SvelteKit)
The frontend uses **Svelte 5, SvelteKit**, and structured Reactivity patterns.

### Structure & Organization
- **Pages & Routing**: SvelteKit routes inside `src/routes/` (e.g., `/(app)/` for authenticated routes, `/` for public).
- **State & Logic**: Use Svelte 5 runes (`$state`, `$derived`, `$effect`).
- **Services**: Use a class-based singleton pattern leveraging `runed` (e.g., `PersistedState`) for stateful logic, placed in `src/lib/services/`.
- **Auth Guards**: Protect client routes using guards (`useAuthGuard`, `useGuestGuard`) stored in `src/lib/guards/`.
- **UI Components**: Rely exclusively on Tailwind CSS v4 classes and `shadcn-svelte` components. `src/lib/components/ui/` holds shadcn-generated primitives (plus the adaptive wrappers in `ui/responsive/`) — never put new hand-written components there. Several primitives carry project variants (see "UI Composition" below and `docs/adr/0007-primitive-first-ui.md`), so regenerate them by diffing, not overwriting. Hand-written cross-feature compositions live in `src/lib/components/common/` (exported via its barrel); feature-specific components live in `src/lib/components/<feature>/`. For forms, use the `sveltekit-superforms` single-dialog pattern. For data management pages, use `ResponsiveDataView` from `$lib/components/common` as described in `docs/adr/0004-responsive-data-grids.md`.
- **Route Pages Compose, They Do Not Style**: Route files under `src/routes/` compose primitives and compositions; they must not put visual utilities (`text-*`, `bg-*`, `border*`, `rounded*`, `shadow*`, `font-*`) on bare HTML elements. Layout utilities (`flex`, `grid`, `gap-*`, spacing) on a wrapper are fine. Extract visual treatments into a component. Enforced at build time by `bun run lint:routes`. See `docs/adr/0006-route-pages-compose.md`.
- **File Naming**: Component files use `kebab-case.svelte`, matching what `shadcn-svelte add` generates.
- **Component Props**: Declare a documented `interface Props` and destructure with `let { ... }: Props = $props()`. Do not use the `$props<{ ... }>()` generic form — it loses the named, documentable interface.
- **i18n**: All text must be internationalized using Paraglide.

### UI/UX Rules & Accessibility
- **Touch-First Design**: UI must be heavily optimized for touchscreen interactions (large touch targets, responsive layouts) and screens ≤ 1024x768px.
- **Wizards over Long Forms**: Complex actions like Order Creation must be split into logical wizard steps (e.g., 1. Customer, 2. Garment/Service, 3. Payment).
- **Navigation**: A floating bottom dock (`AppDock`) holds primary and recent sections plus a button that opens the full modal "Menu"; there is no permanent sidebar or top bar. While a page registers a bulk action, the dock swaps for `FloatingActionBar` (same `DOCK_SURFACE` style).
- **Styling**: Use **Tailwind CSS v4** only. No `<style>` blocks and no new custom CSS. `src/routes/layout.css` is the theme boundary: design tokens, shadcn-generated `@layer base` / `@custom-variant` blocks, and Tailwind v4 `@utility` definitions only — no component classes or `@apply` blobs. Prefer a Tailwind variant (`motion-reduce:`, `dark:`, `data-*:`) over a CSS selector; never write CSS that targets Tailwind's generated class names. Avoid arbitrary values when theme values exist. **Colour comes only from semantic tokens** (`primary`, `muted`, `success`, `warning`, `destructive`, `info` and their `-muted`/`-text`/`-border`/`-emphasis` variants) — never raw palette classes like `bg-red-500` or `text-white`. The tokens carry their own dark-mode values, so `dark:` colour overrides are unnecessary. Workload capacity colours come from `$lib/utils/capacity` (`capacityTone`), the single source for the low/medium/high scale. Each `--<tone>-emphasis` token aliases a palette token with `var(…)` — to change a solid tone for one theme, add a palette token (e.g. `--success-strong`) in both `:root` and `.dark` and point the emphasis at it; never put a literal colour on the emphasis alias, or `.dark` silently inherits the light value. Overlay surfaces (menus, selects, context menus) use opaque `bg-popover`, never a translucent `bg-popover/<n>`.

### UI Composition (see `docs/adr/0007-primitive-first-ui.md`)
Enforced at build time by `bun run lint:ui` (`scripts/lint-ui-composition.mjs`, part of `prebuild`) across components and routes; run it directly to see violations. When it flags a style, add or use a variant — do not relax the gate.

Reach for UI in this order: **(1)** an installed primitive and its variants → **(2)** a composition in `common/` or a feature folder → **(3)** a new variant on the primitive when a style repeats → **(4)** hand-written markup only when nothing covers it. A long `class` string at a call site means a variant is missing.

- **Never hand-roll what a primitive covers**: pick-one rows → `ToggleGroup` (`segmented`, or `tile` for card-like choices); button clusters/steppers → `ButtonGroup`; icon or `$` inside a field → `InputGroup`; label + control + error/hint → `FormField` (built on `Field`); list rows → `Item`; tabular data → `Table` or `ResponsiveDataView`; code entry → `InputOTP`; range → `Slider`; search-and-pick → `Command` (when rendering `Command.Input` through a `child` snippet, put `bind:value` on the inner input — bits-ui passes neither the value nor an input handler to `child`); alerts → `Alert` / `InlineAlert`; navigation links → `NavLink` (`tab`, `sidebar`, `chip`, `tile`, `card`, `skip`; pass `current` instead of toggling classes) and action links → `Button href`; loading/empty → `StatePanel` / `Empty`; spinners → `Spinner`; charts → `Chart` + `layerchart`; tags/chips → `Badge`. No raw `<input>`, `<select>`, `<textarea>`, `<button>`, or `<table>`, and no styled `<a>`, in components either — the dock tile is the only sanctioned exception.
- **Variants to use instead of classes**: `Button` sizes `touch` / `touch-lg` / `xl` / `icon-touch`, `step` for wizard navigation, and variant `destructive-outline` (never set `h-*`, `w-*`, `rounded-*` or `touch-manipulation` on a button); fields (`Input`, `InputGroup`, selects, pickers) are 48px by default — use `inputSize="lg"` for prominent wizard fields, never `h-*` or `rounded-*`; `Card` `tone="highlight" | "muted"` for tinted surfaces; `Alert` / `InlineAlert` tones `destructive | warning | info | success`; `Badge` `brand` / `muted` / status tones, `size="lg"`, `emphasis`; `Tabs.List variant="bordered"` for page tabs; `Text variant="metric"` sizes `sm`–`2xl` for figures; `StatePanel size="screen | page | section | inset | inline"`.
- **Shared compositions** (`$lib/components/common`): `PageContainer` wraps every dashboard page and owns its width (`full` lists, `wide` split layouts, `form` editors/records, `narrow` settings) plus section spacing and entry animation — pages add no `max-w-*`, `pb-*`, or `animate-in`. `AppShell` owns gutters and dock clearance. Also `PageHeader`, `FormField`, `CheckboxField` (checkbox + label as one 44px target), `RowActions` (edit/delete), `SimplePager`, `PaymentMethodPicker`, `IconMedallion`, `StatusBadge`.
- **Touch targets**: every interactive control is at least 44px (`touch` / `icon-touch`). Primary page actions use `touch-lg`, `w-full sm:w-auto`, with a leading icon for "create" actions.
- **Dialogs**: `Dialog.Content` defaults to `sm:max-w-md` with a mobile gutter; widen only with an `sm:`-prefixed class (`sm:max-w-lg` for two-column forms). A bare `max-w-*` removes the gutter. Close buttons use `buttonVariants`, never a copied class string.
- **Layout by width, not by device**: stack below `md` and split into columns from `md` up; do not cap a form at `max-w-md` on desktop. Use one breakpoint per decision — `useIsMobile` is 768px (`md`).
- **Formatting**: money only through `formatCurrency`, dates/numbers only with `getIntlLocale()` (both in `$lib/utils/formatUtils`) — never `'$' + x.toFixed(2)` or a hard-coded `'es-MX'`. Order/payment status codes are labelled only through `statusLabel()` from `$lib/utils/status-labels` — never a local code→message map. Never render raw backend identifiers (field names, enum codes, ISO timestamps) — map them to message keys and format dates with `formatDateTime`.
- **Accessibility**: icon-only buttons need `aria-label`; decorative icons get `aria-hidden="true"`; a group of toggles needs a group `aria-label` from its own message key; charts and other SVG-only views carry an `sr-only` text equivalent.

### Adaptive UI Components (`src/lib/components/ui/responsive/`)
The project uses **adaptive wrapper components** that render styled shadcn-svelte on desktop and native browser primitives on mobile. This ensures premium desktop UX while leveraging superior OS-native pickers on mobile.

- **`AdaptiveConfirm`**: Renders `AlertDialog` on desktop, native `confirm()` on mobile. Usage: `const ok = await adaptiveConfirm({ title, description })`.
- **`AdaptiveSelect`**: Renders shadcn `Select` on desktop, native `<select>` on mobile.
- **`AdaptiveDatePicker`**: Renders `Popover` + `Calendar` on desktop, native `<input type="date">` on mobile.
- **`AdaptiveDateTimePicker`**: Same as above but includes a time picker for `datetime-local` values.
- **`useIsMobile`**: Reactive hook using `matchMedia` for viewport detection (breakpoint: 768px).

**Rules:**
- **NEVER** use `confirm()`, `alert()`, or native `<select>` directly. Use the adaptive wrappers.
- **ALWAYS** use `toast` from `svelte-sonner` for success/error notifications.
- The `AdaptiveConfirm` singleton is mounted globally in `+layout.svelte`.
- The `adaptiveConfirm()` function is imported from `$lib/components/ui/responsive/confirm-state.svelte`.

### Svelte 5 & Vite Strict Compiler Rules
- **Component Hydration**: Never use `<svelte:component>` (it's deprecated). Instead, map it to a standard Uppercase variable `{@const IconComponent = item.icon}` and call it `<IconComponent />`.
- **{@const} Placements**: The Svelte compiler mandates that `{@const}` tags MUST sit immediately as a direct child of a logical block like `{#each}` or `{#if}`. Do not nest them inside raw HTML `<div>` blocks!
- **State Prop Catch-alls**: Destructuring an initial `$props()` variable directly into a `$state()` literal will throw compilation hydration warnings (`did you mean to reference it inside a derived?`). To intentionally hydrate once without warning, intercept the assignment (`let ref = props.val; let state = $state(ref)`).
- **A11y Strictness**: All semantic `<label>` elements MUST be strongly chained to interactive inputs via `for=` and `id=` syntax.
- **No `$state` in `<script module>`**: Svelte 5 runes (`$state`, `$derived`) cannot be used in `<script module>` / `<script context="module">` blocks. If you need module-level reactive state, extract it to a separate `.svelte.ts` file.
- **Snippets inside component children become props**: a `{#snippet name()}` placed directly inside `<Component>…</Component>` is passed to that component as a prop, which fails type-checking if it is not declared. Declare shared cell/row snippets at the top level of the file, outside wrappers like `PageContainer`.
- **Self-closing HTML tags**: The Svelte compiler warns on self-closing non-void HTML elements (e.g., `<div />`). Always use `<div></div>`.

## 4. Workflows & General Rules
- Always verify changes via `bun run build` (exit code 0) before committing.
- Verify end-to-end via `docker compose up --build`.
- Respect the existing module boundaries.
- For documentation sources of truth, consult `docs/README.md`.
- For current setup and service topology, consult `README.md` and the service-specific READMEs.
- Historical GSD context is read-only and lives outside the repo; see `docs/workflow.md`.
