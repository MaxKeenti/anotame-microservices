<script lang="ts">
  import type { Snippet } from 'svelte';
  import SectionTabs, { type SectionTab } from './section-tabs.svelte';
  import SectionSidebar from './section-sidebar.svelte';

  /**
   * An app's section navigation around its page: a tab bar on top, or (for
   * sidebar apps such as Ajustes) a System Settings–style sidebar beside the
   * page when there is room, falling back to tabs when narrow. Room is measured
   * with a container query, so a half-width desktop window gets tabs too.
   * Renders the page alone when the app has a single section.
   */
  interface Props {
    tabs: SectionTab[];
    ariaLabel: string;
    nav?: 'tabs' | 'sidebar';
    children: Snippet;
  }

  let { tabs, ariaLabel, nav = 'tabs', children }: Props = $props();
</script>

{#if tabs.length < 2}
  {@render children()}
{:else if nav === 'sidebar'}
  <div class="@container flex flex-1 flex-col">
    <div class="flex flex-1 flex-col gap-4 @3xl:flex-row @3xl:gap-8">
      <div class="@3xl:hidden">
        <SectionTabs {tabs} {ariaLabel} />
      </div>
      <SectionSidebar {tabs} {ariaLabel} class="hidden @3xl:flex" />
      <div class="flex min-w-0 flex-1 flex-col">
        {@render children()}
      </div>
    </div>
  </div>
{:else}
  <SectionTabs {tabs} {ariaLabel} class="mb-4" />
  {@render children()}
{/if}
