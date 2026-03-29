# Migration Gap Analysis & Future Roadmap

**Status**: Phase 5 — Remaining Page Migration
**Source**: Gap Analysis of `anotame-web-legacy` (Next.js) vs `anotame-web` (Svelte 5)

## Overview
This document tracks functional modules from the legacy system and their migration status. Modules are prioritized for development to achieve feature parity.

---

## 1. Core Application Pages

### Fully Migrated ✅
| Module | Legacy | Modern | Notes |
|---|---|---|---|
| Login/Register | `app/(auth)/` | `routes/login/` | Auth guards, token storage |
| Dashboard Shell | `app/dashboard/layout` | `routes/(app)/+layout` | Menu modal, responsive nav |
| Customers CRUD | `dashboard/customers` | `dashboard/customers` | Single-dialog pattern, search |
| Garments CRUD | `dashboard/catalog/garments` | `dashboard/catalog/garments` | Admin role guard |
| Orders Dashboard | `dashboard/orders` | `dashboard/orders` | Active/Drafts toggle, filters |
| Order Details | `dashboard/orders/[id]` | `dashboard/orders/[id]` | Receipt printing, status actions |
| Order Wizard | `dashboard/orders/new` | `dashboard/orders/new` | 3-step: Customer→Items→Payment |

### Not Yet Migrated ❌
| Module | Legacy | Priority | Complexity |
|---|---|---|---|
| **Catalog Services** | `catalog/services` | High | 400-line CRUD + 3-step wizard modal |
| **Catalog Pricelists** | `catalog/pricelists` | Medium | CRUD + temporal validity |
| **Operations Dashboard** | `operations` | High | Table + "Marcar Listo" action |
| **User Management** | `users` | Medium | CRUD + edit/delete modals |
| **Admin Settings** | `admin/settings` | Medium | Establishment config form |
| **Admin KPIs** | `admin/kpi` | Low | Read-only metrics |
| **Admin Schedule** | `admin/schedule` | Low | Work days / shifts UI |

---

## 2. Advanced Pricing Strategy (Priority: High)
The legacy system supported dynamic "Price Lists" (`Lista de Precios`). Current system only supports static `base_price`.

### Missing Functionality
- **Multiple Price Lists**: Named lists (e.g., "Winter 2025", "VIP").
- **Temporal Validity**: Start/End dates for price lists.
- **Service-Specific Overrides**: Per-service pricing within a list.

### Legacy Tables Reference
- `tci03_lista_precio`, `tci02_servicio_lista_precio`, `tci01_estado_lista_precio`

---

## 3. Work Scheduling & Establishment Rules (Priority: Medium)
The legacy system modeled establishment constraints (working days, holidays, shifts).

### Missing Functionality
- **Work Days**: Defining operational days (Mon-Sun).
- **Holidays**: Non-working dates.
- **Shifts**: Employee start/end times.

### Legacy Tables Reference
- `tce04_dia_laboral`, `tce05_dia_descanso`, `tce06_empleado_horario`, `tce08_horario`

---

## 4. Operations & Cashier (Priority: High) — Partially Resolved

| Feature | Status |
|---|---|
| Ticket/Receipt Printing | ✅ Resolved — `receipt-generator.ts` |
| Payment Tracking (`amountPaid`, `paymentMethod`) | ✅ Resolved |
| Ticket Number Auto-generation | ✅ Resolved |
| Operations Dashboard (IN_PROGRESS view) | ❌ Not migrated — Phase 5B |
| Establishment Config UI | ❌ Not migrated — Phase 5D |

---

## 5. Deprecated / Excluded Modules
- **Appointment Management (Citas)**: `tci05_cita` — intentionally excluded from migration.

---

## 6. Modern Architecture Enhancements (Not in Legacy)
Features added in the modern stack that didn't exist in legacy:

| Feature | Details |
|---|---|
| **Adaptive UI** | Desktop: shadcn-svelte styled. Mobile: native OS pickers |
| **Toast Notifications** | `svelte-sonner` for all success/error feedback |
| **Draft Orders** | LocalStorage-persisted wizard drafts with resume |
| **Soft Deletes** | All entities use `is_deleted` + `deleted_at` pattern |
| **Bounded Contexts** | Proper DDD microservice separation |
