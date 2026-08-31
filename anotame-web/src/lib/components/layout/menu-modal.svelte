<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { page } from '$app/state';
  import XIcon from '@lucide/svelte/icons/x';
  import LogOutIcon from '@lucide/svelte/icons/log-out';
  import { menuItems, adminOnlyItems } from '$lib/config/menu';
  import { authService } from '$lib/services/auth.svelte';
  import { Button } from '$lib/components/ui/button';
  import * as m from '$lib/paraglide/messages';

  let { isOpen = $bindable(false), onOpenProfile } = $props<{
    isOpen: boolean;
    onOpenProfile?: () => void;
  }>();

  const user = $derived(authService.user);

  let sortedMenuItems = $derived([...menuItems].sort((a, b) => a.getName().localeCompare(b.getName())));

  let dialogEl = $state<HTMLElement | null>(null);

  function handleClose() {
    isOpen = false;
  }

  // Only the elements actually rendered inside the panel are reachable while
  // the menu is open; everything behind it is inert via the focus trap below.
  function focusables(): HTMLElement[] {
    if (!dialogEl) return [];
    const selector =
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    return Array.from(dialogEl.querySelectorAll<HTMLElement>(selector)).filter(
      (el) => el.offsetWidth > 0 || el.offsetHeight > 0
    );
  }

  function trapFocus(e: KeyboardEvent) {
    const els = focusables();
    if (els.length === 0) {
      e.preventDefault();
      dialogEl?.focus();
      return;
    }
    const first = els[0];
    const last = els[els.length - 1];
    const active = document.activeElement as HTMLElement | null;
    const inside = !!active && !!dialogEl && dialogEl.contains(active);

    if (e.shiftKey && (!inside || active === first)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && (!inside || active === last)) {
      e.preventDefault();
      first.focus();
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (!isOpen) return;
    if (e.key === "Escape") {
      handleClose();
    } else if (e.key === "Tab") {
      trapFocus(e);
    }
  }

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) handleClose();
  }

  onMount(() => {
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  });

  // While the menu is open, move focus into it, lock background scrolling, and
  // restore both when it closes.
  $effect(() => {
    if (!isOpen) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    tick().then(() => {
      if (isOpen) (focusables()[0] ?? dialogEl)?.focus();
    });

    return () => {
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  });
</script>

{#if isOpen}
  <div
    role="presentation"
    onclick={handleBackdropClick}
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200"
  >
    <div
      bind:this={dialogEl}
      role="dialog"
      aria-modal="true"
      aria-labelledby="menu-modal-title"
      tabindex="-1"
      class="relative w-full max-w-5xl bg-card border shadow-2xl rounded-xl overflow-hidden flex flex-col max-h-[90vh] outline-none"
    >

      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b">
        <div>
          <h2 id="menu-modal-title" class="text-2xl font-bold font-heading">{m["nav.menu.title"]()}</h2>
          <p class="text-muted-foreground">{m["nav.menu.subtitle"]()}</p>
        </div>
        <Button variant="ghost" size="icon" onclick={handleClose} class="h-12 w-12 rounded-full" aria-label={m["common.close"]()}>
          <XIcon class="h-8 w-8" />
        </Button>
      </div>

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
                class="flex flex-col items-center justify-center gap-4 p-8 rounded-xl border-2 transition-all hover:scale-105 active:scale-95
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
      <div class="p-6 border-t bg-muted/20 flex justify-between items-center">
        <div class="flex items-center gap-3">
          <div class="w-11 h-11 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg">
            {user?.username?.charAt(0).toUpperCase() || "U"}
          </div>
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
      </div>

    </div>
  </div>
{/if}
