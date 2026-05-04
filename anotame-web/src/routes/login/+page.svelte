<script lang="ts">
  import { useGuestGuard } from '$lib/guards/index.svelte';
  import { authService } from '$lib/services/auth.svelte';
  import * as Card from '$lib/components/ui/card';
  import * as Form from '$lib/components/ui/form';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Loader2 } from 'lucide-svelte';
  import { superForm, defaults, setError } from 'sveltekit-superforms';
  import { zod4 } from 'sveltekit-superforms/adapters';
  import { z } from 'zod';
  import * as m from '$lib/paraglide/messages';

  const guard = useGuestGuard('/dashboard');

  const loginSchema = z.object({
    username: z.string().min(1, m["login.zod.usernameRequired"]()),
    password: z.string().min(1, m["login.zod.passwordRequired"]()),
  });

  let isLoading = $state(false);
  let errorMsg = $state('');

  const superform = superForm(defaults(zod4(loginSchema)), {
    id: 'login-form',
    SPA: true,
    validators: zod4(loginSchema),
    async onUpdate({ form }) {
      if (!form.valid) return;
      isLoading = true;
      errorMsg = '';
      try {
        await authService.login({
          username: form.data.username,
          password: form.data.password
        });
        window.location.href = '/dashboard';
      } catch (err: any) {
        errorMsg = m["login.error.invalidCredentials"]();
      } finally {
        isLoading = false;
      }
    }
  });

  const { form, enhance } = superform;
</script>

{#if guard.allowed}
<div class="flex min-h-screen flex-col items-center justify-center bg-muted/50 p-4">
  <Card.Root class="w-full max-w-md">
    <Card.Header class="text-center space-y-2">
      <h1 class="text-3xl font-heading font-bold text-foreground">
        {m["login.title"]()}<span class="text-primary">.</span>
      </h1>
      <Card.Title>{m["login.card.title"]()}</Card.Title>
      <p class="text-sm text-muted-foreground">
        {m["login.card.subtitle"]()}
      </p>
    </Card.Header>
    <Card.Content>
      <form method="POST" use:enhance class="space-y-6">
        {#if errorMsg}
          <div class="bg-destructive/10 text-destructive p-3 rounded-md text-sm text-center">
            {errorMsg}
          </div>
        {/if}

        <Form.Field form={superform} name="username">
          {#snippet children({ constraints })}
            <Form.Control>
              {#snippet children({ props })}
                <Form.Label>{m["login.label.username"]()}</Form.Label>
                <Input {...props} {...constraints} id="username" placeholder="admin" bind:value={$form.username} />
              {/snippet}
            </Form.Control>
            <Form.FieldErrors />
          {/snippet}
        </Form.Field>

        <Form.Field form={superform} name="password">
          {#snippet children({ constraints })}
            <Form.Control>
              {#snippet children({ props })}
                <Form.Label>{m["login.label.password"]()}</Form.Label>
                <Input {...props} {...constraints} id="password" type="password" placeholder="••••••••" bind:value={$form.password} />
              {/snippet}
            </Form.Control>
            <Form.FieldErrors />
          {/snippet}
        </Form.Field>

        <Button
          type="submit"
          class="w-full"
          size="lg"
          disabled={isLoading}
        >
          {#if isLoading}
            <Loader2 class="w-4 h-4 mr-2 animate-spin" />
            {m["login.button.loading"]()}
          {:else}
            {m["login.button.submit"]()}
          {/if}
        </Button>

        <div class="text-center text-sm pt-4">
          <a href="/" class="text-muted-foreground hover:text-primary transition-colors">
            {m["login.link.back"]()}
          </a>
        </div>
      </form>
    </Card.Content>
  </Card.Root>
</div>
{/if}
