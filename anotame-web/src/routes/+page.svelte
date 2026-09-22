<script lang="ts">
  import { authService } from '$lib/services/auth.svelte';
  import { BrandWordmark, CenteredPage } from '$lib/components/common';
  import { Button } from '$lib/components/ui/button';
  import * as m from '$lib/paraglide/messages';
</script>

<svelte:head>
  <title>{m["common.appName"]()}</title>
  <meta name="description" content={m["landing.description"]()} />
</svelte:head>

<CenteredPage class="gap-8 text-center">
  <BrandWordmark
    text={m["landing.heading"]()}
    accent=".com"
    class="text-5xl md:text-6xl"
    tagline={m["landing.description"]()}
  />

  <div class="flex w-full max-w-sm flex-col justify-center gap-4 sm:max-w-md sm:flex-row">
    {#if !authService.loading}
      {#if authService.isAuthenticated}
        <Button size="xl" href="/dashboard" class="w-full sm:w-auto">
          {m["landing.button.dashboard"]()}
        </Button>
      {:else}
        <Button size="xl" href="/login" variant="secondary" class="w-full sm:w-auto border mt-3 sm:mt-0">
          {m["landing.button.login"]()}
        </Button>
      {/if}
    {/if}
  </div>
</CenteredPage>
