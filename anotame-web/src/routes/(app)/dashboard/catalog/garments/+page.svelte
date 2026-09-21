<script lang="ts">
  import { onMount } from 'svelte';
  import * as Card from '$lib/components/ui/card';
  import * as m from '$lib/paraglide/messages';
  import { apiService, API_CATALOG } from '$lib/services/api.svelte';
  import { adaptiveConfirm } from '$lib/components/ui/responsive/confirm-state.svelte';
  import { toast } from 'svelte-sonner';
  import { authService } from '$lib/services/auth.svelte';
  import { Button } from '$lib/components/ui/button';
  import { PageHeader, ResponsiveDataView, PageContainer, RowActions } from '$lib/components/common';
  import type { ColumnDef, Row } from '@tanstack/table-core';
  import type { GarmentTypeResponse } from '$lib/types/dtos';


  import GarmentDialog from '$lib/components/catalog/garment-dialog.svelte';

  const isAdmin = $derived(authService.user?.role === 'ADMIN');

  type GarmentEditorItem = Omit<Partial<GarmentTypeResponse>, 'id'> & { id?: string | null };

  let garments = $state<GarmentTypeResponse[]>([]);
  let loading = $state(true);

  // Single dialog state
  let editingGarment = $state<GarmentEditorItem | null>(null);

  let columns = $derived<ColumnDef<GarmentTypeResponse>[]>([
    { accessorKey: 'name', header: m["catalog.garments.colName"](), enableSorting: true, meta: { cardGroup: 'header' } },
    { id: 'description', accessorFn: (row) => row.description || '-', header: m["catalog.garments.colDescription"](), enableSorting: false, meta: { cardGroup: 'body' } },
    ...(isAdmin ? [{ id: 'actions', header: m["common.actions"](), enableSorting: false, meta: { cardGroup: 'hidden' } } as ColumnDef<GarmentTypeResponse>] : []),
  ]);

  async function fetchGarments() {
    loading = true;
    try {
      const response = await apiService.request<GarmentTypeResponse[]>(`${API_CATALOG}/catalog/garments`);
      garments = response || [];
    } catch (e: any) {
      toast.error(e.message || m["catalog.garments.loadError"]());
      garments = [];
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    fetchGarments();
  });

  function handleCreateClick() {
    editingGarment = { id: null, name: '', description: '' };
  }

  function handleEditClick(garment: GarmentTypeResponse) {
    editingGarment = garment;
  }

  async function handleDeleteClick(garment: GarmentTypeResponse) {
    const ok = await adaptiveConfirm({ title: m['garments.delete.title'](), description: m['garments.delete.desc']({ name: garment.name }) });
    if (ok) {
      try {
        await apiService.request(`${API_CATALOG}/catalog/garments/${garment.id}`, { method: 'DELETE' });
        toast.success(m["catalog.garments.deleteSuccess"]());
        fetchGarments();
      } catch (e: any) {
        toast.error(e.message || m["catalog.garments.deleteError"]());
      }
    }
  }

  function handleFormSuccess() {
    editingGarment = null;
    fetchGarments();
  }
</script>

<PageContainer>
  <PageHeader
    title={m["catalog.garments.title"]()}
    description={m["catalog.garments.description"]()}
  >
    {#snippet actions()}
      {#if isAdmin}
      <Button size="touch-lg" onclick={handleCreateClick} class="w-full sm:w-auto px-6 text-lg font-bold shadow-md">{m["catalog.garments.addButton"]()}</Button>
      {/if}
    {/snippet}
  </PageHeader>


  <Card.Root class="p-4">
    

    <ResponsiveDataView
      {columns}
      data={garments}
      {loading}
      emptyMessage={m["catalog.garments.emptyMessage"]()}
      filterPlaceholder={m["catalog.garments.searchPlaceholder"]()}
      actionCell={garmentActions}
    />
  </Card.Root>

  <GarmentDialog item={editingGarment} onClose={() => editingGarment = null} onSuccess={handleFormSuccess} />
</PageContainer>

<!-- Row actions shared by the table and card views. -->
{#snippet garmentActions(row: Row<GarmentTypeResponse>)}
  <RowActions onEdit={() => handleEditClick(row.original)} onDelete={() => handleDeleteClick(row.original)} />
{/snippet}
