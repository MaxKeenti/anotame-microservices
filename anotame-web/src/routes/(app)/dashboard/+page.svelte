<script lang="ts">
  import { menuItems, adminOnlyItems } from '$lib/config/menu';
  import { authService } from '$lib/services/auth.svelte';
  import * as m from '$lib/paraglide/messages';

  const userRole = $derived(authService.user?.role);
  const isAdmin = $derived(userRole === 'ADMIN');

  const visibleItems = $derived(menuItems.filter((item) => {
    if (adminOnlyItems.includes(item.key)) return isAdmin;
    return true;
  }));
</script>

<div class="space-y-8 pb-20 p-2 sm:p-0">
  <div class="mb-8">
     <h2 class="text-3xl sm:text-4xl font-bold font-heading">{m.dashboard_greeting({ name: authService.user?.username || m.common_user() })}</h2>
     <p class="text-muted-foreground mt-2 sm:text-lg">{m.dashboard_welcome()}</p>
  </div>

  <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
    {#each visibleItems as item (item.href)}
      {@const IconComponent = item.icon}
      <a href={item.href} class="group outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl block touch-manipulation">
        <div class="bg-card border border-border rounded-xl p-6 md:p-8 shadow-sm hover:shadow-md hover:border-primary/50 transition-all h-full flex flex-col items-center text-center gap-4">
          <div class="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            <IconComponent class="w-8 h-8" />
          </div>
          <div>
            <h3 class="text-xl font-bold font-heading">{item.getName()}</h3>
            <p class="text-sm text-muted-foreground mt-2">
              {item.getDescription()}
            </p>
          </div>
        </div>
      </a>
    {/each}
  </div>
</div>
