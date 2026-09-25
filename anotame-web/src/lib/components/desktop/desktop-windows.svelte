<script lang="ts">
  import { untrack } from 'svelte';
  import { visibleApps } from '$lib/config/apps';
  import { authService } from '$lib/services/auth.svelte';
  import { windowsStore, tileGeometry } from '$lib/desktop/windows.svelte';
  import AppWindow from './app-window.svelte';

  /**
   * The layer windows float in, covering the content area between the menu
   * bar and the bottom of the screen. It lets clicks through to the home page
   * underneath except where a window is.
   */

  let width = $state(0);
  let height = $state(0);

  // Only the size is tracked: setBounds reads and re-clamps the windows.
  $effect(() => {
    const w = width;
    const h = height;
    untrack(() => windowsStore.setBounds(w, h));
  });

  const entries = $derived(visibleApps(authService.user?.role === 'ADMIN'));
  const focusedKey = $derived(windowsStore.focused?.appKey);
  const preview = $derived(windowsStore.snapPreview ? tileGeometry(windowsStore.snapPreview) : null);
</script>

<div
  bind:clientWidth={width}
  bind:clientHeight={height}
  class="pointer-events-none absolute inset-0 z-10 overflow-hidden"
>
  {#if preview}
    <!-- Where the dragged window lands if released now; drawn under it -->
    <div
      aria-hidden="true"
      class="absolute rounded-xl border-2 border-primary/50 bg-primary/10 backdrop-blur-sm transition-all duration-150"
      style:left="{preview.x}px"
      style:top="{preview.y}px"
      style:width="{preview.w}px"
      style:height="{preview.h}px"
      style:z-index={windowsStore.focused?.z ?? 1}
    ></div>
  {/if}

  {#each windowsStore.windows as win (win.appKey)}
    <AppWindow {win} entry={entries.find((e) => e.app.key === win.appKey)} focused={win.appKey === focusedKey} />
  {/each}
</div>
