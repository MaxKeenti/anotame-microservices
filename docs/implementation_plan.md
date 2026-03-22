# Svelte 5 Frontend Architecture & Migration Plan

## 1. Project Goal
Migrate the frontend architecture from Next.js to **Svelte 5 + SvelteKit**, strictly following the structural, routing, and reactivity conventions defined in `CLAUDE.md`. The backend will remain Java Spring Boot 3 Microservices with PostgreSQL.

---

## 2. Implementation Roadmap

### Phase 1: Setup & Scaffolding [NEXT]
1.  **Repository Setup**: Rename the existing Next.js `anotame-web` folder to `anotame-web-legacy`.
2.  **Scaffolding**: Bootstrap a fresh SvelteKit project in `anotame-web` using Bun.
3.  **Dependencies**: Install Tailwind CSS v4, `shadcn-svelte`, `runed`, and Paraglide.

### Phase 2: Core Architecture Setup [PENDING]
1.  **Services**: Implement `src/lib/services` utilizing the Runed-based singleton pattern for Auth and API.
2.  **Guards**: Implement client-side `$effect`-based route protection (`useAuthGuard`, `useGuestGuard`).
3.  **i18n**: Set up Paraglide messages structure (`messages/es.json`, `messages/en.json`).
4.  **Layouts**: Scaffold base routing structural layouts (`+layout.svelte`, `(app)/+layout.svelte`).

### Phase 3: Route & Component Migration [PENDING]
1.  **Public Routes**: Port the Login/Register screens.
2.  **Dashboard Shell**: Rebuild the Dashboard interface and implement the top-bar Menu Modal component.
3.  **Data Tables**: Port the Data Tables (Customers, Users) using the standardized `DataTableWrapper` and the single-dialog pattern via `sveltekit-superforms` for inserts/edits.
4.  **Wizards**: Port the order creation workflow (Customer -> Services -> Payment) to rely entirely on Svelte 5 `$state`.

### Phase 4: System Polish & Production Readiness [PENDING]
1.  **Establishment Settings**: Develop Admin UI to configure Store Name, Tax Info, and Receipt Header.
2.  **Employee Management**: Form dialogs to create users and assign access roles.
3.  **Production Verification**: Verify Docker persistence for the new Svelte SSR container.
