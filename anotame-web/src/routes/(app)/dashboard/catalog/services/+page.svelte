<script lang="ts">
  import { onMount } from 'svelte';
  import * as Card from '$lib/components/ui/card';
  import * as m from '$lib/paraglide/messages';
  import { apiService, API_CATALOG } from '$lib/services/api.svelte';
  import { authService } from '$lib/services/auth.svelte';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Edit, Trash2 } from '@lucide/svelte';
  import { adaptiveConfirm } from '$lib/components/ui/responsive/confirm-state.svelte';
  import { AdaptiveSelect } from '$lib/components/ui/responsive';
  import { toast } from 'svelte-sonner';
  import { FilterField, PageHeader, ResponsiveDataView } from '$lib/components/common';
  import type { ColumnDef, Row } from '@tanstack/table-core';
  import type { GarmentTypeResponse, ServiceResponse } from '$lib/types/dtos';


  import ServiceDialog from '$lib/components/catalog/service-dialog.svelte';

  const isAdmin = $derived(authService.user?.role === 'ADMIN');

  type ServiceEditorItem = Omit<Partial<ServiceResponse>, 'id'> & { id?: string | null };

  let services = $state<ServiceResponse[]>([]);
  let garments = $state<GarmentTypeResponse[]>([]);
  let loading = $state(true);

  // Filters
  let searchQuery = $state('');
  let garmentFilter = $state('');

  // Single dialog state
  let editingService = $state<ServiceEditorItem | null>(null);

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

  let columns = $derived<ColumnDef<ServiceResponse>[]>([
    { accessorKey: 'name', header: m["catalog.services.colName"](), enableSorting: true, meta: { cardGroup: 'header' } },
    { id: 'garment', accessorFn: (row) => getGarmentName(row.garmentTypeId), header: m["catalog.services.colGarment"](), enableSorting: true, meta: { cardGroup: 'header' } },
    { accessorKey: 'defaultDurationMin', header: m["catalog.services.colDuration"](), enableSorting: true, meta: { cardGroup: 'body' } },
    { id: 'price', accessorFn: (row) => row.basePrice, header: m["catalog.services.colPrice"](), enableSorting: true, meta: { cardGroup: 'header', format: (v) => `$${(v as number).toFixed(2)}` } },
    ...(isAdmin ? [{ id: 'actions', header: m["common.actions"](), enableSorting: false, meta: { cardGroup: 'hidden' } } as ColumnDef<ServiceResponse>] : []),
  ]);

  async function fetchData() {
    loading = true;
    try {
      const [servicesData, garmentsData] = await Promise.all([
        apiService.request<ServiceResponse[]>(`${API_CATALOG}/catalog/services`),
        apiService.request<GarmentTypeResponse[]>(`${API_CATALOG}/catalog/garments`)
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

  function handleEditClick(service: ServiceResponse) {
    editingService = service;
  }

  async function handleDeleteClick(service: ServiceResponse) {
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

  function getGarmentName(garmentTypeId?: string): string {
    const g = garments.find(g => g.id === garmentTypeId);
    return g?.name || '-';
  }
</script>

<div class="space-y-6 animate-in fade-in duration-300">
  <PageHeader
    title={m["catalog.services.title"]()}
    description={m["catalog.services.description"]()}
  >
    {#snippet actions()}
      {#if isAdmin}
      <Button size="touch-lg" onclick={handleCreateClick} class="w-full sm:w-auto px-6 text-lg font-bold shadow-md">
      {m["catalog.services.addButton"]()}
      </Button>
      {/if}
    {/snippet}
  </PageHeader>

  <!-- External Filters -->
  <Card.Root class="grid grid-cols-1 md:grid-cols-3 gap-4 p-5">
    <FilterField label={m["catalog.services.searchLabel"]()} for="search-services" class="col-span-1 md:col-span-2">
      <Input
        id="search-services"
        placeholder={m["catalog.services.searchPlaceholder"]()}
        bind:value={searchQuery}
        class="h-12 text-base touch-manipulation"
      />
    </FilterField>
    <FilterField label={m["catalog.services.filterGarmentLabel"]()} for="filter-garment-service">
      <AdaptiveSelect
        id="filter-garment-service"
        bind:value={garmentFilter}
        placeholder={m["catalog.services.filterGarmentPlaceholder"]()}
        items={garments.map(g => ({ value: g.id, label: g.name }))}
        allowClear={true}
        clearText={m["catalog.services.filterGarmentClear"]()}
      />
    </FilterField>
  </Card.Root>

  <!-- Table / Cards -->
  {#snippet serviceActions(row: Row<ServiceResponse>)}
      <div class="flex justify-end gap-2">
        <Button
          variant="outline"
          size="touch"
          class="px-4 font-medium"
          onclick={() => handleEditClick(row.original)}
        >
          <Edit class="w-4 h-4 mr-2" />
          {m["common.edit"]()}
        </Button>
        <Button
          variant="destructive-outline"
          size="touch"
          class="px-4 font-medium"
          onclick={() => handleDeleteClick(row.original)}
        >
          <Trash2 class="w-4 h-4 mr-2" />
          {m["common.delete"]()}
        </Button>
      </div>
    {/snippet}

  <Card.Root class="p-4">
    

    <ResponsiveDataView
      {columns}
      data={filteredServices}
      {loading}
      showFilter={false}
      emptyMessage={m["catalog.services.emptyMessage"]()}
      actionCell={serviceActions}
      filterPlaceholder={m["catalog.services.filterPlaceholder"]()}
    />
  </Card.Root>

  <ServiceDialog
    item={editingService}
    {garments}
    onClose={() => editingService = null}
    onSuccess={handleFormSuccess}
  />
</div>
