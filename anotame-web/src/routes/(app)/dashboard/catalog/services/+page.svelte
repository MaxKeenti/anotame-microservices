<script lang="ts">
  import { onMount } from 'svelte';
  import { apiService, API_CATALOG } from '$lib/services/api.svelte';
  import { authService } from '$lib/services/auth.svelte';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import * as Table from '$lib/components/ui/table';
  import { Edit, Trash2 } from 'lucide-svelte';
  import { adaptiveConfirm } from '$lib/components/ui/responsive/confirm-state.svelte';
  import { AdaptiveSelect } from '$lib/components/ui/responsive';
  import { toast } from 'svelte-sonner';

  import ServiceDialog from '$lib/components/catalog/service-dialog.svelte';

  const isAdmin = $derived(authService.user?.role === 'ADMIN');

  let services = $state<any[]>([]);
  let garments = $state<any[]>([]);
  let loading = $state(true);

  // Filters
  let searchQuery = $state('');
  let garmentFilter = $state('');

  // Single dialog state
  let editingService = $state<any | null>(null);

  // Reactive filtering
  let filteredServices = $derived.by(() => {
    return services.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      if (garmentFilter) {
        if (s.garmentTypeId !== garmentFilter) return false;
      }

      return true;
    });
  });

  async function fetchData() {
    loading = true;
    try {
      const [servicesData, garmentsData] = await Promise.all([
        apiService.request<any[]>(`${API_CATALOG}/catalog/services`),
        apiService.request<any[]>(`${API_CATALOG}/catalog/garments`)
      ]);
      services = servicesData || [];
      garments = garmentsData || [];
    } catch (e: any) {
      toast.error(e.message || "Error al cargar los servicios");
      services = [];
      garments = [];
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    fetchData();
  });

  function handleCreateClick() {
    editingService = {
      id: null,
      name: '',
      description: '',
      basePrice: 0,
      defaultDurationMin: 30,
      garmentTypeId: ''
    };
  }

  function handleEditClick(service: any) {
    editingService = service;
  }

  async function handleDeleteClick(service: any) {
    const ok = await adaptiveConfirm({
      title: 'Eliminar Servicio',
      description: `¿Estás seguro de que deseas eliminar "${service.name}"? Esta acción no se puede deshacer.`
    });
    if (ok) {
      try {
        await apiService.request(`${API_CATALOG}/catalog/services/${service.id}`, { method: 'DELETE' });
        toast.success("Servicio eliminado exitosamente");
        fetchData();
      } catch (e: any) {
        toast.error(e.message || "Error al eliminar el servicio");
      }
    }
  }

  function handleFormSuccess() {
    editingService = null;
    fetchData();
  }

  function getGarmentName(garmentTypeId: string): string {
    const g = garments.find(g => g.id === garmentTypeId);
    return g?.name || '-';
  }
</script>

<div class="space-y-6 animate-in fade-in duration-300">
  <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
    <div>
      <h1 class="text-3xl font-heading font-bold text-foreground">Servicios</h1>
      <p class="text-muted-foreground">Gestionar servicios ofrecidos y precios.</p>
    </div>
    {#if isAdmin}
      <Button onclick={handleCreateClick} class="w-full sm:w-auto h-12 px-6 text-lg font-bold touch-manipulation shadow-md">
        + Agregar Servicio
      </Button>
    {/if}
  </div>

  <!-- Filters -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 bg-card border border-border rounded-xl shadow-sm">
    <div class="col-span-1 md:col-span-2 space-y-1.5">
      <label class="text-xs font-bold uppercase tracking-wider text-muted-foreground" for="search-services">Buscar</label>
      <Input
        id="search-services"
        placeholder="Nombre del servicio..."
        bind:value={searchQuery}
        class="h-12 text-base touch-manipulation"
      />
    </div>
    <div class="space-y-1.5">
      <label class="text-xs font-bold uppercase tracking-wider text-muted-foreground" for="filter-garment-service">Filtrar por Prenda</label>
      <AdaptiveSelect
        id="filter-garment-service"
        bind:value={garmentFilter}
        placeholder="Selecciona prenda..."
        items={garments.map(g => ({ value: g.id, label: g.name }))}
        allowClear={true}
        clearText="Cualquier prenda"
      />
    </div>
  </div>

  <!-- Table -->
  <div class="bg-card border border-border rounded-xl overflow-x-auto shadow-sm">
    <Table.Root class="w-full min-w-[700px]">
      <Table.Header>
        <Table.Row>
          <Table.Head class="px-6 py-4">Nombre</Table.Head>
          <Table.Head class="px-6 py-4">Prenda</Table.Head>
          <Table.Head class="px-6 py-4">Duración (min)</Table.Head>
          <Table.Head class="px-6 py-4">Precio</Table.Head>
          {#if isAdmin}
            <Table.Head class="px-6 py-4 text-right">Acciones</Table.Head>
          {/if}
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {#if loading}
          <Table.Row>
            <Table.Cell colspan={isAdmin ? 5 : 4} class="h-24 text-center">
              Cargando...
            </Table.Cell>
          </Table.Row>
        {:else if filteredServices.length === 0}
          <Table.Row>
            <Table.Cell colspan={isAdmin ? 5 : 4} class="h-24 text-center text-muted-foreground">
              No se encontraron servicios.
            </Table.Cell>
          </Table.Row>
        {:else}
          {#each filteredServices as service (service.id)}
            <Table.Row>
              <Table.Cell class="px-6 py-4 font-medium">{service.name}</Table.Cell>
              <Table.Cell class="px-6 py-4 text-muted-foreground">{getGarmentName(service.garmentTypeId)}</Table.Cell>
              <Table.Cell class="px-6 py-4">{service.defaultDurationMin}</Table.Cell>
              <Table.Cell class="px-6 py-4 font-bold font-mono">${service.basePrice.toFixed(2)}</Table.Cell>
              {#if isAdmin}
                <Table.Cell class="px-6 py-4 text-right space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    class="h-10 px-4 touch-manipulation font-medium"
                    onclick={() => handleEditClick(service)}
                  >
                    <Edit class="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    class="h-10 px-4 text-destructive hover:text-destructive/90 touch-manipulation font-medium"
                    onclick={() => handleDeleteClick(service)}
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

  <ServiceDialog
    item={editingService}
    {garments}
    onClose={() => editingService = null}
    onSuccess={handleFormSuccess}
  />
</div>
