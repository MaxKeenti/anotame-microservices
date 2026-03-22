<script lang="ts">
  import { useGuestGuard } from '$lib/guards/index.svelte';
  import { authService } from '$lib/services/auth.svelte';
  import * as Card from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';

  // Protect this route from authenticated users
  const guard = useGuestGuard('/dashboard');

  let username = $state('');
  let password = $state('');
  let isLoading = $state(false);
  let errorMsg = $state('');

  async function handleSubmit(e: Event) {
    e.preventDefault();
    isLoading = true;
    errorMsg = '';
    try {
      await authService.login({ username, password });
      window.location.href = '/dashboard';
    } catch (err: any) {
      errorMsg = "Error iniciando sesión. Verifica tus credenciales.";
    } finally {
      isLoading = false;
    }
  }
</script>

{#if guard.allowed}
<div class="flex min-h-screen flex-col items-center justify-center bg-muted/50 p-4">
  <Card.Root class="w-full max-w-md">
    <Card.Header class="text-center space-y-2">
      <h1 class="text-3xl font-heading font-bold text-foreground">
        Anotame<span class="text-primary">.</span>
      </h1>
      <Card.Title>Inicia sesión en tu cuenta</Card.Title>
      <p class="text-sm text-muted-foreground">
        Ingresa tus credenciales para acceder
      </p>
    </Card.Header>
    <Card.Content>
      <form onsubmit={handleSubmit} class="space-y-6">
        {#if errorMsg}
          <div class="bg-destructive/10 text-destructive p-3 rounded-md text-sm text-center">
            {errorMsg}
          </div>
        {/if}

        <div class="space-y-2">
            <label for="username" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Usuario
            </label>
            <Input
              id="username"
              placeholder="admin"
              bind:value={username}
              required
            />
        </div>
        <div class="space-y-2">
            <label for="password" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Contraseña
            </label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              bind:value={password}
              required
            />
        </div>

        <Button
          type="submit"
          class="w-full"
          size="lg"
          disabled={isLoading}
        >
          {isLoading ? "Iniciando..." : "Iniciar Sesión"}
        </Button>

        <div class="text-center text-sm pt-2">
          <span class="text-muted-foreground">¿No tienes cuenta? </span>
          <a href="/register" class="text-primary font-medium hover:underline transition-colors">
            Crea una aquí
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
