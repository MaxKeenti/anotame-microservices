<script lang="ts">
  import { type Snippet, untrack } from 'svelte';
  import { page } from '$app/state';
  import type { LayoutData } from './$types';
  import { useAuthGuard } from '$lib/guards/index.svelte';
  import MenuModal from '$lib/components/layout/menu-modal.svelte';
  import CredentialsDialog from '$lib/components/users/credentials-dialog.svelte';
  import { paletteStore } from '$lib/stores/palette.svelte';
  import { tenantThemeStore } from '$lib/stores/tenant-theme.svelte';
  import { authService } from '$lib/services/auth.svelte';
  import * as m from '$lib/paraglide/messages';
  import { menuItems, adminOnlyItems } from '$lib/config/menu';
  import LayoutGridIcon from '@lucide/svelte/icons/layout-grid';
  import FloatingActionBar from '$lib/components/ui/FloatingActionBar.svelte';
  import { dockActionStore } from '$lib/stores/dock-action.svelte';

  let { data, children }: { data: LayoutData; children: Snippet } = $props();
  const guard = useAuthGuard('/login');

  let isMenuOpen = $state(false);
  let isCredentialsOpen = $state(false);

  const user = $derived(authService.user);

  // When a page registers a contextual action (bulk editing), the dock is
  // swapped for its action bar.
  const bulkAction = $derived(dockActionStore.current);

  let windowWidth = $state(typeof window !== 'undefined' ? window.innerWidth : 1024);

  $effect(() => {
    const handleResize = () => { windowWidth = window.innerWidth; };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  });

  let recentPaths = $state<string[]>([]);

  // Track recent paths intelligently
  $effect(() => {
    const currentPath = page.url.pathname;
    untrack(() => {
      let matchedItem = menuItems.find(m => currentPath === m.href);
      if (!matchedItem) {
        matchedItem = menuItems.find(m => currentPath.startsWith(m.href) && m.href !== '/dashboard' && m.href !== '/');
      }

      if (matchedItem) {
        const newPaths = recentPaths.filter(p => p !== matchedItem.key);
        newPaths.unshift(matchedItem.key);
        recentPaths = newPaths.slice(0, 10);
      }
    });
  });

  const isMobile = $derived(windowWidth < 640);
  const maxRecents = $derived(isMobile ? 1 : 3);

  const allAvailableItems = $derived.by(() => {
    return menuItems.filter(item => {
      if (item.showInDock === false) return false;
      const isAdmin = user?.role === 'ADMIN';
      return adminOnlyItems.includes(item.key) ? isAdmin : true;
    });
  });

  // Mobile: 3 pinned icons + 1 recent. Desktop: dynamic based on available width.
  // 64px per slot = 52px icon cell + 8px gap, plus headroom so the
  // magnification spread never pushes the dock past the viewport edge.
  const reservedWidth = $derived(32 + (maxRecents * 64) + 24 + 64);
  const maxVisibleDockItems = $derived(isMobile ? 3 : Math.max(1, Math.floor((windowWidth - reservedWidth) / 64)));

  const dockItems = $derived(allAvailableItems.slice(0, maxVisibleDockItems));

  const recentItems = $derived.by(() => {
    const visibleDockKeys = new Set(dockItems.map(i => i.key));
    const recents = recentPaths
      .map(key => menuItems.find(m => m.key === key)!)
      .filter(item => item && item.showInDock !== false && !visibleDockKeys.has(item.key));
    return recents.slice(0, maxRecents);
  });

  // macOS-style dock magnification: each icon's width follows a cosine bell
  // centered on the cursor, so neighbors swell too and push each other apart
  // while their bottoms stay anchored to the shelf. Width (not transform) is
  // animated so siblings genuinely displace, like the real dock.
  const MAGNIFY = 0.7; // extra scale at the cursor (1x -> 1.7x)
  const MAGNIFY_RANGE = 130; // px of influence to each side of the cursor
  let dockEl = $state<HTMLElement | undefined>(undefined);
  let magnifyRaf = 0;

  function magnifyDock(e: PointerEvent) {
    if (e.pointerType !== 'mouse' || !dockEl) return;
    const x = e.clientX;
    cancelAnimationFrame(magnifyRaf);
    magnifyRaf = requestAnimationFrame(() => {
      if (!dockEl) return;
      for (const el of dockEl.querySelectorAll<HTMLElement>('[data-dock-icon]')) {
        const rect = el.getBoundingClientRect();
        const t = Math.min(Math.abs(x - rect.left - rect.width / 2) / MAGNIFY_RANGE, 1);
        const scale = 1 + MAGNIFY * Math.cos((t * Math.PI) / 2) ** 2;
        el.style.setProperty('--scale', scale.toFixed(3));
      }
    });
  }

  function resetDockMagnify() {
    cancelAnimationFrame(magnifyRaf);
    if (!dockEl) return;
    for (const el of dockEl.querySelectorAll<HTMLElement>('[data-dock-icon]')) {
      el.style.removeProperty('--scale');
    }
  }

  $effect(() => () => cancelAnimationFrame(magnifyRaf));

  // Initialize store with server-loaded theme during hydration
  // We use untrack to avoid dependency tracking on the store itself, preventing hydration loops
  $effect.pre(() => {
    if (data.establishmentTheme) {
      untrack(() => {
        tenantThemeStore.set(data.establishmentTheme);
      });
    }
  });

  // Unified CSS variable injection (User palette + Tenant theme)
  // Tenant theme primaryColor takes priority over user palette primary
  $effect(() => {
    const palette = paletteStore.current;
    const theme = tenantThemeStore.current;
    const el = document.documentElement;

    const primary = theme.primaryColor || palette.primary;

    const vars: Array<[string, string | null]> = [
      ['--primary', primary],
      ['--accent', palette.accent],
      ['--destructive', palette.destructive],
    ];

    for (const [prop, value] of vars) {
      if (value) {
        el.style.setProperty(prop, value);
      } else {
        el.style.removeProperty(prop);
      }
    }

    // Font family injection
    if (theme.fontFamily) {
      const fontMap = {
        'Inter': "'Inter Variable', sans-serif",
        'Outfit': "'Outfit Variable', sans-serif",
        'Merriweather': "'Merriweather Variable', serif",
      };
      el.style.setProperty('--font-sans', fontMap[theme.fontFamily]);
    } else {
      el.style.removeProperty('--font-sans');
    }
  });
