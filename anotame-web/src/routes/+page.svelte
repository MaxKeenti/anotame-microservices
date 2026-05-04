<script lang="ts">
  import { authService } from '$lib/services/auth.svelte';
  import { Button } from '$lib/components/ui/button';
  import * as m from '$lib/paraglide/messages';
</script>

<div class="flex flex-col items-center justify-center min-h-screen bg-background">
  <main class="flex flex-col items-center gap-8 text-center px-4 w-full">
    <h1 class="text-5xl md:text-6xl font-heading font-bold text-foreground">
      {m["landing.heading"]()}<span class="text-primary">.com</span>
    </h1>
    <p class="text-xl text-muted-foreground max-w-md">
      {m["landing.description"]()}
    </p>

    <div class="flex flex-col sm:flex-row gap-4 mt-8 w-full max-w-sm sm:max-w-md justify-center">
      {#if !authService.loading}
        {#if authService.isAuthenticated}
          <Button href="/dashboard" class="w-full sm:w-auto h-14 px-8 text-lg rounded-xl touch-manipulation">
            {m["landing.button.dashboard"]()}
          </Button>
        {:else}
          <Button href="/login" variant="secondary" class="w-full sm:w-auto h-14 px-8 text-lg rounded-xl touch-manipulation border mt-3 sm:mt-0">
            {m["landing.button.login"]()}
          </Button>
        {/if}
      {/if}
    </div>
  </main>
</div>
