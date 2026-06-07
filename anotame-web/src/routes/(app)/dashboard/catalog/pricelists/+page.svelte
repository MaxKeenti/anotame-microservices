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
  import DataTableWrapper from '$lib/components/ui/DataTableWrapper.svelte';
  import CardGridWrapper from '$lib/components/ui/CardGridWrapper.svelte';
  import { useIsMobile } from '$lib/hooks/use-mobile.svelte';
  import type { ColumnDef, Row } from '@tanstack/table-core';
  import type { PriceListResponse } from '$lib/types/dtos';
  import * as m from '$lib/paraglide/messages';

  // Guard: Protect this route, strictly checking 'ADMIN'
  const guard = useAuthGuard(true, '/dashboard');

  const mobile = useIsMobile();

  let lists = $state<PriceListResponse[]>([]);
  let isLoading = $state(true);

  // Computed state for derived logic (though guard.allowed handles fast redirects)
  const isAdmin = $derived(authService.user?.role === 'ADMIN');

  const columns: ColumnDef<PriceListResponse>[] = [
    { accessorKey: 'name', header: m["catalog.pricelists.colName"](), enableSorting: true, meta: { cardGroup: 'header' } },
    { id: 'status', accessorFn: (row) => row.active ? m["catalog.pricelists.colActive"]() : m["catalog.pricelists.colInactive"](), header: m["catalog.pricelists.colStatus"](), enableSorting: true, meta: { cardGroup: 'header' } },
    { accessorKey: 'priority', header: m["catalog.pricelists.colPriority"](), enableSorting: true, meta: { cardGroup: 'body' } },
    { id: 'validFrom', accessorFn: (row) => new Date(row.validFrom).toLocaleDateString('es-ES'), header: m["catalog.pricelists.colValidFrom"](), enableSorting: true, meta: { cardGroup: 'body' } },
    { id: 'validTo', accessorFn: (row) => row.validTo ? new Date(row.validTo).toLocaleDateString('es-ES') : m["catalog.pricelists.colPermanent"](), header: m["catalog.pricelists.colValidTo"](), enableSorting: true, meta: { cardGroup: 'body' } },
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
  <div class="p-8 text-center text-muted-foreground animate-pulse">{m["catalog.pricelists.verifyingAccess"]()}</div>
{:else if guard.allowed}
  <div class="space-y-6 animate-in fade-in duration-300">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 class="text-3xl font-heading font-bold text-foreground">{m["catalog.pricelists.title"]()}</h1>
        <p class="text-muted-foreground">{m["catalog.pricelists.description"]()}</p>
      </div>
      <Button href="/dashboard/catalog/pricelists/new" class="w-full sm:w-auto h-12 shadow-sm touch-manipulation">
        {m["catalog.pricelists.addButton"]()}
      </Button>
    </div>

    {#snippet pricelistActions(row: Row<PriceListResponse>)}
      <div class="flex justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          class="h-11 border-primary/20 hover:bg-primary/5 text-primary touch-manipulation"
          onclick={() => handleClone(row.original.id)}
        >
          <Copy class="w-4 h-4 mr-2" />
          {m["catalog.pricelists.cloneButton"]()}
        </Button>
        <Button
          variant="outline"
          size="sm"
          class="h-11 touch-manipulation"
          href={`/dashboard/catalog/pricelists/${row.original.id}`}
        >
          <Eye class="w-4 h-4 mr-2" />
          {m["catalog.pricelists.viewButton"]()}
        </Button>
        <Button
          variant="outline"
          size="sm"
          class="h-11 text-destructive hover:bg-destructive/10 border-destructive/20 touch-manipulation"
          onclick={() => handleDelete(row.original.id, row.original.name)}
        >
          <Trash2 class="w-4 h-4 mr-2" />
          {m["common.delete"]()}
        </Button>
      </div>
    {/snippet}

    <Card.Root>
      <Card.Header>
        <Card.Title>{m["catalog.pricelists.cardTitle"]()}</Card.Title>
        <Card.Description>{m["catalog.pricelists.cardDescription"]()}</Card.Description>
      </Card.Header>
      <Card.Content>
        {#if mobile.current}
          <CardGridWrapper
            {columns}
            data={lists}
            loading={isLoading}
            emptyMessage={m["catalog.pricelists.emptyMessage"]()}
            filterPlaceholder={m["catalog.pricelists.searchPlaceholder"]()}
            actionCell={pricelistActions}
          />
        {:else}
          <DataTableWrapper
            {columns}
            data={lists}
            loading={isLoading}
            emptyMessage={m["catalog.pricelists.emptyMessage"]()}
            filterPlaceholder={m["catalog.pricelists.searchPlaceholder"]()}
            actionCell={pricelistActions}
          />
        {/if}
      </Card.Content>
    </Card.Root>
  </div>
{/if}
