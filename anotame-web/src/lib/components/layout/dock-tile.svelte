<script lang="ts">
  import type { Snippet } from 'svelte';

  /**
   * One magnifiable dock icon. Renders as a link when given `href`, otherwise as
   * a button, so the nav entries and the menu trigger share one appearance.
   */
  interface Props {
    /** Accessible name, also shown in the hover label above the tile. */
    label: string;
    /** Destination for a navigation tile. */
    href?: string;
    /** Marks the tile as the current section. */
    active?: boolean;
    /** Action for a non-navigating tile, such as opening the menu. */
    onclick?: () => void;
    /** The tile's icon. */
    children: Snippet;
  }

  let { label, href, active = false, onclick, children }: Props = $props();

  const TILE =
    'group relative flex w-[calc(var(--scale,1)*44px)] sm:w-[calc(var(--scale,1)*52px)] shrink-0 flex-col items-center justify-end outline-none transition-[width] duration-150 ease-out will-change-[width]';
</script>

{#snippet body()}
  <!-- macOS-style name label above the magnified icon -->
  <span
    aria-hidden="true"
    class="pointer-events-none absolute bottom-full left-1/2 mb-2.5 -translate-x-1/2 scale-90 whitespace-nowrap rounded-lg border border-border/50 bg-popover/90 px-2.5 py-1 text-xs font-medium text-popover-foreground shadow-lg opacity-0 transition-all duration-150 group-hover:scale-100 group-hover:opacity-100"
  >
    {label}
    <span
      class="absolute left-1/2 top-full -mt-1 size-2 -translate-x-1/2 rotate-45 rounded-xs border-b border-r border-border/50 bg-popover/90"
    ></span>
  </span>
  <div
    class="flex aspect-square w-full items-center justify-center rounded-[22%] border transition-shadow group-hover:shadow-md group-active:brightness-90 group-focus-visible:ring-2 group-focus-visible:ring-ring {active
      ? 'bg-linear-to-b from-primary to-primary/85 border-primary/50 shadow-md'
      : 'bg-linear-to-b from-card to-muted border-border/50 shadow-sm'}"
  >
    {@render children()}
  </div>
  {#if active}
    <!-- Running-app dot, neutral like macOS -->
    <span
      class="absolute -bottom-1.25 left-1/2 size-1 -translate-x-1/2 rounded-full bg-foreground/60"
    ></span>
  {/if}
{/snippet}

{#if href}
  <a data-dock-icon {href} aria-label={label} class={TILE}>
    {@render body()}
  </a>
{:else}
  <button data-dock-icon type="button" {onclick} aria-label={label} class={TILE}>
    {@render body()}
  </button>
{/if}
