<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { apiService, API_CATALOG } from '$lib/services/api.svelte';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import * as Form from '$lib/components/ui/form';
  import { AdaptiveDatePicker } from '$lib/components/ui/responsive';
  import * as Card from '$lib/components/ui/card';
  import * as Table from '$lib/components/ui/table';
  import DataTableWrapper from '$lib/components/ui/DataTableWrapper.svelte';
  import type { ColumnDef, Row } from '@tanstack/table-core';
  import { adaptiveConfirm } from '$lib/components/ui/responsive/confirm-state.svelte';
  import { toast } from 'svelte-sonner';
  import { Loader2 } from 'lucide-svelte';
  import { superForm, defaults } from 'sveltekit-superforms';
  import { zod4 } from 'sveltekit-superforms/adapters';
  import { z } from 'zod';

  // Derived ID
  let listId = $derived($page.params.id);

  // State
  let isLoading = $state(true);
  let isSaving = $state(false);
  let services = $state<any[]>([]);

  const pricelistSchema = z.object({
    name: z.string().min(1, 'El nombre es obligatorio'),
    priority: z.number().default(0),
    validFrom: z.string().min(1, 'La fecha de inicio es obligatoria'),
    validTo: z.string().optional().or(z.literal('')),
    active: z.boolean().default(true),
  });

  // Overrides Map: ServiceID -> String Price
  let overrides = $state<Record<string, string>>({});

  // Original state reference for resets
  let originalOverrides = $state<Record<string, string>>({});

  const superform = superForm(defaults(zod4(pricelistSchema)), {
    SPA: true,
    validators: zod4(pricelistSchema),
    async onUpdate({ form: f }) {
      if (!f.valid) return;

      isSaving = true;
      try {
        const items = Object.entries(overrides)
          .filter(([_, val]) => val !== null && val !== undefined && String(val).trim() !== '')
          .map(([serviceId, val]) => ({
            serviceId,
            price: parseFloat(String(val))
          }));

        const payload = {
          name: f.data.name,
          priority: f.data.priority,
          validFrom: new Date(f.data.validFrom).toISOString(),
          validTo: f.data.validTo ? new Date(f.data.validTo).toISOString() : null,
          active: f.data.active,
          items
        };

        await apiService.request(`${API_CATALOG}/pricelists/${listId}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });

        toast.success('Lista de precios actualizada exitosamente');
        goto('/dashboard/catalog/pricelists');
      } catch (err: any) {
        toast.error(err.message || 'Error al actualizar la lista');
      } finally {
        isSaving = false;
      }
    }
  });

  const { form, enhance } = superform;

  // Column definitions for overrides table
  const overrideColumns: ColumnDef<any>[] = [
    {
      accessorKey: 'name',
      header: 'Servicio',
      enableSorting: false,
    },
    {
      accessorKey: 'basePrice',
      header: 'Precio Base',
      enableSorting: false,
      accessorFn: (row) => `$${row.basePrice.toFixed(2)}`,
    },
    {
      id: 'override',
      header: 'Precio Override',
      enableSorting: false,
    },
  ];

  onMount(async () => {
    try {
      // Fetch both services and the specific pricelist simultaneously
      const [svcRes, listRes] = await Promise.all([
        apiService.request<any[]>(`${API_CATALOG}/catalog/services`),
        apiService.request<any>(`${API_CATALOG}/pricelists/${listId}`)
      ]);

      services = svcRes || [];

      const list = listRes;
      if (list) {
        $form.name = list.name;
        $form.priority = list.priority;
        $form.active = list.active;
        if (list.validFrom) $form.validFrom = new Date(list.validFrom).toISOString().split('T')[0];
        if (list.validTo) $form.validTo = new Date(list.validTo).toISOString().split('T')[0];

        const newOverrides: Record<string, string> = {};
        if (list.items) {
          list.items.forEach((item: any) => {
            newOverrides[item.serviceId] = String(item.price);
          });
        }
        overrides = newOverrides;
        originalOverrides = { ...newOverrides };
      }
    } catch (err: any) {
      toast.error(err.message || 'Error al cargar la lista de precios');
      goto('/dashboard/catalog/pricelists');
    } finally {
      isLoading = false;
    }
  });

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
    overrides = { ...originalOverrides };
    toast.info('Valores restaurados a la configuración guardada.');
  }
</script>

{#if isLoading}
  <div class="h-64 flex items-center justify-center text-muted-foreground animate-pulse">
    Cargando estrategia...
  </div>
{:else}
  {#snippet overrideCellRender(row: Row<any>)}
    <Input
      type="number"
      step="0.01"
      min="0"
      class="h-12 w-full max-w-[180px] mx-auto text-center font-mono font-bold text-primary shadow-sm bg-background"
      placeholder="Igual al base"
      bind:value={overrides[row.original.id]}
    />
  {/snippet}

  {@const cellRenders = {
    override: overrideCellRender
  }}

  <div class="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-3xl font-heading font-bold text-foreground">Editar Lista de Precios</h1>
        <p class="text-muted-foreground">Actualiza la estrategia "{$form.name}"</p>
      </div>
      <Button variant="outline" class="h-10 touch-manipulation" onclick={() => goto('/dashboard/catalog/pricelists')}>Cancelar</Button>
    </div>

    <form method="POST" use:enhance class="space-y-6">
      <Card.Root>
        <Card.Header>
          <Card.Title>Detalles de la Estrategia</Card.Title>
        </Card.Header>
        <Card.Content class="space-y-4">
          <Form.Field form={superform} name="name">
            {#snippet children({ constraints })}
              <Form.Control>
                {#snippet children({ props })}
                  <Form.Label>Nombre de la Lista <span class="text-destructive">*</span></Form.Label>
                  <Input {...props} {...constraints} id="pl-name" placeholder="Ej. Promoción de Verano 2026" bind:value={$form.name} class="h-12" />
                {/snippet}
              </Form.Control>
              <Form.FieldErrors />
            {/snippet}
          </Form.Field>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Field form={superform} name="priority">
              {#snippet children({ constraints })}
                <Form.Control>
                  {#snippet children({ props })}
                    <Form.Label>Prioridad (Mayor gana)</Form.Label>
                    <Input {...props} {...constraints} id="pl-priority" type="number" bind:value={$form.priority} class="h-12 font-mono" />
                  {/snippet}
                </Form.Control>
                <Form.FieldErrors />
              {/snippet}
            </Form.Field>

            <Form.Field form={superform} name="active">
              {#snippet children({ constraints })}
                <div class="flex items-center gap-2 pt-8">
                  <label class="flex items-center gap-3 cursor-pointer touch-manipulation font-medium">
                    <input
                      type="checkbox"
                      class="checkbox-custom"
                      bind:checked={$form.active}
                    />
                    Estrategia Activa
                  </label>
                </div>
                <Form.FieldErrors />
              {/snippet}
            </Form.Field>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Field form={superform} name="validFrom">
              {#snippet children({ constraints })}
                <Form.Label>Válido Desde</Form.Label>
                <AdaptiveDatePicker id="pl-from" bind:value={$form.validFrom} />
                <Form.FieldErrors />
              {/snippet}
            </Form.Field>
            <Form.Field form={superform} name="validTo">
              {#snippet children({ constraints })}
                <Form.Label>Válido Hasta (Opcional)</Form.Label>
                <AdaptiveDatePicker id="pl-to" value={$form.validTo ?? ''} onValueChange={(v) => $form.validTo = v} placeholder="Permanente si está vacío" />
                <Form.FieldErrors />
              {/snippet}
            </Form.Field>
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
            <Button type="button" variant="ghost" size="sm" class="h-10 text-muted-foreground w-full sm:w-auto" onclick={handleReset}>
              Restaurar
            </Button>
          </div>

          <!-- Overrides Table -->
          <div class="border rounded-md overflow-x-auto">
            <DataTableWrapper
              columns={overrideColumns}
              data={services}
              loading={false}
              emptyMessage="No hay servicios disponibles."
              pageSize={100}
              {cellRenders}
            />
          </div>
        </Card.Content>
      </Card.Root>

      <div class="flex justify-between items-center gap-4 pt-4 pb-12">
        <Button
          type="button"
          variant="ghost"
          class="h-14 px-8 text-lg touch-manipulation text-destructive hover:bg-destructive-muted hover:text-destructive"
          onclick={async () => {
            const ok = await adaptiveConfirm({
              title: 'Descartar Cambios',
              description: '¿Estás seguro de que deseas salir sin guardar los cambios?'
            });
            if(ok) goto('/dashboard/catalog/pricelists');
          }}
        >
          Descartar Cambios
        </Button>
        <Button type="submit" disabled={isSaving} class="h-14 px-8 text-lg shadow-md touch-manipulation">
          {#if isSaving}
            <Loader2 class="w-4 h-4 mr-2 animate-spin" />
            Guardando...
          {:else}
            Guardar Estrategia
          {/if}
        </Button>
      </div>
    </form>
  </div>
{/if}

