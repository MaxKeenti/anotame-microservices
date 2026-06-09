<script lang="ts">
  import { untrack } from 'svelte';
  import * as Dialog from '$lib/components/ui/dialog';
  import * as Form from '$lib/components/ui/form';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Loader2 } from '@lucide/svelte';
  import { authService } from '$lib/services/auth.svelte';
  import { ApiError } from '$lib/services/ApiError';
  import { toast } from 'svelte-sonner';
  import { superForm, defaults, setError } from 'sveltekit-superforms';
  import { zod4 } from 'sveltekit-superforms/adapters';
  import { z } from 'zod';
  import * as m from '$lib/paraglide/messages';

  const credentialsSchema = z.object({
    currentPassword: z.string().min(1, m['credentials.zod.currentRequired']()),
    newUsername: z.string().optional().or(z.literal('')),
    newPassword: z.string().optional().or(z.literal('')),
    confirmPassword: z.string().optional().or(z.literal('')),
  }).superRefine((data, ctx) => {
    const hasNewUsername = Boolean(data.newUsername?.trim());
    const hasNewPassword = Boolean(data.newPassword);

    if (!hasNewUsername && !hasNewPassword) {
      ctx.addIssue({
        code: 'custom',
        path: ['newUsername'],
        message: m['credentials.zod.oneChangeRequired'](),
      });
    }

    if (hasNewPassword && (data.newPassword?.length ?? 0) < 6) {
      ctx.addIssue({
        code: 'custom',
        path: ['newPassword'],
        message: m['credentials.zod.minPassword'](),
      });
    }

    if (hasNewPassword && data.newPassword !== data.confirmPassword) {
      ctx.addIssue({
        code: 'custom',
        path: ['confirmPassword'],
        message: m['credentials.zod.confirmMismatch'](),
      });
    }
  });

  let {
    open = $bindable(false),
    onClose,
    onSuccess,
    id: formId = 'credentials-dialog',
  } = $props<{
    open: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    id?: string;
  }>();

  let isSubmitting = $state(false);
  let wasOpen = $state(false);

  const superform = superForm(defaults(zod4(credentialsSchema)), {
    id: untrack(() => formId),
    SPA: true,
    validators: zod4(credentialsSchema),
    async onUpdate({ form }) {
      if (!form.valid) return;

      isSubmitting = true;
      try {
        await authService.changeCredentials({
          currentPassword: form.data.currentPassword,
          newUsername: form.data.newUsername?.trim() || null,
          newPassword: form.data.newPassword || null,
        });
        toast.success(m['credentials.toast.success']());
        open = false;
        onClose();
        onSuccess?.();
      } catch (e: any) {
        if (e instanceof ApiError && e.status === 401) {
          setError(form, 'currentPassword', m['credentials.zod.currentInvalid']());
        } else if (e instanceof ApiError && e.status === 409) {
          setError(form, 'newUsername', m['credentials.zod.usernameExists']());
        } else {
          toast.error(e.message || m['credentials.toast.error']());
        }
      } finally {
        isSubmitting = false;
      }
    },
  });

  const { form, enhance, reset } = superform;

  $effect(() => {
    if (open && !wasOpen) {
      untrack(() => {
        reset();
      });
    }
    wasOpen = open;
  });

  function handleOpenChange(v: boolean) {
    open = v;
    if (!v) onClose();
  }
</script>

<Dialog.Root bind:open onOpenChange={handleOpenChange}>
  <Dialog.Content class="max-w-md">
    <Dialog.Header>
      <Dialog.Title>{m['credentials.dialog.title']()}</Dialog.Title>
      <Dialog.Description>
        {m['credentials.dialog.description']()}
      </Dialog.Description>
    </Dialog.Header>

    <form method="POST" use:enhance class="space-y-4 py-4">
      <Form.Field form={superform} name="currentPassword">
        {#snippet children({ constraints })}
          <Form.Control>
            {#snippet children({ props })}
              <Form.Label>{m['credentials.label.currentPassword']()} <span class="text-destructive">*</span></Form.Label>
              <Input
                {...props}
                {...constraints}
                id="credentials-current-password"
                type="password"
                autocomplete="current-password"
                bind:value={$form.currentPassword}
                class="h-12"
              />
            {/snippet}
          </Form.Control>
          <Form.FieldErrors />
        {/snippet}
      </Form.Field>

      <Form.Field form={superform} name="newUsername">
        {#snippet children({ constraints })}
          <Form.Control>
            {#snippet children({ props })}
              <Form.Label>{m['credentials.label.newUsername']()}</Form.Label>
              <Input
                {...props}
                {...constraints}
                id="credentials-new-username"
                type="text"
                autocomplete="username"
                placeholder={authService.user?.username || m['common.user']()}
                bind:value={$form.newUsername}
                class="h-12"
              />
            {/snippet}
          </Form.Control>
          <Form.Description>{m['credentials.hint.blankUsername']()}</Form.Description>
          <Form.FieldErrors />
        {/snippet}
      </Form.Field>

      <Form.Field form={superform} name="newPassword">
        {#snippet children({ constraints })}
          <Form.Control>
            {#snippet children({ props })}
              <Form.Label>{m['credentials.label.newPassword']()}</Form.Label>
              <Input
                {...props}
                {...constraints}
                id="credentials-new-password"
                type="password"
                autocomplete="new-password"
                bind:value={$form.newPassword}
                class="h-12"
              />
            {/snippet}
          </Form.Control>
          <Form.Description>{m['credentials.hint.passwordLength']()}</Form.Description>
          <Form.FieldErrors />
        {/snippet}
      </Form.Field>

      <Form.Field form={superform} name="confirmPassword">
        {#snippet children({ constraints })}
          <Form.Control>
            {#snippet children({ props })}
              <Form.Label>{m['credentials.label.confirmPassword']()}</Form.Label>
              <Input
                {...props}
                {...constraints}
                id="credentials-confirm-password"
                type="password"
                autocomplete="new-password"
                bind:value={$form.confirmPassword}
                class="h-12"
              />
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
            {m['credentials.button.save']()}
          {/if}
        </Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>
