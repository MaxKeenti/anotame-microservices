<script lang="ts">
  import { useAuthGuard } from '$lib/guards/index.svelte';
  import MenuModal from '$lib/components/layout/menu-modal.svelte';
  
  let { children } = $props();
  // Protect all internal dashboard routes. If not logged in, boot out to /login
  const guard = useAuthGuard('/login');

  let isMenuOpen = $state(false);
  let isProfileOpen = $state(false);
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
