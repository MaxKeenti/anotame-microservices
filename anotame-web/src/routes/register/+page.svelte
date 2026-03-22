<script lang="ts">
  import { useGuestGuard } from '$lib/guards/index.svelte';
  import { authService } from '$lib/services/auth.svelte';
  import { apiService, API_IDENTITY } from '$lib/services/api.svelte';
  import * as Card from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';

  // Protect this route from authenticated users
  const guard = useGuestGuard('/dashboard');

  let formData = $state({
    firstName: "",
    lastName: "",
    email: "",
    username: "",
    password: ""
  });
  
  let isLoading = $state(false);
  let errorMsg = $state('');

  async function handleSubmit(e: Event) {
    e.preventDefault();
    isLoading = true;
    errorMsg = '';
    try {
      // Simulate useAuth().register by calling identity service creation
      await apiService.request(`${API_IDENTITY}/auth/register`, {
        method: 'POST',
        body: JSON.stringify(formData),
        skipAuthRedirect: true
      });
      // Optionally auto-login
      await authService.login({ username: formData.username, password: formData.password });
      window.location.href = '/dashboard';
    } catch (err: any) {
      errorMsg = "Error en el registro. Verifica que tus datos sean correctos.";
    } finally {
      isLoading = false;
    }
  }
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
      <form onsubmit={handleSubmit} class="space-y-4">
        {#if errorMsg}
          <div class="bg-destructive/10 text-destructive p-3 rounded-md text-sm text-center">
            {errorMsg}
          </div>
        {/if}

        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <label for="firstName" class="text-sm font-medium leading-none">Nombre</label>
            <Input id="firstName" bind:value={formData.firstName} placeholder="Juan" required />
          </div>
          <div class="space-y-2">
            <label for="lastName" class="text-sm font-medium leading-none">Apellido</label>
            <Input id="lastName" bind:value={formData.lastName} placeholder="Pérez" required />
          </div>
        </div>

        <div class="space-y-2">
          <label for="email" class="text-sm font-medium leading-none">Correo Electrónico</label>
          <Input id="email" type="email" bind:value={formData.email} placeholder="juan@ejemplo.com" required />
        </div>

        <div class="space-y-2">
          <label for="username" class="text-sm font-medium leading-none">Usuario</label>
          <Input id="username" bind:value={formData.username} placeholder="juanperez" required />
        </div>

        <div class="space-y-2">
          <label for="password" class="text-sm font-medium leading-none">Contraseña</label>
          <Input id="password" type="password" bind:value={formData.password} placeholder="••••••••" required />
        </div>

        <Button type="submit" class="w-full mt-2" size="lg" disabled={isLoading}>
          {isLoading ? "Creando Cuenta..." : "Registrarse"}
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
