---
phase: 27-catalog-wizard-categorized-menu-modal
plan: 5
type: execute
wave: 2  # depends on PLAN-1's catalogPreferences store; runs in parallel with PLAN-2 (both depend only on PLAN-1)
depends_on: [1]
files_modified:
  - anotame-web/src/lib/config/menu.ts
  - anotame-web/src/lib/components/layout/menu-modal.svelte
autonomous: true
requirements:
  - CAT-WIZ-06  # Categorized menu modal with admin filter and wizardOnly filter (ROADMAP success criterion #6)

must_haves:
  truths:
    - "menu-modal.svelte renders 4 categorized sections: Operaciones, Catálogo, Administración, Configuración. Each section has a header (uppercase muted label + icon) and a grid of items below."
    - "The 'Administración' category and any item flagged as admin-only are hidden when `authService.user?.role !== 'ADMIN'` (the entire category title hides if all its items are filtered out)."
    - "An item with `wizardOnly: true` (specifically 'Asistente de Catálogo') is hidden when `catalogPreferences.catalogMode !== 'wizard'`."
    - "The existing footer (user info + 'Editar Credenciales' + 'Cerrar Sesión') is preserved unchanged."
    - "All previously reachable URLs remain reachable through the new structure (no orphaned menu items)."
  artifacts:
    - path: "anotame-web/src/lib/config/menu.ts"
      provides: "menuCategories array (new) + menuItems flat compat export retained"
      contains: "menuCategories"
    - path: "anotame-web/src/lib/components/layout/menu-modal.svelte"
      provides: "Categorized rendering with admin + wizardOnly filters"
      contains: "menuCategories"
  key_links:
    - from: "menu-modal.svelte"
      to: "catalog-preferences"
      via: "import catalogPreferences; reads catalogMode for wizardOnly filter"
      pattern: "catalogPreferences\\.catalogMode"
    - from: "menu-modal.svelte"
      to: "menu.ts"
      via: "import { menuCategories }"
      pattern: "menuCategories"
---

<objective>
Restructure the menu config from a flat 12-item array into 4 logical categories, and rewrite the menu modal to render them as grouped sections with admin and wizardOnly filtering. Footer preserved.

Purpose: Improves discoverability and exposes the wizard entry point as a first-class menu item when the user opts into wizard mode.
Output: One config file restructured (with backward-compat flat export retained), one component rewritten. Build green.
</objective>

<execution_context>
@/Users/moonstone/Source/Personal/anotame-microservices/.claude/get-shit-done/workflows/execute-plan.md
@/Users/moonstone/Source/Personal/anotame-microservices/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/phases/27-catalog-wizard-categorized-menu-modal/27-CONTEXT.md
@.planning/phases/27-catalog-wizard-categorized-menu-modal/27-01-SUMMARY.md
@AI_RULES.md

@anotame-web/src/lib/config/menu.ts
@anotame-web/src/lib/components/layout/menu-modal.svelte

<interfaces>
```ts
// New types in menu.ts
import type { Component } from 'svelte';
export interface MenuItem {
  name: string;
  href: string;
  icon: Component;
  description: string;
  adminOnly?: boolean;
  wizardOnly?: boolean;
}
export interface MenuCategory {
  name: string;
  icon: Component;
  items: MenuItem[];
}
export const menuCategories: MenuCategory[];
// keep legacy flat exports during transition:
export const menuItems: MenuItem[];                  // flattened for any other consumer
export const adminOnlyItems: string[];               // legacy compat
```

```ts
// Filtering reads (in menu-modal.svelte)
import { authService } from '$lib/services/auth.svelte';
import { catalogPreferences } from '$lib/stores/catalog-preferences.svelte';
const isAdmin = $derived(authService.user?.role === 'ADMIN');
const mode = $derived(catalogPreferences.catalogMode);
```
</interfaces>
</context>

<tasks>

