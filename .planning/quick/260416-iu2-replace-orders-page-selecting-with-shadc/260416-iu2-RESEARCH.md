# Quick Task 260416-iu2: Replace /Orders Page Selecting with shadcn-svelte Data-Table Row Actions Pattern - Research

**Researched:** 2026-04-16
**Domain:** SvelteKit 5 frontend — data table row selection UI pattern  
**Confidence:** HIGH

## Summary

The /Orders page currently uses a manual bulk selection mode with a toggle button and FloatingActionBar component that appears based on a `bulkMode` state boolean. The goal is to replace this with the shadcn-svelte data-table row actions pattern, which uses native checkboxes in a selection column and conditionally displays actions based on actual selected row state from the TanStack table.

The good news: **DataTableWrapper already supports most of this pattern.** It has:
- Row selection state management via TanStack Table's `rowSelection`
- Selection column that appears when `bulkMode && bulkActions` are true
- Native HTML checkboxes (header for select-all, cell for individual rows)
- `onSelectionChange` callback that fires when rows are selected
- FloatingActionBar that conditionally renders only when `count > 0`

**Primary change needed:** Instead of a `bulkMode` toggle button that explicitly enters/exits selection mode, use **automatic visibility of the selection column and FloatingActionBar based on TanStack table's selection state** — no modal "enter bulk mode" needed. This matches shadcn-svelte's row actions pattern exactly.

## User Constraints (from CONTEXT.md)

### Implementation Decisions
- Floating window for mass selections should only be visible when items are selected (not always shown)
- This follows the shadcn pattern where actions appear contextually based on selection state

### Canonical Reference
- shadcn-svelte data-table row actions: https://www.shadcn-svelte.com/docs/components/data-table#row-actions

## Current Implementation Analysis

### Orders Page (+page.svelte)
- **Bulk mode toggle:** Button manually switches `bulkMode` boolean (line 237-254)
- **Selection tracking:** `selectedOrders` state array updated via `onSelectionChange` callback from DataTableWrapper
- **FloatingActionBar visibility:** Renders only when `count > 0` (line 291-298) ✓ Already correct
- **Table state:** DataTableWrapper receives `bulkMode` as prop and conditionally adds selection column

### DataTableWrapper.svelte
- **Selection column management:** `selectionColumn` is injected into `effectiveColumns` only when `bulkActions && bulkMode` are both true (lines 77-89)
- **Native checkboxes:** Already using HTML `<input type="checkbox">` for both header (select-all) and row cells (individual selection)
- **Row selection state:** Uses TanStack Table's `rowSelection` and `onRowSelectionChange` handlers
- **Selection reset:** `$effect` hook clears `rowSelection` when `bulkMode` toggles to false (lines 70-74)
- **Callback:** `onSelectionChange` fires whenever selected rows change (lines 147-151) ✓ Correctly wired

### FloatingActionBar.svelte
- **Visibility:** Only renders when `{#if count > 0}` — already following the pattern ✓
- **Conditional disable:** Delete button disabled when not all selected are RECEIVED status — correct business logic ✓

## Standard Stack

| Library | Version | Purpose | Already in Project |
|---------|---------|---------|-------------------|
| @tanstack/table-core | 8.21.3 | Table state management | ✓ Yes |
| shadcn-svelte | 1.2.7 | Component library | ✓ Yes |
| svelte | 5.51.0 | Framework with runes | ✓ Yes |
| shadcn-svelte checkbox | — | Row selection UI | ✓ Available (not yet installed) |

**Version verification:** [VERIFIED: npm registry] - All versions current as of 2026-04-16.

## Architecture Pattern: Row Actions + Selection

### How It Works (shadcn-svelte approach)

1. **Selection column appears automatically** — no modal toggle
   - Column is conditionally rendered based on whether ANY row is selected
   - OR: Always show the column, but it's invisible/collapsed when no rows selected

2. **Checkbox mechanics:**
   - Header checkbox: `getIsAllPageRowsSelected()` and `toggleAllPageRowsSelected()`
   - Row cell: `getIsSelected()` and `toggleSelected()`

3. **Actions appear contextually:**
   - FloatingActionBar renders only when `table.getFilteredSelectedRowModel().rows.length > 0`
   - No manual `bulkMode` toggle needed

### Recommended Implementation for Orders Page

