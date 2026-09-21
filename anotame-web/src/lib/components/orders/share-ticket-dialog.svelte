<script lang="ts">
  import { Text } from '$lib/components/ui/typography';
  import * as Dialog from '$lib/components/ui/dialog';
  import { Button } from '$lib/components/ui/button';
  import { apiService, API_SALES } from '$lib/services/api.svelte';
  import type { CreatedTicketShareResponse, TicketShareResponse } from '$lib/types/dtos';
  import { formatDateTime } from '$lib/utils/formatUtils';
  import { toast } from 'svelte-sonner';
  import { adaptiveConfirm } from '$lib/components/ui/responsive/confirm-state.svelte';
  import * as m from '$lib/paraglide/messages';

  let {
    open = $bindable(false),
    orderId,
    ticketNumber,
  }: {
    open?: boolean;
    orderId: string;
    ticketNumber: string;
  } = $props();

  let shares = $state<TicketShareResponse[]>([]);
  let loading = $state(false);
  let creating = $state(false);
  let revokingId = $state<string | null>(null);
  let createdShare = $state<CreatedTicketShareResponse | null>(null);
  let loadedForCurrentOpen = $state(false);

  const shareUrl = $derived(
    createdShare && typeof window !== 'undefined'
      ? new URL(`/t/${createdShare.token}`, window.location.origin).toString()
      : null,
  );

  async function loadShares() {
    loading = true;
    try {
      shares = await apiService.request<TicketShareResponse[]>(`${API_SALES}/orders/${orderId}/ticket-shares`);
    } catch (error: any) {
      toast.error(m['ticketShare.loadError'](), { description: error?.message });
    } finally {
      loading = false;
    }
  }

  async function handleOpenChange(nextOpen: boolean) {
    open = nextOpen;
  }

  // The parent opens this dialog through its bound `open` prop, which does not
  // trigger Dialog.Root's onOpenChange callback. Load on the state transition
  // so both parent-controlled and user-controlled opens show current links.
  $effect(() => {
    if (!open) {
      loadedForCurrentOpen = false;
      return;
    }
    if (!loadedForCurrentOpen) {
      loadedForCurrentOpen = true;
      void loadShares();
    }
  });

  async function createLink() {
    creating = true;
    try {
      createdShare = await apiService.request<CreatedTicketShareResponse>(
        `${API_SALES}/orders/${orderId}/ticket-shares`,
        { method: 'POST' },
      );
      await loadShares();
    } catch (error: any) {
      toast.error(m['ticketShare.createError'](), { description: error?.message });
    } finally {
      creating = false;
    }
  }

  async function copyLink() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success(m['ticketShare.copied']());
    } catch {
      toast.error(m['ticketShare.copyError']());
    }
  }

  async function shareLink() {
    if (!shareUrl) return;
    if (!navigator.share) {
      await copyLink();
      return;
    }
    try {
      await navigator.share({
        title: m['ticketShare.nativeTitle']({ ticket: ticketNumber }),
        url: shareUrl,
      });
    } catch (error: any) {
      if (error?.name !== 'AbortError') toast.error(m['ticketShare.shareError']());
    }
  }

  async function revokeLink(share: TicketShareResponse) {
    const ok = await adaptiveConfirm({
      title: m['ticketShare.revokeTitle'](),
      description: m['ticketShare.revokeDescription'](),
    });
    if (!ok) return;

    revokingId = share.id;
    try {
      await apiService.request(`${API_SALES}/orders/${orderId}/ticket-shares/${share.id}`, { method: 'DELETE' });
      if (createdShare?.id === share.id) createdShare = null;
      toast.success(m['ticketShare.revoked']());
      await loadShares();
    } catch (error: any) {
      toast.error(m['ticketShare.revokeError'](), { description: error?.message });
    } finally {
      revokingId = null;
    }
  }

  function isActive(share: TicketShareResponse) {
    return !share.revokedAt && new Date(share.expiresAt).getTime() > Date.now();
  }
</script>

<Dialog.Root bind:open onOpenChange={handleOpenChange}>
  <Dialog.Content class="max-w-md">
    <Dialog.Header>
      <Dialog.Title>{m['ticketShare.title']()}</Dialog.Title>
      <Dialog.Description>{m['ticketShare.description']()}</Dialog.Description>
    </Dialog.Header>

    <div class="space-y-4 py-2">
      <p class="rounded-lg border border-warning-border bg-warning-background p-3 text-sm text-warning-background-foreground">
        {m['ticketShare.securityNotice']()}
      </p>

      {#if shareUrl}
        <div class="space-y-2">
          <label for="ticket-share-url" class="text-sm font-medium">{m['ticketShare.linkLabel']()}</label>
          <input
            id="ticket-share-url"
            class="flex h-11 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm"
            value={shareUrl}
            readonly
            aria-label={m['ticketShare.linkLabel']()}
          />
          <Text variant="small">
            {m['ticketShare.expires']({ date: formatDateTime(createdShare?.expiresAt) })}
          </Text>
          <div class="grid grid-cols-2 gap-2">
            <Button size="touch" onclick={shareLink}>{m['ticketShare.share']()}</Button>
            <Button size="touch" onclick={copyLink} variant="outline">{m['ticketShare.copy']()}</Button>
          </div>
        </div>
      {:else}
        <Button size="touch-lg" onclick={createLink} disabled={creating} class="w-full">
          {creating ? m['ticketShare.creating']() : m['ticketShare.create']()}
        </Button>
      {/if}

      <div class="space-y-2 border-t border-border pt-4">
        <p class="text-sm font-semibold">{m['ticketShare.activeLinks']()}</p>
        {#if loading}
          <Text variant="muted">{m['ticketShare.loading']()}</Text>
        {:else if shares.length === 0}
          <Text variant="muted">{m['ticketShare.noLinks']()}</Text>
        {:else}
          <div class="space-y-2">
            {#each shares as share}
              <div class="flex items-center justify-between gap-3 rounded-lg border border-border p-3 text-sm">
                <div class="min-w-0">
                  <p class="font-medium">
                    {isActive(share) ? m['ticketShare.active']() : m['ticketShare.inactive']()}
                    <span class="ml-1 text-xs font-normal text-muted-foreground">
                      {share.scope === 'HANDLING' ? m['ticketShare.scopeHandling']() : m['ticketShare.scopeCustomer']()}
                    </span>
                  </p>
                  <Text variant="small">{m['ticketShare.expires']({ date: formatDateTime(share.expiresAt) })}</Text>
                </div>
                {#if isActive(share)}
                  <Button size="touch"
                    onclick={() => revokeLink(share)}
                    disabled={revokingId === share.id}
                    variant="destructive-outline"
                    class="shrink-0"
                  >
                    {m['ticketShare.revoke']()}
                  </Button>
                {/if}
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </Dialog.Content>
</Dialog.Root>
