<script lang="ts">
  import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
  import { Button } from '$lib/components/ui/button';
  import { resolveSection, type VisibleApp } from '$lib/config/apps';
  import { windowsStore, DOCK_CLEARANCE, type AppWindow } from '$lib/desktop/windows.svelte';
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
  function track(e: PointerEvent, apply: (dx: number, dy: number) => void) {
    const el = e.currentTarget as HTMLElement;
    const startX = e.clientX;
    const startY = e.clientY;
    el.setPointerCapture(e.pointerId);
    const move = (ev: PointerEvent) => apply(ev.clientX - startX, ev.clientY - startY);
    const end = () => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', end);
      el.removeEventListener('pointercancel', end);
      windowsStore.setGeometry(win.appKey, {}, true);
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
  }

  function startDrag(e: PointerEvent) {
    // Buttons in the title bar keep their own behaviour.
    if ((e.target as Element).closest('button')) return;
    windowsStore.focus(win.appKey);
    const origin = { ...geometry };
    track(e, (dx, dy) =>
      windowsStore.setGeometry(win.appKey, { x: origin.x + dx, y: origin.y + dy, w: origin.w, h: origin.h })
    );
  }

  function startResize(e: PointerEvent) {
    windowsStore.focus(win.appKey);
    const origin = { ...geometry };
    track(e, (dx, dy) =>
      windowsStore.setGeometry(win.appKey, { x: origin.x, y: origin.y, w: origin.w + dx, h: origin.h + dy })
    );
  }
</script>

<section
  data-window-app={win.appKey}
  aria-label={title}
  onpointerdowncapture={() => windowsStore.focus(win.appKey)}
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
    ondblclick={() => windowsStore.toggleMaximize(win.appKey)}
    class={cn(
      'flex h-12 shrink-0 touch-none select-none items-center gap-1 border-b border-border/60 px-1',
      focused ? 'bg-muted' : 'bg-muted/50'
    )}
  >
    <div class="flex items-center" class:opacity-60={!focused}>
      <Button variant="ghost" size="icon-touch" aria-label={m['desktop.window.close']()} onclick={() => windowsStore.close(win.appKey)}>
        <span class="size-3.5 rounded-full bg-destructive" aria-hidden="true"></span>
      </Button>
      <Button variant="ghost" size="icon-touch" aria-label={m['desktop.window.minimize']()} onclick={() => windowsStore.minimize(win.appKey)}>
        <span class="size-3.5 rounded-full bg-warning" aria-hidden="true"></span>
      </Button>
      <Button variant="ghost" size="icon-touch" aria-label={m['desktop.window.zoom']()} onclick={() => windowsStore.toggleMaximize(win.appKey)}>
        <span class="size-3.5 rounded-full bg-success" aria-hidden="true"></span>
      </Button>
    </div>

    <Button
      variant="ghost"
      size="icon-touch"
      aria-label={m['desktop.window.back']()}
      disabled={win.history.length === 0}
      onclick={() => windowsStore.back(win.appKey)}
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
    <!-- Resize corner, finger-sized -->
    <div
      role="presentation"
      onpointerdown={startResize}
      class="absolute right-0 bottom-0 size-11 cursor-nwse-resize touch-none"
    ></div>
  {/if}
</section>
