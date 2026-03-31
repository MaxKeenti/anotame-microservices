<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { apiService, API_CATALOG } from '$lib/services/api.svelte';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { AdaptiveDatePicker, AdaptiveSelect } from '$lib/components/ui/responsive';
  import * as Card from '$lib/components/ui/card';
  import * as Table from '$lib/components/ui/table';
  import { toast } from 'svelte-sonner';

  // State
  let isLoading = $state(false);
  let isFetchingBase = $state(false);
  let services = $state<any[]>([]);
  let availableLists = $state<any[]>([]);
  
  // Clone parameter
  let cloneFromId = $derived($page.url.searchParams.get('cloneFrom'));

  // Form State
  let name = $state('');
  let priority = $state(0);
  let validFrom = $state(new Date().toISOString().split('T')[0]);
  let validTo = $state('');
  let active = $state(true);
  let baseListId = $state('');
  
  // Overrides Map: ServiceID -> String Price
  let overrides = $state<Record<string, string>>({});

  onMount(async () => {
    try {
      const [svcRes, listsRes] = await Promise.all([
        apiService.request<any[]>(`${API_CATALOG}/catalog/services`),
        apiService.request<any[]>(`${API_CATALOG}/pricelists`)
      ]);
      services = svcRes || [];
      availableLists = listsRes || [];

      // Handle clone functionality if URL param exists
      if (cloneFromId) {
        baseListId = cloneFromId;
        await handleBaseListChange(cloneFromId, true);
      }
    } catch (err) {
      toast.error('Error al cargar datos necesarios');
    }
  });

  const availableListItems = $derived(
    availableLists.map(l => ({ value: l.id, label: l.name }))
  );

  async function handleBaseListChange(listId: string, isFromCloneParam = false) {
    if (!listId) {
      overrides = {};
      return;
    }
    isFetchingBase = true;
    try {
      const list = await apiService.request<any>(`${API_CATALOG}/pricelists/${listId}`);
      if (list) {
        // If cloning, we also pre-fill the name and priority
        if (isFromCloneParam) {
          name = `${list.name} (Copia)`;
          priority = list.priority;
          if (list.validFrom) validFrom = new Date(list.validFrom).toISOString().split('T')[0];
          if (list.validTo) validTo = new Date(list.validTo).toISOString().split('T')[0];
          active = list.active;
        }

        const newOverrides: Record<string, string> = {};
        if (list.items) {
          list.items.forEach((item: any) => {
            newOverrides[item.serviceId] = String(item.price);
          });
        }
        overrides = newOverrides;
        toast.info(isFromCloneParam ? 'Lista original cargada como plantilla.' : 'Precios base cargados.');
      }
    } catch (error) {
      toast.error('Error al cargar la lista base');
    } finally {
      isFetchingBase = false;
    }
  }

  function handleBulkAdjustment(amount: number) {
    let next: Record<string, string> = { ...overrides };
    services.forEach(service => {
      const currentPrice = parseFloat(next[service.id] || String(service.basePrice));
      const newPrice = Math.max(0, currentPrice + amount);
      next[service.id] = newPrice.toFixed(2);
    });
    overrides = next;
    toast.success(`Ajuste masivo de ${amount > 0 ? '+' : ''}$${amount} aplicado.`);
  }

  function handleReset() {
    if (baseListId) {
      handleBaseListChange(baseListId);
    } else {
      overrides = {};
    }
  }

  async function handleSubmit(e: Event) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }
    
    isLoading = true;
    try {
      const items = Object.entries(overrides)
        .filter(([_, val]) => val !== null && val !== undefined && String(val).trim() !== '')
        .map(([serviceId, val]) => ({
          serviceId,
          price: parseFloat(String(val))
        }));

      const payload = {
        name,
        priority,
        validFrom: new Date(validFrom).toISOString(),
        validTo: validTo ? new Date(validTo).toISOString() : null,
        active,
        items
      };

      await apiService.request(`${API_CATALOG}/pricelists`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      toast.success('Lista de precios creada exitosamente');
      goto('/dashboard/catalog/pricelists');
    } catch (err: any) {
      toast.error(err.message || 'Error al crear la lista');
    } finally {
      isLoading = false;
    }
  }
</script>

