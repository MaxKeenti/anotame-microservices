<script lang="ts">
  import { apiService, API_CATALOG } from '$lib/services/api.svelte';
  import { authService } from '$lib/services/auth.svelte';
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import { adaptiveConfirm } from '$lib/components/ui/responsive/confirm-state.svelte';
  import { toast } from 'svelte-sonner';
  import { Eye, Trash2, Copy } from '@lucide/svelte';
  import { useAuthGuard } from '$lib/guards/index.svelte';
  import { goto } from '$app/navigation';
  import { PageHeader, ResponsiveDataView, StatePanel, PageContainer } from '$lib/components/common';
  import type { ColumnDef, Row } from '@tanstack/table-core';
  import type { PriceListResponse } from '$lib/types/dtos';
  import * as m from '$lib/paraglide/messages';
  import { formatDate, toTimestamp } from '$lib/utils/formatUtils';

  // Guard: Protect this route, strictly checking 'ADMIN'
  const guard = useAuthGuard(true, '/dashboard');


  let lists = $state<PriceListResponse[]>([]);
  let isLoading = $state(true);

  // Computed state for derived logic (though guard.allowed handles fast redirects)
  const isAdmin = $derived(authService.user?.role === 'ADMIN');

  const columns: ColumnDef<PriceListResponse>[] = [
    { accessorKey: 'name', header: m["catalog.pricelists.colName"](), enableSorting: true, meta: { cardGroup: 'header' } },
    {
      id: 'status',
      accessorFn: (row) => (row.active ? 'active' : 'inactive'),
      header: m["catalog.pricelists.colStatus"](),
      enableSorting: true,
      meta: {
        cardGroup: 'header',
        format: (v) => (v === 'active' ? m["catalog.pricelists.colActive"]() : m["catalog.pricelists.colInactive"]()),
        filterOptions: [
          { value: 'active', label: m["catalog.pricelists.colActive"]() },
          { value: 'inactive', label: m["catalog.pricelists.colInactive"]() },
        ],
      },
    },
    { accessorKey: 'priority', header: m["catalog.pricelists.colPriority"](), enableSorting: true, meta: { cardGroup: 'body' } },
    { id: 'validFrom', accessorFn: (row) => toTimestamp(row.validFrom), header: m["catalog.pricelists.colValidFrom"](), enableSorting: true, meta: { cardGroup: 'body', format: (v) => formatDate(v as number | undefined) } },
    { id: 'validTo', accessorFn: (row) => toTimestamp(row.validTo), header: m["catalog.pricelists.colValidTo"](), enableSorting: true, meta: { cardGroup: 'body', format: (v) => (v == null ? m["catalog.pricelists.colPermanent"]() : formatDate(v as number)) } },
    { id: 'actions', header: m["common.actions"](), enableSorting: false, meta: { cardGroup: 'hidden' } },
  ];

  async function loadLists() {
    isLoading = true;
    try {
      if (!isAdmin) return;
      const data = await apiService.request<PriceListResponse[]>(`${API_CATALOG}/pricelists`);
      lists = data || [];
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || m["catalog.pricelists.loadError"]());
      lists = [];
    } finally {
      isLoading = false;
    }
  }

  // Once guard resolves authentication state:
  $effect(() => {
    if (guard.allowed) {
      loadLists();
    }
  });

  async function handleDelete(id: string, name: string) {
    const ok = await adaptiveConfirm({
      title: m["catalog.pricelists.deleteTitle"](),
      description: m["catalog.pricelists.deleteDescription"]({ name })
    });

    if (ok) {
      try {
        await apiService.request(`${API_CATALOG}/pricelists/${id}`, { method: 'DELETE' });
        toast.success(m["catalog.pricelists.deleteSuccess"]());
        loadLists();
      } catch (err: any) {
        toast.error(m["catalog.pricelists.deleteError"]());
      }
    }
  }

  function handleClone(id: string) {
    // Clone passes the source id via query parameter to the `new` route
    goto(`/dashboard/catalog/pricelists/new?cloneFrom=${id}`);
  }
</script>

{#if guard.checking}
  <StatePanel message={m["catalog.pricelists.verifyingAccess"]()} loading class="h-auto border-0 p-8" />
{:else if guard.allowed}
  <PageContainer>
    <PageHeader
      title={m["catalog.pricelists.title"]()}
      description={m["catalog.pricelists.description"]()}
    >
      {#snippet actions()}
        <Button size="touch-lg" href="/dashboard/catalog/pricelists/new" class="w-full sm:w-auto shadow-sm">
        {m["catalog.pricelists.addButton"]()}
        </Button>
      {/snippet}
    </PageHeader>


    <Card.Root>
      <Card.Header>
        <Card.Title>{m["catalog.pricelists.cardTitle"]()}</Card.Title>
        <Card.Description>{m["catalog.pricelists.cardDescription"]()}</Card.Description>
      </Card.Header>
      <Card.Content>
        <ResponsiveDataView
          {columns}
          data={lists}
          loading={isLoading}
          emptyMessage={m["catalog.pricelists.emptyMessage"]()}
          filterPlaceholder={m["catalog.pricelists.searchPlaceholder"]()}
          actionCell={pricelistActions}
        />
      </Card.Content>
    </Card.Root>
  </PageContainer>
{/if}

<!-- Row actions shared by the table and card views. -->
{#snippet pricelistActions(row: Row<PriceListResponse>)}
      <div class="flex justify-end gap-2">
        <Button
          variant="outline"
          size="touch"
          class="border-primary/20 hover:bg-primary/5 text-primary"
          onclick={() => handleClone(row.original.id)}
        >
          <Copy class="w-4 h-4 mr-2" />
          {m["catalog.pricelists.cloneButton"]()}
        </Button>
        <Button
          variant="outline"
          size="touch"
          
          href={`/dashboard/catalog/pricelists/${row.original.id}`}
        >
          <Eye class="w-4 h-4 mr-2" />
          {m["catalog.pricelists.viewButton"]()}
        </Button>
        <Button
          variant="destructive-outline"
          size="touch"
          class=""
          onclick={() => handleDelete(row.original.id, row.original.name)}
        >
          <Trash2 class="w-4 h-4 mr-2" />
          {m["common.delete"]()}
        </Button>
      </div>
    {/snippet}
