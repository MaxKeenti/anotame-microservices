<script lang="ts">
  import { onMount } from 'svelte';
  import { apiService, API_CATALOG } from '$lib/services/api.svelte';
  import { adaptiveConfirm } from '$lib/components/ui/responsive/confirm-state.svelte';
  import { toast } from 'svelte-sonner';
  import { authService } from '$lib/services/auth.svelte';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import * as Table from '$lib/components/ui/table';
  import { Edit, Trash2 } from 'lucide-svelte';
  
  import GarmentDialog from '$lib/components/catalog/garment-dialog.svelte';

  const isAdmin = $derived(authService.user?.role === 'ADMIN');

  let garments = $state<any[]>([]);
  let loading = $state(true);
  let searchQuery = $state('');
  
  // Single dialog state
  let editingGarment = $state<any | null>(null);

  // Reactive filtering! No useEffect needed.
  let filteredGarments = $derived(
    garments.filter(g => g.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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
    const ok = await adaptiveConfirm({ title: 'Eliminar Prenda', description: `¿Estás seguro de que deseas eliminar ${garment.name}?` });
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

<div class="space-y-6">
  <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
    <div>
      <h1 class="text-3xl font-heading font-bold text-foreground">Prendas</h1>
      <p class="text-muted-foreground">Gestionar tipos de prendas (Camisas, Pantalones, etc).</p>
    </div>
    {#if isAdmin}
      <Button onclick={handleCreateClick} class="w-full sm:w-auto h-12 touch-manipulation">+ Agregar Prenda</Button>
    {/if}
  </div>

  <div class="flex gap-2">
    <Input
      placeholder="Buscar por nombre..."
      bind:value={searchQuery}
      class="max-w-md h-12"
    />
  </div>

  <div class="bg-card border border-border rounded-xl overflow-x-auto shadow-sm">
    <Table.Root class="w-full min-w-[600px]">
      <Table.Header>
        <Table.Row>
          <Table.Head class="px-6 py-4">Nombre</Table.Head>
          <Table.Head class="px-6 py-4">Descripción</Table.Head>
          {#if isAdmin}
            <Table.Head class="px-6 py-4 text-right">Acciones</Table.Head>
          {/if}
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {#if loading}
          <Table.Row>
            <Table.Cell colspan={isAdmin ? 3 : 2} class="h-24 text-center">
              Cargando...
            </Table.Cell>
          </Table.Row>
        {:else if filteredGarments.length === 0}
          <Table.Row>
            <Table.Cell colspan={isAdmin ? 3 : 2} class="h-24 text-center text-muted-foreground">
              No se encontraron prendas.
            </Table.Cell>
          </Table.Row>
        {:else}
          {#each filteredGarments as garment (garment.id)}
            <Table.Row>
              <Table.Cell class="px-6 py-4 font-medium">{garment.name}</Table.Cell>
              <Table.Cell class="px-6 py-4 text-muted-foreground">{garment.description || "-"}</Table.Cell>
              {#if isAdmin}
                <Table.Cell class="px-6 py-4 text-right space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    class="h-10 px-4 touch-manipulation font-medium"
                    onclick={() => handleEditClick(garment)}
                  >
                    <Edit class="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    class="h-10 px-4 text-destructive hover:text-destructive/90 touch-manipulation font-medium"
                    onclick={() => handleDeleteClick(garment)}
                  >
                    <Trash2 class="w-4 h-4 mr-2" />
                    Eliminar
                  </Button>
                </Table.Cell>
              {/if}
            </Table.Row>
          {/each}
        {/if}
      </Table.Body>
    </Table.Root>
  </div>

  <GarmentDialog item={editingGarment} onClose={() => editingGarment = null} onSuccess={handleFormSuccess} />
</div>