```svelte
{#if selectedOrders.length > 0 || someRowSelected}
  <DataTableWrapper
    {columns}
    {data}
    bulkActions={true}
    bind:bulkMode={true}  <!-- Always true — selection is automatic -->
    onSelectionChange={(rows) => { selectedOrders = rows; }}
  />
{:else}
  <DataTableWrapper
    {columns}
    {data}
    bulkActions={false}
  />
{/if}
```

OR (simpler):

```svelte
<DataTableWrapper
  {columns}
  {data}
  bulkActions={true}
  bulkMode={true}  <!-- Always enabled -->
  onSelectionChange={(rows) => { selectedOrders = rows; }}
/>

<FloatingActionBar
  count={selectedOrders.length}
  {...props}
/>
```

**Key insight:** The "mode" is implicit — when user checks a box, the action bar appears. No separate toggle button needed.

## Common Pitfalls

### Pitfall 1: Forgetting to Reset Selection on Data Refresh
**What goes wrong:** User selects rows, then data refreshes (e.g., after bulk operation), but `selectedOrders` still contains old row objects. Subsequent bulk operations may target stale data.

**Why it happens:** DataTableWrapper resets `rowSelection` state correctly, but parent component might not clear `selectedOrders` array.

**How to avoid:** Always reset `selectedOrders = []` after any async operation that modifies data (delete, status change, etc.). Ensure `fetchData()` is called and completes before clearing selection.

**Warning signs:** Bulk action succeeds but shows wrong count in toast, or FloatingActionBar shows count doesn't match filtered rows.

### Pitfall 2: Selection Column Width Causing Layout Shift
**What goes wrong:** Selection column appears/disappears causing table to reflow, creating janky visual shift, especially on touch devices.

**Why it happens:** `selectionColumn` is conditionally included in `effectiveColumns` — when `bulkMode` toggles, column count changes.

**How to avoid:** 
- Keep selection column ALWAYS in the columns array, but hide it with CSS when not needed (preferred)
- OR: Keep `bulkMode` always true and use CSS `hidden` on selection column when `selectedOrders.length === 0`

**Warning signs:** Page reflow when clicking first checkbox, table width changes when entering/exiting bulk mode.

### Pitfall 3: Svelte 5 Rune Reactivity Trap with Table State
**What goes wrong:** `onSelectionChange` callback fires, `selectedOrders` updates, but FloatingActionBar doesn't show because `count` derived is stale.

**Why it happens:** In Svelte 5, if you use `$derived` for count based on `selectedOrders`, you MUST ensure `onSelectionChange` is firing synchronously before derived recalculates. If callback is delayed (async), the derived might read old state.

**How to avoid:** 
- Ensure `onSelectionChange` fires synchronously (it does in current DataTableWrapper)
- Use `$state` for `selectedOrders` (already correct)
- Use `$derived` for any computed counts (already done: `const allSelectedDeletable = $derived(...)`)

**Warning signs:** Check a checkbox, action bar appears late or flickers, multiple re-renders visible in console.

### Pitfall 4: Pagination with Selection
**What goes wrong:** User selects rows on page 1, goes to page 2, selection persists across pages (good), but FloatingActionBar count shows all selected rows including page 1 (confusing for bulk operations).

**Why it happens:** TanStack Table tracks selection globally across all pages, not just current page. This is intentional but needs clear UX signaling.

**How to avoid:** 
- Current implementation already correct — `onSelectionChange` passes all selected rows to parent
- Ensure toast/confirmation dialogs show exactly which rows will be affected (current code does: `ticketList` in delete confirmation)
- Optional: Show visual indicator "5 of 50 rows selected" using `table.getFilteredSelectedRowModel().rows.length` vs total

**Warning signs:** User expects to only affect current page but bulk operation affects all pages.

## Code Examples

### Current Pattern (Manual Toggle Mode) — Replace This

```svelte
<!-- Orders Page: Manual bulkMode toggle -->
<div class="flex justify-end">
  {#if !bulkMode}
    <Button
      variant="secondary"
      onclick={() => { bulkMode = true; selectedOrders = []; }}
    >
      Seleccionar pedidos
    </Button>
  {:else}
    <Button
      variant="ghost"
      onclick={handleBulkCancel}
    >
      Cancelar selección
    </Button>
  {/if}
</div>

<!-- Table always shows selection column when in bulkMode -->
<DataTableWrapper
  {columns}
  {data}
  bulkActions={true}
  bind:bulkMode={bulkMode}
  onSelectionChange={(rows) => { selectedOrders = rows; }}
/>

<!-- Action bar shows only when count > 0 -->
<FloatingActionBar
  count={selectedOrders.length}
  {...props}
/>
```

