<script lang="ts">
  import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
  import { Button } from '$lib/components/ui/button';
  import { resolveSection, type VisibleApp } from '$lib/config/apps';
  import { windowsStore, DOCK_CLEARANCE, MIN_WINDOW, type AppWindow, type TileLayout } from '$lib/desktop/windows.svelte';
  import { cn } from '$lib/utils';
  import WindowContent from './window-content.svelte';
  import * as m from '$lib/paraglide/messages';

  /**
   * One app in a movable, resizable window: macOS-style title bar (close,
   * minimize, zoom, back), then the app's navbar and route. The title bar and
   * resize corner are 44px so they work with a finger on the shop's tablets.
   */
  interface Props {
    win: AppWindow;
    entry: VisibleApp | undefined;
    focused: boolean;
  }

  let { win, entry, focused }: Props = $props();

  const Icon = $derived(entry?.app.icon);
  const sectionName = $derived(resolveSection(new URL(win.url, 'http://x').pathname)?.getName());
  const title = $derived(
    entry && sectionName && sectionName !== entry.app.getName()
      ? `${entry.app.getName()} — ${sectionName}`
      : (entry?.app.getName() ?? '')
  );

  const geometry = $derived(
    win.maximized
      ? { x: 0, y: 0, w: windowsStore.bounds.width, h: windowsStore.bounds.height - DOCK_CLEARANCE }
      : { x: win.x, y: win.y, w: win.w, h: win.h }
  );

  /** Tracks a drag or resize from the pointer that started it. */
  function track(
    e: PointerEvent,
    apply: (dx: number, dy: number, ev: PointerEvent) => void,
    done: () => void = () => {}
  ) {
    const el = e.currentTarget as HTMLElement;
    const startX = e.clientX;
    const startY = e.clientY;
    el.setPointerCapture(e.pointerId);
    // Without this, dragging selects the text of whatever the pointer crosses.
    e.preventDefault();
    document.getSelection()?.removeAllRanges();
    const root = document.documentElement.style;
    const userSelect = root.userSelect;
    root.userSelect = 'none';
    root.setProperty('-webkit-user-select', 'none');
    const move = (ev: PointerEvent) => apply(ev.clientX - startX, ev.clientY - startY, ev);
    const end = () => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', end);
      el.removeEventListener('pointercancel', end);
      root.userSelect = userSelect;
      root.removeProperty('-webkit-user-select');
      done();
      windowsStore.setGeometry(win.id, {}, true);
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
  }

  /** How close to a desktop edge the pointer must get to snap, in px. */
  const SNAP_EDGE = 16;

  /** The snap a pointer position asks for: top edge fills, side edges tile a half. */
  function snapFor(ev: PointerEvent, desktop: DOMRect): TileLayout | null {
    if (ev.clientY <= desktop.top + SNAP_EDGE) return 'fill';
    if (ev.clientX <= desktop.left + SNAP_EDGE) return 'left';
    if (ev.clientX >= desktop.right - SNAP_EDGE) return 'right';
    return null;
  }

  function startDrag(e: PointerEvent) {
    // Buttons in the title bar keep their own behaviour.
    if ((e.target as Element).closest('button')) return;
    windowsStore.focus(win.id);
    const sectionEl = (e.currentTarget as HTMLElement).closest('section')!;
    const desktop = (sectionEl.offsetParent as HTMLElement).getBoundingClientRect();
    const origin = { ...geometry };

    // Dragging a tiled or zoomed window away gives it back its earlier size,
    // keeping the grab point at the same place along the title bar.
    const restored = win.maximized ? { w: win.w, h: win.h } : windowsStore.takePreTile(win.id);
    if (restored) {
      const grab = (e.clientX - desktop.left - origin.x) / origin.w;
      origin.x = e.clientX - desktop.left - grab * restored.w;
      origin.w = restored.w;
      origin.h = restored.h;
    }

    let snap: TileLayout | null = null;
    track(
      e,
      (dx, dy, ev) => {
        windowsStore.setGeometry(win.id, { x: origin.x + dx, y: origin.y + dy, w: origin.w, h: origin.h });
        snap = snapFor(ev, desktop);
        windowsStore.setSnapPreview(snap);
      },
      () => {
        windowsStore.setSnapPreview(null);
        if (snap) {
          // Remember the size it had before snapping, not the tiled one.
          windowsStore.setGeometry(win.id, { w: origin.w, h: origin.h });
          windowsStore.tile(win.id, snap);
        }
      }
    );
  }

  /** Resizes from an edge or corner; `edges` holds n, s, e, w as needed. */
  function startResize(e: PointerEvent, edges: string) {
    e.stopPropagation();
    windowsStore.focus(win.id);
    windowsStore.takePreTile(win.id);
    const o = { ...geometry };
    track(e, (dx, dy) => {
      let { x, y, w, h } = o;
      if (edges.includes('e')) w = o.w + dx;
      if (edges.includes('s')) h = o.h + dy;
      if (edges.includes('w')) {
        w = Math.max(MIN_WINDOW.w, o.w - dx);
        x = o.x + o.w - w;
      }
      if (edges.includes('n')) {
        h = Math.max(MIN_WINDOW.h, o.h - dy);
        y = o.y + o.h - h;
      }
      windowsStore.setGeometry(win.id, { x, y, w, h });
    });
  }

  // Thin edge strips and small corners for the mouse; the finger-sized corner
  // below covers touch, and the menu bar's Window menu covers exact sizes.
  const resizeHandles = [
    { edges: 'n', class: 'inset-x-3 top-0 h-1.5 cursor-ns-resize' },
    { edges: 's', class: 'inset-x-3 bottom-0 h-1.5 cursor-ns-resize' },
    { edges: 'w', class: 'inset-y-3 left-0 w-1.5 cursor-ew-resize' },
    { edges: 'e', class: 'inset-y-3 right-0 w-1.5 cursor-ew-resize' },
    { edges: 'nw', class: 'top-0 left-0 size-3 cursor-nwse-resize' },
    { edges: 'ne', class: 'top-0 right-0 size-3 cursor-nesw-resize' },
    { edges: 'sw', class: 'bottom-0 left-0 size-3 cursor-nesw-resize' },
    { edges: 'se', class: 'right-0 bottom-0 size-11 cursor-nwse-resize' },
  ];
