<script lang="ts">
  import { page } from '$app/state';
  import LogOutIcon from '@lucide/svelte/icons/log-out';
  import { menuItems, adminOnlyItems } from '$lib/config/menu';
  import { authService } from '$lib/services/auth.svelte';
  import { Button } from '$lib/components/ui/button';
  import * as Dialog from '$lib/components/ui/dialog';
  import * as Avatar from '$lib/components/ui/avatar';
  import * as m from '$lib/paraglide/messages';

  interface Props {
    isOpen: boolean;
    onOpenProfile?: () => void;
  }

  let { isOpen = $bindable(false), onOpenProfile }: Props = $props();

  const user = $derived(authService.user);

  let sortedMenuItems = $derived([...menuItems].sort((a, b) => a.getName().localeCompare(b.getName())));

  function handleClose() {
    isOpen = false;
  }
</script>

<Dialog.Root bind:open={isOpen}>
  <Dialog.Content class="sm:max-w-5xl max-h-[90dvh] gap-0 p-0 overflow-hidden flex flex-col">
    <!-- Header -->
    <Dialog.Header class="p-6 border-b text-left">
      <Dialog.Title class="text-2xl font-bold font-heading">{m["nav.menu.title"]()}</Dialog.Title>
      <Dialog.Description class="text-muted-foreground">{m["nav.menu.subtitle"]()}</Dialog.Description>
    </Dialog.Header>

    <!-- Grid Content -->
    <div class="flex-1 overflow-y-auto p-6">
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {#each sortedMenuItems as item}
          {@const isAdmin = user?.role === 'ADMIN'}
          {@const isAllowed = adminOnlyItems.includes(item.key) ? isAdmin : true}
          {#if isAllowed}
            {@const isActive = page.url.pathname === item.href}
            {@const SvelteIcon = item.icon}
            <a
              href={item.href}
              onclick={handleClose}
              class="flex flex-col items-center justify-center gap-4 p-8 rounded-xl border-2 transition-all hover:scale-105 active:scale-95 motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:active:scale-100
                {isActive
                  ? 'border-primary bg-primary/5 text-primary shadow-sm'
                  : 'border-border bg-card hover:border-primary/50 hover:bg-secondary/50 text-muted-foreground hover:text-foreground'
                }"
            >
              <SvelteIcon class="w-12 h-12 {isActive ? 'text-primary' : 'text-muted-foreground'}" />
              <span class="text-lg font-semibold text-center">{item.getName()}</span>
            </a>
          {/if}
        {/each}
      </div>
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
