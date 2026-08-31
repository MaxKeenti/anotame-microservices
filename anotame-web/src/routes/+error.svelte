<script lang="ts">
  import { page } from '$app/state';
  import { Button } from '$lib/components/ui/button';
  import * as m from '$lib/paraglide/messages';
  import AlertTriangleIcon from '@lucide/svelte/icons/alert-triangle';
  import SearchXIcon from '@lucide/svelte/icons/search-x';

  // The public ticket routes (/t/<token>, /g/<token>) are opened by customers
  // and by the embroidery shop from a printed garment tag, so a dead link there
  // needs a plain-language explanation rather than a generic "not found".
  const isTicketLink = $derived(/^\/(t|g)\//.test(page.url.pathname));
  const isNotFound = $derived(page.status === 404);

  const title = $derived(
    isTicketLink
      ? m['error.ticket.title']()
      : isNotFound
        ? m['error.notFound.title']()
        : m['error.generic.title']()
  );

  const body = $derived(
    isTicketLink
      ? m['error.ticket.body']()
      : isNotFound
        ? m['error.notFound.body']()
        : m['error.generic.body']()
  );
</script>

<svelte:head>
  <title>{title} · {m['common.appName']()}</title>
  <meta name="robots" content="noindex,nofollow" />
</svelte:head>

<main class="flex min-h-dvh flex-col items-center justify-center bg-muted/40 px-4 py-10">
  <div class="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
    <div class="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
      {#if isNotFound}
        <SearchXIcon class="h-8 w-8 text-muted-foreground" />
      {:else}
        <AlertTriangleIcon class="h-8 w-8 text-muted-foreground" />
      {/if}
    </div>

    <h1 class="font-heading text-2xl font-bold text-foreground">{title}</h1>
    <p class="mt-3 text-sm text-muted-foreground">{body}</p>

    {#if !isTicketLink}
      <Button href="/" size="lg" class="mt-7 w-full touch-manipulation">
        {m['error.action.home']()}
      </Button>
    {/if}

    <p class="mt-6 font-mono text-xs text-muted-foreground/70">{page.status}</p>
  </div>
</main>
