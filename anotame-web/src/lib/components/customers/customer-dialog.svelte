<script lang="ts">
  import * as Dialog from '$lib/components/ui/dialog';
  import * as Form from '$lib/components/ui/form';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Loader2 } from 'lucide-svelte';
  import { apiService, API_SALES, ApiValidationError } from '$lib/services/api.svelte';
  import { toast } from 'svelte-sonner';
  import { superForm, defaults, setError } from 'sveltekit-superforms';
  import { zod4 } from 'sveltekit-superforms/adapters';
  import { z } from 'zod';

  const customerSchema = z.object({
    id: z.string().nullable().optional(),
    firstName: z.string().min(2, 'El nombre es obligatorio'),
    lastName: z.string().optional().or(z.literal('')),
    phoneNumber: z.string().regex(/^\d{10}$/, 'Debe ser un número de 10 dígitos'),
    email: z.string().email('Correo inválido').optional().or(z.literal(''))
  });

  let { item, onClose, onSuccess } = $props<{
    item: any | null;
    onClose: () => void;
    onSuccess?: () => void;
  }>();

  const open = $derived(item !== null);
  let isSubmitting = $state(false);

  const superform = superForm(defaults(zod4(customerSchema)), {
    SPA: true,
    validators: zod4(customerSchema),
    async onUpdate({ form }) {
      if (!form.valid) return;
      isSubmitting = true;
      try {
        if (form.data.id) {
          await apiService.request(`${API_SALES}/api/customers/${form.data.id}`, { method: 'PUT', body: JSON.stringify(form.data) });
          toast.success("Cliente actualizado exitosamente");
        } else {
          await apiService.request(`${API_SALES}/api/customers`, { method: 'POST', body: JSON.stringify(form.data) });
          toast.success("Cliente creado exitosamente");
        }

        onClose();
        onSuccess?.();
      } catch (e: any) {
        if (e instanceof ApiValidationError) {
          for (const [field, message] of Object.entries(e.validationErrors)) {
            setError(form, field as keyof typeof form.data, message);
          }
          toast.error("Por favor, revisa los campos marcados en rojo.");
        } else {
          toast.error(e.message || "Error al guardar el cliente.");
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
  <Dialog.Content class="max-w-md sm:max-w-lg">
    <Dialog.Header>
      <Dialog.Title>{item?.id ? 'Editar Cliente' : 'Nuevo Cliente'}</Dialog.Title>
      <Dialog.Description>
        Diligencia la información de contacto de tu cliente.
      </Dialog.Description>
    </Dialog.Header>
    <form method="POST" use:enhance class="space-y-4 py-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Form.Field form={superform} name="firstName">
          {#snippet children({ constraints })}
            <Form.Control>
              {#snippet children({ props })}
                <Form.Label>Nombre</Form.Label>
                <Input {...props} {...constraints} bind:value={$form.firstName} class="h-12" />
              {/snippet}
            </Form.Control>
            <Form.FieldErrors />
          {/snippet}
        </Form.Field>
        <Form.Field form={superform} name="lastName">
          {#snippet children({ constraints })}
            <Form.Control>
              {#snippet children({ props })}
                <Form.Label>Apellido</Form.Label>
                <Input {...props} {...constraints} bind:value={$form.lastName} class="h-12" />
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
              <Form.Label>Teléfono</Form.Label>
              <Input {...props} {...constraints} type="tel" bind:value={$form.phoneNumber} class="h-12" />
            {/snippet}
          </Form.Control>
          <Form.FieldErrors />
        {/snippet}
      </Form.Field>
      <Form.Field form={superform} name="email">
        {#snippet children({ constraints })}
          <Form.Control>
            {#snippet children({ props })}
              <Form.Label>Correo Electrónico (opcional)</Form.Label>
              <Input {...props} {...constraints} type="email" bind:value={$form.email} class="h-12" />
            {/snippet}
          </Form.Control>
          <Form.FieldErrors />
        {/snippet}
      </Form.Field>

      <Dialog.Footer class="pt-4">
        <Dialog.Close class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-12 w-full sm:w-auto px-6 mt-2 sm:mt-0">
          Cancelar
        </Dialog.Close>
        <Button type="submit" disabled={isSubmitting} class="h-12 w-full sm:w-auto px-6">
          {#if isSubmitting}
            <Loader2 class="w-4 h-4 mr-2 animate-spin" />
            Guardando...
          {:else}
            Guardar
          {/if}
        </Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>
