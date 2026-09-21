<script lang="ts">
  import { menuItems, adminOnlyItems } from '$lib/config/menu';
  import { PageHeader } from '$lib/components/common';
  import DashboardTile from '$lib/components/dashboard/dashboard-tile.svelte';
  import { authService } from '$lib/services/auth.svelte';
  import * as m from '$lib/paraglide/messages';
  import WeekCalendarWidget from '$lib/components/dashboard/week-calendar-widget.svelte';

  const userRole = $derived(authService.user?.role);
  const isAdmin = $derived(userRole === 'ADMIN');

  const visibleItems = $derived(menuItems.filter((item) => {
    if (item.showInDashboard === false) return false;
    if (adminOnlyItems.includes(item.key)) return isAdmin;
    return true;
  }));
</script>

<div class="space-y-8 pb-20 p-2 sm:p-0">
  <PageHeader
    class="mb-8"
    title={m["dashboard.greeting"]({ name: authService.user?.username || m["common.user"]() })}
    description={m["dashboard.welcome"]()}
  />

  {#if isAdmin}
    <div class="mb-2">
      <WeekCalendarWidget />
    </div>
  {/if}

  <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
    {#each visibleItems as item (item.href)}
      <DashboardTile {item} />
    {/each}
  </div>
</div>
