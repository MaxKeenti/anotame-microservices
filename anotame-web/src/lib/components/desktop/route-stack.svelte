<script lang="ts">
  import type { Component } from 'svelte';
  import RouteStack from './route-stack.svelte';

  /** Renders route layouts around their page, as SvelteKit nests them. */
  interface Props {
    /** Layouts then the page, outermost first. */
    stack: Component<any>[];
    /** Merged `load` data for the route. */
    data: Record<string, any>;
    index?: number;
  }

  let { stack, data, index = 0 }: Props = $props();

  const Current = $derived(stack[index]);
</script>

{#if index < stack.length - 1}
  <Current {data}>
    <RouteStack {stack} {data} index={index + 1} />
  </Current>
{:else}
  <Current {data} />
{/if}