<task type="auto" tdd="false">
  <name>Task 1: Restructure menu.ts into menuCategories</name>
  <files>anotame-web/src/lib/config/menu.ts</files>
  <behavior>
    - Exports `menuCategories: MenuCategory[]` with 4 categories matching the structure in CONTEXT.md ("Implementation Decisions › Menu Restructure" + the PRD mockup).
    - The "Asistente de Catálogo" item (href '/dashboard/catalog/wizard', icon WandIcon) lives under "Catálogo" with `wizardOnly: true`.
    - The "Administración" category items (Tablero KPI, Horarios, Negocio, Empleados) all have `adminOnly: true`.
    - "Listas de Precios" remains under "Catálogo" with `adminOnly: true`.
    - Backward compatibility: also export `menuItems` (flat array of all items) and `adminOnlyItems` (string[] of names with adminOnly:true), to avoid breaking any other consumer.
  </behavior>
  <action>
    Rewrite `anotame-web/src/lib/config/menu.ts`:

    1. Keep all existing icon imports and add `import WandIcon from 'lucide-svelte/icons/wand-2'`.
    2. Add `import type { Component } from 'svelte';`
    3. Define and export `MenuItem` and `MenuCategory` interfaces per `<interfaces>` above.
    4. Define `menuCategories` with these 4 entries (preserve all existing items — do NOT drop any href):
       - "Operaciones" (icon ClipboardListIcon): Inicio, Notas, Trabajo, Clientes
       - "Catálogo" (icon TagIcon): Asistente de Catálogo (wizardOnly), Prendas, Servicios, Listas de Precios (adminOnly)
       - "Administración" (icon SettingsIcon): Tablero KPI (adminOnly), Horarios (adminOnly), Negocio (adminOnly), Empleados (adminOnly)
       - "Configuración" (icon SettingsIcon): Preferencias

       Use the exact names, hrefs, descriptions, and icons from the existing flat `menuItems` for all preserved items. Reuse the icons from the current file. Do NOT install new icon packages — `wand-2` is part of lucide-svelte.

    5. Backward-compat exports at end of file:
       ```ts
       export const menuItems: MenuItem[] = menuCategories.flatMap(c => c.items);
       export const adminOnlyItems: string[] = menuItems.filter(i => i.adminOnly).map(i => i.name);
       ```
  </action>
  <verify>
    <automated>cd anotame-web &amp;&amp; bun run build</automated>
    Verify with grep: `grep -v '^#' anotame-web/src/lib/config/menu.ts | grep -c "wizardOnly: true"` should yield 1.
    Verify all original 12 hrefs survive: `grep -E "href: '/dashboard" anotame-web/src/lib/config/menu.ts` should list at least 13 hrefs (12 originals + 1 new wizard href).
  </verify>
  <done>menuCategories exported with 4 categories, wizard item included with wizardOnly flag, backward-compat exports preserved, build green.</done>
</task>

