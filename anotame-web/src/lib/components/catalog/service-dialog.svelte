<script lang="ts">
  import * as Dialog from '$lib/components/ui/dialog';
  import * as Form from '$lib/components/ui/form';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Loader2 } from '@lucide/svelte';
  import { AdaptiveSelect } from '$lib/components/ui/responsive';
  import { apiService, API_CATALOG, ApiValidationError } from '$lib/services/api.svelte';
  import { toast } from 'svelte-sonner';

  import { superForm, defaults, setError } from 'sveltekit-superforms';
  import * as m from '$lib/paraglide/messages';
  import { zod4 } from 'sveltekit-superforms/adapters';
  import { z } from 'zod';
  import type { GarmentTypeResponse } from '$lib/types/dtos';

  const serviceSchema = z.object({
    id: z.string().nullable().optional(),
    name: z.string().min(2, m['serviceDialog.zod.nameRequired']()),
    description: z.string().optional().or(z.literal('')),
    basePrice: z.number().min(0, m['serviceDialog.zod.priceMin']()),
    defaultDurationMin: z.number().min(1, m['serviceDialog.zod.minDuration']()),
    garmentTypeId: z.string().min(1, m['serviceDialog.zod.garmentRequired']()),
  });

  let { item, garments = [], onClose, onSuccess } = $props<{
    item: any | null;
    garments?: GarmentTypeResponse[];
    onClose: () => void;
    onSuccess?: () => void;
  }>();

  const open = $derived(item !== null);
  let isSubmitting = $state(false);

  const garmentItems = $derived(
    garments.map((g: GarmentTypeResponse) => ({ value: g.id, label: g.name }))
  );

  const superform = superForm(defaults(zod4(serviceSchema)), {
    id: 'service-dialog',
    SPA: true,
    validators: zod4(serviceSchema),
    async onUpdate({ form }) {
      if (!form.valid) return;
      isSubmitting = true;
      try {
        const payload = {
          name: form.data.name,
          description: form.data.description || '',
          basePrice: form.data.basePrice,
          defaultDurationMin: form.data.defaultDurationMin,
          garmentTypeId: form.data.garmentTypeId,
        };

        if (form.data.id) {
          await apiService.request(`${API_CATALOG}/catalog/services/${form.data.id}`, {
            method: 'PUT',
            body: JSON.stringify(payload)
          });
          toast.success(m['serviceDialog.toast.updateSuccess']());
        } else {
          await apiService.request(`${API_CATALOG}/catalog/services`, {
            method: 'POST',
            body: JSON.stringify(payload)
          });
          toast.success(m['serviceDialog.toast.createSuccess']());
        }
        onClose();
        onSuccess?.();
      } catch (e: any) {
        if (e instanceof ApiValidationError) {
          for (const [field, message] of Object.entries(e.validationErrors)) {
            setError(form, field as keyof typeof form.data, message);
          }
          toast.error(m['common.checkMarkedFields']());
        } else {
          toast.error(e.message || m['serviceDialog.toast.saveError']());
        }
      } finally {
        isSubmitting = false;
      }
    }
  });

  const { form, enhance, reset } = superform;

  $effect(() => {
    if (item) {
      $form = {
        id: item.id || null,
        name: item.name || '',
        description: item.description || '',
        basePrice: item.basePrice ?? 0,
        defaultDurationMin: item.defaultDurationMin ?? 30,
        garmentTypeId: item.garmentTypeId || '',
      };
    } else {
      reset();
    }
  });

  function handleOpenChange(v: boolean) {
    if (!v) onClose();
  }
</script>

<Dialog.Root {open} onOpenChange={handleOpenChange}>
  <Dialog.Content class="max-w-lg">
    <Dialog.Header>
      <Dialog.Title>{item?.id ? m['serviceDialog.title.edit']() : m['serviceDialog.title.new']()}</Dialog.Title>
      <Dialog.Description>
        {m['serviceDialog.description']()}
      </Dialog.Description>
    </Dialog.Header>
    <form method="POST" use:enhance class="space-y-4 py-4">
      <Form.Field form={superform} name="garmentTypeId">
        {#snippet children({ constraints })}
          <Form.Label>{m['serviceDialog.label.garment']()}</Form.Label>
          <AdaptiveSelect
            id="s-garment"
            bind:value={$form.garmentTypeId}
            placeholder={m['serviceDialog.placeholder.garment']()}
            items={garmentItems}
          />
          <Form.FieldErrors />
        {/snippet}
      </Form.Field>

      <Form.Field form={superform} name="name">
        {#snippet children({ constraints })}
          <Form.Control>
            {#snippet children({ props })}
              <Form.Label>{m['serviceDialog.label.name']()}</Form.Label>
              <Input {...props} {...constraints} placeholder={m['serviceDialog.placeholder.name']()} bind:value={$form.name} class="h-12" />
            {/snippet}
          </Form.Control>
          <Form.FieldErrors />
        {/snippet}
      </Form.Field>

      <Form.Field form={superform} name="description">
        {#snippet children({ constraints })}
          <Form.Control>
            {#snippet children({ props })}
              <Form.Label>{m['serviceDialog.label.description']()}</Form.Label>
              <Input {...props} {...constraints} placeholder={m['serviceDialog.placeholder.description']()} bind:value={$form.description} class="h-12" />
            {/snippet}
          </Form.Control>
          <Form.FieldErrors />
        {/snippet}
      </Form.Field>

      <div class="grid grid-cols-2 gap-4">
        <Form.Field form={superform} name="basePrice">
          {#snippet children({ constraints })}
            <Form.Control>
              {#snippet children({ props })}
                <Form.Label>{m['serviceDialog.label.basePrice']()}</Form.Label>
                <Input {...props} {...constraints} type="number" step="0.01" min="0" placeholder="0.00" bind:value={$form.basePrice} class="h-12" />
              {/snippet}
            </Form.Control>
            <Form.FieldErrors />
          {/snippet}
        </Form.Field>
        <Form.Field form={superform} name="defaultDurationMin">
          {#snippet children({ constraints })}
            <Form.Control>
              {#snippet children({ props })}
                <Form.Label>{m['serviceDialog.label.duration']()}</Form.Label>
                <Input {...props} {...constraints} type="number" min="1" placeholder="30" bind:value={$form.defaultDurationMin} class="h-12" />
              {/snippet}
            </Form.Control>
            <Form.FieldErrors />
          {/snippet}
        </Form.Field>
      </div>

      <Dialog.Footer class="pt-4">
        <Dialog.Close class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-12 w-full sm:w-auto px-6 mt-2 sm:mt-0">
          {m['common.cancel']()}
        </Dialog.Close>
        <Button type="submit" disabled={isSubmitting} class="h-12 w-full sm:w-auto px-6">
          {#if isSubmitting}
            <Loader2 class="w-4 h-4 mr-2 animate-spin" />
            {m['common.saving']()}
          {:else}
            {m['common.save']()}
          {/if}
        </Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>

