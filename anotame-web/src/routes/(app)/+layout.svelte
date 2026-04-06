<script lang="ts">
  import { useAuthGuard } from '$lib/guards/index.svelte';
  import MenuModal from '$lib/components/layout/menu-modal.svelte';
  import UserDialog from '$lib/components/users/user-dialog.svelte';
  import { paletteStore } from '$lib/stores/palette.svelte';
  import { tenantThemeStore } from '$lib/stores/tenant-theme.svelte';
  import { authService } from '$lib/services/auth.svelte';

  let { data, children } = $props();
  const guard = useAuthGuard('/login');

  let isMenuOpen = $state(false);
  let isProfileOpen = $state(false);
  let currentUserForEdit = $state<any | null>(null);

  const user = $derived(authService.user);

  // When profile is opened, set current user for editing
  $effect(() => {
    if (isProfileOpen && user) {
      currentUserForEdit = user;
    }
  });

  // Initialize store with server-loaded theme during hydration
  $effect.pre(() => {
    if (data.establishmentTheme) {
      tenantThemeStore.set(data.establishmentTheme);
    }
  });

  // User palette injection (existing effect - unchanged)
  $effect(() => {
    const palette = paletteStore.current;
    const el = document.documentElement;
    const vars: Array<[string, string | null]> = [
      ['--primary', palette.primary],
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
  });

  // Inject tenant theme CSS variables whenever theme changes
  $effect(() => {
    const theme = tenantThemeStore.current;
    const root = document.documentElement;

    // Inject primary color if customized
    if (theme.primaryColor) {
      root.style.setProperty('--primary', theme.primaryColor);
    } else {
      root.style.removeProperty('--primary'); // Fallback to CSS default
    }

    // Inject font family if customized
    if (theme.fontFamily) {
      const fontMap = {
        'Inter': "'Inter Variable', sans-serif",
        'Outfit': "'Outfit Variable', sans-serif",
        'Merriweather': "'Merriweather Variable', serif",
      };
      root.style.setProperty('--font-sans', fontMap[theme.fontFamily]);
    } else {
      root.style.removeProperty('--font-sans'); // Fallback to CSS default
    }
  });
</script>

{#if guard.checking}
  <div class="h-screen w-screen flex flex-col items-center justify-center bg-background text-muted-foreground gap-4">
    <!-- Inline simple spinner and text, relying on standard tailwind utility classes -->
    <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
    <p class="text-sm font-medium">Validando sesión...</p>
  </div>
{:else if guard.allowed}
  <!-- The authenticated shell with global touch-first UI rules -->
  <div class="flex flex-col min-h-screen bg-background text-foreground overflow-x-hidden">

      <MenuModal bind:isOpen={isMenuOpen} onOpenProfile={() => { isMenuOpen = false; isProfileOpen = true; }} />

      <UserDialog
        item={currentUserForEdit}
        onClose={() => { isProfileOpen = false; currentUserForEdit = null; }}
        onSuccess={() => { /* User data will be refetched via authService */ }}
      />

      <!-- Top navbar placeholder (Touch-friendly rules: tall enough for thumbs) -->
      <header class="h-16 shrink-0 border-b flex items-center justify-between px-4 sticky top-0 bg-background z-10 w-full">
        <h1 class="text-xl font-bold">Anotame</h1>

        <!-- Menu Modal Button Placeholder. Touch targets must be generous. -->
        <button onclick={() => isMenuOpen = true} class="h-10 px-4 py-2 border rounded-md hover:bg-accent hover:text-accent-foreground touch-manipulation font-medium">
           Menú
        </button>
      </header>

      <main class="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        {@render children()}
      </main>

  </div>
{/if}