<task type="auto" tdd="false">
  <name>Task 2: Rewrite menu-modal.svelte to render categories with admin + wizardOnly filters</name>
  <files>anotame-web/src/lib/components/layout/menu-modal.svelte</files>
  <behavior>
    - Imports `menuCategories` from menu config (no longer uses `menuItems` / `adminOnlyItems`).
    - Computes `visibleCategories = $derived.by(...)` that:
        - For each category, filters items: drop adminOnly when not admin; drop wizardOnly when mode != 'wizard'.
        - Drops the category entirely if its filtered items array is empty.
    - Renders each visible category as: a header row (uppercase tracking-wider muted label + small icon, e.g. `text-xs font-bold uppercase tracking-wider text-muted-foreground`), followed by a `grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4` of item cards using the same card style as the existing modal.
    - Footer (user avatar + Editar Credenciales + Cerrar Sesión) preserved verbatim.
    - Active item highlighting matches the existing modal (border-primary etc).
    - Closing on Escape and the X button works as before.
  </behavior>
  <action>
    Rewrite `anotame-web/src/lib/components/layout/menu-modal.svelte`:

    1. Replace the `menuItems, adminOnlyItems` import with: `import { menuCategories, type MenuItem } from '$lib/config/menu';`
    2. Add: `import { catalogPreferences } from '$lib/stores/catalog-preferences.svelte';`
    3. Add reactive derivations:
       ```ts
       const isAdmin = $derived(authService.user?.role === 'ADMIN');
       const mode = $derived(catalogPreferences.catalogMode);
       const visibleCategories = $derived(
         menuCategories
           .map(cat => ({ ...cat, items: cat.items.filter(i =>
             (!i.adminOnly || isAdmin) && (!i.wizardOnly || mode === 'wizard')
           ) }))
           .filter(cat => cat.items.length > 0)
       );
       ```
    4. In the body grid container, replace the single `{#each menuItems}` block with:
       ```svelte
       <div class="space-y-8">
         {#each visibleCategories as category (category.name)}
           {@const CategoryIcon = category.icon}
           <section>
             <div class="flex items-center gap-2 mb-3">
               <CategoryIcon class="w-4 h-4 text-muted-foreground" />
               <h3 class="text-xs font-bold uppercase tracking-wider text-muted-foreground">{category.name}</h3>
             </div>
             <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
               {#each category.items as item (item.href)}
                 {@const isActive = page.url.pathname === item.href}
                 {@const ItemIcon = item.icon}
                 <a href={item.href} onclick={handleClose}
                    class="flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 transition-all hover:scale-105 active:scale-95
                      {isActive ? 'border-primary bg-primary/5 text-primary shadow-sm' : 'border-border bg-card hover:border-primary/50 hover:bg-secondary/50 text-muted-foreground hover:text-foreground'}">
                   <ItemIcon class="w-10 h-10 {isActive ? 'text-primary' : 'text-muted-foreground'}" />
                   <span class="text-base font-semibold text-center">{item.name}</span>
                 </a>
               {/each}
             </div>
           </section>
         {/each}
       </div>
       ```
    5. Keep the existing header and footer untouched. Keep the existing `handleClose`, `handleKeydown`, and onMount escape listener unchanged.

    Comply with AI_RULES.md §3:
    - `{@const}` only as direct child of `{#each}` / `{#if}` (the snippet above places it correctly inside `{#each}`).
    - No `<svelte:component>` — uses the Uppercase-variable pattern.
    - No self-closing non-void elements.
  </action>
  <verify>
    <automated>cd anotame-web &amp;&amp; bun run build</automated>
    Manual:
      1. Open menu-modal as ADMIN, mode='wizard' → see 4 sections, 'Asistente de Catálogo' visible.
      2. Toggle mode='pro' in Settings → reopen modal → 'Asistente de Catálogo' is gone; other Catálogo items remain.
      3. Login as EMPLOYEE → reopen modal → 'Administración' section is hidden entirely; 'Listas de Precios' is hidden inside Catálogo.
      4. Footer (avatar, Editar Credenciales, Cerrar Sesión) renders identically.
  </verify>
  <done>4 categorized sections render with correct filtering; admin + wizard filters work; footer intact; build green.</done>
</task>

</tasks>

<verification>
- `bun --cwd anotame-web run build` exits 0
- `grep -v '^#' anotame-web/src/lib/config/menu.ts | grep -c "wizardOnly: true"` returns 1
- `grep -n "menuCategories" anotame-web/src/lib/components/layout/menu-modal.svelte` returns ≥1 match
- `grep -n "catalogPreferences" anotame-web/src/lib/components/layout/menu-modal.svelte` returns ≥1 match
- Manual modal verification covers admin/non-admin and wizard/pro toggles.
</verification>

<success_criteria>
1. Menu modal shows 4 categorized sections.
2. Admin-only items + categories hidden for non-admins.
3. wizardOnly items shown only in wizard mode.
4. Footer preserved verbatim.
5. Build is green.
</success_criteria>

<output>
After completion, create `.planning/phases/27-catalog-wizard-categorized-menu-modal/27-05-SUMMARY.md`.
</output>
