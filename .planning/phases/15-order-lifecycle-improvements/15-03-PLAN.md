---
phase: 15-order-lifecycle-improvements
plan: 03
type: execute
wave: 3
depends_on:
  - 15-PLAN-2
files_modified:
  - anotame-web/src/lib/components/ui/DataTableWrapper.svelte
  - anotame-web/src/lib/components/ui/FloatingActionBar.svelte
  - anotame-web/src/routes/(app)/dashboard/orders/+page.svelte
  - anotame-web/src/lib/components/orders/pickup-code-dialog.svelte
  - anotame-web/src/routes/(app)/dashboard/operations/+page.svelte
autonomous: true
requirements:
  - ORDER-02

must_haves:
  truths:
    - "Orders list shows a 'Seleccionar pedidos' button that activates bulk mode (reveals checkbox column) and a 'Cancelar selección' button that deactivates it"
    - "When 1+ rows are checked in bulk mode a floating action bar appears fixed at viewport bottom-center with: count label, Cambiar estado button, Eliminar pedidos button, and a cancel X button"
    - "Bulk status change: ADMIN can select any target status; EMPLOYEE role sees only RECEIVED / IN_PROGRESS / READY"
    - "Bulk delete: enabled only when all selected orders are DRAFT; otherwise button is disabled with tooltip; confirmation via adaptiveConfirm() listing ticket numbers"
    - "Operations page has a 'Listas para entrega' tab showing only READY orders with an 'Entregar pedido' button per row"
    - "Clicking 'Entregar pedido' opens a dialog: staff enters 6-digit pickup code, submits to PATCH /orders/{id}/deliver, success transitions row to DELIVERED"
    - "After bulk action completes: bulk mode exits, table refreshes, toast shows 'Se actualizaron N pedidos.'"
  artifacts:
    - path: "anotame-web/src/lib/components/ui/FloatingActionBar.svelte"
      provides: "Floating bulk action bar — fixed bottom-center, role-aware status options, delete guard"
      contains: "FloatingActionBar"
    - path: "anotame-web/src/lib/components/ui/DataTableWrapper.svelte"
      provides: "DataTableWrapper extended with bulkActions prop, checkbox column, and selection state callback"
      contains: "bulkActions"
    - path: "anotame-web/src/routes/(app)/dashboard/orders/+page.svelte"
      provides: "Orders list wired to bulk mode — Seleccionar button, FloatingActionBar rendered, bulk handlers"
      contains: "bulkMode"
    - path: "anotame-web/src/lib/components/orders/pickup-code-dialog.svelte"
      provides: "6-digit code entry dialog that calls PATCH /orders/{id}/deliver"
      contains: "pickup-code"
    - path: "anotame-web/src/routes/(app)/dashboard/operations/+page.svelte"
      provides: "Operations page with Listas para entrega tab + pickup-code-dialog per READY row"
      contains: "READY"
  key_links:
    - from: "orders/+page.svelte bulkMode toggle"
      to: "DataTableWrapper bulkActions prop"
      via: "selectedRows callback"
      pattern: "selectedRows"
    - from: "FloatingActionBar Eliminar button"
      to: "DELETE /api/sales/orders/{id} per order"
      via: "sequential apiService.request calls"
      pattern: "apiService.request.*DELETE"
    - from: "FloatingActionBar Cambiar estado"
      to: "PATCH /api/sales/orders/{id}/status per order"
      via: "sequential apiService.request calls"
      pattern: "apiService.request.*status"
    - from: "pickup-code-dialog submit"
      to: "PATCH /api/sales/orders/{id}/deliver"
      via: "apiService.request with pickupCode body"
      pattern: "deliver"
---

<objective>
Bulk selection mode for the orders list (D-17 to D-21) and the READY orders delivery tab with pickup code confirmation in the operations page (D-15, D-16).

Purpose: Completes ORDER-02. Staff can select multiple orders and change their status or delete DRAFT orders in one action. Staff on the operations page can confirm pickup by entering the customer's 6-digit code.
Output: FloatingActionBar component, DataTableWrapper with bulkActions prop, bulk handlers on orders page, pickup-code-dialog, READY tab on operations page.
</objective>

<execution_context>
@/Users/maximilianogonzalezcalzada/Library/Mobile Documents/com~apple~CloudDocs/source/personal/anotame-microservices/.claude/get-shit-done/workflows/execute-plan.md
@/Users/maximilianogonzalezcalzada/Library/Mobile Documents/com~apple~CloudDocs/source/personal/anotame-microservices/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@/Users/maximilianogonzalezcalzada/Library/Mobile Documents/com~apple~CloudDocs/source/personal/anotame-microservices/.planning/ROADMAP.md
@/Users/maximilianogonzalezcalzada/Library/Mobile Documents/com~apple~CloudDocs/source/personal/anotame-microservices/.planning/phases/15-order-lifecycle-improvements/15-CONTEXT.md
@/Users/maximilianogonzalezcalzada/Library/Mobile Documents/com~apple~CloudDocs/source/personal/anotame-microservices/.planning/phases/15-order-lifecycle-improvements/15-RESEARCH.md
@/Users/maximilianogonzalezcalzada/Library/Mobile Documents/com~apple~CloudDocs/source/personal/anotame-microservices/.planning/phases/15-order-lifecycle-improvements/15-UI-SPEC.md

<interfaces>
<!-- Key contracts the executor needs. Extracted from codebase reads. -->

