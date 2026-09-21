<script lang="ts">
  import { onMount } from 'svelte';
  import * as Card from '$lib/components/ui/card';
  import { apiService, API_SALES } from '$lib/services/api.svelte';
  import { Button, buttonVariants } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import * as Tabs from '$lib/components/ui/tabs';
  import { FilterField, PageHeader, ResponsiveDataView, StatusBadge } from '$lib/components/common';
  import { Badge } from '$lib/components/ui/badge';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
  import { useIsMobile } from '$lib/hooks/use-mobile.svelte';
  import PickupCodeDialog from '$lib/components/orders/pickup-code-dialog.svelte';
  import { formatDate } from '$lib/utils/formatUtils';
  import { adaptiveConfirm } from '$lib/components/ui/responsive/confirm-state.svelte';
  import { toast } from 'svelte-sonner';
  import { CheckCircle2, Eye, XCircle, MoreVertical } from '@lucide/svelte';
  import type { ColumnDef, Row } from '@tanstack/table-core';
  import type { OrderSummaryResponse, PageResponse } from '$lib/types/dtos';
  import * as m from '$lib/paraglide/messages';

  const mobile = useIsMobile();

  let inProgressOrders = $state<OrderSummaryResponse[]>([]);
  let readyOrders = $state<OrderSummaryResponse[]>([]);
  let inProgressLoading = $state(true);
  let readyLoading = $state(true);
  let inProgressPageIndex = $state(0);
  let readyPageIndex = $state(0);
  let inProgressTotalPages = $state(0);
  let readyTotalPages = $state(0);
  let inProgressTotal = $state(0);
  let deliverDialogOpen = $state(false);
  let deliverTarget = $state<{
    id: string;
    ticketNumber: string;
    totalAmount: number;
    amountPaid: number;
  } | null>(null);

  let operationPageSize = $derived(mobile.current ? 12 : 20);
  let searchQuery = $state('');

  function buildSummaryUrl(status: string, pageIndex: number, pageSize: number): string {
    const params = new URLSearchParams({
      status,
      page: String(pageIndex),
      size: String(pageSize)
    });
    const query = searchQuery.trim();
    if (query) params.set('search', query);
    return `${API_SALES}/orders/summary?${params.toString()}`;
  }

  let inProgressRequestId = 0;
  let readyRequestId = 0;

  async function fetchStatusPage(status: 'IN_PROGRESS' | 'READY', pageIndex: number, pageSize: number) {
    const requestId = status === 'IN_PROGRESS'
      ? ++inProgressRequestId
      : ++readyRequestId;
    if (status === 'IN_PROGRESS') {
      inProgressLoading = true;
    } else {
      readyLoading = true;
    }
    try {
      const page = await apiService.request<PageResponse<OrderSummaryResponse>>(
        buildSummaryUrl(status, pageIndex, pageSize)
      );
      if (status === 'IN_PROGRESS') {
        if (requestId !== inProgressRequestId) return;
        inProgressOrders = page.items || [];
        inProgressTotalPages = page.totalPages;
        inProgressTotal = page.total;
      } else {
        if (requestId !== readyRequestId) return;
        readyOrders = page.items || [];
        readyTotalPages = page.totalPages;
      }
    } catch (e: any) {
      if (
        (status === 'IN_PROGRESS' && requestId !== inProgressRequestId) ||
        (status === 'READY' && requestId !== readyRequestId)
      ) return;
      console.error(e);
      toast.error(m["operations.toast.loadError"]());
      if (status === 'IN_PROGRESS') {
        inProgressOrders = [];
        inProgressTotalPages = 0;
        inProgressTotal = 0;
      } else {
        readyOrders = [];
        readyTotalPages = 0;
      }
    } finally {
      if (status === 'IN_PROGRESS') {
        if (requestId === inProgressRequestId) {
          inProgressLoading = false;
        }
      } else {
        if (requestId === readyRequestId) {
          readyLoading = false;
        }
      }
    }
  }

  function refreshOperationOrders() {
    fetchStatusPage('IN_PROGRESS', inProgressPageIndex, operationPageSize);
    fetchStatusPage('READY', readyPageIndex, operationPageSize);
  }

  let mounted = $state(false);
  let lastInProgressFilterKey = '';
  let lastReadyFilterKey = '';

  onMount(() => {
    mounted = true;
  });

  $effect(() => {
    if (!mounted) return;
    const pageSize = operationPageSize;
    const filterKey = [searchQuery.trim(), pageSize].join('\u001f');
    if (filterKey !== lastInProgressFilterKey) {
      lastInProgressFilterKey = filterKey;
      if (inProgressPageIndex !== 0) {
        inProgressPageIndex = 0;
        return;
      }
    }
    fetchStatusPage('IN_PROGRESS', inProgressPageIndex, pageSize);
  });

  $effect(() => {
    if (!mounted) return;
    const pageSize = operationPageSize;
    const filterKey = [searchQuery.trim(), pageSize].join('\u001f');
    if (filterKey !== lastReadyFilterKey) {
      lastReadyFilterKey = filterKey;
      if (readyPageIndex !== 0) {
        readyPageIndex = 0;
        return;
      }
    }
    fetchStatusPage('READY', readyPageIndex, pageSize);
  });

  async function handleComplete(order: OrderSummaryResponse) {
    const ok = await adaptiveConfirm({
      title: m["operations.confirmMarkReadyTitle"](),
      description: m["operations.confirmMarkReadyDesc"]({ ticket: order.ticketNumber })
    });
    if (!ok) return;

    try {
      await apiService.request(`${API_SALES}/orders/${order.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'READY' })
      });
      toast.success(m["operations.toast.markedReady"](), { description: order.ticketNumber });
      refreshOperationOrders();
    } catch (e: any) {
      console.error(e);
      toast.error(m["operations.toast.updateError"](), { description: e.message });
    }
  }

  async function handleCancelOrder(order: OrderSummaryResponse) {
    const ok = await adaptiveConfirm({
      title: m["operations.confirmCancelTitle"](),
      description: m["operations.confirmCancelDesc"]({ ticket: order.ticketNumber })
    });
    if (!ok) return;

    try {
      await apiService.request(`${API_SALES}/orders/${order.id}`, { method: 'DELETE' });
      toast.success(m["operations.toast.cancelSuccess"](), { description: order.ticketNumber });
      refreshOperationOrders();
    } catch (e: any) {
      console.error(e);
      toast.error(m["operations.toast.cancelError"](), { description: e?.message });
    }
  }

  function openDeliverDialog(order: OrderSummaryResponse) {
    deliverTarget = {
      id: order.id,
      ticketNumber: order.ticketNumber,
      totalAmount: Number(order.totalAmount ?? 0),
      amountPaid: Number(order.amountPaid ?? 0)
    };
    deliverDialogOpen = true;
  }

  function handleDelivered() {
    deliverDialogOpen = false;
    deliverTarget = null;
    refreshOperationOrders();
  }

  function getNamesSummary(names: string[] | undefined): string {
    return names?.filter(Boolean).join(', ') || '-';
  }

  const inProgressColumns: ColumnDef<OrderSummaryResponse>[] = [
    { accessorKey: 'ticketNumber', header: m["operations.column.ticket"](), enableSorting: true, meta: { cardGroup: 'header' } },
    { id: 'customer', accessorFn: (row) => `${row.customer?.firstName ?? ''} ${row.customer?.lastName ?? ''}`.trim(), header: m["operations.column.customer"](), enableSorting: true, meta: { cardGroup: 'header' } },
    { id: 'status', accessorFn: (row) => row.status, header: m["operations.column.status"](), enableSorting: true, meta: { cardGroup: 'header' } },
    { id: 'services', accessorFn: (row) => getNamesSummary(row.serviceNames), header: m["operations.column.services"](), enableSorting: false, meta: { cardGroup: 'body' } },
    { id: 'deadline', accessorFn: (row) => formatDate(row.committedDeadline), header: m["operations.column.deadline"](), enableSorting: true, meta: { cardGroup: 'body' } },
    { id: 'actions', header: m["operations.column.actions"](), enableSorting: false, meta: { cardGroup: 'hidden' } },
  ];

  const readyColumns: ColumnDef<OrderSummaryResponse>[] = [
    { accessorKey: 'ticketNumber', header: m["operations.column.ticket"](), enableSorting: true, meta: { cardGroup: 'header' } },
    { id: 'customer', accessorFn: (row) => `${row.customer?.firstName ?? ''} ${row.customer?.lastName ?? ''}`.trim(), header: m["operations.column.customer"](), enableSorting: true, meta: { cardGroup: 'header' } },
    { id: 'garments', accessorFn: (row) => getNamesSummary(row.garmentNames), header: m["operations.column.garments"](), enableSorting: false, meta: { cardGroup: 'body' } },
    { id: 'deliveryPromised', accessorFn: (row) => formatDate(row.committedDeadline), header: m["operations.column.deliveryPromised"](), enableSorting: true, meta: { cardGroup: 'body' } },
    { id: 'actions', header: m["operations.column.actions"](), enableSorting: false, meta: { cardGroup: 'hidden' } },
  ];
</script>

<div class="space-y-6 animate-in fade-in duration-300">
  <PageHeader
    title={m["operations.page.title"]()}
    description={m["operations.page.subtitle"]()}
  >
    {#snippet actions()}
      <Badge variant="outline" class="h-auto px-4 py-2 text-sm text-muted-foreground">
        {inProgressTotal === 1
          ? m["operations.count.single"]({ count: inProgressTotal })
          : m["operations.count.plural"]({ count: inProgressTotal })}
      </Badge>
    {/snippet}
  </PageHeader>

  <FilterField label={m["common.search"]()} for="search-operations">
    <Input
      id="search-operations"
      placeholder={m["operations.searchPlaceholder"]()}
      bind:value={searchQuery}
      class="h-12 text-base touch-manipulation"
    />
  </FilterField>

  <Tabs.Root value="in-progress" class="space-y-4">
    <Tabs.List class="shadow-sm border border-border/50">
      <Tabs.Trigger value="in-progress" class="px-6 font-bold">{m["operations.tab.inProgress"]()}</Tabs.Trigger>
      <Tabs.Trigger value="ready" class="px-6 font-bold">{m["operations.tab.ready"]()}</Tabs.Trigger>
    </Tabs.List>

    <Tabs.Content value="in-progress">


      <Card.Root class="p-4">
        

        

        <ResponsiveDataView
          columns={inProgressColumns}
          data={inProgressOrders}
          loading={inProgressLoading}
          emptyMessage={m["operations.empty.inProgress"]()}
          showFilter={false}
          cellRenders={{ status: statusCell }}
          manualPagination={true}
          pageSize={operationPageSize}
          mobilePageSize={operationPageSize}
          pageIndex={inProgressPageIndex}
          pageCount={inProgressTotalPages}
          onPageChange={(page) => { inProgressPageIndex = page; }}
          actionCell={inProgressActions}
        />
      </Card.Root>
    </Tabs.Content>

    <Tabs.Content value="ready">

      <Card.Root class="p-4">
        

        <ResponsiveDataView
          columns={readyColumns}
          data={readyOrders}
          loading={readyLoading}
          emptyMessage={m["operations.emptyReadyTitle"]()}
          showFilter={false}
          manualPagination={true}
          pageSize={operationPageSize}
          mobilePageSize={operationPageSize}
          pageIndex={readyPageIndex}
          pageCount={readyTotalPages}
          onPageChange={(page) => { readyPageIndex = page; }}
          actionCell={readyActions}
        />
      </Card.Root>
    </Tabs.Content>
  </Tabs.Root>
</div>

{#if deliverTarget}
  <PickupCodeDialog
    bind:open={deliverDialogOpen}
    orderId={deliverTarget.id}
    ticketNumber={deliverTarget.ticketNumber}
    orderTotal={deliverTarget.totalAmount}
    amountPaid={deliverTarget.amountPaid}
    onDelivered={handleDelivered}
    onClose={() => { deliverDialogOpen = false; deliverTarget = null; }}
  />
{/if}

<!-- Cell renderers shared by the views above. -->
{#snippet statusCell(row: Row<OrderSummaryResponse>)}
<StatusBadge status={row.original.status} />
{/snippet}

{#snippet inProgressActions(row: Row<OrderSummaryResponse>)}
<div class="flex justify-end items-center gap-2">
  <Button
    variant="success"
    size="sm"
    class="h-11 px-4 touch-manipulation font-medium"
    onclick={() => handleComplete(row.original)}
  >
    <CheckCircle2 class="w-4 h-4 mr-2" />
    {m["operations.button.markReady"]()}
  </Button>
  <DropdownMenu.Root>
    <DropdownMenu.Trigger
      class={buttonVariants({ variant: 'outline', size: 'icon-lg' }) + ' touch-manipulation'}
      aria-label={m["common.actions"]()}
    >
      <MoreVertical class="w-4 h-4" />
    </DropdownMenu.Trigger>
    <DropdownMenu.Content class="w-48" align="end">
      <DropdownMenu.Item>
        {#snippet child({ props })}
          <a href={`/dashboard/orders/${row.original.id}`} {...props}>
            <Eye class="w-4 h-4" />
            {m["common.view"]()}
          </a>
        {/snippet}
      </DropdownMenu.Item>
      <DropdownMenu.Item variant="destructive" onSelect={() => handleCancelOrder(row.original)}>
        <XCircle class="w-4 h-4" />
        {m["operations.button.cancel"]()}
      </DropdownMenu.Item>
    </DropdownMenu.Content>
  </DropdownMenu.Root>
</div>
{/snippet}

{#snippet readyActions(row: Row<OrderSummaryResponse>)}
<div class="flex justify-end">
  <Button
    class="h-12 px-4 touch-manipulation font-medium"
    onclick={() => openDeliverDialog(row.original)}
  >
    {m["operations.button.deliver"]()}
  </Button>
</div>
{/snippet}
