<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import * as Dialog from '$lib/components/ui/dialog';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { apiService, API_IDENTITY, ApiValidationError } from '$lib/services/api.svelte';
  import { toast } from 'svelte-sonner';

  import { superForm, defaults, setError } from 'sveltekit-superforms';
  import { zod4 } from 'sveltekit-superforms/adapters';
  import { z } from 'zod';
  import { AdaptiveSelect } from '$lib/components/ui/responsive';

  const userSchema = z.object({
    id: z.string().nullable().optional(),
    username: z.string().optional().or(z.literal('')),
    password: z.string().optional().or(z.literal('')),
    role: z.string().default('EMPLOYEE'),
    firstName: z.string().min(1, 'El nombre es obligatorio'),
    lastName: z.string().min(1, 'El apellido es obligatorio'),
    email: z.string().email('Correo electrónico inválido'),
  });

  let { item, onClose, onSuccess } = $props<{
    item: any | null;
    onClose: () => void;
    onSuccess?: () => void;
  }>();

  const open = $derived(item !== null);
  let isSubmitting = $state(false);

  const { form, enhance, errors, reset } = superForm(defaults(zod4(userSchema)), {
    SPA: true,
    validators: zod4(userSchema),
    async onUpdate({ form }) {
      if (!form.valid) return;

      const isEdit = !!form.data.id;
      if (!isEdit) {
        if (!form.data.username) {
            setError(form, 'username', 'El nombre de usuario es obligatorio');
            return;
        }
        if (!form.data.password || form.data.password.length < 6) {
            setError(form, 'password', 'La contraseña debe tener al menos 6 caracteres');
            return;
        }
      }

      isSubmitting = true;
      try {
        if (isEdit) {
            await apiService.request(`${API_IDENTITY}/users/${form.data.id}`, {
              method: 'PUT',
              body: JSON.stringify({
                firstName: form.data.firstName,
                lastName: form.data.lastName,
                email: form.data.email,
              })
            });
            toast.success("Usuario actualizado exitosamente");
        } else {
            await apiService.request(`${API_IDENTITY}/users`, {
              method: 'POST',
              body: JSON.stringify({
                username: form.data.username,
                password: form.data.password,
                role: form.data.role || 'EMPLOYEE',
                firstName: form.data.firstName,
                lastName: form.data.lastName,
                email: form.data.email,
              })
            });
            toast.success("Usuario creado exitosamente");
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
          toast.error(e.message || "Error al actualizar el usuario.");
        }
      } finally {
        isSubmitting = false;
      }
    }
  });


  $effect(() => {
    // We only want to run this when `item` changes.
    const currentItem = item;

    untrack(() => {
      if (currentItem) {
        $form.id = currentItem.id || null;
        $form.username = currentItem.username || '';
        $form.password = '';
        $form.role = currentItem.role || 'EMPLOYEE';
        $form.firstName = currentItem.firstName || '';
        $form.lastName = currentItem.lastName || '';
        $form.email = currentItem.email || '';
      } else {
        reset();
      }
    });
  });

  function handleOpenChange(v: boolean) {
    if (!v) onClose();
  }
</script>

<Dialog.Root {open} onOpenChange={handleOpenChange}>
  <Dialog.Content class="max-w-md">
    <Dialog.Header>
      <Dialog.Title>{$form.id ? 'Editar Usuario' : 'Nuevo Usuario'}</Dialog.Title>
      <Dialog.Description>
        {$form.id ? 'Actualiza los datos del usuario.' : 'Crea un nuevo acceso al sistema.'}
      </Dialog.Description>
    </Dialog.Header>
    <form method="POST" use:enhance class="space-y-4 py-4">
      {#if $form.id}
        <!-- Username: read-only -->
        <div class="space-y-2">
          <label for="u-username" class="text-sm font-medium">Usuario</label>
          <div id="u-username" class="flex h-12 w-full items-center rounded-md border border-input bg-muted px-3 text-sm text-muted-foreground">
            {$form.username}
          </div>
        </div>
      {:else}
        <!-- Username input for creation -->
        <div class="space-y-2">
          <label for="u-username" class="text-sm font-medium">Usuario (Login) <span class="text-destructive">*</span></label>
          <Input id="u-username" name="username" bind:value={$form.username} class="h-12" />
          {#if $errors.username}<span class="text-xs text-destructive">{$errors.username}</span>{/if}
        </div>
        <!-- Password input for creation -->
        <div class="space-y-2">
          <label for="u-password" class="text-sm font-medium">Contraseña <span class="text-destructive">*</span></label>
          <Input id="u-password" name="password" type="password" bind:value={$form.password} class="h-12" />
          {#if $errors.password}<span class="text-xs text-destructive">{$errors.password}</span>{/if}
        </div>
        <!-- Role input for creation -->
        <div class="space-y-2">
          <label for="u-role" class="text-sm font-medium">Rol <span class="text-destructive">*</span></label>
          <AdaptiveSelect 
            id="u-role" 
            bind:value={$form.role} 
            items={[
                {value: 'EMPLOYEE', label: 'Empleado'},
                {value: 'ADMIN', label: 'Administrador'}
            ]}
          />
        </div>
      {/if}

      <div class="grid grid-cols-2 gap-4">
        <div class="space-y-2">
          <label for="u-firstname" class="text-sm font-medium">Nombre</label>
          <Input id="u-firstname" name="firstName" bind:value={$form.firstName} class="h-12" />
          {#if $errors.firstName}<span class="text-xs text-destructive">{$errors.firstName}</span>{/if}
        </div>
        <div class="space-y-2">
          <label for="u-lastname" class="text-sm font-medium">Apellido</label>
          <Input id="u-lastname" name="lastName" bind:value={$form.lastName} class="h-12" />
          {#if $errors.lastName}<span class="text-xs text-destructive">{$errors.lastName}</span>{/if}
        </div>
      </div>

      <div class="space-y-2">
        <label for="u-email" class="text-sm font-medium">Correo Electrónico</label>
        <Input id="u-email" name="email" type="email" bind:value={$form.email} class="h-12" />
        {#if $errors.email}<span class="text-xs text-destructive">{$errors.email}</span>{/if}
      </div>

      <Dialog.Footer class="pt-4">
        <Dialog.Close class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-12 w-full sm:w-auto px-6 mt-2 sm:mt-0">
          Cancelar
        </Dialog.Close>
        <Button type="submit" disabled={isSubmitting} class="h-12 w-full sm:w-auto px-6">
          {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>
