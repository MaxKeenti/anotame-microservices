# Phase 11: DataTableWrapper Filter Consolidation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-04
**Phase:** 11-datatablewrapper-filter-consolidation
**Areas discussed:** Filter Control, Filter Strategy, Visual Separation, API Integration, Divider Location, Prop Default, Custom Filter Implementation

---

## Filter Control

| Option | Description | Selected |
|--------|-------------|----------|
| Add showFilter prop (Recommended) | Pages pass showFilter={false} to hide the built-in search. DataTableWrapper defaults to showFilter={true} for backward compatibility. | ✓ |
| Remove built-in filter entirely | Delete the search input from DataTableWrapper. Pages implement their own filters if needed. | |
| Always show both (keep as-is) | Leave DataTableWrapper unchanged. Accept duplicate filters on some pages as acceptable UX. | |
| Other approach | I have a different idea | |

**User's choice:** Add showFilter prop (Recommended)
**Notes:** Backward compatible approach preserves existing behavior while giving pages control.

---

## Filter Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Customers & Orders only get custom filters (Recommended) | These pages need server-side search for real-time data. Others use DataTableWrapper's local filter. | ✓ |
| All pages should have custom filters | Every page does server-side API search for consistency. | |
| No custom filters at all | All pages use DataTableWrapper's built-in client-side filter. Simpler, works for current data size. | |
| Other strategy | Different approach | |

**User's choice:** Customers & Orders only get custom filters (Recommended)
**Notes:** Scoped approach — only pages that truly need server-side search implement it; others stay simple with local filtering.

---

## Visual Separation

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, always add a divider (Recommended) | Horizontal separator (border or spacing gap) between filter area and table starts. Clarifies which controls affect the table. | ✓ |
| For custom-filter pages only | Add divider only on pages that hide DataTableWrapper's built-in filter (customers, orders). | |
| No separator needed | Spacing and visual hierarchy in current layout is clear enough. | |
| Other design | Different visual approach | |

**User's choice:** Yes, always add a divider (Recommended)
**Notes:** Consistent visual hierarchy across all pages.

---

## API Integration

| Option | Description | Selected |
|--------|-------------|----------|
| Keep current API search as-is (Recommended) | Pages keep their current API search (like customers page). DataTableWrapper only filters within the already-fetched data. | |
| DataTableWrapper manages custom filtering | DataTableWrapper itself should accept a prop for a custom filter function (e.g., onCustomFilter) that pages call. | ✓ |
| Other method | Different approach | |

**User's choice:** DataTableWrapper manages custom filtering
**Rationale:** User later clarified this means pages handle filtering externally with DataTableWrapper receiving final filtered data.

---

## Divider Location

| Option | Description | Selected |
|--------|-------------|----------|
| In DataTableWrapper <hr /> (Recommended) | Add divider in DataTableWrapper itself, so it always separates the filter and table. | ✓ |
| Page-level CSS separator | Pages add their own divider/spacing after their filter form. Keeps separation concern outside wrapper. | |
| Margin-based spacing | Use CSS margin/space in the wrapper container. | |

**User's choice:** In DataTableWrapper <hr /> (Recommended)
**Notes:** Centralized separator — every table has consistent visual boundary.

---

## Prop Default

| Option | Description | Selected |
|--------|-------------|----------|
| Defaults to true (Recommended) | showFilter defaults to true. Backward compatible — existing pages keep built-in filter unless they explicitly pass showFilter={false}. | ✓ |
| Defaults to false | Default to false (no built-in filter). Pages that want it must opt-in. | |
| Required prop | No default — pages must always pass the prop explicitly. | |

**User's choice:** Defaults to true (Recommended)
**Notes:** Maintains backward compatibility; no code churn on 6+ existing pages.

---

## Custom Filter Implementation

| Option | Description | Selected |
|--------|-------------|----------|
| onSearch callback (event-driven) | DataTableWrapper accepts an optional onSearch callback. Customers page calls this when the search form is submitted, which fetches fresh data. | |
| customFilter function (logic-driven) | DataTableWrapper accepts an optional customFilter function. Pages pass their own filtering logic for DataTableWrapper to apply. | |
| Pages handle filtering externally (Recommended) | Pages manage filters externally; DataTableWrapper just receives final data. | ✓ |

**User's choice:** Pages handle filtering externally (Recommended)
**Rationale:** Cleanest separation of concerns. Pages implement API search independently; DataTableWrapper is a pure presentation layer.

---

## Claude's Discretion

- Exact divider styling (thickness, color, spacing)
- Whether to wrap the divider in a padding container
- Order of UI elements when `showFilter={false}`

---

*Phase: 11-datatablewrapper-filter-consolidation*
*Context gathered: 2026-04-04*
