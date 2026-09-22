<script lang="ts">
  import { Spinner } from '$lib/components/ui/spinner';
  import * as Dialog from '$lib/components/ui/dialog';
  import * as Form from '$lib/components/ui/form';
  import { cn } from '$lib/utils';
  import { Button, buttonVariants } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { apiService, API_SALES, ApiValidationError } from '$lib/services/api.svelte';
  import { toast } from 'svelte-sonner';
  import { superForm, defaults, setError } from 'sveltekit-superforms';
  import * as m from '$lib/paraglide/messages';
  import { zod4 } from 'sveltekit-superforms/adapters';
  import { z } from 'zod';

  const customerSchema = z.object({
    id: z.string().nullable().optional(),
    firstName: z.string().min(2, m['customerDialog.zod.nameRequired']()),
    lastName: z.string().optional().or(z.literal('')),
    phoneNumber: z.string().regex(/^\d{10}$/, m['customerDialog.zod.phoneFormat']()),
    email: z.string().email(m['customerDialog.zod.emailInvalid']()).optional().or(z.literal(''))
  });

  interface Props {
    item: any | null;
    onClose: () => void;
    onSuccess?: () => void;
  }

  let { item, onClose, onSuccess }: Props = $props();

  const open = $derived(item !== null);
  let isSubmitting = $state(false);

  const superform = superForm(defaults(zod4(customerSchema)), {
    id: 'customer-dialog',
    SPA: true,
    validators: zod4(customerSchema),
    async onUpdate({ form }) {
      if (!form.valid) return;
      isSubmitting = true;
      try {
        if (form.data.id) {
          await apiService.request(`${API_SALES}/api/customers/${form.data.id}`, { method: 'PUT', body: JSON.stringify(form.data) });
          toast.success(m['customerDialog.toast.updateSuccess']());
        } else {
          await apiService.request(`${API_SALES}/api/customers`, { method: 'POST', body: JSON.stringify(form.data) });
          toast.success(m['customerDialog.toast.createSuccess']());
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
          toast.error(e.message || m['customerDialog.toast.saveError']());
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
        firstName: item.firstName || '',
        lastName: item.lastName || '',
        email: item.email || '',
        phoneNumber: item.phoneNumber || ''
      };
    } else {
        reset();
    }
  });

  function handleOpenChange(v: boolean) {
    if (!v) {
        onClose();
    }
  }
</script>

<Dialog.Root {open} onOpenChange={handleOpenChange}>
  <Dialog.Content class="sm:max-w-lg">
    <Dialog.Header>
      <Dialog.Title>{item?.id ? m['customerDialog.title.edit']() : m['customerDialog.title.new']()}</Dialog.Title>
      <Dialog.Description>
        {m['customerDialog.description']()}
      </Dialog.Description>
    </Dialog.Header>
    <form method="POST" use:enhance class="space-y-4 py-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Form.Field form={superform} name="firstName">
          {#snippet children({ constraints })}
            <Form.Control>
              {#snippet children({ props })}
                <Form.Label>{m['common.firstName']()}</Form.Label>
                <Input {...props} {...constraints} bind:value={$form.firstName} />
              {/snippet}
            </Form.Control>
            <Form.FieldErrors />
          {/snippet}
        </Form.Field>
        <Form.Field form={superform} name="lastName">
          {#snippet children({ constraints })}
            <Form.Control>
              {#snippet children({ props })}
                <Form.Label>{m['common.lastName']()}</Form.Label>
                <Input {...props} {...constraints} bind:value={$form.lastName} />
              {/snippet}
            </Form.Control>
            <Form.FieldErrors />
          {/snippet}
        </Form.Field>
      </div>
      <Form.Field form={superform} name="phoneNumber">
        {#snippet children({ constraints })}
          <Form.Control>
            {#snippet children({ props })}
              <Form.Label>{m['customerDialog.label.phone']()}</Form.Label>
              <Input {...props} {...constraints} type="tel" bind:value={$form.phoneNumber} />
            {/snippet}
          </Form.Control>
          <Form.FieldErrors />
        {/snippet}
      </Form.Field>
      <Form.Field form={superform} name="email">
        {#snippet children({ constraints })}
          <Form.Control>
            {#snippet children({ props })}
              <Form.Label>{m['customerDialog.label.email']()}</Form.Label>
              <Input {...props} {...constraints} type="email" bind:value={$form.email} />
            {/snippet}
          </Form.Control>
          <Form.FieldErrors />
        {/snippet}
      </Form.Field>

      <Dialog.Footer class="pt-4">
        <Dialog.Close class={cn(buttonVariants({ variant: 'outline', size: 'touch-lg' }), 'w-full sm:w-auto')}>
          {m['common.cancel']()}
        </Dialog.Close>
        <Button size="touch-lg" type="submit" disabled={isSubmitting} class="w-full sm:w-auto px-6">
          {#if isSubmitting}
            <Spinner data-icon="inline-start" aria-hidden="true" />
            {m['common.saving']()}
          {:else}
            {m['common.save']()}
          {/if}
        </Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>
