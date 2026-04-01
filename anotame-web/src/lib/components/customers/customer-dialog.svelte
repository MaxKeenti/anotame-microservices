<script lang="ts">
  import * as Dialog from '$lib/components/ui/dialog';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { apiService, API_SALES, ApiValidationError } from '$lib/services/api.svelte';
  import { toast } from 'svelte-sonner';
  import { superForm, defaults, setError } from 'sveltekit-superforms';
  import { zod4 } from 'sveltekit-superforms/adapters';
  import { z } from 'zod';

  const customerSchema = z.object({
    id: z.string().nullable().optional(),
    firstName: z.string().min(2, 'El nombre es obligatorio'),
    lastName: z.string().min(2, 'El apellido es obligatorio'),
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

  const { form, enhance, errors, reset } = superForm(defaults(zod4(customerSchema)), {
    SPA: true,
    validators: zod4(customerSchema),
    async onUpdate({ form }) {
      if (!form.valid) return;
      isSubmitting = true;
      try {
        if (form.data.id) {
          await apiService.request(`${API_SALES}/api/customers/${form.data.id}`, { method: 'PUT', body: JSON.stringify(form.data) });
        } else {
          await apiService.request(`${API_SALES}/api/customers`, { method: 'POST', body: JSON.stringify(form.data) });
        }
        
        onClose();
        onSuccess?.();
      } catch (e: any) {
        if (e instanceof ApiValidationError) {
          // Iterate through the backend errors and apply them to the form fields
          for (const [field, message] of Object.entries(e.validationErrors)) {
            // We use 'as keyof typeof form.data' to satisfy TypeScript's strict typing
            setError(form, field as keyof typeof form.data, message);
          }
          toast.error("Por favor, revisa los campos marcados en rojo.");
        } else {
          // Fallback for generic 500s or standard errors
          toast.error(e.message || "Error al guardar el cliente.");
        }
      } finally {
        isSubmitting = false;
      }
    }
  });

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
        <div class="space-y-2">
          <label for="c-firstName" class="text-sm font-medium">Nombre</label>
          <Input id="c-firstName" name="firstName" bind:value={$form.firstName} class="h-12" />
          {#if $errors.firstName}<span class="text-xs text-destructive">{$errors.firstName}</span>{/if}
        </div>
        <div class="space-y-2">
          <label for="c-lastName" class="text-sm font-medium">Apellido</label>
          <Input id="c-lastName" name="lastName" bind:value={$form.lastName} class="h-12" />
          {#if $errors.lastName}<span class="text-xs text-destructive">{$errors.lastName}</span>{/if}
        </div>
      </div>
      <div class="space-y-2">
        <label for="c-phone" class="text-sm font-medium">Teléfono</label>
        <Input id="c-phone" name="phoneNumber" type="tel" bind:value={$form.phoneNumber} class="h-12" />
        {#if $errors.phoneNumber}<span class="text-xs text-destructive">{$errors.phoneNumber}</span>{/if}
      </div>
      <div class="space-y-2">
        <label for="c-email" class="text-sm font-medium">Correo Electrónico (opcional)</label>
        <Input id="c-email" name="email" type="email" bind:value={$form.email} class="h-12" />
        {#if $errors.email}<span class="text-xs text-destructive">{$errors.email}</span>{/if}
      </div>

      <Dialog.Footer class="pt-4">
        <Dialog.Close class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-12 w-full sm:w-auto px-6 mt-2 sm:mt-0">
          Cancelar
        </Dialog.Close>
        <Button type="submit" disabled={isSubmitting} class="h-12 w-full sm:w-auto px-6">
          {isSubmitting ? 'Guardando...' : 'Guardar'}
        </Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>
