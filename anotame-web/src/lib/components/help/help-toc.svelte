<script lang="ts">
  import NavLink from '$lib/components/common/nav-link.svelte';
  import { Text } from '$lib/components/ui/typography';
  import type { HelpTopic } from '$lib/config/help';
  import * as m from '$lib/paraglide/messages';

  /**
   * Table of contents for the manual. `sidebar` is the scrolling list beside
   * the content on wide screens; `chips` is the sticky horizontal strip that
   * replaces it on narrow ones.
   */
  interface Props {
    topics: HelpTopic[];
    /** Id of the topic currently in view. */
    activeId: string;
    layout: 'sidebar' | 'chips';
  }

  let { topics, activeId, layout }: Props = $props();
</script>

{#if layout === 'sidebar'}
  <nav
    class="hidden rounded-xl border border-border bg-card p-3 shadow-sm lg:block"
    aria-label={m['help.toc.title']()}
  >
    <Text variant="label" class="px-2 pb-2">
      {m['help.toc.title']()}
    </Text>
    <div class="max-h-[calc(100vh-18rem)] space-y-1 overflow-y-auto pr-1">
      {#each topics as topic (topic.id)}
        <NavLink href={`#${topic.id}`} variant="sidebar" current={activeId === topic.id ? 'location' : false}>
          {topic.title()}
        </NavLink>
      {/each}
    </div>
  </nav>
{:else}
  <nav
    class="sticky top-0 z-20 rounded-xl border border-border bg-background/90 p-2 shadow-sm backdrop-blur lg:hidden"
    aria-label={m['help.toc.title']()}
  >
    <div
      class="no-scrollbar flex gap-2 overflow-x-auto mask-[linear-gradient(to_right,black_calc(100%-1.5rem),transparent)]"
    >
      {#each topics as topic (topic.id)}
        <NavLink
          href={`#${topic.id}`}
          variant="chip"
          current={activeId === topic.id ? 'location' : false}
          data-mobile-help-topic={topic.id}
        >
          {topic.title()}
        </NavLink>
      {/each}
    </div>
  </nav>
{/if}
