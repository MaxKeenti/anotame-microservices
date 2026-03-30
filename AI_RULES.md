# Anotame Microservices - Development Standards & Conventions

This document outlines the architectural, structural, and coding standards for the Anotame Microservices project. All AI assistants and developers must adhere to these guidelines to ensure consistency across the codebase.

## 1. Architecture Overview
- **Monorepo Structure**: Contains `anotame-api` (Backend), `anotame-web` (Frontend), `anotame-web-legacy` (deprecated Next.js), and `anotame-db` (Database).
- **Backend**: Java Quarkus Microservices (Identity, Catalog, Sales, Operations).
- **Frontend**: Svelte 5 + SvelteKit.
- **Database**: PostgreSQL with PostGIS support.
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
- **UI Components**: Rely exclusively on Tailwind CSS v4 classes and `shadcn-svelte` components placed in `src/lib/components/ui/`. For forms/tables, strictly use `sveltekit-superforms` single-dialog pattern and `DataTableWrapper` with TanStack table.
- **i18n**: All text must be internationalized using Paraglide.

### UI/UX Rules & Accessibility
- **Touch-First Design**: UI must be heavily optimized for touchscreen interactions (large touch targets, responsive layouts) and screens ≤ 1024x768px.
- **Wizards over Long Forms**: Complex actions like Order Creation must be split into logical wizard steps (e.g., 1. Customer, 2. Garment/Service, 3. Payment).
- **Navigation**: Use a modal "Menu" accessible from the top bar instead of a permanent sidebar.
- **Styling**: Use **Tailwind CSS v4**. Avoid arbitrary values when theme values exist.

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
- **Self-closing HTML tags**: The Svelte compiler warns on self-closing non-void HTML elements (e.g., `<div />`). Always use `<div></div>`.

## 4. Workflows & General Rules
- Always verify changes via `bun run build` (exit code 0) before committing.
- Verify end-to-end via `docker compose up --build`.
- Respect the existing module boundaries.
- For new features, always consult `docs/implementation_plan.md` to align with the roadmap.
- For migration status, consult `docs/migration_gap_analysis.md`.