<script lang="ts">
  import { type Snippet, untrack } from 'svelte';
  import AppDock, { type DockEntry } from '$lib/components/layout/app-dock.svelte';
  import AppShell from '$lib/components/layout/app-shell.svelte';
  import { page } from '$app/state';
  import { goto, replaceState } from '$app/navigation';
  import type { LayoutData } from './$types';
  import { useAuthGuard } from '$lib/guards/index.svelte';
  import LaunchpadModal from '$lib/components/layout/launchpad-modal.svelte';
  import CommandPalette from '$lib/components/layout/command-palette.svelte';
  import MenuBar from '$lib/components/layout/menu-bar.svelte';
  import { launchpadStore } from '$lib/stores/launchpad.svelte';
  import CredentialsDialog from '$lib/components/users/credentials-dialog.svelte';
  import { paletteStore } from '$lib/stores/palette.svelte';
  import { tenantThemeStore } from '$lib/stores/tenant-theme.svelte';
  import { authService } from '$lib/services/auth.svelte';
  import * as m from '$lib/paraglide/messages';
  import { home, openHref, resolveApp, visibleApps, type VisibleApp } from '$lib/config/apps';
  import { FloatingActionBar, SectionFrame, StatePanel } from '$lib/components/common';
  import { appSessionStore } from '$lib/stores/app-session.svelte';
  import { dockActionStore } from '$lib/stores/dock-action.svelte';
  import DesktopWindows from '$lib/components/desktop/desktop-windows.svelte';
  import { windowsStore } from '$lib/desktop/windows.svelte';
  import { currentPathname } from '$lib/desktop/location.svelte';
  import DesktopWallpaper from '$lib/components/desktop/desktop-wallpaper.svelte';
  import { wallpaperStore } from '$lib/stores/wallpaper.svelte';

  let { data, children }: { data: LayoutData; children: Snippet } = $props();
  const guard = useAuthGuard('/login');

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

  const isAdmin = $derived(user?.role === 'ADMIN');
  const entries = $derived(visibleApps(isAdmin));

  // Desktop mode: apps open in windows on screens at least 1024px wide (the
  // shop's tablets included), unless the user turned windows off.
  $effect(() => windowsStore.setWide(windowWidth >= 1024));
  const desktopActive = $derived(windowsStore.active);

  let restoredFor: string | undefined;
  $effect(() => {
    const username = user?.username;
    if (!username || restoredFor === username) return;
    restoredFor = username;
    untrack(() => {
      windowsStore.restore(username, (key) => entries.some((e) => e.app.key === key));
      wallpaperStore.load();
    });
  });

  // A deep link (or reload) to an app route opens it in a window over the
  // home page, which is the desktop.
  $effect(() => {
    if (!desktopActive || !resolveApp(page.url.pathname)) return;
    const href = `${page.url.pathname}${page.url.search}`;
    untrack(() => {
      windowsStore.open(href, { fromAppKey: resolveApp(page.url.pathname)?.app.key });
      goto(home.href, { replaceState: true });
    });
  });

  // The address bar follows the focused window (shallow, so the desktop stays
  // mounted); reloading it reopens that window through the deep-link path.
  $effect(() => {
    if (!desktopActive || page.url.pathname !== home.href) return;
    const target = windowsStore.focused?.url ?? home.href;
    if (`${location.pathname}${location.search}` !== target) {
      untrack(() => replaceState(target, page.state));
    }
  });

  // Leaving desktop mode (narrow window, or windows turned off) lands on the
  // focused window's page as a normal route.
  let wasActive = false;
  $effect(() => {
    const active = desktopActive;
    if (wasActive && !active && page.url.pathname === home.href) {
      const focused = untrack(() => windowsStore.focused);
      if (focused) goto(focused.url);
    }
    wasActive = active;
  });

  // Internal links inside windows, the Launchpad, and the dock open in windows
  // instead of navigating. Capture phase runs before SvelteKit's router, which
  // skips clicks whose default was prevented.
  $effect(() => {
    if (!desktopActive) return;
    const handleClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const anchor = (e.target as Element | null)?.closest?.('a[href]');
      if (!(anchor instanceof HTMLAnchorElement) || anchor.target === '_blank' || anchor.hasAttribute('download')) return;
      const url = new URL(anchor.href);
      if (url.origin !== location.origin) return;
      if (url.pathname === home.href) {
        windowsStore.minimizeAll();
        return;
      }
      const fromAppKey = anchor.closest('[data-window-app]')?.getAttribute('data-window-app') ?? undefined;
      if (windowsStore.open(`${url.pathname}${url.search}`, { fromAppKey })) e.preventDefault();
    };
    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  });

  const current = $derived(resolveApp(currentPathname()));
  const currentEntry = $derived(entries.find((e) => e.app.key === current?.app.key));

  // Remember the section each app was left on, so reopening it from the dock
  // or the Launchpad returns there, and feed the dock's recent apps.
  $effect(() => {
    const match = current;
    if (match) untrack(() => appSessionStore.visit(match.app.key, match.section.href));
  });

  // Every dashboard route -- including detail pages like /dashboard/orders/[id]
  // -- gets a stable document title from the section and app it belongs to.
  const pageTitle = $derived.by(() => {
    if (!current) return `${home.getName()} · ${m["common.appName"]()}`;
    const section = current.section.getName();
    const app = current.app.getName();
    return section === app
      ? `${section} · ${m["common.appName"]()}`
      : `${section} · ${app} · ${m["common.appName"]()}`;
  });

  const isMobile = $derived(windowWidth < 640);
  const maxRecents = $derived(isMobile ? 1 : 3);

  function toDockEntry(entry: VisibleApp): DockEntry {
    // In desktop mode a dock tile brings the app's window back as it was, and
    // its dot means the window is open.
    const win = desktopActive ? windowsStore.windows.find((w) => w.appKey === entry.app.key) : undefined;
    return {
      key: entry.app.key,
      label: entry.app.getName(),
      href: win?.url ?? openHref(entry, appSessionStore.lastSection[entry.app.key]),
      icon: entry.app.icon,
      active: entry.app.key === current?.app.key,
      running: desktopActive ? !!win : appSessionStore.recentApps.includes(entry.app.key),
    };
  }

  const homeEntry = $derived<DockEntry>({
    key: 'home',
    label: home.getName(),
    href: home.href,
    icon: home.icon,
    active: desktopActive ? !windowsStore.focused : page.url.pathname === home.href,
    // Home is always there, like Finder.
    running: true,
  });

  // Mobile: home + 2 pinned apps + 1 recent + Launchpad. Desktop: dynamic based on
  // available width. 64px per slot = 52px icon cell + 8px gap, plus headroom
  // so the magnification spread never pushes the dock past the viewport edge.
  const reservedWidth = $derived(32 + 64 + (maxRecents * 64) + 24 + 64);
  const maxVisibleDockItems = $derived(isMobile ? 2 : Math.max(1, Math.floor((windowWidth - reservedWidth) / 64)));

  const pinnedEntries = $derived(
    entries.filter((e) => e.app.showInDock !== false).slice(0, maxVisibleDockItems)
  );
  const dockItems = $derived(pinnedEntries.map(toDockEntry));

  const recentItems = $derived.by(() => {
    const pinned = new Set(pinnedEntries.map((e) => e.app.key));
    return appSessionStore.recentApps
      .filter((key) => !pinned.has(key))
      .map((key) => entries.find((e) => e.app.key === key))
      .filter((e): e is VisibleApp => !!e)
      .slice(0, maxRecents)
      .map(toDockEntry);
  });

  // An app with several sections gets a navbar to move between them, like the
  // tabs of a standalone app.
  const appTabs = $derived(
    !desktopActive && currentEntry && currentEntry.sections.length > 1
      ? currentEntry.sections.map((section) => ({
          href: section.href,
          label: section.getName(),
          icon: section.icon,
        }))
      : []
  );

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
  <StatePanel message={m["layout.validatingSession"]()} spinner size="screen" />
{:else if guard.allowed}
  <!-- The authenticated shell with global touch-first UI rules -->
  <AppShell>
    {#snippet overlays()}
      <LaunchpadModal onOpenProfile={() => { launchpadStore.open = false; isCredentialsOpen = true; }} />
      <CommandPalette onOpenProfile={() => (isCredentialsOpen = true)} />
      <CredentialsDialog
        bind:open={isCredentialsOpen}
        id="credentials-edit"
        onClose={() => { isCredentialsOpen = false; }}
      />
    {/snippet}

    <!-- The wallpaper sits behind the home page, which is also the desktop
         that windows float over. -->
    {#snippet wallpaper()}
      {#if page.url.pathname === home.href}
        <DesktopWallpaper wallpaper={wallpaperStore.state} class="size-full" />
      {/if}
    {/snippet}

    {#snippet desktop()}
      {#if desktopActive}
        <DesktopWindows />
      {/if}
    {/snippet}

    {#snippet menubar()}
      <MenuBar onOpenProfile={() => (isCredentialsOpen = true)} canUseWindows={windowWidth >= 1024} />
    {/snippet}

    <SectionFrame tabs={appTabs} ariaLabel={currentEntry?.app.getName() ?? ''} nav={currentEntry?.app.nav}>
      {@render children()}
    </SectionFrame>

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
        <AppDock home={homeEntry} items={dockItems} recent={recentItems} onOpenLaunchpad={() => (launchpadStore.open = true)} />
      {/if}
    {/snippet}
  </AppShell>
{/if}
