<script lang="ts">
  import * as Dialog from '$lib/components/ui/dialog';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { apiService, API_SALES } from '$lib/services/api.svelte';
  
  // In a full implementation, you'd use superForm(defaults(zod4(schema))) here as defined in CLAUDE.md.
  // For immediate mock-up migration, we bind native $state closely simulating it.

  let { item, onClose, onSuccess } = $props<{
    item: any | null;
    onClose: () => void;
    onSuccess?: () => void;
  }>();

  // Derived open state
  const open = $derived(item !== null);

  // Form State
  let formData = $state({
      id: null,
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: ''
  });
  let isSubmitting = $state(false);

  // Sync state cleanly when an item is selected
  $effect(() => {
    if (item) {
      formData = {
        id: item.id || null,
        firstName: item.firstName || '',
        lastName: item.lastName || '',
        email: item.email || '',
        phoneNumber: item.phoneNumber || ''
      };
    }
  });

  async function handleSubmit(e: Event) {
    e.preventDefault();
    isSubmitting = true;
    try {
      if (formData.id) {
        await apiService.request(`${API_SALES}/customers/${formData.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
      } else {
        await apiService.request(`${API_SALES}/customers`, {
          method: 'POST',
          body: JSON.stringify(formData)
        });
      }
      onClose();
      onSuccess?.();
    } catch {
      alert("Error guardando el cliente.");
    } finally {
      isSubmitting = false;
    }
  }

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
    <form onsubmit={handleSubmit} class="space-y-4 py-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="space-y-2">
          <label for="c-firstName" class="text-sm font-medium">Nombre</label>
          <Input id="c-firstName" bind:value={formData.firstName} required class="h-12" />
        </div>
        <div class="space-y-2">
          <label for="c-lastName" class="text-sm font-medium">Apellido</label>
          <Input id="c-lastName" bind:value={formData.lastName} required class="h-12" />
        </div>
      </div>
      <div class="space-y-2">
        <label for="c-phone" class="text-sm font-medium">Teléfono</label>
        <Input id="c-phone" type="tel" bind:value={formData.phoneNumber} required class="h-12" />
      </div>
      <div class="space-y-2">
        <label for="c-email" class="text-sm font-medium">Correo Electrónico (opcional)</label>
        <Input id="c-email" type="email" bind:value={formData.email} class="h-12" />
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
