<script lang="ts">
  import { page } from '$app/state';
  import { CenteredPage, MessageCard } from '$lib/components/common';
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

<CenteredPage tone="muted" class="py-10">
  <MessageCard {title} {body} footnote={String(page.status)}>
    {#snippet icon()}
      {#if isNotFound}
        <SearchXIcon class="h-8 w-8 text-muted-foreground" />
      {:else}
        <AlertTriangleIcon class="h-8 w-8 text-muted-foreground" />
      {/if}
    {/snippet}
    {#if !isTicketLink}
      <Button href="/" size="lg" class="mt-7 w-full touch-manipulation">
        {m['error.action.home']()}
      </Button>
    {/if}
  </MessageCard>
</CenteredPage>
