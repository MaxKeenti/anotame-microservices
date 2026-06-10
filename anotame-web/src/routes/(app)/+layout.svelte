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
  const reservedWidth = $derived(24 + (maxRecents * 56) + 20 + 56);
  const maxVisibleDockItems = $derived(isMobile ? 3 : Math.max(1, Math.floor((windowWidth - reservedWidth) / 56)));

  const dockItems = $derived(allAvailableItems.slice(0, maxVisibleDockItems));

  const recentItems = $derived.by(() => {
    const visibleDockKeys = new Set(dockItems.map(i => i.key));
    const recents = recentPaths
      .map(key => menuItems.find(m => m.key === key)!)
      .filter(item => item && item.showInDock !== false && !visibleDockKeys.has(item.key));
    return recents.slice(0, maxRecents);
  });

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

      <!-- pb leaves room for the floating dock so content scrolls clear of it -->
      <main class="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8 pb-28 overflow-y-auto">
        {@render children()}
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
        <div class="pointer-events-auto flex items-center justify-center gap-1.5 px-2.5 py-1.5 max-w-[calc(100vw-2rem)] rounded-full bg-background/60 backdrop-blur-xl border border-border/50 shadow-2xl overflow-x-auto no-scrollbar">
          {#snippet dockIconWrapper(item: any)}
            {@const Icon = item.icon}
            <a
              href={item.href}
              class="relative group flex items-center justify-center w-13 h-13 transition-all duration-300 origin-bottom hover:scale-125 hover:-translate-y-3"
              title={item.getName()}
            >
              <div class="w-11 h-11 flex items-center justify-center rounded-2xl bg-linear-to-b from-card to-muted shadow-sm border border-border/50 transition-all group-hover:shadow-md {page.url.pathname.startsWith(item.href) ? 'ring-2 ring-primary/50' : ''}">
                <Icon class="w-6 h-6 {page.url.pathname.startsWith(item.href) ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}" />
              </div>
              {#if page.url.pathname.startsWith(item.href)}
                <div class="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary"></div>
              {/if}
            </a>
          {/snippet}

          {#each dockItems as item (item.key)}
            {@render dockIconWrapper(item)}
          {/each}
          
          {#if recentItems.length > 0}
            <div class="w-px h-8 bg-border/50 mx-1"></div>
            {#each recentItems as item (item.key)}
              {@render dockIconWrapper(item)}
            {/each}
          {/if}

          <div class="w-px h-8 bg-border/50 mx-1"></div>

          <!-- Full Menu Button -->
          <button
            onclick={() => isMenuOpen = true}
            class="relative group flex items-center justify-center w-13 h-13 transition-all duration-300 origin-bottom hover:scale-125 hover:-translate-y-3"
            title={m["layout.menuButton"]()}
          >
            <div class="w-11 h-11 flex items-center justify-center rounded-2xl bg-linear-to-b from-card to-muted shadow-sm border border-border/50 transition-all group-hover:shadow-md">
              <LayoutGridIcon class="w-6 h-6 text-muted-foreground group-hover:text-foreground" />
            </div>
          </button>
        </div>
        {/if}
      </div>

  </div>
{/if}
