<script lang="ts">
  import { wallpaperPresets, DEFAULT_WALLPAPER, type WallpaperState } from '$lib/config/wallpapers';
  import { cn } from '$lib/utils';

  /** A wallpaper surface: the chosen preset gradient or the user's photo. */
  interface Props {
    wallpaper: WallpaperState;
    /** Sizing and placement at the call site (the desktop fills its parent; previews are thumbnails). */
    class?: string;
  }

  let { wallpaper, class: className }: Props = $props();

  const preset = $derived(
    wallpaper.selected.kind === 'preset'
      ? (wallpaperPresets.find((p) => p.id === (wallpaper.selected as { preset: string }).preset) ??
          wallpaperPresets.find((p) => p.id === DEFAULT_WALLPAPER)!)
      : null
  );
</script>

{#if wallpaper.selected.kind === 'photo' && wallpaper.photoUrl}
  <img src={wallpaper.photoUrl} alt="" class={cn('object-cover', className)} />
{:else}
  <div class={cn(preset?.class ?? 'bg-background', className)}></div>
{/if}
