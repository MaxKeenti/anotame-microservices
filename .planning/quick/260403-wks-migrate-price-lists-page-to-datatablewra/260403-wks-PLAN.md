---
phase: quick
plan: 260403-wks
type: execute
task_count: 1
context_target: 30%
files_modified:
  - anotame-web/src/routes/(app)/dashboard/catalog/pricelists/+page.svelte
autonomous: true
---

<objective>
Verify and optimize price lists page DataTableWrapper integration to ensure best practices and eliminate any duplicate filtering UI.

Purpose: STATE.md flags DataTableWrapper filter deduplication as priority—audit price lists page to confirm single filter source and optimize UX.
Output: Optimized price lists page using DataTableWrapper best practices.
</objective>

<execution_context>
@.planning/STATE.md
@AI_RULES.md (frontend standards — DataTableWrapper & touch-first UI rules)
</execution_context>

<context>
Current implementation: `/dashboard/catalog/pricelists/+page.svelte` already uses DataTableWrapper with:
- Single global filter input (line 108-114 in DataTableWrapper)
- No duplicate filtering UI detected
- Action column rendering via actionCell snippet
- Proper column definitions with sorting support

Per AI_RULES.md § 3.2: "For forms/tables, strictly use `sveltekit-superforms` single-dialog pattern and `DataTableWrapper` with TanStack table."

Per STATE.md: "DataTableWrapper filter deduplication is a priority bug fix — some pages duplicate filtering UI"

Price lists page implementation is clean—verify no redundant filters exist and optimize touch targets per AI_RULES.md § 3.1 (touch-first design).
</context>

<tasks>

<task type="auto">
  <name>Task 1: Verify DataTableWrapper integration and optimize touch targets</name>
  <files>anotame-web/src/routes/(app)/dashboard/catalog/pricelists/+page.svelte</files>
  <action>
Review current price lists page implementation:
1. Confirm DataTableWrapper is the ONLY filtering mechanism (no redundant input fields outside DataTableWrapper)
2. Verify no duplicate column definitions or filters
3. Audit button touch targets: confirm all action buttons (Clonar, Ver, Eliminar) have min 44px height or padding-equivalent for touch-friendly interaction per AI_RULES § 3.1
4. Check that column headers are sortable and properly labeled for a11y
5. Verify empty state message is user-friendly ("No hay listas configuradas" is good)
6. Test responsive behavior: ensure table scrolls on mobile and action buttons remain accessible

No code changes needed if current implementation is clean. If improvements found:
- Add missing `min-h-[44px]` to action buttons if needed
- Ensure label properly associates with filter input via `for="dt-filter"` (already present in DataTableWrapper)
- Verify Card/Header structure doesn't duplicate any search/filter UI

Expected result: Single filter source (DataTableWrapper), optimized touch targets, clear a11y structure.
  </action>
  <verify>
1. `grep -c "Input" anotame-web/src/routes/(app)/dashboard/catalog/pricelists/+page.svelte` returns 0 (confirms only DataTableWrapper input, no local input)
2. Manual review: Open http://localhost:3000/dashboard/catalog/pricelists in browser, verify single search input, test sorting, test actions
3. `bun run build` exits with code 0 (no compilation errors)
  </verify>
  <done>
- Price lists page uses DataTableWrapper as single filter source—no duplicate UI
- All action buttons have touch-friendly sizing (min 44px or equivalent padding)
- Page renders without errors, sorting and filtering work correctly
- a11y structure confirmed (label + input association via id/for)
  </done>
</task>

</tasks>

<verification>
After completion:
- [ ] DataTableWrapper is sole filtering mechanism (no redundant inputs)
- [ ] Touch targets optimized per AI_RULES (44px minimum)
- [ ] Sorting, filtering, pagination functional on desktop and mobile
- [ ] Page renders cleanly in browser
- [ ] Build succeeds without warnings
</verification>

<success_criteria>
- Price lists page cleanly uses DataTableWrapper with no filter duplication
- All interactive elements (buttons, sort headers) meet touch accessibility requirements
- Page functional across desktop and mobile viewports
- Build passes with zero errors
</success_criteria>

<output>
After completion, commit changes:
```bash
git add anotame-web/src/routes/(app)/dashboard/catalog/pricelists/+page.svelte
git commit -m "refactor(catalog): optimize price lists DataTableWrapper integration and touch targets"
```
</output>
