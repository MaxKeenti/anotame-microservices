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
  import { menuItems } from '$lib/config/menu';
  import LayoutGridIcon from 'lucide-svelte/icons/layout-grid';

  let { data, children }: { data: LayoutData; children: Snippet } = $props();
  const guard = useAuthGuard('/login');

  let isMenuOpen = $state(false);
  let isProfileOpen = $state(false);
  let currentUserForEdit = $state<any | null>(null);

  const user = $derived(authService.user);

  const dockItems = $derived.by(() => {
    const baseKeys = ['orders', 'operations', 'customers', 'garments', 'services'];
    const items = baseKeys.map(k => menuItems.find(m => m.key === k)!);
    if (user?.role === 'ADMIN') {
      items.push(menuItems.find(m => m.key === 'kpi')!);
    }
    return items;
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
  <div class="flex flex-col h-[100dvh] bg-background text-foreground overflow-hidden">

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
      <div class="shrink-0 w-full border-t border-border/40 bg-background/80 backdrop-blur-xl pb-safe z-50 relative">
        <div class="flex items-center justify-center gap-2 px-3 py-2 mx-auto w-max max-w-full overflow-x-auto no-scrollbar">
          {#each dockItems as item, i}
            {@const Icon = item.icon}
            <a
              href={item.href}
              class="relative flex items-center justify-center p-3 rounded-2xl transition-all duration-200 origin-bottom hover:scale-125 hover:-translate-y-2 {i >= 3 ? 'hidden sm:flex' : 'flex'} {page.url.pathname.startsWith(item.href) ? 'text-primary' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'}"
              title={item.getName()}
            >
              <Icon class="w-6 h-6" />
              {#if page.url.pathname.startsWith(item.href)}
                <div class="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary"></div>
              {/if}
            </a>
          {/each}
          
          <div class="w-px h-8 bg-border/50 mx-1"></div>

          <!-- Full Menu Button -->
          <button
            onclick={() => isMenuOpen = true}
            class="relative flex items-center justify-center p-3 rounded-2xl transition-all duration-200 origin-bottom hover:scale-125 hover:-translate-y-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            title={m["layout.menuButton"]()}
          >
            <LayoutGridIcon class="w-6 h-6" />
          </button>
        </div>
      </div>

  </div>
{/if}
