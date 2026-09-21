<script lang="ts">
  import { type Snippet, untrack } from 'svelte';
  import AppDock from '$lib/components/layout/app-dock.svelte';
  import AppShell from '$lib/components/layout/app-shell.svelte';
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
  import { FloatingActionBar, StatePanel } from '$lib/components/common';
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

  // Longest-prefix match against the menu config gives every dashboard route --
  // including detail pages like /dashboard/orders/[id] -- a stable document
  // title, instead of each page inheriting whatever the last one set.
  const pageTitle = $derived.by(() => {
    const path = page.url.pathname;
    const match = menuItems
      .filter((item) => path === item.href || path.startsWith(`${item.href}/`))
      .sort((a, b) => b.href.length - a.href.length)[0];
    return match ? `${match.getName()} · ${m["common.appName"]()}` : m["common.appName"]();
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

<svelte:head>
  <title>{pageTitle}</title>
</svelte:head>

{#if guard.checking}
  <StatePanel message={m["layout.validatingSession"]()} spinner class="h-screen border-0" />
{:else if guard.allowed}
  <!-- The authenticated shell with global touch-first UI rules -->
  <AppShell>
    {#snippet overlays()}
      <MenuModal bind:isOpen={isMenuOpen} onOpenProfile={() => { isMenuOpen = false; isCredentialsOpen = true; }} />
      <CredentialsDialog
        bind:open={isCredentialsOpen}
        id="credentials-edit"
        onClose={() => { isCredentialsOpen = false; }}
      />
    {/snippet}

    {@render children()}

    <!-- While a page registers a bulk action (e.g. orders selection) the dock
         swaps for that action bar, keeping the user on the page until done. -->
    {#snippet dock()}
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
        <AppDock items={dockItems} recent={recentItems} onOpenMenu={() => (isMenuOpen = true)} />
      {/if}
    {/snippet}
  </AppShell>
{/if}
