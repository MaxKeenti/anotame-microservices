---
id: SEED-006
status: dormant
planted: 2026-04-05
planted_during: v1.2 / Phase 12
trigger_when: "When we start the 'Price List & Catalog UX' milestone (expected v1.5 or later)"
scope: Medium
---

# SEED-006: Categorical sorting for garments and services

## Why This Matters

Currently, the garment and service lists can become long and difficult to navigate. Categorization (e.g., "Upper Body", "Lower Body" for garments, and "Adjustments", "Repairs" for services) will improve searchability and organization in:
- The Order Creation Wizard (Step 1: Garments, Step 2: Services).
- The Catalog Management pages (Garments and Services lists).

The user specifically requested categories like:
- **Garments:** "Upper body" (shirts, sweaters).
- **Services:** "Adjustments" (e.g., "Ajuste de cintura con costado", "Ajuste de cinturas con piernas y dobladillo").

## When to Surface

**Trigger:** When we start the "Price List & Catalog UX" milestone (expected v1.5 or later) or when the user explicitly asks to "clean up the catalog".

This seed should be presented during `/gsd-new-milestone` when the milestone scope matches any of these conditions:
- `catalog-ux`
- `sorting`
- `categorization`

## Scope Estimate

**Medium** — Requires:
- Schema updates in `catalog-service` (adding `category` or a `Category` entity).
- API updates to expose categories and allow filtering.
- Frontend updates in `GarmentDialog.svelte` and `ServiceDialog.svelte` to manage categories.
- UI updates in the Order Wizard to group items by category.

## Breadcrumbs

Related code and decisions found in the current codebase:

- [GarmentType.java](file:///Users/maximilianogonzalezcalzada/Library/Mobile%20Documents/com~apple~CloudDocs/source/personal/anotame-microservices/anotame-api/backend/catalog-service/src/main/java/com/anotame/catalog/domain/model/GarmentType.java)
- [Service.java](file:///Users/maximilianogonzalezcalzada/Library/Mobile%20Documents/com~apple~CloudDocs/source/personal/anotame-microservices/anotame-api/backend/catalog-service/src/main/java/com/anotame/catalog/domain/model/Service.java)
- [garments/+page.svelte](file:///Users/maximilianogonzalezcalzada/Library/Mobile%20Documents/com~apple~CloudDocs/source/personal/anotame-microservices/anotame-web/src/routes/(app)/dashboard/catalog/garments/+page.svelte)
- [services/+page.svelte](file:///Users/maximilianogonzalezcalzada/Library/Mobile%20Documents/com~apple~CloudDocs/source/personal/anotame-microservices/anotame-web/src/routes/(app)/dashboard/catalog/services/+page.svelte)
- [garment-dialog.svelte](file:///Users/maximilianogonzalezcalzada/Library/Mobile%20Documents/com~apple~CloudDocs/source/personal/anotame-microservices/anotame-web/src/lib/components/catalog/garment-dialog.svelte)
- [service-dialog.svelte](file:///Users/maximilianogonzalezcalzada/Library/Mobile%20Documents/com~apple~CloudDocs/source/personal/anotame-microservices/anotame-web/src/lib/components/catalog/service-dialog.svelte)

## Notes

The user wants specific examples:
- "upper body" for shirts or sweaters.
- "adjustments" for "Ajuste de cintura con costado", "Ajuste de cinturas con piernas y dobladillo".
