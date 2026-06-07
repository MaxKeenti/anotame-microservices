<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import * as Dialog from '$lib/components/ui/dialog';
  import * as Form from '$lib/components/ui/form';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Loader2 } from 'lucide-svelte';
  import { apiService, API_IDENTITY, ApiValidationError } from '$lib/services/api.svelte';
  import { toast } from 'svelte-sonner';

  import { superForm, defaults, setError } from 'sveltekit-superforms';
  import * as m from '$lib/paraglide/messages';
  import { zod4 } from 'sveltekit-superforms/adapters';
  import { z } from 'zod';
  import { AdaptiveSelect } from '$lib/components/ui/responsive';

  const userSchema = z.object({
    id: z.string().nullable().optional(),
    username: z.string().optional().or(z.literal('')),
    password: z.string().optional().or(z.literal('')),
    role: z.string().default('EMPLOYEE'),
    firstName: z.string().min(1, m['userDialog.zod.nameRequired']()),
    lastName: z.string().min(1, m['userDialog.zod.lastNameRequired']()),
    email: z.string().email(m['userDialog.zod.emailInvalid']()),
  });

  let { item, onClose, onSuccess, id: formId = 'user-dialog' } = $props<{
    item: any | null;
    onClose: () => void;
    onSuccess?: () => void;
    id?: string;
  }>();

  const open = $derived(item !== null);
  let isSubmitting = $state(false);

  const superform = superForm(defaults(zod4(userSchema)), {
    id: untrack(() => formId),
    SPA: true,
    validators: zod4(userSchema),
    async onUpdate({ form }) {
      if (!form.valid) return;

      const isEdit = !!form.data.id;
      if (!isEdit) {
        if (!form.data.username) {
            setError(form, 'username', m['userDialog.zod.usernameRequired']());
            return;
        }
        if (!form.data.password || form.data.password.length < 6) {
            setError(form, 'password', m['userDialog.zod.minPassword']());
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
            toast.success(m['userDialog.toast.updateSuccess']());
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
            toast.success(m['userDialog.toast.createSuccess']());
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
          toast.error(e.message || m['userDialog.toast.saveError']());
        }
      } finally {
        isSubmitting = false;
      }
    }
  });

  const { form, enhance, reset } = superform;

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
      <Dialog.Title>{$form.id ? m['userDialog.title.edit']() : m['userDialog.title.new']()}</Dialog.Title>
      <Dialog.Description>
        {$form.id ? m['userDialog.description.edit']() : m['userDialog.description.new']()}
      </Dialog.Description>
    </Dialog.Header>
    <form method="POST" use:enhance class="space-y-4 py-4">
      {#if $form.id}
        <!-- Username: read-only -->
        <div class="space-y-2">
          <Form.Label>{m['common.user']()}</Form.Label>
          <div id="u-username" class="flex h-12 w-full items-center rounded-md border border-input bg-muted px-3 text-sm text-muted-foreground">
            {$form.username}
          </div>
        </div>
      {:else}
        <!-- Username input for creation -->
        <Form.Field form={superform} name="username">
          {#snippet children({ constraints })}
            <Form.Control>
              {#snippet children({ props })}
                <Form.Label>{m['userDialog.label.username']()} <span class="text-destructive">*</span></Form.Label>
                <Input {...props} {...constraints} id="u-username" bind:value={$form.username} class="h-12" />
              {/snippet}
            </Form.Control>
            <Form.FieldErrors />
          {/snippet}
        </Form.Field>

        <!-- Password input for creation -->
        <Form.Field form={superform} name="password">
          {#snippet children({ constraints })}
            <Form.Control>
              {#snippet children({ props })}
                <Form.Label>{m['userDialog.label.password']()} <span class="text-destructive">*</span></Form.Label>
                <Input {...props} {...constraints} id="u-password" type="password" bind:value={$form.password} class="h-12" />
              {/snippet}
            </Form.Control>
            <Form.FieldErrors />
          {/snippet}
        </Form.Field>

        <!-- Role input for creation -->
        <Form.Field form={superform} name="role">
          {#snippet children({ constraints })}
            <Form.Label>{m['userDialog.label.role']()} <span class="text-destructive">*</span></Form.Label>
            <AdaptiveSelect
              id="u-role"
              bind:value={$form.role}
              items={[
                  {value: 'EMPLOYEE', label: m['userDialog.role.employee']()},
                  {value: 'ADMIN', label: m['userDialog.role.admin']()}
              ]}
            />
            <Form.FieldErrors />
          {/snippet}
        </Form.Field>
      {/if}

      <div class="grid grid-cols-2 gap-4">
        <Form.Field form={superform} name="firstName">
          {#snippet children({ constraints })}
            <Form.Control>
              {#snippet children({ props })}
                <Form.Label>{m['common.firstName']()}</Form.Label>
                <Input {...props} {...constraints} id="u-firstname" bind:value={$form.firstName} class="h-12" />
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
                <Input {...props} {...constraints} id="u-lastname" bind:value={$form.lastName} class="h-12" />
              {/snippet}
            </Form.Control>
            <Form.FieldErrors />
          {/snippet}
        </Form.Field>
      </div>

      <Form.Field form={superform} name="email">
        {#snippet children({ constraints })}
          <Form.Control>
            {#snippet children({ props })}
              <Form.Label>{m['userDialog.label.email']()}</Form.Label>
              <Input {...props} {...constraints} id="u-email" type="email" bind:value={$form.email} class="h-12" />
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
            {$form.id ? m['common.saveChanges']() : m['common.save']()}
          {/if}
        </Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>

