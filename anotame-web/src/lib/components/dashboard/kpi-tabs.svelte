<script lang="ts">
  import { page } from '$app/state';
  import type ActivityIcon from '@lucide/svelte/icons/activity';
  import { cn } from '$lib/utils';
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
  class="sticky top-0 z-20 -mx-2 overflow-x-auto bg-background/95 px-2 py-2 backdrop-blur"
>
  <div class="flex w-max min-w-full gap-1 rounded-xl border border-border bg-muted/40 p-1">
    {#each tabs as tab (tab.href)}
      {@const active = isActive(tab.href)}
      <a
        href={tab.href}
        aria-current={active ? 'page' : undefined}
        class={cn(
          'flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
          active ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
        )}
      >
        <tab.icon class="h-4 w-4" />
        {tab.label}
        {#if tab.alert}
          <span
            class="h-2 w-2 shrink-0 rounded-full bg-destructive"
            aria-label={m['kpi.tabs.needsAttention']()}
          ></span>
        {/if}
      </a>
    {/each}
  </div>
</nav>