<div class="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
  <div class="flex justify-between items-center">
    <h1 class="text-3xl font-heading font-bold text-foreground">Nueva Lista de Precios</h1>
    <Button variant="outline" class="h-10 touch-manipulation" onclick={() => goto('/dashboard/catalog/pricelists')}>Cancelar</Button>
  </div>

  <form onsubmit={handleSubmit} class="space-y-6">
    <Card.Root>
      <Card.Header>
        <Card.Title>Detalles de la Estrategia</Card.Title>
      </Card.Header>
      <Card.Content class="space-y-4">
        <div class="space-y-2">
          <label for="pl-name" class="text-sm font-medium">Nombre de la Lista <span class="text-destructive">*</span></label>
          <Input id="pl-name" placeholder="Ej. Promoción de Verano 2026" required bind:value={name} class="h-12" />
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-2">
            <label for="pl-priority" class="text-sm font-medium">Prioridad (Mayor gana)</label>
            <Input id="pl-priority" type="number" required bind:value={priority} class="h-12 font-mono" />
            <p class="text-xs text-muted-foreground">Si dos listas chocan en fecha, aplicará la de mayor prioridad.</p>
          </div>
          <div class="flex items-center gap-2 pt-8">
            <label class="flex items-center gap-3 cursor-pointer touch-manipulation font-medium">
              <input
                type="checkbox"
                class="w-5 h-5 border-2 border-border rounded appearance-none checked:bg-primary checked:border-primary shrink-0 flex items-center justify-center transition-colors after:content-['✓'] after:text-white after:font-bold after:hidden checked:after:block after:text-xs"
                bind:checked={active}
              />
              Estrategia Activa
            </label>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-2">
            <label for="pl-from" class="text-sm font-medium">Válido Desde</label>
            <AdaptiveDatePicker id="pl-from" bind:value={validFrom} min={new Date().toISOString().slice(0, 10)} />
          </div>
          <div class="space-y-2">
            <label for="pl-to" class="text-sm font-medium">Válido Hasta (Opcional)</label>
            <AdaptiveDatePicker id="pl-to" bind:value={validTo} min={validFrom || new Date().toISOString().slice(0, 10)} placeholder="Permanente si está vacío" />
          </div>
        </div>
      </Card.Content>
    </Card.Root>

    <Card.Root>
      <Card.Header>
        <Card.Title>Configuración Base</Card.Title>
      </Card.Header>
      <Card.Content>
        <div class="space-y-2">
          <label for="pl-base" class="text-sm font-medium">Copiar desde una lista existente</label>
          <AdaptiveSelect
            id="pl-base"
            bind:value={baseListId}
            onchange={() => handleBaseListChange(baseListId)}
            placeholder="-- Iniciar desde cero (Precios Base) --"
            items={availableListItems}
          />
          <p class="text-xs text-muted-foreground">Al seleccionar una lista, se cargarán sus precios y sobrescribirán los actuales.</p>
        </div>
      </Card.Content>
    </Card.Root>

    <Card.Root>
      <Card.Header>
        <Card.Title>Sobrescritura de Precios (Overrides)</Card.Title>
        <Card.Description>Deja el campo vacío para mantener el Precio Base.</Card.Description>
      </Card.Header>
      <Card.Content class="space-y-4">
        <!-- Bulk adjustments -->
        <div class="flex flex-col sm:flex-row flex-wrap gap-2 items-center p-4 bg-secondary/20 rounded-lg border border-border">
          <span class="text-sm font-bold mr-2 uppercase tracking-wide opacity-70">Ajuste Masivo:</span>
          <div class="flex gap-2">
            {#each [5, 10, 15, 20] as amount}
              <Button type="button" variant="outline" size="sm" class="font-mono text-success hover:text-success hover:bg-success/10 border-success/30 touch-manipulation h-10" onclick={() => handleBulkAdjustment(amount)}>
                +${amount}
              </Button>
            {/each}
          </div>
          <div class="hidden sm:block w-px h-6 bg-border mx-2"></div>
          <div class="flex gap-2">
            {#each [5, 10, 15, 20] as amount}
              <Button type="button" variant="outline" size="sm" class="font-mono text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30 touch-manipulation h-10" onclick={() => handleBulkAdjustment(-amount)}>
                -${amount}
              </Button>
            {/each}
          </div>
          <div class="w-full sm:w-px sm:h-6 bg-border mx-0 sm:mx-2 my-2 sm:my-0"></div>
          <Button type="button" variant="ghost" size="sm" class="h-10 text-muted-foreground w-full sm:w-auto" onclick={handleReset} disabled={isFetchingBase}>
            {isFetchingBase ? 'Cargando...' : 'Revertir a originales'}
          </Button>
        </div>

        <!-- Overrides Table -->
        <div class="border rounded-md overflow-x-auto">
          <Table.Root class="w-full text-sm">
            <Table.Header class="bg-secondary/30">
              <Table.Row>
                <Table.Head class="p-4 font-bold">Servicio</Table.Head>
                <Table.Head class="p-4 font-bold text-right">Precio Base</Table.Head>
                <Table.Head class="p-4 font-bold text-center">Precio Override</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {#each services as service}
                <Table.Row class="hover:bg-muted/10">
                  <Table.Cell class="p-4 font-medium align-middle">{service.name}</Table.Cell>
                  <Table.Cell class="p-4 text-muted-foreground font-mono text-right align-middle text-base">
                    ${service.basePrice.toFixed(2)}
                  </Table.Cell>
                  <Table.Cell class="p-4 align-middle">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      class="h-12 w-full max-w-[180px] mx-auto text-center font-mono font-bold text-primary shadow-sm bg-background"
                      placeholder="Igual al base"
                      bind:value={overrides[service.id]}
                    />
                  </Table.Cell>
                </Table.Row>
              {/each}
              {#if services.length === 0}
                <Table.Row>
                  <Table.Cell colspan={3} class="p-8 text-center text-muted-foreground">
                    No hay servicios configurados en el catálogo.
                  </Table.Cell>
                </Table.Row>
              {/if}
            </Table.Body>
          </Table.Root>
        </div>
      </Card.Content>
    </Card.Root>

    <div class="flex justify-end gap-4 pt-4 pb-12">
      <Button type="button" variant="outline" class="h-14 px-8 text-lg touch-manipulation" onclick={() => goto('/dashboard/catalog/pricelists')}>Cancelar</Button>
      <Button type="submit" disabled={isLoading} class="h-14 px-8 text-lg shadow-md touch-manipulation">
        {isLoading ? "Creando..." : "Guardar Lista de Precios"}
      </Button>
    </div>
  </form>
</div>
