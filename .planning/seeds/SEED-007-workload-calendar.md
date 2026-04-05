---
id: SEED-007
status: dormant
planted: 2026-04-05
planted_during: v1.2 / Phase 12
trigger_when: "When we start the 'KPI Intelligence & Dashboard' milestone (expected v1.5 or later)"
scope: Large
---

# SEED-007: Simplified daily workload calendar with summaries

## Why This Matters

A calendar-based view of workload provides immediate visual context that standard lists or charts lack. By color-coding days (e.g., Green for low load, Yellow for medium, Red for at capacity), staff can see at a glance if they can take on more urgent work for "past or incoming days."

Clicking a day provides a "one-stop" summary of:
- **Earnings:** Total revenue scheduled or completed for that day.
- **Workload:** Total minutes/complexity of tasks assigned.

This reduces cognitive load and prevents over-scheduling.

## When to Surface

**Trigger:** When we start the "KPI Intelligence & Dashboard" milestone (v1.5+) or when the user asks for a "smarter calendar" or a "better way to see availability."

This seed should be presented during `/gsd-new-milestone` when the milestone scope matches:
- `kpi`
- `dashboard`
- `calendar`
- `workload-planning`

## Scope Estimate

**Large** — Requires:
- **Frontend:** Selection and integration of a robust calendar library (e.g., FullCalendar or a lightweight Svelte alternative). 
- **Backend (Operations):** New endpoints for daily aggregated workload (sum of `durationMin` per day).
- **Backend (Sales):** New endpoints for daily aggregated earnings (sum of order totals).
- **UX/UI:** Design for the "Daily Summary" modal/popover that shows both sales and operations data.

## Breadcrumbs

Related code and decisions found in the current codebase:

- [dashboard/+page.svelte](file:///Users/maximilianogonzalezcalzada/Library/Mobile%20Documents/com~apple~CloudDocs/source/personal/anotame-microservices/anotame-web/src/routes/(app)/dashboard/+page.svelte)
- [operations/dashboard](file:///Users/maximilianogonzalezcalzada/Library/Mobile%20Documents/com~apple~CloudDocs/source/personal/anotame-microservices/anotame-web/src/routes/(app)/dashboard/operations/) (existing groundwork for metrics)
- [schedule/+page.svelte](file:///Users/maximilianogonzalezcalzada/Library/Mobile%20Documents/com~apple~CloudDocs/source/personal/anotame-microservices/anotame-web/src/routes/(app)/dashboard/admin/schedule/+page.svelte) (related to daily time management)
- [Order.java](file:///Users/maximilianogonzalezcalzada/Library/Mobile%20Documents/com~apple~CloudDocs/source/personal/anotame-microservices/anotame-api/backend/sales-service/src/main/java/com/anotame/sales/domain/model/Order.java) (for price/earnings calculation)

## Notes

- Color logic should probably be configurable (e.g. what % constitutes "Red").
- Past days should show *actual* workload/earnings; future days show *scheduled* metrics.