From DataTableWrapper.svelte (current Props type):
```typescript
type Props = {
  columns: ColumnDef<TData>[];
  data: TData[];
  pageSize?: number;
  loading?: boolean;
  emptyMessage?: string;
  filterPlaceholder?: string;
  showFilter?: boolean;
  actionCell?: import('svelte').Snippet<[Row<TData>]>;
  cellRenders?: Record<string, import('svelte').Snippet<[Row<TData>]>>;
};
```
Current table state already manages: `sorting`, `globalFilter`, `pagination`, `columnPinning`.
Table is created via `$derived(createTable<TData>({...}))` — any new state added to the options object will cause recomputation.

From orders/+page.svelte (current bulk-relevant imports and state already present):
```typescript
import DataTableWrapper from '$lib/components/ui/DataTableWrapper.svelte';
import { AdaptiveSelect } from '$lib/components/ui/responsive';
import { authService } from '$lib/services/auth.svelte'; // NOT yet imported — add it
import { adaptiveConfirm } from '$lib/components/ui/responsive/confirm-state.svelte';
import { ApiError } from '$lib/services/ApiError';
// orders = $state<any[]>([]) already exists
// activeColumns: ColumnDef<any>[] already defined
```

From operations/+page.svelte (current structure):
```typescript
// Uses raw <Table.Root> — NOT DataTableWrapper
// workOrders = $state<any[]>([]) already exists — filtered to IN_PROGRESS on fetch
// apiService.request pattern: apiService.request(`${API_SALES}/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status: 'READY' }) })
// ApiError imported: import { ApiError } from '$lib/services/ApiError';
```

Role codes (CRITICAL — Finding 1 from RESEARCH.md):
- `authService.user?.role === 'ADMIN'` for admin check
- `authService.user?.role === 'EMPLOYEE'` for operator check
- Import: `import { authService } from '$lib/services/auth.svelte'`
- NEVER use 'OPERATOR' string in code

Svelte 5 rules (from AI_RULES.md):
- Use `$state`, `$derived`, `$effect` only
- Never `<svelte:component>` — map icon to uppercase const: `{@const IconComponent = item.icon}` then `<IconComponent />`
- Never `window.confirm()` — use `adaptiveConfirm()`
- All toasts via `toast` from `svelte-sonner`
- h-12 minimum + `touch-manipulation` on all interactive elements
- Self-closing non-void HTML: always `<div></div>` not `<div />`
- `{@const}` MUST be direct child of `{#each}` or `{#if}` — not inside raw HTML

Existing apiService.request signature (used throughout the codebase):
```typescript
// GET:   apiService.request<T>(`${API_SALES}/path`)
// PATCH: apiService.request(`${API_SALES}/path`, { method: 'PATCH', body: JSON.stringify(payload) })
// DELETE: apiService.request(`${API_SALES}/path`, { method: 'DELETE' })
```

TanStack Table row selection (from RESEARCH.md Pattern 6):
```typescript
import { getRowSelectionRowModel } from '@tanstack/table-core';
// Add to createTable() options when bulkActions=true:
// enableRowSelection: true,
// getRowSelectionRowModel: getRowSelectionRowModel(),
// onRowSelectionChange: (updater) => { rowSelection = typeof updater === 'function' ? updater(rowSelection) : updater; }
```

Checkbox column definition pattern (TanStack standard):
```typescript
const selectionColumn: ColumnDef<TData> = {
  id: '__select__',
  header: ({ table }) => ({
    // header checkbox for select-all
  }),
  cell: ({ row }) => ({
    // row checkbox
  }),
  enableSorting: false,
  size: 48,
};
```

Status transitions allowed for EMPLOYEE (OPERATOR per D-20):
- Forward-only: RECEIVED → IN_PROGRESS → READY
- Allowed target values: ['RECEIVED', 'IN_PROGRESS', 'READY']
ADMIN: all status values: ['RECEIVED', 'IN_PROGRESS', 'READY', 'DELIVERED', 'CANCELLED']

Component imports verified present in project:
- `import * as Dialog from '$lib/components/ui/dialog'`
- `import { Input } from '$lib/components/ui/input'`
- `import * as Tabs from '$lib/components/ui/tabs'` (already in orders page)
- `import { Button } from '$lib/components/ui/button'`
- `import StatusBadge from '$lib/components/ui/StatusBadge.svelte'`
- `import { adaptiveConfirm } from '$lib/components/ui/responsive/confirm-state.svelte'`
- `import { AdaptiveSelect } from '$lib/components/ui/responsive'`
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: DataTableWrapper bulk mode extension + FloatingActionBar component</name>
  <files>
    anotame-web/src/lib/components/ui/DataTableWrapper.svelte,
    anotame-web/src/lib/components/ui/FloatingActionBar.svelte
  </files>

  <read_first>
    - anotame-web/src/lib/components/ui/DataTableWrapper.svelte (full file — current Props type, createTable() options, sorting/filter/pagination state, template structure including header row rendering and cell rendering)
    - anotame-web/src/lib/services/auth.svelte.ts OR anotame-web/src/lib/services/auth.svelte (whichever exists — confirm authService export and user.role field)
    - anotame-web/src/lib/components/ui/button/index.ts (Button component — confirm import path)
  </read_first>

  <action>
**DataTableWrapper.svelte — add bulkActions prop and selection state:**

1. **Add to Props type** (alongside existing props):
```typescript
bulkActions?: boolean;
onSelectionChange?: (selectedRows: TData[]) => void;
```

2. **Add new state variables** (after existing `let columnPinning = $state<ColumnPinningState>(...)`):
```typescript
let rowSelection = $state<Record<string, boolean>>({});
let bulkMode = $state(false);
```

3. **Extend `createTable()` options** inside the existing `$derived` block — add these fields when `bulkActions` prop is true. The `createTable()` call already has `data`, `columns`, `state`, `onStateChange`, and handler callbacks. Add to the options object:
```typescript
// Inside the createTable() options:
...(bulkActions ? {
  enableRowSelection: true,
  getRowSelectionRowModel: getRowSelectionRowModel(),
  onRowSelectionChange: (updater: any) => {
    rowSelection = typeof updater === 'function' ? updater(rowSelection) : updater;
  },
} : {}),
// Also add rowSelection to the state object:
// state: { sorting, globalFilter, pagination, columnPinning, ...(bulkActions ? { rowSelection } : {}) }
```
Read the full existing `createTable()` call carefully before editing — add these keys without removing any existing ones.

4. **Prepend checkbox column when bulkMode is active.** The existing `columns` prop is used directly. Create a derived columns list that prepends the selection column when `bulkMode` is true:
```typescript
const selectionColumn: ColumnDef<TData> = {
  id: '__select__',
  size: 48,
  enableSorting: false,
  header: ({ table }: any) => table,  // rendered via snippet below
  cell: ({ row }: any) => row,         // rendered via snippet below
};

let effectiveColumns = $derived(
  bulkActions && bulkMode
    ? [selectionColumn as ColumnDef<TData>, ...columns]
    : columns
);
```
Then replace `columns` with `effectiveColumns` inside the `createTable()` call.

5. **Reset rowSelection when bulkMode is toggled off:**
```typescript
$effect(() => {
  if (!bulkMode) {
    rowSelection = {};
  }
});
```

6. **Fire onSelectionChange callback when rowSelection changes:**
```typescript
$effect(() => {
  if (!bulkActions || !onSelectionChange) return;
  const selected = table.getSelectedRowModel().rows.map((r: any) => r.original as TData);
  untrack(() => onSelectionChange(selected));
});
```

7. **Expose `bulkMode` toggle and selection state via a snippet/prop for the parent.** Add two new props:
```typescript
getBulkMode?: () => boolean;
setBulkMode?: (v: boolean) => void;
```
In the component body, call these to let the parent control bulk mode:
```typescript
// When getBulkMode / setBulkMode are provided, sync with parent
$effect(() => {
  if (setBulkMode) {
    // Expose internal toggle function
  }
});
```

IMPORTANT NOTE: Since Svelte 5 does not support binding to internal state directly, the simpler approach is to expose bulk mode as a **bindable prop**:
```typescript
// Replace getBulkMode/setBulkMode with:
let { ..., bulkActions = false, onSelectionChange, bulkMode: bulkModeProp = $bindable(false) }: Props = $props();
// Then sync: let bulkMode = $state(false); becomes let bulkMode = bulkModeProp;
// Use $derived or bind the prop — read Svelte 5 $bindable docs in the file for existing patterns
```
Read whether the existing component uses `$bindable` elsewhere. If it does NOT, the safest approach is to keep `bulkMode` fully internal and expose `onSelectionChange` and a `toggleBulkMode` callback prop instead:
```typescript
toggleBulkMode?: () => void;  // caller binds a function to this prop; component calls it when ready
```
For simplicity: make `bulkMode` a `$bindable` prop so the parent can `bind:bulkMode={localBulkMode}`.

Exact Props addition (final):
```typescript
type Props = {
  // ... all existing fields unchanged ...
  bulkActions?: boolean;
  bulkMode?: boolean;  // $bindable — parent binds to control toggle
  onSelectionChange?: (selectedRows: TData[]) => void;
};

let {
  columns,
  data,
  // ... all existing destructured props unchanged ...
  bulkActions = false,
  bulkMode = $bindable(false),
  onSelectionChange,
}: Props = $props();
```
Remove the local `let bulkMode = $state(false)` since bulkMode is now a bindable prop driven by the parent.

8. **Template changes — checkbox column rendering:**

In the table header row rendering, check if the column id is `'__select__'` and render a checkbox `<input type="checkbox">` for select-all:
```svelte
{#if header.column.id === '__select__'}
  <input
    type="checkbox"
    class="h-4 w-4 cursor-pointer"
    aria-label="Seleccionar todos"
    checked={table.getIsAllRowsSelected()}
    onchange={table.getToggleAllRowsSelectedHandler()}
  />
{:else}
  <!-- existing header rendering -->
{/if}
```

In the table body cell rendering, check if the column id is `'__select__'` and render a row checkbox:
```svelte
{#if cell.column.id === '__select__'}
  <input
    type="checkbox"
    class="h-4 w-4 cursor-pointer"
    aria-label="Seleccionar fila"
    checked={cell.row.getIsSelected()}
    onchange={cell.row.getToggleSelectedHandler()}
  />
{:else}
  <!-- existing cell rendering logic -->
{/if}
```

---

**FloatingActionBar.svelte — create new file at `anotame-web/src/lib/components/ui/FloatingActionBar.svelte`:**

This is a new standalone component. No existing file to read first — create from scratch following project Svelte 5 patterns.

```svelte
<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { AdaptiveSelect } from '$lib/components/ui/responsive';
  import { X } from 'lucide-svelte';

  type Props = {
    count: number;
    isAdmin: boolean;
    allDraft: boolean;       // true when every selected order is DRAFT status
    onChangeStatus: (status: string) => Promise<void>;
    onDelete: () => Promise<void>;
    onCancel: () => void;
  };

  let { count, isAdmin, allDraft, onChangeStatus, onDelete, onCancel }: Props = $props();

  const adminStatuses = ['RECEIVED', 'IN_PROGRESS', 'READY', 'DELIVERED', 'CANCELLED'];
  const employeeStatuses = ['RECEIVED', 'IN_PROGRESS', 'READY'];

  let availableStatuses = $derived(isAdmin ? adminStatuses : employeeStatuses);

  let statusItems = $derived(availableStatuses.map(s => ({ value: s, label: s })));

  let selectedStatus = $state('');

  async function handleChangeStatus() {
    if (!selectedStatus) return;
    await onChangeStatus(selectedStatus);
    selectedStatus = '';
  }
</script>

{#if count > 0}
<div
  role="toolbar"
  aria-label="Acciones en lote"
  class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-card border border-border rounded-xl shadow-lg px-4 py-2"
>
  <span class="text-sm font-semibold text-foreground whitespace-nowrap">{count} seleccionadas</span>

  <div class="flex items-center gap-2">
    <AdaptiveSelect
      bind:value={selectedStatus}
      placeholder="Cambiar estado"
      items={statusItems}
      class="h-9 min-w-[160px] text-sm"
    />
    <Button
      variant="default"
      size="sm"
      class="h-9 touch-manipulation"
      disabled={!selectedStatus}
      onclick={handleChangeStatus}
    >
      Aplicar
    </Button>
  </div>

  <Button
    variant="destructive"
    size="sm"
    class="h-9 touch-manipulation"
    disabled={!allDraft}
    title={!allDraft ? 'Solo se pueden eliminar pedidos en borrador' : undefined}
    onclick={onDelete}
  >
    Eliminar pedidos
  </Button>

  <Button
    variant="ghost"
    size="icon"
    class="h-9 w-9 touch-manipulation"
    aria-label="Cancelar selección"
    onclick={onCancel}
  >
    {@const XIcon = X}
    <XIcon class="w-4 h-4" />
  </Button>
</div>
{/if}
```

Note: The `{@const XIcon = X}` pattern satisfies AI_RULES.md prohibition on `<svelte:component>`. However, since `X` is a direct Lucide import used as `<X />`, this is fine directly as `<X class="..." />` — Lucide components are standard Svelte components imported as uppercase named exports. Only use the `{@const}` pattern when mapping from a variable (like `item.icon`). For direct named imports like `X`, use `<X />` directly.
  </action>

  <verify>
    <automated>cd "/Users/maximilianogonzalezcalzada/Library/Mobile Documents/com~apple~CloudDocs/source/personal/anotame-microservices/anotame-web" && bun run check 2>&1 | tail -20</automated>
  </verify>

  <acceptance_criteria>
    - DataTableWrapper.svelte Props type contains `bulkActions?: boolean`
    - DataTableWrapper.svelte contains `bulkMode = $bindable(false)`
    - DataTableWrapper.svelte contains `onSelectionChange`
    - DataTableWrapper.svelte contains `getRowSelectionRowModel`
    - DataTableWrapper.svelte contains `__select__` (selection column id)
    - DataTableWrapper.svelte contains `aria-label="Seleccionar todos"`
    - DataTableWrapper.svelte contains `getIsAllRowsSelected`
    - FloatingActionBar.svelte exists at `anotame-web/src/lib/components/ui/FloatingActionBar.svelte`
    - FloatingActionBar.svelte contains `role="toolbar"` and `aria-label="Acciones en lote"`
    - FloatingActionBar.svelte contains `fixed bottom-6 left-1/2 -translate-x-1/2`
    - FloatingActionBar.svelte contains `allDraft` prop and disabled logic on delete button
    - FloatingActionBar.svelte contains `onChangeStatus` and `onDelete` and `onCancel` props
    - `bun run check` exits 0
  </acceptance_criteria>

  <done>DataTableWrapper has bulkActions prop with bindable bulkMode, checkbox column (shown only in bulk mode), getRowSelectionRowModel integration, and onSelectionChange callback. FloatingActionBar exists as a standalone component with role-aware status picker, delete guard, and cancel button. TypeScript check passes.</done>
</task>

<task type="auto">
  <name>Task 2: Orders page bulk wiring + pickup-code-dialog + operations READY tab</name>
  <files>
    anotame-web/src/routes/(app)/dashboard/orders/+page.svelte,
    anotame-web/src/lib/components/orders/pickup-code-dialog.svelte,
    anotame-web/src/routes/(app)/dashboard/operations/+page.svelte
  </files>

  <read_first>
    - anotame-web/src/routes/(app)/dashboard/orders/+page.svelte (full file — current imports, state, activeColumns definition, DataTableWrapper usage in Tabs.Content "active", existing handleDeleteDraft)
    - anotame-web/src/routes/(app)/dashboard/operations/+page.svelte (full file — current imports, state, fetchWorkOrders, handleComplete, handleCancelWorkOrder, table template structure, existing Table.Root usage)
    - anotame-web/src/lib/services/auth.svelte.ts OR anotame-web/src/lib/services/auth.svelte (confirm authService import path and user.role field)
    - anotame-web/src/lib/components/ui/FloatingActionBar.svelte (just created in Task 1 — verify Props)
    - anotame-web/src/lib/components/ui/DataTableWrapper.svelte (just modified in Task 1 — verify bulkActions, bulkMode, onSelectionChange prop names)
    - anotame-web/src/lib/components/ui/dialog/index.ts (confirm Dialog component import path)
    - anotame-web/src/lib/components/ui/input/index.ts (confirm Input component import path)
  </read_first>

  <action>
**orders/+page.svelte — wire bulk mode to DataTableWrapper + FloatingActionBar:**

1. **Add imports** at the top of the script block (do NOT remove any existing imports):
```typescript
import FloatingActionBar from '$lib/components/ui/FloatingActionBar.svelte';
import { authService } from '$lib/services/auth.svelte';
```

2. **Add bulk state variables** (after existing state declarations):
```typescript
let bulkMode = $state(false);
let selectedOrders = $state<any[]>([]);
```

3. **Add derived helpers:**
```typescript
const isAdmin = $derived(authService.user?.role === 'ADMIN');
const allSelectedAreDraft = $derived(selectedOrders.every(o => o.status === 'DRAFT'));
```

4. **Add bulk handler functions:**

```typescript
async function handleBulkStatusChange(targetStatus: string) {
  let successCount = 0;
  for (const order of selectedOrders) {
    try {
      await apiService.request(`${API_SALES}/orders/${order.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: targetStatus })
      });
      successCount++;
    } catch (e: any) {
      toast.error(`Error al actualizar ${order.ticketNumber}`, { description: e?.message });
    }
  }
  if (successCount > 0) {
    toast.success(`Se actualizaron ${successCount} pedidos.`);
  }
  bulkMode = false;
  selectedOrders = [];
  fetchData();  // refresh table — use existing fetchData() function
}

