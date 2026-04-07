<script lang="ts">
  import { useGuestGuard } from '$lib/guards/index.svelte';
  import { authService } from '$lib/services/auth.svelte';
  import { apiService, API_IDENTITY } from '$lib/services/api.svelte';
  import * as Card from '$lib/components/ui/card';
  import * as Form from '$lib/components/ui/form';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Loader2 } from 'lucide-svelte';
  import { superForm, defaults, setError } from 'sveltekit-superforms';
  import { zod4 } from 'sveltekit-superforms/adapters';
  import { z } from 'zod';

  // Protect this route from authenticated users
  const guard = useGuestGuard('/dashboard');

  const registerSchema = z.object({
    firstName: z.string().min(1, 'El nombre es obligatorio'),
    lastName: z.string().min(1, 'El apellido es obligatorio'),
    email: z.string().email('Correo electrónico inválido'),
    username: z.string().min(3, 'El usuario debe tener al menos 3 caracteres'),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  });
  
  let isLoading = $state(false);
  let errorMsg = $state('');

  const superform = superForm(defaults(zod4(registerSchema)), {
    SPA: true,
    validators: zod4(registerSchema),
    async onUpdate({ form }) {
      if (!form.valid) return;
      isLoading = true;
      errorMsg = '';
      try {
        await apiService.request(`${API_IDENTITY}/auth/register`, {
          method: 'POST',
          body: JSON.stringify(form.data),
          skipAuthRedirect: true
        });
        await authService.login({ 
          username: form.data.username, 
          password: form.data.password 
        });
        window.location.href = '/dashboard';
      } catch (err: any) {
        errorMsg = "Error en el registro. Verifica que tus datos sean correctos.";
      } finally {
        isLoading = false;
      }
    }
  });

  const { form, enhance } = superform;
</script>

{#if guard.allowed}
<div class="flex min-h-screen flex-col items-center justify-center bg-muted/50 p-4">
  <Card.Root class="w-full max-w-md my-8">
    <Card.Header class="text-center space-y-2">
      <h1 class="text-3xl font-heading font-bold text-foreground">
        Anotame<span class="text-primary">.</span>
      </h1>
      <Card.Title>Crear una cuenta</Card.Title>
      <p class="text-sm text-muted-foreground">
        Ingresa tus datos para comenzar
      </p>
    </Card.Header>
    <Card.Content>
      <form method="POST" use:enhance class="space-y-4">
        {#if errorMsg}
          <div class="bg-destructive/10 text-destructive p-3 rounded-md text-sm text-center">
            {errorMsg}
          </div>
        {/if}

        <div class="grid grid-cols-2 gap-4">
          <Form.Field form={superform} name="firstName">
            {#snippet children({ constraints })}
              <Form.Control>
                {#snippet children({ props })}
                  <Form.Label>Nombre</Form.Label>
                  <Input {...props} {...constraints} id="firstName" bind:value={$form.firstName} placeholder="Juan" />
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
                  <Input {...props} {...constraints} id="lastName" bind:value={$form.lastName} placeholder="Pérez" />
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
                <Form.Label>Correo Electrónico</Form.Label>
                <Input {...props} {...constraints} id="email" type="email" bind:value={$form.email} placeholder="juan@ejemplo.com" />
              {/snippet}
            </Form.Control>
            <Form.FieldErrors />
          {/snippet}
        </Form.Field>

        <Form.Field form={superform} name="username">
          {#snippet children({ constraints })}
            <Form.Control>
              {#snippet children({ props })}
                <Form.Label>Usuario</Form.Label>
                <Input {...props} {...constraints} id="username" bind:value={$form.username} placeholder="juanperez" />
              {/snippet}
            </Form.Control>
            <Form.FieldErrors />
          {/snippet}
        </Form.Field>

        <Form.Field form={superform} name="password">
          {#snippet children({ constraints })}
            <Form.Control>
              {#snippet children({ props })}
                <Form.Label>Contraseña</Form.Label>
                <Input {...props} {...constraints} id="password" type="password" bind:value={$form.password} placeholder="••••••••" />
              {/snippet}
            </Form.Control>
            <Form.FieldErrors />
          {/snippet}
        </Form.Field>

        <Button type="submit" class="w-full mt-2" size="lg" disabled={isLoading}>
          {#if isLoading}
            <Loader2 class="w-4 h-4 mr-2 animate-spin" />
            Creando Cuenta...
          {:else}
            Registrarse
          {/if}
        </Button>

        <div class="text-center text-sm pt-2">
          <span class="text-muted-foreground">¿Ya tienes una cuenta? </span>
          <a href="/login" class="text-primary font-medium hover:underline transition-colors">
            Inicia Sesión
          </a>
        </div>

        <div class="text-center text-sm">
          <a href="/" class="text-muted-foreground hover:text-primary transition-colors">
            &larr; Volver al Inicio
          </a>
        </div>
      </form>
    </Card.Content>
  </Card.Root>
</div>
{/if}

