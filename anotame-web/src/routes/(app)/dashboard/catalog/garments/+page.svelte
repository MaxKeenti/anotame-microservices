<script lang="ts">
  import { onMount } from 'svelte';
  import * as m from '$lib/paraglide/messages';
  import { apiService, API_CATALOG } from '$lib/services/api.svelte';
  import { adaptiveConfirm } from '$lib/components/ui/responsive/confirm-state.svelte';
  import { toast } from 'svelte-sonner';
  import { authService } from '$lib/services/auth.svelte';
  import { Button } from '$lib/components/ui/button';
  import { Edit, Trash2 } from 'lucide-svelte';
  import DataTableWrapper from '$lib/components/ui/DataTableWrapper.svelte';
  import type { ColumnDef } from '@tanstack/table-core';

  import GarmentDialog from '$lib/components/catalog/garment-dialog.svelte';

  const isAdmin = $derived(authService.user?.role === 'ADMIN');

  let garments = $state<any[]>([]);
  let loading = $state(true);

  // Single dialog state
  let editingGarment = $state<any | null>(null);

  let columns = $derived<ColumnDef<any>[]>([
    { accessorKey: 'name', header: 'Nombre', enableSorting: true },
    { id: 'description', accessorFn: (row: any) => row.description || '-', header: m['garments.column.description'](), enableSorting: false },
    ...(isAdmin ? [{ id: 'actions', header: 'Acciones', enableSorting: false } as ColumnDef<any>] : []),
  ]);

  async function fetchGarments() {
    loading = true;
    try {
      const response = await apiService.request<any[]>(`${API_CATALOG}/catalog/garments`);
      garments = response || [];
    } catch (e: any) {
      toast.error(e.message || "Error al cargar las prendas");
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

  function handleEditClick(garment: any) {
    editingGarment = garment;
  }

  async function handleDeleteClick(garment: any) {
    const ok = await adaptiveConfirm({ title: m['garments.delete.title'](), description: m['garments.delete.desc']({ name: garment.name }) });
    if (ok) {
      try {
        await apiService.request(`${API_CATALOG}/catalog/garments/${garment.id}`, { method: 'DELETE' });
        toast.success("Prenda eliminada exitosamente");
        fetchGarments();
      } catch (e: any) {
        toast.error(e.message || "Error al eliminar la prenda");
      }
    }
  }

  function handleFormSuccess() {
    editingGarment = null;
    fetchGarments();
  }
</script>

<div class="space-y-6 animate-in fade-in duration-300">
  <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
    <div>
      <h1 class="text-3xl font-heading font-bold text-foreground">Prendas</h1>
      <p class="text-muted-foreground">Gestionar tipos de prendas (Camisas, Pantalones, etc).</p>
    </div>
    {#if isAdmin}
      <Button onclick={handleCreateClick} class="w-full sm:w-auto h-12 px-6 text-lg font-bold touch-manipulation shadow-md">+ Agregar Prenda</Button>
    {/if}
  </div>

  <div class="bg-card border border-border rounded-xl overflow-hidden shadow-sm p-4">
    <DataTableWrapper
      {columns}
      data={garments}
      {loading}
      emptyMessage="No se encontraron prendas."
      filterPlaceholder="Buscar prendas..."
    >
      {#snippet actionCell(row)}
        <div class="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            class="h-10 px-4 touch-manipulation font-medium"
            onclick={() => handleEditClick(row.original)}
          >
            <Edit class="w-4 h-4 mr-2" />
            Editar
          </Button>
          <Button
            variant="outline"
            size="sm"
            class="h-10 px-4 text-destructive hover:text-destructive/90 touch-manipulation font-medium"
            onclick={() => handleDeleteClick(row.original)}
          >
            <Trash2 class="w-4 h-4 mr-2" />
            Eliminar
          </Button>
        </div>
      {/snippet}
    </DataTableWrapper>
  </div>

  <GarmentDialog item={editingGarment} onClose={() => editingGarment = null} onSuccess={handleFormSuccess} />
</div>