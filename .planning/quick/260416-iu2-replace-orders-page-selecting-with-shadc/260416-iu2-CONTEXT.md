# Quick Task 260416-iu2: Replace /Orders page selecting with shadcn-svelte data-table row actions pattern - Context

**Gathered:** 2026-04-16
**Status:** Ready for planning

<domain>
## Task Boundary

Replace the existing row selection implementation in the /Orders page with the pattern from shadcn-svelte's data-table row actions example (https://www.shadcn-svelte.com/docs/components/data-table#row-actions).

</domain>

<decisions>
## Implementation Decisions

### Row Action Visibility
- Floating window for mass selections should only be visible when items are selected (not always shown)
- This follows the shadcn pattern where actions appear contextually based on selection state

</decisions>

<specifics>
## Specific Ideas

- Reference implementation: https://www.shadcn-svelte.com/docs/components/data-table#row-actions
- Preserve existing bulk action floating window UI, but trigger visibility based on selection state
- Leverage shadcn's checkbox + row click pattern for consistency

</specifics>

<canonical_refs>
## Canonical References

- shadcn-svelte data-table row actions: https://www.shadcn-svelte.com/docs/components/data-table#row-actions

</canonical_refs>
