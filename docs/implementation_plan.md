# Svelte 5 Frontend Architecture & Migration Plan

## 1. Project Goal
Migrate the frontend from Next.js to **Svelte 5 + SvelteKit**, following the conventions in `GEMINI.md`. The backend remains Java Quarkus Microservices with PostgreSQL.

---

## 2. Implementation Roadmap

### Phase 1: Setup & Scaffolding ✅
- Renamed `anotame-web` → `anotame-web-legacy`, scaffolded fresh SvelteKit project.
- Installed Tailwind CSS v4, `shadcn-svelte`, `runed`, Paraglide, `sveltekit-superforms`.

### Phase 2: Core Architecture ✅
- Implemented `src/lib/services` (Runed singletons: Auth, API, OrderWizardState).
- Implemented `src/lib/guards` (`useAuthGuard`, `useGuestGuard`).
- Set up Paraglide i18n (`messages/es.json`).
- Scaffolded layouts (`+layout.svelte`, `(app)/+layout.svelte`).

### Phase 3: Route & Component Migration ✅
- Public routes: Login/Register pages.
- Dashboard shell with top-bar Menu Modal.
- Customers CRUD page with single-dialog pattern.
- **Catalog Garments** CRUD page.
- **Order Wizard** (3-step: Customer → Items/Services → Payment).
- **Order Details** page with receipt generation and printing.
- **Orders Dashboard** with Active/Drafts toggle, filters.

### Phase 4: Polish & Adaptive UI ✅
- Docker deployment verified (`docker compose up --build`).
- `svelte-sonner` toast notifications system-wide.
- **Adaptive UI components** (`src/lib/components/ui/responsive/`):
  - `AdaptiveConfirm` — AlertDialog on desktop, native `confirm()` on mobile.
  - `AdaptiveSelect` — shadcn Select on desktop, native `<select>` on mobile.
  - `AdaptiveDatePicker` — Calendar popover on desktop, native date input on mobile.
  - `AdaptiveDateTimePicker` — Calendar + time on desktop, native `datetime-local` on mobile.
  - `useIsMobile` hook for viewport detection.

### Phase 5: Remaining Page Migration [CURRENT]

| Legacy Route | New Route | Status | Complexity |
|---|---|---|---|
| `catalog/services` | `catalog/services` | ❌ Not started | **High** — CRUD + 3-step wizard |
| `catalog/pricelists` | `catalog/pricelists` | ❌ Not started | Medium — CRUD + modals |
| `operations` | `operations` | ❌ Not started | Low — table + 1 action |
| `users` | `users` | ❌ Not started | Medium — CRUD + modals |
| `admin/settings` | `admin/settings` | ❌ Not started | Medium — Settings form |
| `admin/kpi` | `admin/kpi` | ❌ Not started | Low — Read-only display |
| `admin/schedule` | `admin/schedule` | ❌ Not started | High — Schedule UI |

#### Phase 5A: Catalog Services (`/dashboard/catalog/services`)
- Table with search + garment filter (`AdaptiveSelect`).
- 3-step wizard modal (garment → name/description → pricing).
- Standard edit modal, delete via `adaptiveConfirm`.
- Role guard (`isAdmin`).

#### Phase 5B: Operations Dashboard (`/dashboard/operations`)
- Filter orders by `IN_PROGRESS` status.
- "Marcar Listo" action (PATCH status → `READY`).

#### Phase 5C: User Management (`/dashboard/users`)
- CRUD with edit modal for name/email.
- Delete confirmation via `adaptiveConfirm`.
- Admin role guard.

#### Phase 5D: Admin Pages (settings, KPI, schedule)
- Lower priority. Audit legacy before implementation.

### Phase 6: Production Readiness [FUTURE]
- Establishment Settings UI (store name, tax info, receipt header).
- Full i18n coverage.
- Production Docker optimization.
