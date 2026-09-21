<script lang="ts">
  import { formatCurrency } from '$lib/utils/formatUtils';
  import { Spinner } from '$lib/components/ui/spinner';
  import { onMount } from 'svelte';
  import BulkAdjustBar from '$lib/components/catalog/bulk-adjust-bar.svelte';
  import { Separator } from '$lib/components/ui/separator';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { apiService, API_CATALOG } from '$lib/services/api.svelte';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import * as Form from '$lib/components/ui/form';
  import { Checkbox } from '$lib/components/ui/checkbox';
  import { AdaptiveDatePicker } from '$lib/components/ui/responsive';
  import * as Card from '$lib/components/ui/card';
  import { PageHeader, RequiredMark, ResponsiveDataView, StatePanel, PageContainer } from '$lib/components/common';
  import type { ColumnDef, Row } from '@tanstack/table-core';
  import type { ServiceResponse, PriceListResponse, PriceListItemDto } from '$lib/types/dtos';
  import { adaptiveConfirm } from '$lib/components/ui/responsive/confirm-state.svelte';
  import { toast } from 'svelte-sonner';
  import * as m from '$lib/paraglide/messages';
  import { superForm, defaults } from 'sveltekit-superforms';
  import { zod4 } from 'sveltekit-superforms/adapters';
  import { z } from 'zod';

  // Derived ID
  let listId = $derived($page.params.id);


  // State
  let isLoading = $state(true);
  let isSaving = $state(false);
  let services = $state<ServiceResponse[]>([]);

  const pricelistSchema = z.object({
    name: z.string().min(1, m["catalog.pricelist.zodNameRequired"]()),
    priority: z.number().default(0),
    validFrom: z.string().min(1, m["catalog.pricelist.zodValidFromRequired"]()),
    validTo: z.string().optional().or(z.literal('')),
    active: z.boolean().default(true),
  });

  // Overrides Map: ServiceID -> String Price
  let overrides = $state<Record<string, string>>({});

  // Original state reference for resets
  let originalOverrides = $state<Record<string, string>>({});

  const superform = superForm(defaults(zod4(pricelistSchema)), {
    id: 'pricelist-edit-form',
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

        toast.success(m["catalog.pricelist.updateSuccess"]());
        await goto('/dashboard/catalog/pricelists');
      } catch (err: any) {
        toast.error(err.message || m["catalog.pricelist.updateError"]());
      } finally {
        isSaving = false;
      }
    }
  });

  const { form, enhance } = superform;

  // Column definitions for overrides table
  const overrideColumns: ColumnDef<ServiceResponse>[] = [
    {
      accessorKey: 'name',
      header: m["catalog.pricelist.columnService"](),
      enableSorting: false,
      meta: { cardGroup: 'header' },
    },
    {
      accessorKey: 'basePrice',
      header: m["catalog.pricelist.columnBasePrice"](),
      enableSorting: false,
      accessorFn: (row) => formatCurrency(row.basePrice),
      meta: { cardGroup: 'body' },
    },
    {
      id: 'override',
      header: m["catalog.pricelist.columnOverride"](),
      enableSorting: false,
      meta: { cardGroup: 'body' },
    },
  ];

  onMount(async () => {
    try {
      // Fetch both services and the specific pricelist simultaneously
      const [svcRes, listRes] = await Promise.all([
        apiService.request<ServiceResponse[]>(`${API_CATALOG}/catalog/services`),
        apiService.request<PriceListResponse>(`${API_CATALOG}/pricelists/${listId}`)
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
          list.items.forEach((item: PriceListItemDto) => {
            newOverrides[item.serviceId] = String(item.price);
          });
        }
        overrides = newOverrides;
        originalOverrides = { ...newOverrides };
      }
    } catch (err: any) {
      toast.error(err.message || m["catalog.pricelist.loadError"]());
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
    toast.success(m["catalog.pricelist.bulkAdjustSuccess"]({ sign: amount > 0 ? '+' : '', amount }));
  }

  function handleReset() {
    overrides = { ...originalOverrides };
    toast.info(m["catalog.pricelist.resetSuccess"]());
  }
</script>

{#if isLoading}
  <StatePanel message={m["catalog.pricelist.loadingStrategy"]()} loading size="page" />
{:else}
  {#snippet overrideCellRender(row: Row<ServiceResponse>)}
    <Input
      type="number"
      step="0.01"
      min="0"
      class="h-12 w-full max-w-45 mx-auto text-center font-mono font-bold text-primary shadow-sm bg-background"
      placeholder={m["catalog.pricelist.overridePlaceholder"]()}
      bind:value={overrides[row.original.id]}
    />
  {/snippet}

  {@const cellRenders = {
    override: overrideCellRender
  }}

  <PageContainer width="form">
    <PageHeader
      title={m["catalog.pricelist.editTitle"]()}
      description={m["catalog.pricelist.editSubtitle"]({ name: $form.name })}
    >
      {#snippet actions()}
        <Button size="touch-lg" variant="outline" class="w-full sm:w-auto" onclick={() => goto('/dashboard/catalog/pricelists')}>{m["common.cancel"]()}</Button>
      {/snippet}
    </PageHeader>

    <form method="POST" use:enhance class="space-y-6">
      <Card.Root>
        <Card.Header>
          <Card.Title>{m["catalog.pricelist.detailsCardTitle"]()}</Card.Title>
        </Card.Header>
        <Card.Content class="space-y-4">
          <Form.Field form={superform} name="name">
            {#snippet children({ constraints })}
              <Form.Control>
                {#snippet children({ props })}
                  <Form.Label>{m["catalog.pricelist.nameLabel"]()}<RequiredMark /></Form.Label>
                  <Input {...props} {...constraints} placeholder={m["catalog.pricelist.namePlaceholder"]()} bind:value={$form.name} class="h-12" />
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
                    <Form.Label>{m["catalog.pricelist.priorityLabel"]()}</Form.Label>
                    <Input {...props} {...constraints} type="number" bind:value={$form.priority} class="h-12 font-mono" />
                  {/snippet}
                </Form.Control>
                <Form.FieldErrors />
              {/snippet}
            </Form.Field>

            <Form.Field form={superform} name="active">
              {#snippet children()}
                <Form.Control>
                  {#snippet children({ props })}
                    <div class="flex items-center gap-3 pt-8">
                      <Checkbox {...props} class="size-5" bind:checked={$form.active} />
                      <Form.Label class="flex min-h-11 items-center font-medium cursor-pointer touch-manipulation">
                        {m["catalog.pricelist.activeLabel"]()}
                      </Form.Label>
                    </div>
                  {/snippet}
                </Form.Control>
                <Form.FieldErrors />
              {/snippet}
            </Form.Field>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Field form={superform} name="validFrom">
              {#snippet children({ constraints })}
                <Form.Label>{m["catalog.pricelist.validFromLabel"]()}</Form.Label>
                <AdaptiveDatePicker id="pl-from" bind:value={$form.validFrom} />
                <Form.FieldErrors />
              {/snippet}
            </Form.Field>
            <Form.Field form={superform} name="validTo">
              {#snippet children({ constraints })}
                <Form.Label>{m["catalog.pricelist.validToLabel"]()}</Form.Label>
                <AdaptiveDatePicker id="pl-to" value={$form.validTo ?? ''} onValueChange={(v) => $form.validTo = v} placeholder={m["catalog.pricelist.validToPlaceholder"]()} />
                <Form.FieldErrors />
              {/snippet}
            </Form.Field>
          </div>
        </Card.Content>
      </Card.Root>

      <Card.Root>
        <Card.Header>
          <Card.Title>{m["catalog.pricelist.overridesCardTitle"]()}</Card.Title>
          <Card.Description>{m["catalog.pricelist.overridesCardDescription"]()}</Card.Description>
        </Card.Header>
        <Card.Content class="space-y-4">
          <!-- Bulk adjustments -->
          <BulkAdjustBar onAdjust={handleBulkAdjustment}>
            {#snippet reset()}
              <Button type="button" variant="ghost" size="touch" class="text-muted-foreground w-full sm:w-auto" onclick={handleReset}>
                {m["catalog.pricelist.restoreButton"]()}
              </Button>
            {/snippet}
          </BulkAdjustBar>

          <!-- Overrides Table -->
          <ResponsiveDataView
              showColumnToggle={false}
              columns={overrideColumns}
              data={services}
              loading={false}
              emptyMessage={m["catalog.pricelist.noServices"]()}
              {cellRenders}
            />
        </Card.Content>
      </Card.Root>

      <div class="flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center gap-4 pt-4">
        <Button size="xl"
          type="button"
          variant="destructive-outline"
          class="w-full sm:w-auto"
          onclick={async () => {
            const ok = await adaptiveConfirm({
              title: m["catalog.pricelist.discardTitle"](),
              description: m["catalog.pricelist.discardDescription"]()
            });
            if(ok) goto('/dashboard/catalog/pricelists');
          }}
        >
          {m["catalog.pricelist.discardChanges"]()}
        </Button>
        <Button size="xl" type="submit" disabled={isSaving} class="w-full sm:w-auto px-8 text-lg shadow-md">
          {#if isSaving}
            <Spinner data-icon="inline-start" aria-hidden="true" />
            {m["catalog.pricelist.saving"]()}
          {:else}
            {m["catalog.pricelist.saveStrategyButton"]()}
          {/if}
        </Button>
      </div>
    </form>
  </PageContainer>
{/if}