</script>

<section
  data-window-id={win.id}
  aria-label={title}
  onpointerdowncapture={() => windowsStore.focus(win.id)}
  class={cn(
    'pointer-events-auto absolute flex flex-col overflow-hidden rounded-xl border bg-background transition-shadow',
    focused ? 'border-border shadow-2xl shadow-black/25' : 'border-border/60 shadow-lg',
    win.minimized && 'hidden'
  )}
  style:left="{geometry.x}px"
  style:top="{geometry.y}px"
  style:width="{geometry.w}px"
  style:height="{geometry.h}px"
  style:z-index={win.z}
>
  <!-- Title bar: drag to move, double-click to zoom -->
  <header
    role="toolbar"
    tabindex="-1"
    aria-label={title}
    onpointerdown={startDrag}
    ondblclick={() => windowsStore.toggleMaximize(win.id)}
    class={cn(
      'flex h-12 shrink-0 touch-none select-none items-center gap-1 border-b border-border/60 px-1',
      focused ? 'bg-muted' : 'bg-muted/50'
    )}
  >
    <div class="flex items-center" class:opacity-60={!focused}>
      <Button variant="ghost" size="icon-touch" aria-label={m['desktop.window.close']()} onclick={() => windowsStore.close(win.id)}>
        <span class="size-3.5 rounded-full bg-destructive" aria-hidden="true"></span>
      </Button>
      <Button variant="ghost" size="icon-touch" aria-label={m['desktop.window.minimize']()} onclick={() => windowsStore.minimize(win.id)}>
        <span class="size-3.5 rounded-full bg-warning" aria-hidden="true"></span>
      </Button>
      <Button variant="ghost" size="icon-touch" aria-label={m['desktop.window.zoom']()} onclick={() => windowsStore.toggleMaximize(win.id)}>
        <span class="size-3.5 rounded-full bg-success" aria-hidden="true"></span>
      </Button>
    </div>

    <Button
      variant="ghost"
      size="icon-touch"
      aria-label={m['desktop.window.back']()}
      disabled={win.history.length === 0}
      onclick={() => windowsStore.back(win.id)}
    >
      <ArrowLeftIcon aria-hidden="true" />
    </Button>

    <div class="flex min-w-0 flex-1 items-center justify-center gap-2 pr-40 text-sm font-semibold" class:text-muted-foreground={!focused}>
      {#if Icon}
        <Icon class="size-4 shrink-0" aria-hidden="true" />
      {/if}
      <span class="truncate">{title}</span>
    </div>
  </header>

  <!-- Content scrolls inside the window; gutters match the full-page shell so
       page components (and SectionTabs' negative margins) lay out the same. -->
  <div class="min-h-0 flex-1 overflow-y-auto">
    <div class="flex min-h-full flex-col px-4 pt-4 pb-6 md:px-6 lg:px-8">
      <WindowContent {win} {entry} />
    </div>
  </div>

  {#if !win.maximized}
    {#each resizeHandles as handle (handle.edges)}
      <div
        role="presentation"
        onpointerdown={(e) => startResize(e, handle.edges)}
        class={cn('absolute z-10 touch-none', handle.class)}
      ></div>
    {/each}
  {/if}
</section>
