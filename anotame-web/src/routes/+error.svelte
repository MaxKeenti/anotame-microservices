<script lang="ts">
  import { page } from '$app/state';
  import { BACKEND_UNAVAILABLE_ERROR } from '$lib/errors/backend-unavailable';
  import { CenteredPage, MessageCard } from '$lib/components/common';
  import { Button } from '$lib/components/ui/button';
  import * as m from '$lib/paraglide/messages';
  import AlertTriangleIcon from '@lucide/svelte/icons/alert-triangle';
  import SearchXIcon from '@lucide/svelte/icons/search-x';
  import ServerOffIcon from '@lucide/svelte/icons/server-off';

  // The public ticket routes (/t/<token>, /g/<token>) are opened by customers
  // and by the embroidery shop from a printed garment tag, so a dead link there
  // needs a plain-language explanation rather than a generic "not found".
  const isTicketLink = $derived(/^\/(t|g)\//.test(page.url.pathname));
  const isNotFound = $derived(page.status === 404);
  // Checked before the ticket-link case: a customer opening a valid link during an
  // outage must not be told their link was revoked.
  const isUnavailable = $derived(page.error?.message === BACKEND_UNAVAILABLE_ERROR);

  // Status plus the logged errorId, so a user reporting a problem can quote it.
  const footnote = $derived(
    page.error?.errorId
      ? `${page.status} · ${m['error.reference']({ errorId: page.error.errorId.slice(0, 8) })}`
      : String(page.status)
  );

  const title = $derived(
    isUnavailable
      ? m['error.unavailable.title']()
      : isTicketLink
        ? m['error.ticket.title']()
        : isNotFound
          ? m['error.notFound.title']()
          : m['error.generic.title']()
  );

  const body = $derived(
    isUnavailable
      ? m['error.unavailable.body']()
      : isTicketLink
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
  <MessageCard {title} {body} {footnote}>
    {#snippet icon()}
      {#if isUnavailable}
        <ServerOffIcon class="h-8 w-8 text-muted-foreground" />
      {:else if isNotFound}
        <SearchXIcon class="h-8 w-8 text-muted-foreground" />
      {:else}
        <AlertTriangleIcon class="h-8 w-8 text-muted-foreground" />
      {/if}
    {/snippet}
    {#if isUnavailable}
      <Button onclick={() => location.reload()} size="lg" class="mt-7 w-full">
        {m['error.action.retry']()}
      </Button>
    {:else if !isTicketLink}
      <Button href="/" size="lg" class="mt-7 w-full">
        {m['error.action.home']()}
      </Button>
    {/if}
  </MessageCard>
</CenteredPage>
