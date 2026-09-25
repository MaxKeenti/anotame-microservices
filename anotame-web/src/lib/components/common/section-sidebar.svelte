<script lang="ts">
  import NavLink from '$lib/components/common/nav-link.svelte';
  import { useRoute } from '$lib/desktop/route-context.svelte';
  import { cn } from '$lib/utils';
  import { activeTabHref, type SectionTab } from './section-tabs.svelte';

  /**
   * Vertical section list, like the sidebar of macOS System Settings: each
   * section behind a small coloured icon tile. Used by apps with many sections
   * (Ajustes), where a tab bar would run out of room.
   */
  interface Props {
    tabs: SectionTab[];
    /** Names the navigation landmark, e.g. the app it belongs to. */
    ariaLabel: string;
    /** Layout classes at the call site. */
    class?: string;
  }

  let { tabs, ariaLabel, class: className }: Props = $props();

  // The window's route when inside one, so the right row lights up there too.
  const route = useRoute();
  const activeHref = $derived(activeTabHref(tabs, route.url.pathname));
</script>

<nav aria-label={ariaLabel} class={cn('sticky top-0 flex w-56 shrink-0 flex-col gap-0.5 self-start', className)}>
  {#each tabs as tab (tab.href)}
    {@const active = tab.href === activeHref}
    <NavLink href={tab.href} variant="sidebar" current={active} class="gap-3">
      <span
        class={cn(
          'flex size-7 shrink-0 items-center justify-center rounded-lg [&_svg]:size-4',
          active ? 'bg-primary text-primary-foreground' : 'bg-primary/15 text-primary'
        )}
        aria-hidden="true"
      >
        <tab.icon />
      </span>
      <span class="truncate">{tab.label}</span>
    </NavLink>
  {/each}
</nav>
