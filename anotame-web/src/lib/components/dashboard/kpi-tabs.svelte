<script lang="ts">
  import NavLink from '$lib/components/common/nav-link.svelte';
  import { page } from '$app/state';
  import type ActivityIcon from '@lucide/svelte/icons/activity';
  import * as m from '$lib/paraglide/messages';

  /** One section of the KPI dashboard. */
  export type KpiTab = {
    href: string;
    label: string;
    icon: typeof ActivityIcon;
    /** Flags the tab when something in that section needs attention. */
    alert?: boolean;
  };

  /** Sticky segmented navigation between the KPI dashboard's sections. */
  interface Props {
    tabs: KpiTab[];
  }

  let { tabs }: Props = $props();

  /** A tab stays active on its own nested routes. */
  function isActive(href: string): boolean {
    return page.url.pathname === href || page.url.pathname.startsWith(`${href}/`);
  }
</script>

<nav
  aria-label={m['kpi.tabs.ariaLabel']()}
  class="sticky top-0 z-20 -mx-4 overflow-x-auto bg-background/95 px-4 py-2 backdrop-blur md:-mx-6 md:px-6 lg:-mx-8 lg:px-8"
>
  <div class="flex w-max min-w-full gap-1 rounded-xl border border-border bg-muted/40 p-1">
    {#each tabs as tab (tab.href)}
      {@const active = isActive(tab.href)}
      <NavLink href={tab.href} variant="tab" current={active}>
        <tab.icon aria-hidden="true" />
        {tab.label}
        {#if tab.alert}
          <span
            class="h-2 w-2 shrink-0 rounded-full bg-destructive"
            aria-label={m['kpi.tabs.needsAttention']()}
          ></span>
        {/if}
      </NavLink>
    {/each}
  </div>
</nav>
