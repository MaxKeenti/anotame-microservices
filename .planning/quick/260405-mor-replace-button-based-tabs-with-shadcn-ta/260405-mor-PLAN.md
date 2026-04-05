---
phase: quick-260405-mor-replace-button-based-tabs-with-shadcn-tabs
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - anotame-web/src/routes/(app)/dashboard/admin/schedule/+page.svelte
  - anotame-web/src/routes/(app)/dashboard/orders/+page.svelte
autonomous: true
requirements: []
user_setup: []

must_haves:
  truths:
    - "Schedule page displays weekly schedule tab with CalendarDays icon"
    - "Schedule page displays holidays tab with AlertTriangle icon"
    - "Orders page displays active orders tab"
    - "Orders page displays drafts tab with draft count"
    - "Tab switching changes content view smoothly"
    - "All existing functionality (forms, filters, tables) works within new tab structure"
  artifacts:
    - path: "anotame-web/src/lib/components/ui/tabs/"
      provides: "Installed shadcn-svelte Tabs component"
    - path: "anotame-web/src/routes/(app)/dashboard/admin/schedule/+page.svelte"
      provides: "Schedule page using Tabs component"
      contains: "Tabs.Root, Tabs.List, Tabs.Trigger, Tabs.Content"
    - path: "anotame-web/src/routes/(app)/dashboard/orders/+page.svelte"
      provides: "Orders page using Tabs component"
      contains: "Tabs.Root, Tabs.List, Tabs.Trigger, Tabs.Content"
  key_links:
    - from: "Tabs.Trigger"
      to: "activeTab state"
      via: "value prop binding"
      pattern: "bind:value"
    - from: "Tab triggers"
      to: "Tab content"
      via: "Tabs.Content value matching"
      pattern: "value=\"weekly\""
---

<objective>
Replace manual button-based tab interfaces with shadcn-svelte Tabs component on schedule and orders pages.

Purpose: Use consistent, accessible Tabs component from shadcn-svelte following project UI standards instead of custom button implementations.

Output: Two converted pages using Tabs component with all functionality intact.
</objective>

<execution_context>
@anotame-web/src/lib/components/ui/tabs/
</execution_context>

<context>
@anotame-web/src/routes/(app)/dashboard/admin/schedule/+page.svelte
@anotame-web/src/routes/(app)/dashboard/orders/+page.svelte
</context>

<tasks>

<task type="auto">
  <name>Task 1: Install shadcn-svelte Tabs component</name>
  <files>anotame-web/src/lib/components/ui/tabs/</files>
  <action>
From anotame-web directory, run: `bun x shadcn-svelte@latest add tabs`

This will install the Tabs component and required dependencies into src/lib/components/ui/tabs/. Verify installation completes without errors.
  </action>
  <verify>
    <automated>cd anotame-web && test -f src/lib/components/ui/tabs/index.ts && echo "Tabs component installed"</automated>
  </verify>
  <done>Tabs component files exist in src/lib/components/ui/tabs/ and can be imported</done>
</task>

<task type="auto">
  <name>Task 2: Convert schedule page to use Tabs component</name>
  <files>anotame-web/src/routes/(app)/dashboard/admin/schedule/+page.svelte</files>
  <action>
Update schedule page (+page.svelte) to use shadcn-svelte Tabs:

1. Update import section:
   - Add: `import * as Tabs from '$lib/components/ui/tabs';`
   - Keep existing imports for CalendarDays, AlertTriangle icons

2. Change state management:
   - Keep: `let activeTab = $state<'weekly' | 'holidays'>('weekly');`
   - This state will now bind to Tabs.Root value

3. Replace button-based tab triggers (lines 119-136):
   - Remove the entire flex div with custom button styling
   - Replace with:
     ```svelte
     <Tabs.Root bind:value={activeTab}>
       <Tabs.List class="border-b border-border">
         <Tabs.Trigger value="weekly" class="gap-2">
           <CalendarDays class="w-4 h-4" />
           Horario Semanal
         </Tabs.Trigger>
         <Tabs.Trigger value="holidays" class="gap-2">
           <AlertTriangle class="w-4 h-4" />
           Excepciones / Festivos
         </Tabs.Trigger>
       </Tabs.List>
     ```

