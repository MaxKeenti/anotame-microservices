<script lang="ts">
  import { PageContainer } from '$lib/components/common';
  import HomeHeader from '$lib/components/dashboard/home-header.svelte';
  import { authService } from '$lib/services/auth.svelte';
  import * as m from '$lib/paraglide/messages';
  import WeekCalendarWidget from '$lib/components/dashboard/week-calendar-widget.svelte';

  const isAdmin = $derived(authService.user?.role === 'ADMIN');
</script>

<PageContainer>
  <HomeHeader name={authService.user?.username || m["common.user"]()} />

  {#if isAdmin}
    <WeekCalendarWidget />
  {/if}
</PageContainer>
