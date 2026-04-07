---
phase: quick-260405-llb
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - anotame-web/src/lib/components/ui/DataTableWrapper.svelte
autonomous: true
requirements: []
---

<objective>
Increase visual separation between filter and table sections in DataTableWrapper to match the services page layout pattern.

Purpose: The services page has clear visual hierarchy with ~6 units of spacing (space-y-6) between filter and table cards. DataTableWrapper currently uses space-y-3, creating insufficient visual separation on the customers page. Normalizing this gap across all DataTableWrapper instances creates consistency.

Output: Updated DataTableWrapper with increased internal spacing
</objective>

<execution_context>
@/Users/maximilianogonzalezcalzada/Library/Mobile Documents/com~apple~CloudDocs/source/personal/anotame-microservices/.claude/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
## Current Implementation Pattern

**Services page (manual filter):** Separate filter card + separate table card with `space-y-6` between sections
- External filters: `div class="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 bg-card border border-border rounded-xl shadow-sm"`
- Table: `div class="bg-card border border-border rounded-xl overflow-hidden shadow-sm p-4"`
- Parent wrapper: `space-y-6` spacing

**Customers page (DataTableWrapper):** Filter and table in one card container with `space-y-3` internal gap
- Current DataTableWrapper spacing: `space-y-3` (line 109)
- Result: Tight, less visually separated sections

## Requirement
Match the visual separation of services page while keeping filter/table in DataTableWrapper.
</context>

<tasks>

<task type="auto">
  <name>Task 1: Increase DataTableWrapper internal gap from space-y-3 to space-y-6</name>
  <files>anotame-web/src/lib/components/ui/DataTableWrapper.svelte</files>
  <action>
Change line 109 in DataTableWrapper.svelte from:
```html
<div class="space-y-3">
```

To:
```html
<div class="space-y-6">
```

This increases the vertical spacing between the filter input (lines 111-121) and the table divider (lines 123-124) to match the visual hierarchy of the services page where external cards use space-y-6 separation.

Rationale: DataTableWrapper is a reusable component. Normalizing to space-y-6 creates consistent visual breathing room across all pages that use it (currently customers page and future uses). This matches the Tailwind spacing scale used elsewhere in the page layout.
  </action>
  <verify>
    <automated>grep -n "space-y-6" anotame-web/src/lib/components/ui/DataTableWrapper.svelte | grep -v "^\s*\/\/"</automated>
  </verify>
  <done>
- Line 109 of DataTableWrapper.svelte changed from `space-y-3` to `space-y-6`
- File committed
- Customers page now visually matches services page gap pattern between filter and table
  </done>
</task>

</tasks>

<verification>
After completion, verify visually:
1. Navigate to customers page and services page side-by-side
2. Compare the gap between filter section and table section
3. Gaps should now be visually equivalent (both using space-y-6)
4. No layout breakage or overflow issues
</verification>

<success_criteria>
- DataTableWrapper spacing updated to space-y-6
- Customers page filter-to-table gap matches services page visual hierarchy
- No regression in other pages using DataTableWrapper
- Change is one-line modification (maintainability)
</success_criteria>

<output>
Create `.planning/quick/260405-llb-add-gap-between-filter-and-table-on-cust/260405-llb-SUMMARY.md` after execution.
</output>
