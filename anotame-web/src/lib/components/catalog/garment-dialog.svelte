<script lang="ts">
  import * as Dialog from '$lib/components/ui/dialog';
  import * as Form from '$lib/components/ui/form';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Loader2 } from 'lucide-svelte';
  import { apiService, API_CATALOG, ApiValidationError } from '$lib/services/api.svelte';
  import { toast } from 'svelte-sonner';
  
  import { superForm, defaults, setError } from 'sveltekit-superforms';
  import * as m from '$lib/paraglide/messages';
  import { zod4 } from 'sveltekit-superforms/adapters';
  import { z } from 'zod';

  const garmentSchema = z.object({
    id: z.string().nullable().optional(),
    name: z.string().min(2, m['garmentDialog.zod.nameRequired']()),
    description: z.string().optional().or(z.literal(''))
  });

  let { item, onClose, onSuccess } = $props<{
    item: any | null;
    onClose: () => void;
    onSuccess?: () => void;
  }>();

  const open = $derived(item !== null);
  let isSubmitting = $state(false);

  const superform = superForm(defaults(zod4(garmentSchema)), {
    id: 'garment-dialog',
    SPA: true,
    validators: zod4(garmentSchema),
    async onUpdate({ form }) {
      if (!form.valid) return;
      isSubmitting = true;
      try {
        if (form.data.id) {
          await apiService.request(`${API_CATALOG}/catalog/garments/${form.data.id}`, {
            method: 'PUT',
            body: JSON.stringify(form.data)
          });
          toast.success(m['garmentDialog.toast.updateSuccess']());
        } else {
          await apiService.request(`${API_CATALOG}/catalog/garments`, {
            method: 'POST',
            body: JSON.stringify(form.data)
          });
          toast.success(m['garmentDialog.toast.createSuccess']());
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
          toast.error(e.message || m['garmentDialog.toast.saveError']());
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
        description: item.description || ''
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
  <Dialog.Content class="max-w-md">
    <Dialog.Header>
      <Dialog.Title>{item?.id ? m['garmentDialog.title.edit']() : m['garmentDialog.title.new']()}</Dialog.Title>
      <Dialog.Description>
        {m['garmentDialog.description']()}
      </Dialog.Description>
    </Dialog.Header>
    <form method="POST" use:enhance class="space-y-4 py-4">
      <Form.Field form={superform} name="name">
        {#snippet children({ constraints })}
          <Form.Control>
            {#snippet children({ props })}
              <Form.Label>{m['garmentDialog.label.name']()}</Form.Label>
              <Input {...props} {...constraints} placeholder={m['garmentDialog.placeholder.name']()} bind:value={$form.name} class="h-12" />
            {/snippet}
          </Form.Control>
          <Form.FieldErrors />
        {/snippet}
      </Form.Field>
      
      <Form.Field form={superform} name="description">
        {#snippet children({ constraints })}
          <Form.Control>
            {#snippet children({ props })}
              <Form.Label>{m['garmentDialog.label.description']()}</Form.Label>
              <Input {...props} {...constraints} placeholder={m['garmentDialog.placeholder.description']()} bind:value={$form.description} class="h-12" />
            {/snippet}
          </Form.Control>
          <Form.FieldErrors />
        {/snippet}
      </Form.Field>

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