4. Replace tab content sections:
   - Replace: `{#if isLoading && workDays.length === 0}` loading state becomes `{#if isLoading && workDays.length === 0}`
   - Replace: `<div class={activeTab === 'weekly' ? 'block animate-in fade-in' : 'hidden'}>` with `<Tabs.Content value="weekly">`
   - Replace: `<div class={activeTab === 'holidays' ? 'block animate-in fade-in' : 'hidden'}>` with `<Tabs.Content value="holidays">`
   - Remove the closing divs and add `</Tabs.Content>` instead
   - Close `</Tabs.Root>` after both content sections

5. Keep all existing functionality:
   - All form logic, event handlers, loading states, card structures unchanged
   - Only the tab shell changes, not the content

6. Verify no TypeScript errors and build passes with `bun run build`
  </action>
  <verify>
    <automated>cd anotame-web && bun run build 2>&1 | grep -q "error" && echo "Build has errors" || echo "Build successful"</automated>
  </verify>
  <done>Schedule page renders Tabs component with weekly and holidays tabs, tabs are clickable, switching tabs shows correct content, no build errors</done>
</task>

<task type="auto">
  <name>Task 3: Convert orders page to use Tabs component</name>
  <files>anotame-web/src/routes/(app)/dashboard/orders/+page.svelte</files>
  <action>
Update orders page (+page.svelte) to use shadcn-svelte Tabs:

1. Update import section:
   - Add: `import * as Tabs from '$lib/components/ui/tabs';`
   - Keep existing imports

2. Change state management:
   - Rename: `let view = $state<'active' | 'drafts'>('active');` to `let activeTab = $state<'active' | 'drafts'>('active');`
   - Update the setView function (line 77-79) to remove it OR keep it as a helper that updates activeTab
   - Simplify: Remove setView function, bind directly to activeTab

3. Replace button-based tab triggers (lines 122-141):
   - Remove the entire div with bg-muted/20 p-1.5 rounded-xl styling
   - Replace with:
     ```svelte
     <Tabs.Root bind:value={activeTab}>
       <Tabs.List>
         <Tabs.Trigger value="active">
           Órdenes Activas
         </Tabs.Trigger>
         <Tabs.Trigger value="drafts">
           Borradores {drafts.length > 0 ? `(${drafts.length})` : ''}
         </Tabs.Trigger>
       </Tabs.List>
     ```

4. Replace tab content sections:
   - Replace: `{#if view === 'active'}` with `<Tabs.Content value="active">`
   - Replace: `{:else}` (drafts section) with `<Tabs.Content value="drafts">`
   - Replace: `{/if}` with `</Tabs.Content>`
   - Close `</Tabs.Root>` after both content sections

5. Update references to `view`:
   - Line 143: `{#if view === 'active'}` → `<Tabs.Content value="active">`
   - Line 200: `{:else}` → `<Tabs.Content value="drafts">`
   - Remove old button onclick handlers

6. Keep all existing functionality:
   - All data tables, filters, actions, delete handlers unchanged
   - Only the tab switching mechanism changes

7. Verify no TypeScript errors and build passes with `bun run build`
  </action>
  <verify>
    <automated>cd anotame-web && bun run build 2>&1 | grep -q "error" && echo "Build has errors" || echo "Build successful"</automated>
  </verify>
  <done>Orders page renders Tabs component with active and drafts tabs, tabs are clickable and show correct content, draft count appears in drafts tab, no build errors</done>
</task>

</tasks>

<verification>
After all tasks complete:
1. Run `cd anotame-web && bun run build` — should exit with code 0
2. Verify no TypeScript errors in either converted file
3. Check that both pages render without errors in the browser (visual verification step will follow)
</verification>

<success_criteria>
- Schedule page successfully uses Tabs component with weekly/holidays tabs
- Orders page successfully uses Tabs component with active/drafts tabs
- All existing functionality preserved (forms, filters, tables, state management)
- No build errors: `bun run build` passes
- No TypeScript errors in converted files
- Single atomic commit with both files updated
</success_criteria>

<output>
After completion, commit with:
```
git add anotame-web/src/routes/\(app\)/dashboard/admin/schedule/+page.svelte anotame-web/src/routes/\(app\)/dashboard/orders/+page.svelte
git commit -m "refactor: replace button-based tabs with shadcn Tabs component on schedule and orders pages"
```
</output>
