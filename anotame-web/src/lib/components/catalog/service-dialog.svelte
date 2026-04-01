<script lang="ts">
  import * as Dialog from '$lib/components/ui/dialog';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { AdaptiveSelect } from '$lib/components/ui/responsive';
  import { apiService, API_CATALOG, ApiValidationError } from '$lib/services/api.svelte';
  import { toast } from 'svelte-sonner';

  import { superForm, defaults, setError } from 'sveltekit-superforms';
  import { zod4 } from 'sveltekit-superforms/adapters';
  import { z } from 'zod';

  const serviceSchema = z.object({
    id: z.string().nullable().optional(),
    name: z.string().min(2, 'El nombre es obligatorio'),
    description: z.string().optional().or(z.literal('')),
    basePrice: z.number().min(0, 'El precio debe ser mayor o igual a 0'),
    defaultDurationMin: z.number().min(1, 'La duración mínima es 1 minuto'),
    garmentTypeId: z.string().min(1, 'Selecciona una prenda'),
  });

  let { item, garments = [], onClose, onSuccess } = $props<{
    item: any | null;
    garments?: any[];
    onClose: () => void;
    onSuccess?: () => void;
  }>();

  const open = $derived(item !== null);
  let isSubmitting = $state(false);

  const garmentItems = $derived(
    garments.map((g: any) => ({ value: g.id, label: g.name }))
  );

  const { form, enhance, errors, reset } = superForm(defaults(zod4(serviceSchema)), {
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
          toast.success("Servicio actualizado exitosamente");
        } else {
          await apiService.request(`${API_CATALOG}/catalog/services`, {
            method: 'POST',
            body: JSON.stringify(payload)
          });
          toast.success("Servicio creado exitosamente");
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
          toast.error(e.message || "Error al guardar el servicio.");
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
      <Dialog.Title>{item?.id ? 'Editar Servicio' : 'Nuevo Servicio'}</Dialog.Title>
      <Dialog.Description>
        Configura los detalles del servicio ofrecido.
      </Dialog.Description>
    </Dialog.Header>
    <form method="POST" use:enhance class="space-y-4 py-4">
      <div class="space-y-2">
        <label for="s-garment" class="text-sm font-medium">Prenda Asociada</label>
        <AdaptiveSelect
          id="s-garment"
          bind:value={$form.garmentTypeId}
          placeholder="Seleccionar prenda..."
          items={garmentItems}
        />
        {#if $errors.garmentTypeId}<span class="text-xs text-destructive">{$errors.garmentTypeId}</span>{/if}
      </div>

      <div class="space-y-2">
        <label for="s-name" class="text-sm font-medium">Nombre del Servicio</label>
        <Input id="s-name" name="name" placeholder="Ej. Bastilla, Ajuste de Cintura" bind:value={$form.name} class="h-12" />
        {#if $errors.name}<span class="text-xs text-destructive">{$errors.name}</span>{/if}
      </div>

      <div class="space-y-2">
        <label for="s-desc" class="text-sm font-medium">Descripción</label>
        <Input id="s-desc" name="description" placeholder="Detalles adicionales (opcional)" bind:value={$form.description} class="h-12" />
        {#if $errors.description}<span class="text-xs text-destructive">{$errors.description}</span>{/if}
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="space-y-2">
          <label for="s-price" class="text-sm font-medium">Precio Base ($)</label>
          <Input id="s-price" name="basePrice" type="number" step="0.01" min="0" placeholder="0.00" bind:value={$form.basePrice} class="h-12" />
          {#if $errors.basePrice}<span class="text-xs text-destructive">{$errors.basePrice}</span>{/if}
        </div>
        <div class="space-y-2">
          <label for="s-duration" class="text-sm font-medium">Duración (min)</label>
          <Input id="s-duration" name="defaultDurationMin" type="number" min="1" placeholder="30" bind:value={$form.defaultDurationMin} class="h-12" />
          {#if $errors.defaultDurationMin}<span class="text-xs text-destructive">{$errors.defaultDurationMin}</span>{/if}
        </div>
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
