<script lang="ts">
  import { onMount } from 'svelte';
  import { apiService, API_SALES, API_CATALOG } from '$lib/services/api.svelte';
  import { orderWizardState } from '$lib/services/orders/OrderWizardState.svelte';
  import { authService } from '$lib/services/auth.svelte';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import StatusBadge from '$lib/components/ui/StatusBadge.svelte';
  import { dockActionStore } from '$lib/stores/dock-action.svelte';
  import { formatCurrency, formatDate } from '$lib/utils/formatUtils';
  import { Trash2, Eye, SquarePen } from '@lucide/svelte';
  import { adaptiveConfirm } from '$lib/components/ui/responsive/confirm-state.svelte';
  import { AdaptiveSelect } from '$lib/components/ui/responsive';
  import { AdaptiveDatePicker } from '$lib/components/ui/responsive';
  import DataTableWrapper from '$lib/components/ui/DataTableWrapper.svelte';
  import CardGridWrapper from '$lib/components/ui/CardGridWrapper.svelte';
  import { useIsMobile } from '$lib/hooks/use-mobile.svelte';
  import { ApiError } from '$lib/services/ApiError';

  const mobile = useIsMobile();
  import { toast } from 'svelte-sonner';
  import type { ColumnDef, Row } from '@tanstack/table-core';
  import type { GarmentTypeResponse, OrderSummaryResponse, PageResponse } from '$lib/types/dtos';
  import * as Tabs from '$lib/components/ui/tabs';
  import * as m from '$lib/paraglide/messages';

  let view = $state<'active' | 'drafts'>('active');
  let orders = $state<OrderSummaryResponse[]>([]);
  let garments = $state<GarmentTypeResponse[]>([]);
  let loading = $state(true);
  let ordersPageIndex = $state(0);
  let ordersTotalPages = $state(0);

  // Bulk selection state
  let selectedOrders = $state<OrderSummaryResponse[]>([]);

  // Filters
  let searchQuery = $state("");
  let garmentFilter = $state("");
  let dateFilter = $state("");

  let drafts = $derived(orderWizardState.drafts.current);
  let ordersPageSize = $derived(mobile.current ? 12 : 20);

  const isAdmin = $derived(authService.user?.role === 'ADMIN');
  const allSelectedDeletable = $derived(selectedOrders.length > 0 && selectedOrders.every(o => o.status === 'RECEIVED'));
  const MAX_GARMENT_SUMMARY_ITEMS = 4;

  // Mirror the bulk selection into the shared dock slot: while orders are
  // selected the (app) layout swaps the dock for the bulk action bar, keeping
  // the user on this page. Cleanup restores the dock when the selection empties
  // or we navigate away.
  $effect(() => {
    if (selectedOrders.length > 0) {
      dockActionStore.set({
        count: selectedOrders.length,
        isAdmin,
        allDraft: allSelectedDeletable,
        onChangeStatus: handleBulkStatusChange,
        onDelete: handleBulkDelete,
        onCancel: handleBulkCancel,
      });
    } else {
      dockActionStore.clear();
    }

    return () => dockActionStore.clear();
  });

  const activeColumns: ColumnDef<OrderSummaryResponse>[] = [
    { accessorKey: 'ticketNumber', header: m["orders.column.ticket"](), enableSorting: true, meta: { cardGroup: 'header' } },
    { id: 'customer', accessorFn: (row) => `${row.customer?.firstName ?? ''} ${row.customer?.lastName ?? ''}`, header: m["orders.column.customer"](), enableSorting: true, meta: { cardGroup: 'header' } },
    { id: 'status', accessorFn: (row) => row.status, header: m["orders.column.status"](), enableSorting: true, meta: { cardGroup: 'header' } },
    { id: 'garments', accessorFn: (row) => formatNames(row.garmentNames), header: m["orders.column.garmentsSummary"](), enableSorting: false, meta: { cardGroup: 'body' } },
    { id: 'deadline', accessorFn: (row) => formatDate(row.committedDeadline), header: m["orders.column.deadline"](), enableSorting: true, meta: { cardGroup: 'body' } },
    { id: 'total', accessorFn: (row) => formatCurrency(row.totalAmount), header: m["orders.column.total"](), enableSorting: true, meta: { cardGroup: 'body' } },
    { id: 'actions', header: m["common.actions"](), enableSorting: false, meta: { cardGroup: 'hidden' } },
  ];

  const draftsColumns: ColumnDef<any>[] = [
    { id: 'draftId', accessorFn: (row) => row.id, header: m["orders.column.tempId"](), enableSorting: false, meta: { cardGroup: 'header' } },
    { id: 'customer', accessorFn: (row) => row.customer?.firstName ? `${row.customer.firstName} ${row.customer.lastName ?? ''}` : m["orders.noName"](), header: m["orders.column.customer"](), enableSorting: true, meta: { cardGroup: 'header' } },
    { id: 'garments', accessorFn: (row) => m["orders.garmentCount"]({ count: String(row.items?.length || 0) }), header: m["orders.column.garments"](), enableSorting: false, meta: { cardGroup: 'body' } },
    { id: 'lastModified', accessorFn: (row) => new Date(row.lastModified).toLocaleString(), header: m["orders.column.lastModified"](), enableSorting: true, meta: { cardGroup: 'body' } },
    { id: 'actions', header: m["common.actions"](), enableSorting: false, meta: { cardGroup: 'hidden' } },
  ];

  function formatNames(names: string[] | undefined): string {
    return names?.filter(Boolean).join(', ') || '-';
  }

  function cleanGarmentNames(names: string[] | undefined): string[] {
    return names?.map((name) => name.trim()).filter(Boolean) ?? [];
  }

  function visibleGarmentNames(names: string[] | undefined): string[] {
    return cleanGarmentNames(names).slice(0, MAX_GARMENT_SUMMARY_ITEMS);
  }

  function hiddenGarmentCount(names: string[] | undefined): number {
    return Math.max(0, cleanGarmentNames(names).length - MAX_GARMENT_SUMMARY_ITEMS);
  }

  function buildSummaryUrl(pageIndex: number, pageSize: number): string {
    const params = new URLSearchParams({
      page: String(pageIndex),
      size: String(pageSize)
    });
    const query = searchQuery.trim();
    if (query) params.set('search', query);
    if (garmentFilter) params.set('garmentId', garmentFilter);
    if (dateFilter) params.set('deadline', dateFilter);
    return `${API_SALES}/orders/summary?${params.toString()}`;
  }

  let ordersRequestId = 0;

  async function fetchOrders(pageIndex = ordersPageIndex, pageSize = ordersPageSize) {
    loading = true;
    const requestId = ++ordersRequestId;
    try {
      const page = await apiService.request<PageResponse<OrderSummaryResponse>>(
        buildSummaryUrl(pageIndex, pageSize)
      );
      if (requestId !== ordersRequestId) return;
      orders = page.items || [];
      ordersTotalPages = page.totalPages;
      selectedOrders = [];
    } catch (e) {
      if (requestId !== ordersRequestId) return;
      console.error(e);
      // Optional: Add toast error handling here
    } finally {
      if (requestId === ordersRequestId) {
        loading = false;
      }
    }
  }

  async function fetchGarments() {
    try {
      garments = await apiService.request<GarmentTypeResponse[]>(`${API_CATALOG}/catalog/garments`) || [];
    } catch (e) {
      console.error(e);
    }
  }

  let mounted = $state(false);
  let lastSummaryFilterKey = '';

  onMount(() => {
    mounted = true;
    fetchGarments();
  });

  $effect(() => {
    if (!mounted) return;
    const pageSize = ordersPageSize;
    const filterKey = [searchQuery.trim(), garmentFilter, dateFilter, pageSize].join('\u0000');
    if (filterKey !== lastSummaryFilterKey) {
      lastSummaryFilterKey = filterKey;
      if (ordersPageIndex !== 0) {
        ordersPageIndex = 0;
        return;
      }
    }
    fetchOrders(ordersPageIndex, pageSize);
  });

  async function handleDeleteDraft(id: string) {
    const ok = await adaptiveConfirm({
      title: m["orders.deleteDraft.title"](),
      description: m["orders.deleteDraft.description"]()
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
        toast.error(m["orders.bulk.updateError"]({ ticket: order.ticketNumber }), { description: e?.message });
      }
    }
    if (successCount > 0) {
      toast.success(m["orders.bulk.updateSuccess"]({ count: String(successCount) }));
    }
    selectedOrders = [];
    fetchOrders();
  }

  async function handleBulkDelete() {
    if (!allSelectedDeletable) return;

    const ticketList = selectedOrders.map(o => o.ticketNumber).join(', ');
    const ok = await adaptiveConfirm({
      title: m["orders.bulkDelete.title"](),
      description: m["orders.bulkDelete.description"]({ count: String(selectedOrders.length), tickets: ticketList })
    });
    if (!ok) return;

    let successCount = 0;
    for (const order of selectedOrders) {
      try {
        await apiService.request(`${API_SALES}/orders/${order.id}`, { method: 'DELETE' });
        successCount++;
      } catch (e: any) {
        if (e instanceof ApiError && e.status === 409) {
          toast.error(m["orders.bulk.cannotDelete"]({ ticket: order.ticketNumber }), {
            description: m["orders.bulk.hasLinkedRecords"]()
          });
        } else {
          toast.error(m["orders.bulk.deleteError"]({ ticket: order.ticketNumber }), { description: e?.message });
        }
      }
    }
    if (successCount > 0) {
      toast.success(m["orders.bulk.updateSuccess"]({ count: String(successCount) }));
    }
    selectedOrders = [];
    ordersPageIndex = 0;
    fetchOrders(0, ordersPageSize);
  }

  function handleBulkCancel() {
    selectedOrders = [];
  }
