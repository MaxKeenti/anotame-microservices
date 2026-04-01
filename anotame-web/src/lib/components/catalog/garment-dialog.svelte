<script lang="ts">
  import * as Dialog from '$lib/components/ui/dialog';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { apiService, API_CATALOG, ApiValidationError } from '$lib/services/api.svelte';
  import { toast } from 'svelte-sonner';
  
  import { superForm, defaults, setError } from 'sveltekit-superforms';
  import { zod4 } from 'sveltekit-superforms/adapters';
  import { z } from 'zod';

  const garmentSchema = z.object({
    id: z.string().nullable().optional(),
    name: z.string().min(2, 'El nombre es obligatorio'),
    description: z.string().optional().or(z.literal(''))
  });

  let { item, onClose, onSuccess } = $props<{
    item: any | null;
    onClose: () => void;
    onSuccess?: () => void;
  }>();

  const open = $derived(item !== null);
  let isSubmitting = $state(false);

  const { form, enhance, errors, reset } = superForm(defaults(zod4(garmentSchema)), {
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
          toast.success("Prenda actualizada exitosamente");
        } else {
          await apiService.request(`${API_CATALOG}/catalog/garments`, {
            method: 'POST',
            body: JSON.stringify(form.data)
          });
          toast.success("Prenda creada exitosamente");
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
          toast.error(e.message || "Error al guardar la prenda.");
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
      <Dialog.Title>{item?.id ? 'Editar Prenda' : 'Nueva Prenda'}</Dialog.Title>
      <Dialog.Description>
        Configura los detalles del tipo de prenda.
      </Dialog.Description>
    </Dialog.Header>
    <form method="POST" use:enhance class="space-y-4 py-4">
      <div class="space-y-2">
        <label for="g-name" class="text-sm font-medium">Nombre</label>
        <Input id="g-name" name="name" placeholder="Ej. Pantalón de Mezclilla" bind:value={$form.name} class="h-12" />
        {#if $errors.name}<span class="text-xs text-destructive">{$errors.name}</span>{/if}
      </div>
      
      <div class="space-y-2">
        <label for="g-desc" class="text-sm font-medium">Descripción</label>
        <Input id="g-desc" name="description" placeholder="Opcional" bind:value={$form.description} class="h-12" />
        {#if $errors.description}<span class="text-xs text-destructive">{$errors.description}</span>{/if}
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