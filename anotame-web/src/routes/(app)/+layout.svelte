<script lang="ts">
  import { type Snippet, untrack } from 'svelte';
  import { page } from '$app/state';
  import type { LayoutData } from './$types';
  import { useAuthGuard } from '$lib/guards/index.svelte';
  import MenuModal from '$lib/components/layout/menu-modal.svelte';
  import UserDialog from '$lib/components/users/user-dialog.svelte';
  import { paletteStore } from '$lib/stores/palette.svelte';
  import { tenantThemeStore } from '$lib/stores/tenant-theme.svelte';
  import { authService } from '$lib/services/auth.svelte';
  import * as m from '$lib/paraglide/messages';
  import { menuItems, adminOnlyItems } from '$lib/config/menu';
  import LayoutGridIcon from 'lucide-svelte/icons/layout-grid';

  let { data, children }: { data: LayoutData; children: Snippet } = $props();
  const guard = useAuthGuard('/login');

  let isMenuOpen = $state(false);
  let isProfileOpen = $state(false);
  let currentUserForEdit = $state<any | null>(null);

  const user = $derived(authService.user);

  let recentPaths = $state<string[]>([]);

  // Track recent paths intelligently
  $effect(() => {
    const currentPath = page.url.pathname;
    untrack(() => {
      // Find the menu item matching the path
      let matchedItem = menuItems.find(m => currentPath === m.href);
      if (!matchedItem) {
        matchedItem = menuItems.find(m => currentPath.startsWith(m.href) && m.href !== '/dashboard' && m.href !== '/');
      }
      
      if (matchedItem) {
        // Exclude specific items we might not want to track as "recent apps" (like home/preferences if we want them pinned, but it's okay)
        const newPaths = recentPaths.filter(p => p !== matchedItem.key);
        newPaths.unshift(matchedItem.key);
        recentPaths = newPaths.slice(0, 10);
      }
    });
  });

  const PINNED_COUNT = 3;

  const allAvailableItems = $derived.by(() => {
    return menuItems.filter(item => {
      if (item.key === 'home' || item.key === 'preferences') return false;
      const isAdmin = user?.role === 'ADMIN';
      return adminOnlyItems.includes(item.key) ? isAdmin : true;
    });
  });

  const dockItems = $derived(allAvailableItems.slice(0, PINNED_COUNT));

  const recentItems = $derived.by(() => {
    const visibleDockKeys = new Set(dockItems.map(i => i.key));
    const recents = recentPaths
      .map(key => menuItems.find(m => m.key === key)!)
      .filter(item => item && !visibleDockKeys.has(item.key));
    return recents.slice(0, 1);
  });

  // When profile is opened, set current user for editing
  $effect(() => {
    if (isProfileOpen && user) {
      currentUserForEdit = user;
    }
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

      <MenuModal bind:isOpen={isMenuOpen} onOpenProfile={() => { isMenuOpen = false; isProfileOpen = true; }} />

      <UserDialog
        item={currentUserForEdit}
        id="profile-edit"
        onClose={() => { isProfileOpen = false; currentUserForEdit = null; }}
        onSuccess={() => { /* User data will be refetched via authService */ }}
      />

      <main class="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8 overflow-y-auto">
        {@render children()}
      </main>

      <!-- Bottom Dock Section -->
      <div class="shrink-0 w-full pt-4 pb-6 bg-transparent z-40 relative pointer-events-none">
        <div class="pointer-events-auto flex items-center justify-center gap-2 px-3 py-2 mx-auto w-max max-w-[calc(100vw-2rem)] rounded-[2rem] bg-background/60 backdrop-blur-xl border border-border/50 shadow-2xl overflow-x-auto no-scrollbar">
          {#snippet dockIconWrapper(item: any)}
            {@const Icon = item.icon}
            <a
              href={item.href}
              class="relative group flex items-center justify-center w-13 h-13 transition-all duration-300 origin-bottom hover:scale-125 hover:-translate-y-3"
              title={item.getName()}
            >
              <div class="w-12 h-12 flex items-center justify-center rounded-[12px] bg-linear-to-b from-card to-muted shadow-sm border border-border/50 transition-all group-hover:shadow-md {page.url.pathname.startsWith(item.href) ? 'ring-2 ring-primary/50' : ''}">
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
            <div class="w-12 h-12 flex items-center justify-center rounded-[12px] bg-linear-to-b from-card to-muted shadow-sm border border-border/50 transition-all group-hover:shadow-md">
              <LayoutGridIcon class="w-6 h-6 text-muted-foreground group-hover:text-foreground" />
            </div>
          </button>
        </div>
      </div>

  </div>
{/if}
