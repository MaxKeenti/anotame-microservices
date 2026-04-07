<script lang="ts">
  import { apiService, API_CATALOG } from '$lib/services/api.svelte';
  import { authService } from '$lib/services/auth.svelte';
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import { adaptiveConfirm } from '$lib/components/ui/responsive/confirm-state.svelte';
  import { toast } from 'svelte-sonner';
  import { Eye, Trash2, Copy } from 'lucide-svelte';
  import { useAuthGuard } from '$lib/guards/index.svelte';
  import { goto } from '$app/navigation';
  import DataTableWrapper from '$lib/components/ui/DataTableWrapper.svelte';
  import type { ColumnDef } from '@tanstack/table-core';

  // Guard: Protect this route, strictly checking 'ADMIN'
  const guard = useAuthGuard(true, '/dashboard');
  
  let lists = $state<any[]>([]);
  let isLoading = $state(true);

  // Computed state for derived logic (though guard.allowed handles fast redirects)
  const isAdmin = $derived(authService.user?.role === 'ADMIN');

  const columns: ColumnDef<any>[] = [
    { accessorKey: 'name', header: 'Nombre', enableSorting: true },
    { accessorKey: 'priority', header: 'Prioridad', enableSorting: true },
    { id: 'validFrom', accessorFn: (row) => new Date(row.validFrom).toLocaleDateString('es-ES'), header: 'Válido Desde', enableSorting: true },
    { id: 'validTo', accessorFn: (row) => row.validTo ? new Date(row.validTo).toLocaleDateString('es-ES') : 'Permanente', header: 'Válido Hasta', enableSorting: true },
    { id: 'status', accessorFn: (row) => row.active ? 'Activa' : 'Inactiva', header: 'Estado', enableSorting: true },
    { id: 'actions', header: 'Acciones', enableSorting: false },
  ];

  async function loadLists() {
    isLoading = true;
    try {
      if (!isAdmin) return;
      const data = await apiService.request<any[]>(`${API_CATALOG}/pricelists`);
      lists = data || [];
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error al cargar listas de precios");
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
      title: 'Eliminar Lista', 
      description: `¿Estás seguro de que deseas eliminar la lista "${name}"?` 
    });
    
    if (ok) {
      try {
        await apiService.request(`${API_CATALOG}/pricelists/${id}`, { method: 'DELETE' });
        toast.success("Lista eliminada exitosamente");
        loadLists();
      } catch (err: any) {
        toast.error("No se pudo eliminar la lista");
      }
    }
  }

  function handleClone(id: string) {
    // Clone passes the source id via query parameter to the `new` route
    goto(`/dashboard/catalog/pricelists/new?cloneFrom=${id}`);
  }
</script>

{#if guard.checking}
  <div class="p-8 text-center text-muted-foreground animate-pulse">Verificando accesos...</div>
{:else if guard.allowed}
  <div class="space-y-6 animate-in fade-in duration-300">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 class="text-3xl font-heading font-bold text-foreground">Listas de Precios</h1>
        <p class="text-muted-foreground">Gestiona estrategias de precios y descuentos temporales.</p>
      </div>
      <Button href="/dashboard/catalog/pricelists/new" class="w-full sm:w-auto h-12 shadow-sm touch-manipulation">
        + Nueva Lista
      </Button>
    </div>

    <Card.Root>
      <Card.Header>
        <Card.Title>Estrategias Activas e Históricas</Card.Title>
        <Card.Description>Las listas con mayor prioridad sobrescriben el precio base del catálogo.</Card.Description>
      </Card.Header>
      <Card.Content>
        <DataTableWrapper
          {columns}
          data={lists}
          loading={isLoading}
          emptyMessage="No hay listas configuradas."
          filterPlaceholder="Buscar listas..."
        >
          {#snippet actionCell(row)}
            <div class="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                class="h-11 border-primary/20 hover:bg-primary/5 text-primary touch-manipulation"
                onclick={() => handleClone(row.original.id)}
                title="Clonar Lista"
              >
                <Copy class="w-4 h-4 mr-2" />
                Clonar
              </Button>
              <Button
                variant="outline"
                size="sm"
                class="h-11 touch-manipulation"
                href={`/dashboard/catalog/pricelists/${row.original.id}`}
              >
                <Eye class="w-4 h-4 mr-2" />
                Ver
              </Button>
              <Button
                variant="outline"
                size="sm"
                class="h-11 text-destructive hover:bg-destructive/10 border-destructive/20 touch-manipulation"
                onclick={() => handleDelete(row.original.id, row.original.name)}
              >
                <Trash2 class="w-4 h-4 mr-2" />
                Eliminar
              </Button>
            </div>
          {/snippet}
        </DataTableWrapper>
      </Card.Content>
    </Card.Root>
  </div>
{/if}
