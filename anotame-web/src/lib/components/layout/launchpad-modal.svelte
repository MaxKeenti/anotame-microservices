<script lang="ts">
  import LogOutIcon from '@lucide/svelte/icons/log-out';
  import { launchpad, openHref, visibleApps } from '$lib/config/apps';
  import { authService } from '$lib/services/auth.svelte';
  import { appSessionStore } from '$lib/stores/app-session.svelte';
  import { launchpadStore } from '$lib/stores/launchpad.svelte';
  import LaunchpadTile from '$lib/components/dashboard/launchpad-tile.svelte';
  import { Button } from '$lib/components/ui/button';
  import * as Dialog from '$lib/components/ui/dialog';
  import { headingVariants } from '$lib/components/ui/typography';
  import * as Avatar from '$lib/components/ui/avatar';
  import * as m from '$lib/paraglide/messages';

  /** Overlay grid of every app the user can open, plus their account actions. */
  interface Props {
    /** Opens the credentials dialog for the signed-in user. */
    onOpenProfile?: () => void;
  }

  let { onOpenProfile }: Props = $props();

  const user = $derived(authService.user);
  const entries = $derived(visibleApps(user?.role === 'ADMIN'));
  const LaunchpadIcon = launchpad.icon;

  function handleClose() {
    launchpadStore.open = false;
  }
</script>

<Dialog.Root bind:open={launchpadStore.open}>
  <Dialog.Content class="sm:max-w-5xl max-h-[90dvh] gap-0 p-0 overflow-hidden flex flex-col">
    <!-- Header -->
    <Dialog.Header class="p-4 pr-14 border-b text-left sm:p-6">
      <Dialog.Title class="{headingVariants({ level: 1 })} flex items-center gap-3">
        <LaunchpadIcon class="size-8 shrink-0 text-primary" aria-hidden="true" />
        {launchpad.getName()}
      </Dialog.Title>
      <Dialog.Description class="text-muted-foreground">{m["launchpad.dialog.description"]()}</Dialog.Description>
    </Dialog.Header>

    <!-- Apps, each opening on its last-visited section -->
    <div class="flex-1 overflow-y-auto p-4 sm:p-6">
      <div class="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6">
        {#each entries as entry (entry.app.key)}
          <LaunchpadTile
            {entry}
            href={openHref(entry, appSessionStore.lastSection[entry.app.key])}
            onclick={handleClose}
          />
        {/each}
      </div>
    </div>

    <!-- Footer -->
    <Dialog.Footer class="p-4 border-t bg-muted/20 flex-row flex-wrap gap-3 justify-between items-center sm:p-6 sm:justify-between">
      <div class="flex items-center gap-3">
        <Avatar.Root class="size-11">
          <Avatar.Fallback class="bg-primary/20 text-primary font-bold text-lg">
            {user?.username?.charAt(0).toUpperCase() || "U"}
          </Avatar.Fallback>
        </Avatar.Root>
        <div>
          <div class="font-semibold">{user?.username || m["common.user"]()}</div>
          <Button
            variant="ghost"
            class="h-auto p-0 text-xs text-muted-foreground hover:text-primary underline"
            onclick={() => { handleClose(); onOpenProfile?.(); }}
          >
            {m["nav.menu.editCredentials"]()}
          </Button>
        </div>
      </div>

      <Button
        variant="destructive"
        size="lg"
        onclick={() => authService.logout()}
        class="gap-2"
      >
        <LogOutIcon class="w-5 h-5" />
        <span>{m["nav.menu.logout"]()}</span>
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
