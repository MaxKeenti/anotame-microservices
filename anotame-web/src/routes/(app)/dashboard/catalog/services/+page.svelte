<script lang="ts">
  import { onMount } from 'svelte';
  import * as m from '$lib/paraglide/messages';
  import { apiService, API_CATALOG } from '$lib/services/api.svelte';
  import { authService } from '$lib/services/auth.svelte';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Edit, Trash2 } from 'lucide-svelte';
  import { adaptiveConfirm } from '$lib/components/ui/responsive/confirm-state.svelte';
  import { AdaptiveSelect } from '$lib/components/ui/responsive';
  import { toast } from 'svelte-sonner';
  import DataTableWrapper from '$lib/components/ui/DataTableWrapper.svelte';
  import type { ColumnDef } from '@tanstack/table-core';

  import ServiceDialog from '$lib/components/catalog/service-dialog.svelte';
  import * as m from '$lib/paraglide/messages';

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

  let columns = $derived<ColumnDef<any>[]>([
    { accessorKey: 'name', header: m["catalog.services.colName"](), enableSorting: true },
    { id: 'garment', accessorFn: (row: any) => getGarmentName(row.garmentTypeId), header: m["catalog.services.colGarment"](), enableSorting: true },
    { accessorKey: 'defaultDurationMin', header: m["catalog.services.colDuration"](), enableSorting: true },
    { id: 'price', accessorFn: (row: any) => `$${row.basePrice.toFixed(2)}`, header: m["catalog.services.colPrice"](), enableSorting: true },
    ...(isAdmin ? [{ id: 'actions', header: m["common.actions"](), enableSorting: false } as ColumnDef<any>] : []),
  ]);

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
      toast.error(e.message || m["catalog.services.loadError"]());
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
      title: m["catalog.services.deleteTitle"](),
      description: m["catalog.services.deleteDescription"]({ name: service.name })
    });
    if (ok) {
      try {
        await apiService.request(`${API_CATALOG}/catalog/services/${service.id}`, { method: 'DELETE' });
        toast.success(m["catalog.services.deleteSuccess"]());
        fetchData();
      } catch (e: any) {
        toast.error(e.message || m["catalog.services.deleteError"]());
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
      <h1 class="text-3xl font-heading font-bold text-foreground">{m["catalog.services.title"]()}</h1>
      <p class="text-muted-foreground">{m["catalog.services.description"]()}</p>
    </div>
    {#if isAdmin}
      <Button onclick={handleCreateClick} class="w-full sm:w-auto h-12 px-6 text-lg font-bold touch-manipulation shadow-md">
        {m["catalog.services.addButton"]()}
      </Button>
    {/if}
  </div>

  <!-- External Filters -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 bg-card border border-border rounded-xl shadow-sm">
    <div class="col-span-1 md:col-span-2 space-y-1.5">
      <label class="text-xs font-bold uppercase tracking-wider text-muted-foreground" for="search-services">{m["catalog.services.searchLabel"]()}</label>
      <Input
        id="search-services"
        placeholder={m["catalog.services.searchPlaceholder"]()}
        bind:value={searchQuery}
        class="h-12 text-base touch-manipulation"
      />
    </div>
    <div class="space-y-1.5">
      <label class="text-xs font-bold uppercase tracking-wider text-muted-foreground" for="filter-garment-service">{m["catalog.services.filterGarmentLabel"]()}</label>
      <AdaptiveSelect
        id="filter-garment-service"
        bind:value={garmentFilter}
        placeholder={m["catalog.services.filterGarmentPlaceholder"]()}
        items={garments.map(g => ({ value: g.id, label: g.name }))}
        allowClear={true}
        clearText={m["catalog.services.filterGarmentClear"]()}
      />
    </div>
  </div>

  <!-- Table -->
  <div class="bg-card border border-border rounded-xl overflow-hidden shadow-sm p-4">
    <DataTableWrapper
      {columns}
      data={filteredServices}
      {loading}
      showFilter={false}
      emptyMessage={m["catalog.services.emptyMessage"]()}
      filterPlaceholder={m["catalog.services.filterPlaceholder"]()}
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
            {m["common.edit"]()}
          </Button>
          <Button
            variant="outline"
            size="sm"
            class="h-10 px-4 text-destructive hover:text-destructive/90 touch-manipulation font-medium"
            onclick={() => handleDeleteClick(row.original)}
          >
            <Trash2 class="w-4 h-4 mr-2" />
            {m["common.delete"]()}
          </Button>
        </div>
      {/snippet}
    </DataTableWrapper>
  </div>

  <ServiceDialog
    item={editingService}
    {garments}
    onClose={() => editingService = null}
    onSuccess={handleFormSuccess}
  />
</div>
