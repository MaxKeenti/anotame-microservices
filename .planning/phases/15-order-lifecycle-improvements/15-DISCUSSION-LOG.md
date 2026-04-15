# Phase 15: Order Lifecycle Improvements - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-07
**Phase:** 15-order-lifecycle-improvements
**Areas discussed:** Edit Order UX, Edit Roles & Audit Trail, Editable Fields & Restrictions, Delivery Confirmation, Bulk Actions Scope, Bulk Selection UI

---

## Edit Order UX

| Option | Description | Selected |
|--------|-------------|----------|
| Dedicated edit page | Route /orders/[id]/edit loads wizard pre-populated | ✓ |
| Edit dialog / sheet | Slide-over sheet on the detail page | |
| Inline fields | Click-to-edit fields on detail page | |

**User's choice:** Dedicated edit page
**Notes:** Already linked from the orders list with `href="/dashboard/orders/${row.original.id}/edit"`.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Reuse wizard steps | Pre-populate existing 3 wizard steps | ✓ |
| Single-page edit form | All fields on one page, no step navigation | |

**User's choice:** Reuse wizard steps
**Notes:** Less new code, consistent with order creation flow.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Order detail page | Navigate to /orders/[id] after save | ✓ |
| Orders list page | Go back to /orders list | |
| Stay on edit page | Success toast, stay on edit page | |

**User's choice:** Order detail page

---

## Edit Roles & Audit Trail

| Option | Description | Selected |
|--------|-------------|----------|
| ADMIN only | Only ADMIN can edit orders | |
| ADMIN and OPERATOR | Both roles can edit | |
| Role-based field restrictions | ADMIN: all fields; OPERATOR: subset of fields | ✓ |

**User's choice:** Role-based field restrictions
**Notes:** User also requested audit trail ("flags of who CRUD what").

---

| Option | Description | Selected |
|--------|-------------|----------|
| Record who edited + timestamp | updatedBy + updatedAt on order | |
| Full field-level diff log | order_audit_log table: field, old_value, new_value, who, when | ✓ |
| No audit trail | Just update, no record | |

**User's choice:** Full field-level diff log

---

| Option | Description | Selected |
|--------|-------------|----------|
| Notes / observations | OPERATOR can edit | ✓ |
| Due date / promised date | OPERATOR can edit | ✓ |
| Payment status | OPERATOR can edit | ✓ |
| Status only | OPERATOR can only change status | |

**User's choice:** Notes, due date, payment status (not garment/service/customer)

---

| Option | Description | Selected |
|--------|-------------|----------|
| New DB table in sales-service | order_audit_log table | ✓ |
| Append to order entity as JSON column | JSONB change_log column | |
| Decide later | Defer audit trail | |

**User's choice:** New DB table in sales-service

---

## Editable Fields & Restrictions

| Option | Description | Selected |
|--------|-------------|----------|
| Lock DELIVERED and CANCELLED | RECEIVED, IN_PROGRESS, READY are editable | ✓ |
| Lock only DELIVERED | CANCELLED orders still editable | |
| ADMIN overrides all locks | ADMIN can edit any status | |

**User's choice:** Lock DELIVERED and CANCELLED for all roles.

---

| Option | Description | Selected |
|--------|-------------|----------|
| No — customer locked after creation | Cannot change customer | |
| Yes — ADMIN can reassign customer | ADMIN can change customer on an order | ✓ |

**User's choice:** ADMIN can reassign customer.

---

## Delivery Confirmation

**User raised this topic** — wanted a view for READY orders and delivery timestamp.

| Option | Description | Selected |
|--------|-------------|----------|
| Filter in /dashboard/operations | READY filter, default view unchanged | ✓ |
| Dedicated delivery page | New /dashboard/orders/delivery route | |
| From order detail page only | Staff opens individual order | |

**User's choice:** Filter in /dashboard/operations

---

| Option | Description | Selected |
|--------|-------------|----------|
| Confirm dialog with optional note | Dialog + optional observations + timestamp | |
| One-tap, no confirmation | Immediate, with undo toast | |
| Customer signature / PIN | Re-entry or signature to confirm | ✓ |

**User's choice:** Customer confirmation code (6-digit, auto-generated at order creation)

---

| Option | Description | Selected |
|--------|-------------|----------|
| Staff enters own PIN | Re-enter logged-in staff's password/PIN | |
| Customer signs on-screen | Signature canvas on device | |
| Customer confirmation code | Unique code given to customer at order creation | ✓ |

**User's choice:** Customer confirmation code

---

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-generated at order creation | 6-digit code, stored in DB, shown on detail/ticket | ✓ |
| Generated on demand | Staff generates manually | |

**User's choice:** Auto-generated at order creation

---

## Bulk Actions Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Bulk status change | Change status of multiple orders at once | ✓ |
| Bulk delete | Delete multiple orders | ✓ |
| Bulk export | Download as CSV or PDF | |

**User's choice:** Bulk status change + bulk delete

---

| Option | Description | Selected |
|--------|-------------|----------|
| Restricted to valid transitions | OPERATOR: forward-only transitions | |
| Any status, ADMIN only | ADMIN: any status; OPERATOR: valid transitions | ✓ |
| Free choice, all roles | Anyone sets any status | |

**User's choice:** Any status for ADMIN; valid transitions for OPERATOR.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Drafts only | Bulk delete only DRAFT orders | ✓ |
| ADMIN can delete any status | ADMIN bulk deletes any order | |
| No bulk delete | Remove from scope | |

**User's choice:** Drafts only

---

## Bulk Selection UI

| Option | Description | Selected |
|--------|-------------|----------|
| Persistent checkbox column | Always visible; checking any row activates toolbar | |
| Long-press / right-click enters select mode | No checkboxes until gesture | |
| Bulk mode toggle button | "Seleccionar" button reveals checkboxes | ✓ (hybrid) |

**User's choice:** Hybrid — checkbox column hidden by default, revealed by "Seleccionar" button press. Floating action bar appears when rows are checked.
**Notes:** User clarified after initial selection of "Persistent checkbox column" — wants the column to appear only on button press.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Floating bar above the table | Sticky bar with count + actions | ✓ |
| Top page action bar replaces buttons | Header buttons replaced when active | |
| Right-side panel / drawer | Side panel for selected orders + actions | |

**User's choice:** Floating bar above the table
