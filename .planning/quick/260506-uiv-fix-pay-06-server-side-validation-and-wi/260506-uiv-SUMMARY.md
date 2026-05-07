---
phase: quick-260506-uiv
plan: "01"
subsystem: sales-service + anotame-web
tags: [payments, refunds, validation, dashboard, calendar, kpi]
dependency_graph:
  requires: []
  provides: [PAY-06-server-guard, CAL-01-dashboard-widget]
  affects: [anotame-web/dashboard, anotame-api/sales-service]
tech_stack:
  added: []
  patterns: [Quarkus WebApplicationException 422 guard, Svelte 5 onMount self-contained widget]
key_files:
  created:
    - anotame-web/src/lib/components/dashboard/WeekCalendarWidget.svelte
  modified:
    - anotame-api/backend/sales-service/src/main/java/com/anotame/sales/application/service/PaymentService.java
    - anotame-api/backend/sales-service/src/main/java/com/anotame/sales/application/dto/AddPaymentRequest.java
    - anotame-web/src/routes/(app)/dashboard/+page.svelte
decisions:
  - "Removed @DecimalMin(0.01) from AddPaymentRequest.amount so negative refund amounts bypass bean validation and reach the service layer guard"
  - "Placed refund note guard after CANCELLED order check and before overpayment check in PaymentService.addPayment()"
  - "WeekCalendarWidget fetches its own data via onMount (self-contained) to avoid prop threading through the dashboard page"
  - "Widget silently suppresses fetch errors — it is non-critical and should not break the dashboard for ADMIN users"
  - "Used same getOccupancyColor thresholds as WorkloadCalendar.svelte for visual consistency"
metrics:
  duration: "12m"
  completed: "2026-05-06"
  tasks: 2
  files: 4
---

# Quick Task 260506-uiv: PAY-06 Refund Note Guard + 7-Day Dashboard Widget Summary

**One-liner:** Server-side 422 REFUND_NOTE_REQUIRED guard for negative-amount payments without a note, plus a self-contained WeekCalendarWidget on the admin dashboard showing 7-day capacity.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add server-side refund note guard + relax DTO constraint | 84d0374 | PaymentService.java, AddPaymentRequest.java |
| 2 | Create WeekCalendarWidget and wire into main dashboard | 8d101f7 | WeekCalendarWidget.svelte, +page.svelte |

## What Was Built

**Task 1 — PAY-06 Server-Side Guard:**
- Removed `@DecimalMin(value = "0.01")` from `AddPaymentRequest.amount` so negative refund amounts reach the service layer rather than being blocked by bean validation
- Removed the now-unused `@DecimalMin` import from AddPaymentRequest.java
- Added guard in `PaymentService.addPayment()`: checks `request.amount().compareTo(BigDecimal.ZERO) < 0` AND `request.notes() == null || request.notes().isBlank()` — throws 422 with entity `"REFUND_NOTE_REQUIRED"`
- Guard position: after CANCELLED order check, before overpayment check

**Task 2 — 7-Day Calendar Widget:**
- Created `WeekCalendarWidget.svelte` at `anotame-web/src/lib/components/dashboard/`
- Self-contained: fetches `GET /orders/kpi/dashboard` (dailyWorkload) and `GET /establishment` (dailyCapacityMinutes) on mount via `Promise.all`
- Renders 7 mini-columns (first 7 entries of dailyWorkload array) with day abbreviation, bar fill, and percentage
- Color tokens match WorkloadCalendar.svelte: bg-success / bg-warning/60 / bg-warning / bg-destructive
- Shows nothing while loading or if no data (non-blocking)
- Dashboard `+page.svelte`: added import, added `{#if isAdmin}<WeekCalendarWidget />{/if}` block between greeting section and menu grid

## Verification

- `mvn compile` in sales-service: exit 0
- `bun run build` in anotame-web: exit 0 (pre-existing circular dependency warnings in node_modules are not from these changes)

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — WeekCalendarWidget fetches real data from existing KPI endpoints.

## Threat Flags

No new trust boundaries introduced. WeekCalendarWidget calls authenticated apiService endpoints already in use by the KPI dashboard page.

## Self-Check: PASSED

- PaymentService.java contains "REFUND_NOTE_REQUIRED": confirmed (line 46)
- AddPaymentRequest.java has no @DecimalMin: confirmed
- WeekCalendarWidget.svelte exists: confirmed
- Dashboard +page.svelte imports WeekCalendarWidget and renders in {#if isAdmin}: confirmed
- Commits 84d0374 and 8d101f7 exist in git log: confirmed