</script>

{#if guard.checking}
  <div class="h-screen w-screen flex flex-col items-center justify-center bg-background text-muted-foreground gap-4">
    <!-- Inline simple spinner and text, relying on standard tailwind utility classes -->
    <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
    <p class="text-sm font-medium">{m["layout.validatingSession"]()}</p>
  </div>
{:else if guard.allowed}
  <!-- The authenticated shell with global touch-first UI rules -->
  <div class="flex flex-col h-dvh bg-background text-foreground overflow-hidden">

      <MenuModal bind:isOpen={isMenuOpen} onOpenProfile={() => { isMenuOpen = false; isCredentialsOpen = true; }} />

      <CredentialsDialog
        bind:open={isCredentialsOpen}
        id="credentials-edit"
        onClose={() => { isCredentialsOpen = false; }}
      />

      <!-- The bottom padding lives on an inner wrapper, not the scroll
           container: Safari ignores padding-bottom on the scroller itself,
           which let fully-scrolled content hide under the floating dock.
           `flex flex-col min-h-full` makes the wrapper at least a full
           viewport tall so full-height pages (e.g. the order wizard, whose
           footer is pinned with mt-auto) fill via flex instead of h-full —
           that keeps the pb-28 clearance honored so their bottom action bar
           ends up safely above the dock instead of overflowing under it. -->
      <main class="flex-1 w-full overflow-y-auto">
        <div class="flex flex-col min-h-full w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8 pb-28">
          {@render children()}
        </div>
      </main>

      <!-- Bottom Dock: floats over content like the macOS dock. While a page
           registers a bulk action (e.g. orders selection) it swaps the dock
           for that action bar, keeping the user on the page until done. -->
      <div class="fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-3 pointer-events-none">
        {#if bulkAction}
          <FloatingActionBar
            count={bulkAction.count}
            isAdmin={bulkAction.isAdmin}
            allDraft={bulkAction.allDraft}
            onChangeStatus={bulkAction.onChangeStatus}
            onDelete={bulkAction.onDelete}
            onCancel={bulkAction.onCancel}
          />
        {:else}
        <nav
          bind:this={dockEl}
          onpointermove={magnifyDock}
          onpointerleave={resetDockMagnify}
          aria-label={m["layout.menuButton"]()}
          class="pointer-events-auto flex h-16 sm:h-18 items-end gap-2 px-3.5 pb-2.5 max-w-[calc(100vw-2rem)] rounded-3xl bg-background/40 backdrop-blur-2xl backdrop-saturate-150 border border-border/40 shadow-2xl shadow-black/15"
        >
          {#snippet dockIconWrapper(item: any)}
            {@const Icon = item.icon}
            {@const active = page.url.pathname.startsWith(item.href)}
            <a
              data-dock-icon
              href={item.href}
              aria-label={item.getName()}
              class="group relative flex w-[calc(var(--scale,1)*44px)] sm:w-[calc(var(--scale,1)*52px)] shrink-0 flex-col items-center justify-end outline-none transition-[width] duration-150 ease-out will-change-[width]"
            >
              <!-- macOS-style name label above the magnified icon -->
              <span
                aria-hidden="true"
                class="pointer-events-none absolute bottom-full left-1/2 mb-2.5 -translate-x-1/2 scale-90 whitespace-nowrap rounded-lg border border-border/50 bg-popover/90 px-2.5 py-1 text-xs font-medium text-popover-foreground shadow-lg opacity-0 transition-all duration-150 group-hover:scale-100 group-hover:opacity-100"
              >
                {item.getName()}
                <span class="absolute left-1/2 top-full -mt-1 size-2 -translate-x-1/2 rotate-45 rounded-[2px] border-b border-r border-border/50 bg-popover/90"></span>
              </span>
              <div class="flex aspect-square w-full items-center justify-center rounded-[22%] border transition-shadow group-hover:shadow-md group-active:brightness-90 group-focus-visible:ring-2 group-focus-visible:ring-ring {active ? 'bg-linear-to-b from-primary to-primary/85 border-primary/50 shadow-md' : 'bg-linear-to-b from-card to-muted border-border/50 shadow-sm'}">
                <Icon class="size-1/2 {active ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground'}" />
              </div>
              {#if active}
                <!-- Running-app dot, neutral like macOS -->
                <span class="absolute -bottom-[5px] left-1/2 size-1 -translate-x-1/2 rounded-full bg-foreground/60"></span>
              {/if}
            </a>
          {/snippet}

          {#each dockItems as item (item.key)}
            {@render dockIconWrapper(item)}
          {/each}

          {#if recentItems.length > 0}
            <div class="w-px h-8 sm:h-9 shrink-0 self-center bg-border/60"></div>
            {#each recentItems as item (item.key)}
              {@render dockIconWrapper(item)}
            {/each}
          {/if}

          <div class="w-px h-8 sm:h-9 shrink-0 self-center bg-border/60"></div>

          <!-- Full Menu Button -->
          <button
            data-dock-icon
            onclick={() => isMenuOpen = true}
            aria-label={m["layout.menuButton"]()}
            class="group relative flex w-[calc(var(--scale,1)*44px)] sm:w-[calc(var(--scale,1)*52px)] shrink-0 flex-col items-center justify-end outline-none transition-[width] duration-150 ease-out will-change-[width]"
          >
            <span
              aria-hidden="true"
              class="pointer-events-none absolute bottom-full left-1/2 mb-2.5 -translate-x-1/2 scale-90 whitespace-nowrap rounded-lg border border-border/50 bg-popover/90 px-2.5 py-1 text-xs font-medium text-popover-foreground shadow-lg opacity-0 transition-all duration-150 group-hover:scale-100 group-hover:opacity-100"
            >
              {m["layout.menuButton"]()}
              <span class="absolute left-1/2 top-full -mt-1 size-2 -translate-x-1/2 rotate-45 rounded-[2px] border-b border-r border-border/50 bg-popover/90"></span>
            </span>
            <div class="flex aspect-square w-full items-center justify-center rounded-[22%] bg-linear-to-b from-card to-muted shadow-sm border border-border/50 transition-shadow group-hover:shadow-md group-active:brightness-90 group-focus-visible:ring-2 group-focus-visible:ring-ring">
              <LayoutGridIcon class="size-1/2 text-muted-foreground group-hover:text-foreground" />
            </div>
          </button>
        </nav>
        {/if}
      </div>

  </div>
{/if}
