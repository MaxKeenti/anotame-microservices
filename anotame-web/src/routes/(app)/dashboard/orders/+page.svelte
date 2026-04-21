<script lang="ts">
  import { onMount } from 'svelte';
  import { apiService, API_SALES, API_CATALOG } from '$lib/services/api.svelte';
  import { orderWizardState } from '$lib/services/orders/OrderWizardState.svelte';
  import { authService } from '$lib/services/auth.svelte';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import StatusBadge from '$lib/components/ui/StatusBadge.svelte';
  import FloatingActionBar from '$lib/components/ui/FloatingActionBar.svelte';
  import { formatCurrency, formatDate } from '$lib/utils/formatUtils';
  import { Edit, Trash2, Eye } from 'lucide-svelte';
  import { adaptiveConfirm } from '$lib/components/ui/responsive/confirm-state.svelte';
  import { AdaptiveSelect } from '$lib/components/ui/responsive';
  import { AdaptiveDatePicker } from '$lib/components/ui/responsive';
  import DataTableWrapper from '$lib/components/ui/DataTableWrapper.svelte';
  import { ApiError } from '$lib/services/ApiError';
  import { toast } from 'svelte-sonner';
  import type { ColumnDef } from '@tanstack/table-core';
  import * as Tabs from '$lib/components/ui/tabs';
  import * as m from '$lib/paraglide/messages';

  let view = $state<'active' | 'drafts'>('active');
  let orders = $state<any[]>([]);
  let garments = $state<any[]>([]);
  let loading = $state(true);

  // Bulk selection state
  let selectedOrders = $state<any[]>([]);

  // Filters
  let searchQuery = $state("");
  let garmentFilter = $state("");
  let dateFilter = $state("");

  let drafts = $derived(orderWizardState.drafts.current);

  const isAdmin = $derived(authService.user?.role === 'ADMIN');
  const allSelectedDeletable = $derived(selectedOrders.length > 0 && selectedOrders.every(o => o.status === 'RECEIVED'));

  const activeColumns: ColumnDef<any>[] = [
    { accessorKey: 'ticketNumber', header: m.orders_column_ticket(), enableSorting: true },
    { id: 'customer', accessorFn: (row) => `${row.customer?.firstName ?? ''} ${row.customer?.lastName ?? ''}`, header: m.orders_column_customer(), enableSorting: true },
    { id: 'garments', accessorFn: (row) => row.items?.map((i: any) => i.garmentName).join(', '), header: m.orders_column_garmentsSummary(), enableSorting: false },
    { id: 'status', accessorFn: (row) => row.status, header: m.orders_column_status(), enableSorting: true },
    { id: 'deadline', accessorFn: (row) => formatDate(row.committedDeadline), header: m.orders_column_deadline(), enableSorting: true },
    { id: 'total', accessorFn: (row) => formatCurrency(row.totalAmount), header: m.orders_column_total(), enableSorting: true },
    { id: 'actions', header: m.common_actions(), enableSorting: false },
  ];

  const draftsColumns: ColumnDef<any>[] = [
    { id: 'draftId', accessorFn: (row) => row.id, header: m.orders_column_tempId(), enableSorting: false },
    { id: 'customer', accessorFn: (row) => row.customer?.firstName ? `${row.customer.firstName} ${row.customer.lastName ?? ''}` : m.orders_noName(), header: m.orders_column_customer(), enableSorting: true },
    { id: 'garments', accessorFn: (row) => m.orders_garmentCount({ count: String(row.items?.length || 0) }), header: m.orders_column_garments(), enableSorting: false },
    { id: 'lastModified', accessorFn: (row) => new Date(row.lastModified).toLocaleString(), header: m.orders_column_lastModified(), enableSorting: true },
    { id: 'actions', header: m.common_actions(), enableSorting: false },
  ];

  async function fetchData() {
    loading = true;
    try {
      const [ordersData, garmentsData] = await Promise.all([
        apiService.request<any[]>(`${API_SALES}/orders`),
        apiService.request<any[]>(`${API_CATALOG}/catalog/garments`)
      ]);
      orders = ordersData || [];
      garments = garmentsData || [];
    } catch (e) {
      console.error(e);
      // Optional: Add toast error handling here
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    fetchData();
  });

  async function handleDeleteDraft(id: string) {
    const ok = await adaptiveConfirm({
      title: m.orders_deleteDraft_title(),
      description: m.orders_deleteDraft_description()
    });
    if (ok) {
      orderWizardState.deleteDraft(id);
    }
  }

  function setView(target: 'active' | 'drafts') {
    view = target;
  }

  // Bulk handler functions
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
        toast.error(m.orders_bulk_updateError({ ticket: order.ticketNumber }), { description: e?.message });
      }
    }
    if (successCount > 0) {
      toast.success(m.orders_bulk_updateSuccess({ count: String(successCount) }));
    }
    selectedOrders = [];
    fetchData();
  }

  async function handleBulkDelete() {
    if (!allSelectedDeletable) return;

    const ticketList = selectedOrders.map(o => o.ticketNumber).join(', ');
    const ok = await adaptiveConfirm({
      title: m.orders_bulkDelete_title(),
      description: m.orders_bulkDelete_description({ count: String(selectedOrders.length), tickets: ticketList })
    });
    if (!ok) return;

    let successCount = 0;
    for (const order of selectedOrders) {
      try {
        await apiService.request(`${API_SALES}/orders/${order.id}`, { method: 'DELETE' });
        successCount++;
      } catch (e: any) {
        if (e instanceof ApiError && e.status === 409) {
          toast.error(m.orders_bulk_cannotDelete({ ticket: order.ticketNumber }), {
            description: m.orders_bulk_hasLinkedRecords()
          });
        } else {
          toast.error(m.orders_bulk_deleteError({ ticket: order.ticketNumber }), { description: e?.message });
        }
      }
    }
    if (successCount > 0) {
      toast.success(m.orders_bulk_updateSuccess({ count: String(successCount) }));
    }
    selectedOrders = [];
    fetchData();
  }

  function handleBulkCancel() {
    selectedOrders = [];
  }

  // Derived filter logic
  let filteredOrders = $derived.by(() => {
    return orders.filter(order => {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        order.ticketNumber?.toLowerCase().includes(query) ||
        order.customer?.firstName?.toLowerCase().includes(query) ||
        order.customer?.lastName?.toLowerCase().includes(query);

      if (!matchesSearch) return false;

      if (garmentFilter) {
        const selectedGarment = garments.find(g => g.id === garmentFilter);
        if (selectedGarment) {
          const hasGarment = order.items?.some((item: any) =>
            item.garmentName === selectedGarment.name
          );
          if (!hasGarment) return false;
        }
      }

      if (dateFilter) {
        if (!order.committedDeadline) return false;
        const orderDate = order.committedDeadline.split('T')[0];
        if (orderDate !== dateFilter) return false;
      }

      return true;
    });
  });
