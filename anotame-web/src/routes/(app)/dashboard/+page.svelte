<script lang="ts">
  import { launchpad, openHref, visibleApps } from '$lib/config/apps';
  import { PageHeader, PageContainer } from '$lib/components/common';
  import LaunchpadTile from '$lib/components/dashboard/launchpad-tile.svelte';
  import { authService } from '$lib/services/auth.svelte';
  import { appSessionStore } from '$lib/stores/app-session.svelte';
  import * as m from '$lib/paraglide/messages';
  import WeekCalendarWidget from '$lib/components/dashboard/week-calendar-widget.svelte';

  const isAdmin = $derived(authService.user?.role === 'ADMIN');
  const entries = $derived(visibleApps(isAdmin));
</script>

<PageContainer>
  <PageHeader
    title={launchpad.getName()}
    description={m["launchpad.page.description"]({ name: authService.user?.username || m["common.user"]() })}
    icon={launchpad.icon}
  />

  {#if isAdmin}
    <WeekCalendarWidget />
  {/if}

  <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
    {#each entries as entry (entry.app.key)}
      <LaunchpadTile {entry} href={openHref(entry, appSessionStore.lastSection[entry.app.key])} />
    {/each}
  </div>
</PageContainer>
