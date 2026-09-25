<script lang="ts" module>
  import type RocketIcon from '@lucide/svelte/icons/rocket';

  /** One app (or the home page) as the dock shows it. */
  export type DockEntry = {
    key: string;
    label: string;
    /** Where the tile opens, e.g. the app's last-visited section. */
    href: string;
    icon: typeof RocketIcon;
    /** The current page belongs to this entry. */
    active: boolean;
  };
</script>

<script lang="ts">
  import DockTile from './dock-tile.svelte';
  import { DOCK_SURFACE } from './dock-surface';
  import { cn } from '$lib/utils';
  import { launchpad } from '$lib/config/apps';
  import * as m from '$lib/paraglide/messages';

  /** Bottom dock of the authenticated shell. */
  interface Props {
    /** The home tile, pinned first like Finder. */
    home: DockEntry;
    /** Pinned apps, always shown. */
    items: DockEntry[];
    /** Recently opened apps that are not pinned, shown after a divider. */
    recent?: DockEntry[];
    /** Opens the Launchpad overlay. */
    onOpenLaunchpad: () => void;
  }

  let { home, items, recent = [], onOpenLaunchpad }: Props = $props();

  const LaunchpadIcon = launchpad.icon;

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
  aria-label={m['layout.dock.label']()}
  class={cn(DOCK_SURFACE, 'items-end pb-2.5')}
>
  {#snippet tile(item: DockEntry)}
    {@const Icon = item.icon}
    <DockTile label={item.label} href={item.href} active={item.active}>
      <Icon
        class="size-1/2 {item.active
          ? 'text-primary-foreground'
          : 'text-muted-foreground group-hover:text-foreground'}"
      />
    </DockTile>
  {/snippet}

  {@render tile(home)}

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

  <DockTile label={launchpad.getName()} onclick={onOpenLaunchpad}>
    <LaunchpadIcon class="size-1/2 text-muted-foreground group-hover:text-foreground" />
  </DockTile>
</nav>