</script>

<div class="space-y-6 animate-in fade-in duration-300">
  <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
    <div>
      <h1 class="text-3xl font-heading font-brand font-bold text-foreground">{m.orders_page_title()}</h1>
      <p class="text-muted-foreground">{m.orders_page_description()}</p>
    </div>
    <Button href="/dashboard/orders/new" class="w-full sm:w-auto h-12 px-6 text-lg font-bold touch-manipulation shadow-md">+ {m.orders_new()}</Button>
  </div>

  <Tabs.Root bind:value={view} class="space-y-6">
    <Tabs.List class="shadow-sm border border-border/50">
      <Tabs.Trigger value="active" class="px-6 font-bold">{m.orders_tab_active()}</Tabs.Trigger>
      <Tabs.Trigger value="drafts" class="px-6 font-bold">
        {m.orders_tab_drafts()} {drafts.length > 0 ? `(${drafts.length})` : ''}
      </Tabs.Trigger>
    </Tabs.List>

    <Tabs.Content value="active" class="space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 bg-card border border-border rounded-xl shadow-sm">
        <div class="col-span-1 md:col-span-2 space-y-1.5">
          <label class="text-xs font-bold uppercase tracking-wider text-muted-foreground" for="search-orders">{m.common_search()}</label>
          <Input
            id="search-orders"
            placeholder={m.orders_filter_searchPlaceholder()}
            bind:value={searchQuery}
            class="h-12 text-base touch-manipulation"
          />
        </div>
        <div class="space-y-1.5">
          <label class="text-xs font-bold uppercase tracking-wider text-muted-foreground" for="filter-garment">{m.orders_filter_garment()}</label>
          <AdaptiveSelect
            id="filter-garment"
            bind:value={garmentFilter}
            placeholder={m.orders_filter_selectGarment()}
            items={garments.map(g => ({ value: g.id, label: g.name }))}
            allowClear={true}
            clearText={m.orders_filter_allGarments()}
            class=""
          />
        </div>
        <div class="space-y-1.5">
          <label class="text-xs font-bold uppercase tracking-wider text-muted-foreground" for="filter-date">{m.orders_filter_deadline()}</label>
          <AdaptiveDatePicker
            id="filter-date"
            bind:value={dateFilter}
            placeholder={m.orders_filter_selectDate()}
          />
        </div>
      </div>

      <!-- Clear selection button -->
      {#if selectedOrders.length > 0}
        <div class="flex justify-end">
          <Button
            variant="ghost"
            class="h-12 px-4 touch-manipulation text-muted-foreground hover:text-foreground"
            onclick={() => { selectedOrders = []; }}
          >
            {m.orders_clearSelection({ count: String(selectedOrders.length) })}
          </Button>
        </div>
      {/if}

      <!-- Active Orders Table -->
      <div class="bg-card border border-border rounded-xl overflow-hidden shadow-sm p-4">
        {#snippet statusCell(row: any)}
          <StatusBadge status={row.original.status} />
        {/snippet}

        <DataTableWrapper
          columns={activeColumns}
          data={filteredOrders}
          loading={loading}
          emptyMessage={m.orders_empty()}
          filterPlaceholder={m.orders_searchPlaceholder()}
          showFilter={false}
          cellRenders={{
            status: statusCell
          }}
          bulkActions={true}
          bulkMode={true}
          onSelectionChange={(rows) => { selectedOrders = rows; }}
        >
          {#snippet actionCell(row)}
            <div class="flex justify-end gap-2">
              <Button variant="ghost" href={`/dashboard/orders/${row.original.id}/edit`} class="h-10 px-4 font-medium hover:text-primary hover:bg-primary/10 touch-manipulation">
                <Edit class="w-4 h-4 mr-2" />
                {m.common_edit()}
              </Button>
              <Button variant="outline" href={`/dashboard/orders/${row.original.id}`} class="h-10 px-4 font-medium touch-manipulation">
                <Eye class="w-4 h-4 mr-2" />
                {m.orders_details()}
              </Button>
            </div>
          {/snippet}
        </DataTableWrapper>
      </div>

      <FloatingActionBar
        count={selectedOrders.length}
        isAdmin={isAdmin}
        allDraft={allSelectedDeletable}
        onChangeStatus={handleBulkStatusChange}
        onDelete={handleBulkDelete}
        onCancel={handleBulkCancel}
      />
    </Tabs.Content>

    <Tabs.Content value="drafts" class="space-y-6">
      <div class="bg-card border border-border rounded-xl overflow-hidden shadow-sm p-4">
        <DataTableWrapper
          columns={draftsColumns}
          data={drafts}
          emptyMessage={m.orders_drafts_empty()}
          filterPlaceholder={m.orders_drafts_searchPlaceholder()}
          showFilter={false}
        >
          {#snippet actionCell(row)}
            <div class="flex justify-end gap-2">
              <Button variant="ghost" href={`/dashboard/orders/new?draftId=${row.original.id}`} class="h-10 px-4 font-medium hover:text-primary hover:bg-primary/10 touch-manipulation flex items-center justify-center">
                <Edit class="w-4 h-4 mr-2" />
                <span>{m.orders_editDraft()}</span>
              </Button>
              <Button variant="ghost" class="h-10 px-4 font-medium text-destructive hover:text-destructive hover:bg-destructive/10 touch-manipulation" onclick={() => handleDeleteDraft(row.original.id)}>
                <Trash2 class="w-4 h-4 mr-2" />
                <span>{m.common_delete()}</span>
              </Button>
            </div>
          {/snippet}
        </DataTableWrapper>
      </div>
    </Tabs.Content>
  </Tabs.Root>
</div>