### New Pattern (Automatic, shadcn-style) — Use This

```svelte
<!-- Orders Page: No bulkMode toggle needed -->
<div class="flex justify-end">
  {#if selectedOrders.length > 0}
    <Button
      variant="ghost"
      onclick={() => { selectedOrders = []; }}
      class="text-muted-foreground hover:text-foreground"
    >
      Limpiar selección ({selectedOrders.length})
    </Button>
  {/if}
</div>

<!-- Table selection column always visible, checkboxes are self-documenting -->
<DataTableWrapper
  {columns}
  {data}
  bulkActions={true}
  bulkMode={true}  <!-- Always true -->
  onSelectionChange={(rows) => { selectedOrders = rows; }}
/>

<!-- Action bar shows contextually when rows selected -->
<FloatingActionBar
  count={selectedOrders.length}
  {...props}
/>
```

**Key changes:**
1. Remove manual toggle button (or convert to "clear selection" button if desired)
2. Set `bulkMode={true}` (always enabled)
3. FloatingActionBar already handles visibility correctly with `{#if count > 0}`

### Checkbox with Label (If Row-Click Selection Needed)

```svelte
<!-- If you want to add click-to-select rows (optional enhancement) -->
<Table.Row 
  class="hover:bg-muted/10 cursor-pointer transition-colors"
  onclick={() => row.toggleSelected()}
>
```

This allows clicking anywhere on the row to toggle selection (shadcn pattern), not just the checkbox.

## Svelte 5 Reactivity Notes

### Current Patterns Already Correct in DataTableWrapper

```svelte
// ✓ Correct: Reset rowSelection when bulkMode changes
$effect(() => {
  if (!bulkMode) {
    rowSelection = {};
  }
});

// ✓ Correct: Fire onSelectionChange when rowSelection changes
$effect(() => {
  if (!bulkActions || !onSelectionChange) return;
  const selected = table.getSelectedRowModel().rows.map((r: any) => r.original as TData);
  untrack(() => onSelectionChange(selected));
});
```

### No Changes Needed
The reactive patterns in DataTableWrapper are already following Svelte 5 best practices:
- `$state` for mutable state
- `$derived` for computed values
- `$effect` for side effects with `untrack()` for callback firing
- Proper cleanup via `rowSelection = {}` reset

## Integration Checklist

- [ ] Remove "Seleccionar pedidos" / "Cancelar selección" toggle button from Orders page
- [ ] Change `bulkMode = true` (hardcoded, or derive from `selectedOrders.length > 0`)
- [ ] Test checkbox click on any row — FloatingActionBar should appear
- [ ] Test header checkbox — should select/deselect all visible rows
- [ ] Test bulk status change — should clear selection and refresh data
- [ ] Test bulk delete — should clear selection and refresh data
- [ ] Verify pagination: select rows on page 1, go to page 2, both remain selected
- [ ] Verify on mobile: touch targets for checkboxes are at least 44x44px (already correct with `h-4 w-4` classes... may need adjustment)

## Mobile UX Consideration

Current checkbox size (`h-4 w-4`) is 16x16px — below the recommended 44x44px touch target. Consider:
- Wrapping checkbox in a larger clickable region
- OR: Using the row-click pattern (click row to select) instead of relying on checkbox click
- OR: Increasing checkbox size on mobile via `sm:h-4 sm:w-4 md:h-5 md:w-5` or similar

AI_RULES.md states: **"Touch-First Design: UI must be heavily optimized for touchscreen interactions (large touch targets...)"**

The shadcn-svelte data-table example includes row-click selection for this reason.

## Sources

- **[VERIFIED: npm registry]** @tanstack/table-core 8.21.3, shadcn-svelte 1.2.7
- **[CITED: https://www.shadcn-svelte.com/docs/components/data-table]** Row actions, checkbox patterns, selection mechanics
- **[VERIFIED: codebase]** DataTableWrapper implementation, FloatingActionBar, Orders page current state
- **[CITED: AI_RULES.md]** Svelte 5 rune patterns, touch-first design requirements, shadcn component usage

## Metadata

**Confidence breakdown:**
- shadcn-svelte data-table pattern: HIGH — official documentation + working reference implementation
- DataTableWrapper current capability: HIGH — code audit shows all mechanics already present
- Integration safety: HIGH — minimal changes needed, no breaking refactors
- Mobile UX: MEDIUM — touch target size needs review, but is separate concern

**Ready for planning:** Yes. Planner can now create task decomposition for implementation.
