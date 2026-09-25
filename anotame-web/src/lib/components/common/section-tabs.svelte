<script lang="ts" module>
  import type ActivityIcon from '@lucide/svelte/icons/activity';

  /** One section reachable from the tab track. */
  export type SectionTab = {
    href: string;
    label: string;
    icon: typeof ActivityIcon;
    /** Flags the tab when something in that section needs attention. */
    alert?: boolean;
  };
</script>

<script lang="ts">
  import NavLink from '$lib/components/common/nav-link.svelte';
  import { useRoute } from '$lib/desktop/route-context.svelte';
  import * as m from '$lib/paraglide/messages';
  import { cn } from '$lib/utils';

  /**
   * Sticky segmented navigation between sibling sections: an app's navbar in
   * the shell, or the KPI dashboard's tabs.
   */
  interface Props {
    tabs: SectionTab[];
    /** Names the navigation landmark, e.g. the app it belongs to. */
    ariaLabel: string;
    /** Spacing at the call site, such as a gap below an app navbar. */
    class?: string;
  }

  let { tabs, ariaLabel, class: className }: Props = $props();

  // The window's route when inside one, so the right tab lights up there too.
  const route = useRoute();

  let trackEl = $state<HTMLElement | undefined>(undefined);

  // On narrow screens the track scrolls sideways; centre the current tab. Only
  // the track's scrollLeft moves -- scrollIntoView would also scroll the page.
  $effect(() => {
    void route.url.pathname;
    const current = trackEl?.querySelector<HTMLElement>('[aria-current]');
    if (!trackEl || !current) return;
    trackEl.scrollLeft = current.offsetLeft - (trackEl.clientWidth - current.offsetWidth) / 2;
  });

  /** A tab stays active on its own nested routes. */
  function isActive(href: string): boolean {
    return route.url.pathname === href || route.url.pathname.startsWith(`${href}/`);
  }
</script>

<nav
  bind:this={trackEl}
  aria-label={ariaLabel}
  class={cn(
    'sticky top-0 z-20 -mx-4 overflow-x-auto bg-background/95 px-4 py-2 backdrop-blur md:-mx-6 md:px-6 lg:-mx-8 lg:px-8',
    className
  )}
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
            aria-label={m['nav.tabs.needsAttention']()}
          ></span>
        {/if}
      </NavLink>
    {/each}
  </div>
</nav>