async function handleBulkDelete() {
  if (!allSelectedAreDraft) return;

  const ticketList = selectedOrders.map(o => o.ticketNumber).join(', ');
  const ok = await adaptiveConfirm({
    title: 'Eliminar pedidos',
    description: `Se eliminarán ${selectedOrders.length} pedidos en borrador: ${ticketList}. Esta acción no se puede deshacer.`
  });
  if (!ok) return;

  let successCount = 0;
  for (const order of selectedOrders) {
    try {
      await apiService.request(`${API_SALES}/orders/${order.id}`, { method: 'DELETE' });
      successCount++;
    } catch (e: any) {
      if (e instanceof ApiError && e.status === 409) {
        toast.error(`No se puede eliminar ${order.ticketNumber}`, {
          description: 'Tiene registros de trabajo vinculados.'
        });
      } else {
        toast.error(`Error al eliminar ${order.ticketNumber}`, { description: e?.message });
      }
    }
  }
  if (successCount > 0) {
    toast.success(`Se actualizaron ${successCount} pedidos.`);
  }
  bulkMode = false;
  selectedOrders = [];
  fetchData();
}

function handleBulkCancel() {
  bulkMode = false;
  selectedOrders = [];
}
```

5. **Add "Seleccionar pedidos" / "Cancelar selección" button to the Active tab header.** Find the existing tab header area (the `flex` div above the active orders DataTableWrapper inside `Tabs.Content value="active"`). Add the bulk toggle button alongside the existing filter form. Place it at the right side of the filter row:
```svelte
<div class="flex justify-end mt-2">
  {#if !bulkMode}
    <Button
      variant="secondary"
      class="h-12 px-4 touch-manipulation"
      onclick={() => { bulkMode = true; selectedOrders = []; }}
    >
      Seleccionar pedidos
    </Button>
  {:else}
    <Button
      variant="ghost"
      class="h-12 px-4 touch-manipulation"
      onclick={handleBulkCancel}
    >
      Cancelar selección
    </Button>
  {/if}
</div>
```
Place this div between the filter grid and the DataTableWrapper container — the exact position depends on the current template; read the file to find the right insertion point.

6. **Update the DataTableWrapper call** (in Tabs.Content value="active") — add the three new props:
```svelte
<DataTableWrapper
  columns={activeColumns}
  data={filteredOrders}
  loading={loading}
  emptyMessage="No se encontraron pedidos."
  filterPlaceholder="Buscar pedidos..."
  showFilter={false}
  cellRenders={{ status: statusCell }}
  bulkActions={true}
  bind:bulkMode={bulkMode}
  onSelectionChange={(rows) => { selectedOrders = rows; }}
>
  {#snippet actionCell(row)}
    <!-- existing action cell content unchanged -->
  {/snippet}
</DataTableWrapper>
```
Keep all existing DataTableWrapper props and snippets unchanged — only ADD the three new props.

7. **Render FloatingActionBar** in the template after the DataTableWrapper (still inside Tabs.Content "active"). Place it after the closing `</div>` of the DataTableWrapper container, but at the same level so it escapes table overflow:
```svelte
<FloatingActionBar
  count={selectedOrders.length}
  isAdmin={isAdmin}
  allDraft={allSelectedAreDraft}
  onChangeStatus={handleBulkStatusChange}
  onDelete={handleBulkDelete}
  onCancel={handleBulkCancel}
/>
```

---

**pickup-code-dialog.svelte — create new file:**

Create at `anotame-web/src/lib/components/orders/pickup-code-dialog.svelte`.

```svelte
<script lang="ts">
  import * as Dialog from '$lib/components/ui/dialog';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { apiService, API_SALES } from '$lib/services/api.svelte';
  import { ApiError } from '$lib/services/ApiError';
  import { toast } from 'svelte-sonner';

  type Props = {
    open: boolean;
    orderId: string;
    ticketNumber: string;
    onDelivered: () => void;    // called on success — parent refreshes table
    onClose: () => void;
  };

  let { open = $bindable(false), orderId, ticketNumber, onDelivered, onClose }: Props = $props();

  let pickupCode = $state('');
  let errorMessage = $state('');
  let submitting = $state(false);

  const isValid = $derived(pickupCode.length === 6 && /^\d{6}$/.test(pickupCode));

  function handleInput(e: Event) {
    const target = e.target as HTMLInputElement;
    pickupCode = target.value.replace(/\D/g, '').slice(0, 6);
    errorMessage = '';
  }

  async function handleSubmit() {
    if (!isValid) return;
    submitting = true;
    errorMessage = '';

    try {
      await apiService.request(`${API_SALES}/orders/${orderId}/deliver`, {
        method: 'PATCH',
        body: JSON.stringify({ pickupCode })
      });
      toast.success('Pedido entregado correctamente.');
      pickupCode = '';
      open = false;
      onDelivered();
    } catch (e: any) {
      if (e instanceof ApiError && e.status === 400) {
        errorMessage = 'Código incorrecto. Verifique con el cliente.';
        pickupCode = '';
        // return focus to input — handled by aria-describedby + user re-typing
      } else {
        toast.error('Ocurrió un error. Por favor, intente nuevamente.');
      }
    } finally {
      submitting = false;
    }
  }

  function handleClose() {
    pickupCode = '';
    errorMessage = '';
    open = false;
    onClose();
  }
</script>

<Dialog.Root bind:open onOpenChange={(v) => { if (!v) handleClose(); }}>
  <Dialog.Content class="sm:max-w-sm">
    <Dialog.Header>
      <Dialog.Title>Confirmar entrega</Dialog.Title>
      <Dialog.Description>
        Ingrese el código de retiro del cliente para confirmar la entrega del pedido {ticketNumber}.
      </Dialog.Description>
    </Dialog.Header>

    <div class="space-y-3 py-2">
      <Input
        id="pickup-code-input"
        type="text"
        inputmode="numeric"
        maxlength={6}
        pattern="[0-9]{6}"
        placeholder="000000"
        aria-label="Código de retiro del cliente"
        aria-describedby={errorMessage ? 'pickup-code-error' : undefined}
        value={pickupCode}
        oninput={handleInput}
        class="text-center text-2xl tracking-widest font-mono h-14 touch-manipulation ring-primary focus-visible:ring-primary"
        autocomplete="off"
      />
      {#if errorMessage}
        <p id="pickup-code-error" class="text-sm text-destructive" role="alert">{errorMessage}</p>
      {/if}
    </div>

    <Dialog.Footer class="gap-2">
      <Button variant="outline" onclick={handleClose} class="h-12 touch-manipulation">
        Cancelar
      </Button>
      <Button
        onclick={handleSubmit}
        disabled={!isValid || submitting}
        class="h-12 touch-manipulation"
      >
        {submitting ? 'Confirmando...' : 'Confirmar entrega'}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
```

---

**operations/+page.svelte — add "Listas para entrega" tab:**

The existing page uses `<Table.Root>` directly (no DataTableWrapper — per Finding 5 in RESEARCH.md, do NOT convert it). Add a Tabs wrapper and a new READY orders tab without changing the existing IN_PROGRESS view.

1. **Add imports** (do NOT remove existing imports):
```typescript
import * as Tabs from '$lib/components/ui/tabs';
import PickupCodeDialog from '$lib/components/orders/pickup-code-dialog.svelte';
```

2. **Add READY orders state and dialog state:**
```typescript
let readyOrders = $state<any[]>([]);
let deliverDialogOpen = $state(false);
let deliverTarget = $state<{ id: string; ticketNumber: string } | null>(null);
```

3. **Update `fetchWorkOrders()`** — after fetching all orders, also compute readyOrders. Keep the existing `workOrders` filter for IN_PROGRESS unchanged:
```typescript
async function fetchWorkOrders() {
  loading = true;
  try {
    const allOrders = await apiService.request<any[]>(`${API_SALES}/orders`);
    workOrders = (allOrders || []).filter((o: any) => o.status === 'IN_PROGRESS');
    readyOrders = (allOrders || []).filter((o: any) => o.status === 'READY');
  } catch (e: any) {
    console.error(e);
    toast.error('Error al cargar las órdenes de trabajo');
    workOrders = [];
    readyOrders = [];
  } finally {
    loading = false;
  }
}
```

4. **Add deliver handler:**
```typescript
function openDeliverDialog(order: any) {
  deliverTarget = { id: order.id, ticketNumber: order.ticketNumber };
  deliverDialogOpen = true;
}

function handleDelivered() {
  deliverDialogOpen = false;
  deliverTarget = null;
  fetchWorkOrders();  // refresh both lists
}
```

5. **Wrap the existing template in Tabs.** The current template is a single `<div class="space-y-6 ...">` with a header and a `<div class="bg-card ...">` table. Wrap the table section in `<Tabs.Root>` with two tabs:
- Tab 1: "En progreso" — contains the UNCHANGED existing `<div class="bg-card border..."><Table.Root>` block
- Tab 2: "Listas para entrega" — contains a new READY orders table

The full resulting template structure:

```svelte
<div class="space-y-6 animate-in fade-in duration-300">
  <!-- Existing header div — KEEP UNCHANGED -->
  <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
    <!-- ... existing header content ... -->
  </div>

  <Tabs.Root value="in-progress" class="space-y-4">
    <Tabs.List class="shadow-sm border border-border/50">
      <Tabs.Trigger value="in-progress" class="px-6 font-bold">En progreso</Tabs.Trigger>
      <Tabs.Trigger value="ready" class="px-6 font-bold">Listas para entrega</Tabs.Trigger>
    </Tabs.List>

    <Tabs.Content value="in-progress">
      <!-- EXISTING table block — move it here UNCHANGED -->
      <div class="bg-card border border-border rounded-xl overflow-x-auto shadow-sm">
        <!-- ... existing Table.Root block ... -->
      </div>
    </Tabs.Content>

    <Tabs.Content value="ready">
      <div class="bg-card border border-border rounded-xl overflow-x-auto shadow-sm">
        <Table.Root class="w-full min-w-[700px]">
          <Table.Header>
            <Table.Row>
              <Table.Head class="px-6 py-4">Ticket</Table.Head>
              <Table.Head class="px-6 py-4">Cliente</Table.Head>
              <Table.Head class="px-6 py-4">Prendas</Table.Head>
              <Table.Head class="px-6 py-4">Entrega prometida</Table.Head>
              <Table.Head class="px-6 py-4 text-right">Acciones</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {#if loading}
              <Table.Row>
                <Table.Cell colspan={5} class="h-24 text-center">Cargando...</Table.Cell>
              </Table.Row>
            {:else if readyOrders.length === 0}
              <Table.Row>
                <Table.Cell colspan={5} class="h-32 text-center">
                  <div class="flex flex-col items-center gap-2 text-muted-foreground">
                    <p class="text-base font-semibold">Sin pedidos listos</p>
                    <p class="text-sm">No hay pedidos marcados como LISTO en este momento.</p>
                  </div>
                </Table.Cell>
              </Table.Row>
            {:else}
              {#each readyOrders as ro (ro.id)}
                <Table.Row class="hover:bg-muted/30 transition-colors">
                  <Table.Cell class="px-6 py-4 font-medium font-mono text-sm">{ro.ticketNumber}</Table.Cell>
                  <Table.Cell class="px-6 py-4">{ro.customer?.firstName} {ro.customer?.lastName}</Table.Cell>
                  <Table.Cell class="px-6 py-4 text-sm text-muted-foreground max-w-xs truncate">
                    {ro.items?.map((i: any) => i.garmentName).filter(Boolean).join(', ') || '-'}
                  </Table.Cell>
                  <Table.Cell class="px-6 py-4 text-muted-foreground text-sm">
                    {formatDate(ro.committedDeadline)}
                  </Table.Cell>
                  <Table.Cell class="px-6 py-4 text-right">
                    <Button
                      class="h-12 px-4 touch-manipulation font-medium"
                      onclick={() => openDeliverDialog(ro)}
                    >
                      Entregar pedido
                    </Button>
                  </Table.Cell>
                </Table.Row>
              {/each}
            {/if}
          </Table.Body>
        </Table.Root>
      </div>
    </Tabs.Content>
  </Tabs.Root>
</div>

{#if deliverTarget}
  <PickupCodeDialog
    bind:open={deliverDialogOpen}
    orderId={deliverTarget.id}
    ticketNumber={deliverTarget.ticketNumber}
    onDelivered={handleDelivered}
    onClose={() => { deliverDialogOpen = false; deliverTarget = null; }}
  />
{/if}
```

IMPORTANT: Move the existing `<div class="bg-card border border-border rounded-xl overflow-x-auto shadow-sm">` table block into `Tabs.Content value="in-progress"` without any changes to its internals. Do not rename or re-order existing columns. Do not touch `handleComplete`, `handleCancelWorkOrder`, or any existing handler functions.
  </action>

  <verify>
    <automated>cd "/Users/maximilianogonzalezcalzada/Library/Mobile Documents/com~apple~CloudDocs/source/personal/anotame-microservices/anotame-web" && bun run build 2>&1 | tail -20</automated>
  </verify>

  <acceptance_criteria>
    - orders/+page.svelte contains `import FloatingActionBar`
    - orders/+page.svelte contains `let bulkMode = $state(false)`
    - orders/+page.svelte contains `let selectedOrders = $state`
    - orders/+page.svelte contains `bulkActions={true}` on DataTableWrapper
    - orders/+page.svelte contains `bind:bulkMode={bulkMode}`
    - orders/+page.svelte contains `onSelectionChange`
    - orders/+page.svelte contains `handleBulkStatusChange`
    - orders/+page.svelte contains `handleBulkDelete`
    - orders/+page.svelte contains `Seleccionar pedidos`
    - orders/+page.svelte contains `Cancelar selección`
    - orders/+page.svelte contains `<FloatingActionBar`
    - orders/+page.svelte contains `allDraft={allSelectedAreDraft}`
    - pickup-code-dialog.svelte exists at `anotame-web/src/lib/components/orders/pickup-code-dialog.svelte`
    - pickup-code-dialog.svelte contains `inputmode="numeric"` and `maxlength`
    - pickup-code-dialog.svelte contains `tracking-widest font-mono`
    - pickup-code-dialog.svelte contains `aria-label="Código de retiro del cliente"`
    - pickup-code-dialog.svelte contains `ApiError && e.status === 400`
    - pickup-code-dialog.svelte contains `/deliver` (the endpoint path)
    - operations/+page.svelte contains `import * as Tabs`
    - operations/+page.svelte contains `Listas para entrega`
    - operations/+page.svelte contains `readyOrders`
    - operations/+page.svelte contains `openDeliverDialog`
    - operations/+page.svelte contains `<PickupCodeDialog`
    - operations/+page.svelte contains `Sin pedidos listos` (empty state)
    - operations/+page.svelte contains `Entregar pedido` (READY row action)
    - `bun run build` exits 0
  </acceptance_criteria>

  <done>Orders page has bulk mode toggle ("Seleccionar pedidos" / "Cancelar selección"), DataTableWrapper wired with bulkActions + selection callback, FloatingActionBar rendered with bulk handlers. pickup-code-dialog is a new component that handles 6-digit code entry, calls PATCH /deliver, shows inline error on 400. Operations page has "Listas para entrega" tab with READY orders table and "Entregar pedido" button per row opening the dialog. Build passes.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| client → PATCH /orders/{id}/status (bulk) | Each status value comes from a controlled UI selector, but the HTTP call is client-originated |
| client → DELETE /orders/{id} (bulk) | Bulk delete iterates over selected IDs — IDs are from API response, not user-typed |
| client → PATCH /orders/{id}/deliver | Pickup code from user input field — backend validates; 400 on mismatch |
| Frontend role check for bulk status options | `authService.user?.role` gates which status values appear in the selector |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-15-11 | Elevation of Privilege | FloatingActionBar status selector — EMPLOYEE shown admin-only statuses | mitigate | `isAdmin` derived from `authService.user?.role` controls `availableStatuses` array in FloatingActionBar; backend PATCH /status validates role independently (Plan 1 backend is authoritative) |
| T-15-12 | Tampering | Bulk delete sending DELETE to non-DRAFT orders | mitigate | `allSelectedAreDraft` derived check disables the delete button client-side; each DELETE call returns 409 from backend if order has work orders; partial failures reported per-order via toast |
| T-15-13 | Tampering | PATCH /deliver pickup code brute-force from dialog | accept | 6-digit code has 1-in-1,000,000 chance per attempt; backend uses constant-time comparison (Plan 1, T-15-03); no rate limiting added in Phase 15 — acceptable for staff-only intranet system with visible accountability |
| T-15-14 | Information Disclosure | Pickup code dialog inline error reveals code validation exists | accept | Error message "Código incorrecto" is expected staff UX; no enumeration risk in a staff-only authenticated app |
| T-15-15 | Spoofing | Bulk action operating on order IDs not belonging to the current branch | mitigate | `selectedOrders` state is populated from `filteredOrders` which is fetched from `/api/sales/orders` using the staff member's JWT; backend enforces branch ownership on all order endpoints |
| T-15-16 | Denial of Service | Bulk status change iterating 100+ orders serially | accept | Bulk UI shows all currently loaded orders — pagination limits exposure; sequential calls prevent thundering-herd; acceptable for staff intranet use |
</threat_model>

<verification>
After both tasks complete:
1. Run `bun run build && bun run check` in anotame-web — must exit 0
2. Open orders list — "Seleccionar pedidos" button visible; click it: checkbox column appears; click "Cancelar selección": checkboxes hidden
3. Select 1+ orders — floating bar appears at bottom with count, status selector, delete button, X cancel
4. As EMPLOYEE: status selector shows only RECEIVED / IN_PROGRESS / READY (no DELIVERED / CANCELLED)
5. As ADMIN: status selector shows all 5 statuses
6. Select DRAFT orders → bulk delete button enabled; select non-DRAFT orders → delete button disabled with tooltip text
7. Trigger bulk delete: adaptiveConfirm appears listing ticket numbers; confirm: orders deleted, toast "Se actualizaron N pedidos."
8. Open /dashboard/operations — "En progreso" and "Listas para entrega" tabs visible; default tab is "En progreso" with existing behavior unchanged
9. Switch to "Listas para entrega" tab — READY orders listed; empty state shows "Sin pedidos listos" when none
10. Click "Entregar pedido" — dialog opens: input field (numeric, monospace, centered), submit disabled until 6 digits
11. Enter wrong code — inline error "Código incorrecto. Verifique con el cliente.", input cleared, focus returned
12. Enter correct code — dialog closes, row disappears from READY tab, toast "Pedido entregado correctamente."
</verification>

<success_criteria>
- DataTableWrapper has optional bulkActions prop; when true and bulkMode is true, checkbox column prepended to column definitions; selection state exposed via onSelectionChange callback
- Orders page: "Seleccionar pedidos" / "Cancelar selección" toggle; FloatingActionBar appears when rows selected; bulk status change calls PATCH /status per order sequentially; bulk delete checks all-DRAFT guard, uses adaptiveConfirm, calls DELETE per order
- FloatingActionBar: role-aware status options (EMPLOYEE: 3 statuses; ADMIN: 5); delete button disabled when not all selected are DRAFT
- pickup-code-dialog: 6-digit numeric input, PATCH /deliver on submit, 400 shows inline error, success fires onDelivered callback
- Operations page: existing IN_PROGRESS tab unchanged; new "Listas para entrega" tab shows READY orders with "Entregar pedido" button per row; empty state shown when no READY orders
- Build: `bun run build` exits 0
</success_criteria>

<output>
After completion, create `.planning/phases/15-order-lifecycle-improvements/15-03-SUMMARY.md`
</output>
