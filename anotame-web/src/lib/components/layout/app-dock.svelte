<script lang="ts">
  import type { menuItems } from '$lib/config/menu';
  import DockTile from './dock-tile.svelte';
  import { DOCK_SURFACE } from './dock-surface';
  import { cn } from '$lib/utils';
  import LayoutGridIcon from '@lucide/svelte/icons/layout-grid';
  import { page } from '$app/state';
  import * as m from '$lib/paraglide/messages';

  type DockItem = (typeof menuItems)[number];

  /** Bottom dock of the authenticated shell. */
  interface Props {
    /** Primary sections, always shown. */
    items: DockItem[];
    /** Recently visited sections, shown after a divider when present. */
    recent?: DockItem[];
    /** Opens the full menu modal. */
    onOpenMenu: () => void;
  }

  let { items, recent = [], onOpenMenu }: Props = $props();

  // Magnification mirrors the macOS dock: a cosine falloff in *width* (not
  // transform) centred on the cursor, so neighbours genuinely displace each
  // other while their bottoms stay anchored to the shelf.
  const MAGNIFY = 0.7; // extra scale at the cursor (1x -> 1.7x)
  const MAGNIFY_RANGE = 130; // px of influence to each side of the cursor

  let dockEl = $state<HTMLElement | undefined>(undefined);
  let magnifyRaf = 0;

  function magnifyDock(e: PointerEvent) {
    if (e.pointerType !== 'mouse' || !dockEl) return;
    const x = e.clientX;
    cancelAnimationFrame(magnifyRaf);
    magnifyRaf = requestAnimationFrame(() => {
      if (!dockEl) return;
      for (const el of dockEl.querySelectorAll<HTMLElement>('[data-dock-icon]')) {
        const rect = el.getBoundingClientRect();
        const t = Math.min(Math.abs(x - rect.left - rect.width / 2) / MAGNIFY_RANGE, 1);
        const scale = 1 + MAGNIFY * Math.cos((t * Math.PI) / 2) ** 2;
        el.style.setProperty('--scale', scale.toFixed(3));
      }
    });
  }

  // A pending frame would write --scale onto elements that are going away.
  $effect(() => () => cancelAnimationFrame(magnifyRaf));

  function resetDockMagnify() {
    cancelAnimationFrame(magnifyRaf);
    if (!dockEl) return;
    for (const el of dockEl.querySelectorAll<HTMLElement>('[data-dock-icon]')) {
      el.style.removeProperty('--scale');
    }
  }
</script>

<nav
  bind:this={dockEl}
  onpointermove={magnifyDock}
  onpointerleave={resetDockMagnify}
  aria-label={m['layout.menuButton']()}
  class={cn(DOCK_SURFACE, 'items-end pb-2.5')}
>
  {#snippet tile(item: DockItem)}
    {@const Icon = item.icon}
    {@const active = page.url.pathname.startsWith(item.href)}
    <DockTile label={item.getName()} href={item.href} {active}>
      <Icon
        class="size-1/2 {active
          ? 'text-primary-foreground'
          : 'text-muted-foreground group-hover:text-foreground'}"
      />
    </DockTile>
  {/snippet}

  {#each items as item (item.key)}
    {@render tile(item)}
  {/each}

  {#if recent.length > 0}
    <div class="h-8 w-px shrink-0 self-center bg-border/60 sm:h-9"></div>
    {#each recent as item (item.key)}
      {@render tile(item)}
    {/each}
  {/if}

  <div class="h-8 w-px shrink-0 self-center bg-border/60 sm:h-9"></div>

  <DockTile label={m['layout.menuButton']()} onclick={onOpenMenu}>
    <LayoutGridIcon class="size-1/2 text-muted-foreground group-hover:text-foreground" />
  </DockTile>
</nav>