</script>

<div class="space-y-6 animate-in fade-in duration-300">
  <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
    <div>
      <h1 class="text-3xl font-heading font-brand font-bold text-foreground">{m["orders.page.title"]()}</h1>
      <p class="text-muted-foreground">{m["orders.page.description"]()}</p>
    </div>
    <Button href="/dashboard/orders/new" class="w-full sm:w-auto h-12 px-6 text-lg font-bold touch-manipulation shadow-md">+ {m["orders.new"]()}</Button>
  </div>

  <Tabs.Root bind:value={view} class="space-y-6">
    <Tabs.List class="shadow-sm border border-border/50">
      <Tabs.Trigger value="active" class="px-6 font-bold">{m["orders.tab.active"]()}</Tabs.Trigger>
      <Tabs.Trigger value="drafts" class="px-6 font-bold">
        {m["orders.tab.drafts"]()} {drafts.length > 0 ? `(${drafts.length})` : ''}
      </Tabs.Trigger>
    </Tabs.List>

    <Tabs.Content value="active" class="space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 bg-card border border-border rounded-xl shadow-sm">
        <div class="col-span-1 md:col-span-2 space-y-1.5">
          <label class="text-xs font-bold uppercase tracking-wider text-muted-foreground" for="search-orders">{m["common.search"]()}</label>
          <Input
            id="search-orders"
            placeholder={m["orders.filter.searchPlaceholder"]()}
            bind:value={searchQuery}
            class="h-12 text-base touch-manipulation"
          />
        </div>
        <div class="space-y-1.5">
          <label class="text-xs font-bold uppercase tracking-wider text-muted-foreground" for="filter-garment">{m["orders.filter.garment"]()}</label>
          <AdaptiveSelect
            id="filter-garment"
            bind:value={garmentFilter}
            placeholder={m["orders.filter.selectGarment"]()}
            items={garments.map(g => ({ value: g.id, label: g.name }))}
            allowClear={true}
            clearText={m["orders.filter.allGarments"]()}
            class=""
          />
        </div>
        <div class="space-y-1.5">
          <label class="text-xs font-bold uppercase tracking-wider text-muted-foreground" for="filter-date">{m["orders.filter.deadline"]()}</label>
          <AdaptiveDatePicker
            id="filter-date"
            bind:value={dateFilter}
            placeholder={m["orders.filter.selectDate"]()}
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
            {m["orders.clearSelection"]({ count: String(selectedOrders.length) })}
          </Button>
        </div>
      {/if}

      <!-- Active Orders Table / Card Grid -->
      <div class="bg-card border border-border rounded-xl overflow-hidden shadow-sm p-4">
        {#snippet statusCell(row: Row<OrderSummaryResponse>)}
          <StatusBadge status={row.original.status} />
        {/snippet}

        {#snippet garmentsSummaryCell(row: Row<OrderSummaryResponse>)}
          <div class="max-w-sm min-w-0 whitespace-normal wrap-break-word leading-6" title={formatNames(row.original.garmentNames)}>
            {#if cleanGarmentNames(row.original.garmentNames).length > 0}
              {visibleGarmentNames(row.original.garmentNames).join(', ')}
              {#if hiddenGarmentCount(row.original.garmentNames) > 0}
                <span class="ml-1 inline-flex whitespace-nowrap rounded-sm bg-muted px-1.5 py-0.5 text-xs font-semibold text-muted-foreground">
                  +{hiddenGarmentCount(row.original.garmentNames)}
                </span>
              {/if}
            {:else}
              -
            {/if}
          </div>
        {/snippet}

        {#snippet activeOrderActions(row: Row<OrderSummaryResponse>)}
          <div class="flex justify-end gap-2 whitespace-nowrap">
            <Button variant="ghost" href={`/dashboard/orders/${row.original.id}/edit`} class="h-10 px-4 font-medium hover:text-primary hover:bg-primary/10 touch-manipulation">
              <SquarePen class="w-4 h-4 mr-2" />
              {m["common.edit"]()}
            </Button>
            <Button variant="outline" href={`/dashboard/orders/${row.original.id}`} class="h-10 px-4 font-medium touch-manipulation">
              <Eye class="w-4 h-4 mr-2" />
              {m["orders.details"]()}
            </Button>
          </div>
        {/snippet}

        {#if mobile.current}
          <CardGridWrapper
            columns={activeColumns}
            data={orders}
            loading={loading}
            emptyMessage={m["orders.empty"]()}
            filterPlaceholder={m["orders.searchPlaceholder"]()}
            showFilter={false}
            cellRenders={{ status: statusCell, garments: garmentsSummaryCell }}
            bulkActions={true}
            bulkMode={true}
            manualPagination={true}
            pageIndex={ordersPageIndex}
            pageCount={ordersTotalPages}
            pageSize={ordersPageSize}
            onPageChange={(page) => { ordersPageIndex = page; }}
            onSelectionChange={(rows) => { selectedOrders = rows; }}
            actionCell={activeOrderActions}
          />
        {:else}
          <DataTableWrapper
            columns={activeColumns}
            data={orders}
            loading={loading}
            emptyMessage={m["orders.empty"]()}
            filterPlaceholder={m["orders.searchPlaceholder"]()}
            showFilter={false}
            cellRenders={{ status: statusCell, garments: garmentsSummaryCell }}
            bulkActions={true}
            bulkMode={true}
            manualPagination={true}
            pageIndex={ordersPageIndex}
            pageCount={ordersTotalPages}
            pageSize={ordersPageSize}
            onPageChange={(page) => { ordersPageIndex = page; }}
            onSelectionChange={(rows) => { selectedOrders = rows; }}
          >
            {#snippet actionCell(row)}
              {@render activeOrderActions(row)}
            {/snippet}
          </DataTableWrapper>
        {/if}
      </div>

    </Tabs.Content>

    <Tabs.Content value="drafts" class="space-y-6">
      <div class="bg-card border border-border rounded-xl overflow-hidden shadow-sm p-4">
        {#snippet draftActions(row: any)}
          <div class="flex justify-end gap-2">
            <Button variant="ghost" href={`/dashboard/orders/new?draftId=${row.original.id}`} class="h-10 px-4 font-medium hover:text-primary hover:bg-primary/10 touch-manipulation flex items-center justify-center">
              <SquarePen class="w-4 h-4 mr-2" />
              <span>{m["orders.editDraft"]()}</span>
            </Button>
            <Button variant="ghost" class="h-10 px-4 font-medium text-destructive hover:text-destructive hover:bg-destructive/10 touch-manipulation" onclick={() => handleDeleteDraft(row.original.id)}>
              <Trash2 class="w-4 h-4 mr-2" />
              <span>{m["common.delete"]()}</span>
            </Button>
          </div>
        {/snippet}

        {#if mobile.current}
          <CardGridWrapper
            columns={draftsColumns}
            data={drafts}
            emptyMessage={m["orders.drafts.empty"]()}
            filterPlaceholder={m["orders.drafts.searchPlaceholder"]()}
            showFilter={false}
            actionCell={draftActions}
          />
        {:else}
          <DataTableWrapper
            columns={draftsColumns}
            data={drafts}
            emptyMessage={m["orders.drafts.empty"]()}
            filterPlaceholder={m["orders.drafts.searchPlaceholder"]()}
            showFilter={false}
          >
            {#snippet actionCell(row)}
              {@render draftActions(row)}
            {/snippet}
          </DataTableWrapper>
        {/if}
      </div>
    </Tabs.Content>
  </Tabs.Root>
</div>
