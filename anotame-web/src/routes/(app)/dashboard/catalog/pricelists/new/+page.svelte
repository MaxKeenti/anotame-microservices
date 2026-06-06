<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { apiService, API_CATALOG } from '$lib/services/api.svelte';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import * as Form from '$lib/components/ui/form';
  import { AdaptiveDatePicker, AdaptiveSelect } from '$lib/components/ui/responsive';
  import * as Card from '$lib/components/ui/card';
  import * as Table from '$lib/components/ui/table';
  import { toast } from 'svelte-sonner';
  import { Loader2 } from 'lucide-svelte';
  import * as m from '$lib/paraglide/messages';
  import { superForm, defaults } from 'sveltekit-superforms';
  import { zod4 } from 'sveltekit-superforms/adapters';
  import { z } from 'zod';
  import type { ServiceResponse, PriceListResponse, PriceListItemDto } from '$lib/types/dtos';

  // State
  let isLoading = $state(false);
  let isFetchingBase = $state(false);
  let services = $state<ServiceResponse[]>([]);
  let availableLists = $state<PriceListResponse[]>([]);
  
  // Clone parameter
  let cloneFromId = $derived($page.url.searchParams.get('cloneFrom'));

  const pricelistSchema = z.object({
    name: z.string().min(1, m["catalog.pricelist.zodNameRequired"]()),
    priority: z.number().default(0),
    validFrom: z.string().min(1, m["catalog.pricelist.zodValidFromRequired"]()),
    validTo: z.string().optional().or(z.literal('')),
    active: z.boolean().default(true),
    baseListId: z.string().optional().or(z.literal('')),
  });
  
  // Overrides Map: ServiceID -> String Price
  let overrides = $state<Record<string, string>>({});

  const superform = superForm(defaults(zod4(pricelistSchema)), {
    id: 'pricelist-new-form',
    SPA: true,
    validators: zod4(pricelistSchema),
    async onUpdate({ form: f }) {
      if (!f.valid) return;

      isLoading = true;
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

        await apiService.request(`${API_CATALOG}/pricelists`, {
          method: 'POST',
          body: JSON.stringify(payload)
        });

        toast.success(m["catalog.pricelist.createSuccess"]());
        goto('/dashboard/catalog/pricelists');
      } catch (err: any) {
        toast.error(err.message || m["catalog.pricelist.createError"]());
      } finally {
        isLoading = false;
      }
    }
  });

  const { form, enhance } = superform;

  onMount(async () => {
    try {
      const [svcRes, listsRes] = await Promise.all([
        apiService.request<ServiceResponse[]>(`${API_CATALOG}/catalog/services`),
        apiService.request<PriceListResponse[]>(`${API_CATALOG}/pricelists`)
      ]);
      services = svcRes || [];
      availableLists = listsRes || [];

      // Initialize overrides with empty strings for all services
      const initialOverrides: Record<string, string> = {};
      services.forEach(s => {
        initialOverrides[s.id] = "";
      });
      overrides = initialOverrides;

      // Handle clone functionality if URL param exists
      // Wait a tick to ensure availableListItems $derived is updated before setting the value
      if (cloneFromId) {
        // Only set baseListId if the list is actually available
        const listExists = availableLists.some(l => l.id === cloneFromId);
        if (listExists) {
          $form.baseListId = cloneFromId;
          await handleBaseListChange(cloneFromId, true);
        }
      }
    } catch (err) {
      toast.error(m["catalog.pricelist.loadDataError"]());
    }
  });

  const availableListItems = $derived.by(() => {
    const items = [{ value: '', label: m["catalog.pricelist.baseListFromScratch"]() }, ...availableLists.map(l => ({ value: l.id, label: l.name }))];
    // If baseListId is set but not in the items, add a temporary placeholder
    if ($form.baseListId && !items.find(i => i.value === $form.baseListId)) {
      items.unshift({ value: $form.baseListId, label: m["common.loading"]() });
    }
    return items;
  });

  async function handleBaseListChange(listId: string | undefined, isFromCloneParam = false) {
    if (!listId) {
      // Reset overrides but keep keys
      const resetOverrides: Record<string, string> = {};
      services.forEach(s => {
        resetOverrides[s.id] = "";
      });
      overrides = resetOverrides;
      return;
    }
    isFetchingBase = true;
    try {
      const list = await apiService.request<PriceListResponse>(`${API_CATALOG}/pricelists/${listId}`);
        if (list) {
        // If cloning, we also pre-fill the name and priority
        if (isFromCloneParam) {
          $form.name = String(list.name || '') + ' (Copia)';
          $form.priority = Number(list.priority ?? 0);
          if (list.validFrom) {
            try {
              $form.validFrom = new Date(list.validFrom).toISOString().split('T')[0];
            } catch (e) {
              $form.validFrom = '';
            }
          }
          if (list.validTo) {
            try {
              $form.validTo = new Date(list.validTo).toISOString().split('T')[0];
            } catch (e) {
              $form.validTo = '';
            }
          }
          $form.active = Boolean(list.active ?? true);
        }

        const newOverrides: Record<string, string> = {};
        // Initialize all services first
        services.forEach(s => {
          newOverrides[s.id] = "";
        });
        
        if (list.items) {
          list.items.forEach((item: PriceListItemDto) => {
            newOverrides[item.serviceId] = String(item.price);
          });
        }
        overrides = newOverrides;
        toast.info(isFromCloneParam ? m["catalog.pricelist.cloneLoadSuccess"]() : m["catalog.pricelist.baseLoadSuccess"]());
      }
    } catch (error) {
      toast.error(m["catalog.pricelist.baseLoadError"]());
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
    toast.success(m["catalog.pricelist.bulkAdjustSuccess"]({ sign: amount > 0 ? '+' : '', amount }));
  }

  function handleReset() {
    if ($form.baseListId) {
      handleBaseListChange($form.baseListId);
    } else {
      const resetOverrides: Record<string, string> = {};
      services.forEach(s => {
        resetOverrides[s.id] = "";
      });
      overrides = resetOverrides;
    }
  }
</script>

<div class="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
  <div class="flex justify-between items-center">
    <h1 class="text-3xl font-heading font-bold text-foreground">{m["catalog.pricelist.newTitle"]()}</h1>
    <Button variant="outline" class="h-10 touch-manipulation" onclick={() => goto('/dashboard/catalog/pricelists')}>{m["common.cancel"]()}</Button>
  </div>

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
                <Form.Label>{m["catalog.pricelist.nameLabel"]()} <span class="text-destructive">*</span></Form.Label>
                <Input {...props} {...constraints} id="pl-name" placeholder={m["catalog.pricelist.namePlaceholder"]()} bind:value={$form.name} class="h-12" />
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
                  <Input {...props} {...constraints} id="pl-priority" type="number" bind:value={$form.priority} class="h-12 font-mono" />
                {/snippet}
              </Form.Control>
              <p class="text-xs text-muted-foreground mt-1">{m["catalog.pricelist.priorityHint"]()}</p>
              <Form.FieldErrors />
            {/snippet}
          </Form.Field>

          <Form.Field form={superform} name="active">
            {#snippet children({ constraints })}
              <div class="flex items-center gap-2 pt-8">
                <label class="flex items-center gap-3 cursor-pointer touch-manipulation font-medium">
                  <input
                    {...constraints}
                    type="checkbox"
                    class="checkbox-custom"
                    bind:checked={$form.active}
                  />
                  {m["catalog.pricelist.activeLabel"]()}
                </label>
              </div>
              <Form.FieldErrors />
            {/snippet}
          </Form.Field>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Form.Field form={superform} name="validFrom">
            {#snippet children({ constraints })}
                  <Form.Label>{m["catalog.pricelist.validFromLabel"]()}</Form.Label>
                  <AdaptiveDatePicker
                    id="pl-from"
                    bind:value={$form.validFrom}
                    min={new Date().toISOString().slice(0, 10)}
                  />
              <Form.FieldErrors />
            {/snippet}
          </Form.Field>
          <Form.Field form={superform} name="validTo">
            {#snippet children({ constraints })}
                  <Form.Label>{m["catalog.pricelist.validToLabel"]()}</Form.Label>
                  <AdaptiveDatePicker
                    id="pl-to"
                    value={$form.validTo ?? ''} onValueChange={(v) => $form.validTo = v}
                    min={$form.validFrom || new Date().toISOString().slice(0, 10)}
                    placeholder={m["catalog.pricelist.validToPlaceholder"]()}
                  />
              <Form.FieldErrors />
            {/snippet}
          </Form.Field>
        </div>
      </Card.Content>
    </Card.Root>

    <Card.Root>
      <Card.Header>
        <Card.Title>{m["catalog.pricelist.baseConfigCardTitle"]()}</Card.Title>
      </Card.Header>
      <Card.Content>
        <Form.Field form={superform} name="baseListId">
          {#snippet children({ constraints })}
                <Form.Label>{m["catalog.pricelist.baseListLabel"]()}</Form.Label>
                <AdaptiveSelect
                  id="pl-base"
                  value={$form.baseListId as string}
                  onValueChange={(newValue) => {
                    $form.baseListId = newValue;
                    handleBaseListChange(newValue);
                  }}
                  placeholder={m["catalog.pricelist.baseListPlaceholder"]()}
                  items={availableListItems}
                />
            <p class="text-xs text-muted-foreground mt-1">{m["catalog.pricelist.baseListHint"]()}</p>
            <Form.FieldErrors />
          {/snippet}
        </Form.Field>
      </Card.Content>
    </Card.Root>

    <Card.Root>
      <Card.Header>
        <Card.Title>{m["catalog.pricelist.overridesCardTitle"]()}</Card.Title>
        <Card.Description>{m["catalog.pricelist.overridesCardDescription"]()}</Card.Description>
      </Card.Header>
      <Card.Content class="space-y-4">
        <!-- Bulk adjustments -->
        <div class="flex flex-col sm:flex-row flex-wrap gap-2 items-center p-4 bg-secondary/20 rounded-lg border border-border">
          <span class="text-sm font-bold mr-2 uppercase tracking-wide opacity-70">{m["catalog.pricelist.bulkAdjust"]()}</span>
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
            {isFetchingBase ? m["common.loading"]() : m["catalog.pricelist.revertOriginals"]()}
          </Button>
        </div>

        <!-- Overrides Table -->
        <div class="border rounded-md overflow-x-auto">
          <Table.Root class="w-full text-sm">
            <Table.Header class="bg-secondary/30">
              <Table.Row>
                <Table.Head class="p-4 font-bold">{m["catalog.pricelist.overrideServiceHeader"]()}</Table.Head>
                <Table.Head class="p-4 font-bold text-right">{m["catalog.pricelist.overrideBaseHeader"]()}</Table.Head>
                <Table.Head class="p-4 font-bold text-center">{m["catalog.pricelist.overrideOverrideHeader"]()}</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {#each services as service (service.id)}
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
                      class="h-12 w-full max-w-45 mx-auto text-center font-mono font-bold text-primary shadow-sm bg-background"
                      placeholder={m["catalog.pricelist.overridePlaceholder"]()}
                      bind:value={overrides[service.id]}
                    />
                  </Table.Cell>
                </Table.Row>
              {/each}
              {#if services.length === 0}
                <Table.Row>
                  <Table.Cell colspan={3} class="p-8 text-center text-muted-foreground">
                    {m["catalog.pricelist.noServices"]()}
                  </Table.Cell>
                </Table.Row>
              {/if}
            </Table.Body>
          </Table.Root>
        </div>
      </Card.Content>
    </Card.Root>


    <div class="flex justify-end gap-4 pt-4 pb-12">
      <Button type="button" variant="outline" class="h-14 px-8 text-lg touch-manipulation" onclick={() => goto('/dashboard/catalog/pricelists')}>{m["common.cancel"]()}</Button>
      <Button type="submit" disabled={isLoading} class="h-14 px-8 text-lg shadow-md touch-manipulation">
        {#if isLoading}
          <Loader2 class="w-4 h-4 mr-2 animate-spin" />
          {m["catalog.pricelist.creating"]()}
        {:else}
          {m["catalog.pricelist.saveButton"]()}
        {/if}
      </Button>
    </div>
  </form>
</div>

