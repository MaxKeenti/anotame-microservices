<script lang="ts">
  import NavLink from '$lib/components/common/nav-link.svelte';
  import { page } from '$app/state';
  import LogOutIcon from '@lucide/svelte/icons/log-out';
  import { launchpad, visibleApps } from '$lib/config/apps';
  import { authService } from '$lib/services/auth.svelte';
  import { Button } from '$lib/components/ui/button';
  import * as Dialog from '$lib/components/ui/dialog';
  import { Heading, headingVariants } from '$lib/components/ui/typography';
  import * as Avatar from '$lib/components/ui/avatar';
  import * as m from '$lib/paraglide/messages';

  interface Props {
    isOpen: boolean;
    onOpenProfile?: () => void;
  }

  let { isOpen = $bindable(false), onOpenProfile }: Props = $props();

  const user = $derived(authService.user);

  const entries = $derived(visibleApps(user?.role === 'ADMIN'));
  const LaunchpadIcon = launchpad.icon;

  function handleClose() {
    isOpen = false;
  }
</script>

<Dialog.Root bind:open={isOpen}>
  <Dialog.Content class="sm:max-w-5xl max-h-[90dvh] gap-0 p-0 overflow-hidden flex flex-col">
    <!-- Header -->
    <Dialog.Header class="p-6 pr-14 border-b text-left sm:flex-row sm:items-center sm:justify-between">
      <div>
        <Dialog.Title class={headingVariants({ level: 1 })}>{m["nav.menu.title"]()}</Dialog.Title>
        <Dialog.Description class="text-muted-foreground">{m["nav.menu.subtitle"]()}</Dialog.Description>
      </div>
      <Button href={launchpad.href} variant="outline" size="touch" onclick={handleClose}>
        <LaunchpadIcon aria-hidden="true" />
        {m["nav.menu.openLaunchpad"]()}
      </Button>
    </Dialog.Header>

    <!-- Sections, grouped by the app that owns them -->
    <div class="flex-1 overflow-y-auto p-6 flex flex-col gap-8">
      {#each entries as entry (entry.app.key)}
        <section class="flex flex-col gap-4" aria-label={entry.app.getName()}>
          <Heading level={2}>{entry.app.getName()}</Heading>
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {#each entry.sections as item (item.key)}
              {@const isActive = page.url.pathname === item.href}
              {@const SvelteIcon = item.icon}
              <NavLink href={item.href} variant="tile" current={isActive} onclick={handleClose}>
                <SvelteIcon aria-hidden="true" />
                <span class="text-lg font-semibold">{item.getName()}</span>
              </NavLink>
            {/each}
          </div>
        </section>
      {/each}
    </div>

    <!-- Footer -->
    <Dialog.Footer class="p-6 border-t bg-muted/20 flex-row justify-between items-center sm:justify-between">
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
