<script lang="ts">
  import ImagePlusIcon from '@lucide/svelte/icons/image-plus';
  import Trash2Icon from '@lucide/svelte/icons/trash-2';
  import { toast } from 'svelte-sonner';
  import * as Card from '$lib/components/ui/card';
  import * as ToggleGroup from '$lib/components/ui/toggle-group';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Spinner } from '$lib/components/ui/spinner';
  import { HintText } from '$lib/components/common';
  import DesktopWallpaper from '$lib/components/desktop/desktop-wallpaper.svelte';
  import { wallpaperPresets, WALLPAPER_TYPES, type WallpaperSelection } from '$lib/config/wallpapers';
  import { wallpaperStore } from '$lib/stores/wallpaper.svelte';
  import * as m from '$lib/paraglide/messages';

  /**
   * Wallpaper chooser, like macOS's Wallpaper settings: a large preview of the
   * current wallpaper, the built-in presets, and the user's own photo.
   */

  let fileInput = $state<HTMLInputElement | null>(null);

  const current = $derived(wallpaperStore.state);
  const value = $derived(current.selected.kind === 'photo' ? 'photo' : `preset:${current.selected.preset}`);

  async function choose(next: string) {
    if (!next || next === value) return;
    const selection: WallpaperSelection =
      next === 'photo' ? { kind: 'photo' } : { kind: 'preset', preset: next.slice('preset:'.length) };
    try {
      await wallpaperStore.select(selection);
    } catch {
      toast.error(m['wallpaper.toast.saveError']());
    }
  }

  async function handleFile(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (!WALLPAPER_TYPES.includes(file.type)) {
      toast.error(m['wallpaper.toast.badType']());
      return;
    }
    try {
      await wallpaperStore.upload(file);
      toast.success(m['wallpaper.toast.uploaded']());
    } catch {
      toast.error(m['wallpaper.toast.uploadError']());
    }
  }

  async function removePhoto() {
    try {
      await wallpaperStore.removePhoto();
    } catch {
      toast.error(m['wallpaper.toast.saveError']());
    }
  }
</script>

<Card.Root>
  <Card.Header>
    <Card.Title>{m['wallpaper.card.title']()}</Card.Title>
    <Card.Description>{m['wallpaper.card.description']()}</Card.Description>
  </Card.Header>
  <Card.Content class="flex flex-col gap-6">
    <DesktopWallpaper wallpaper={current} class="aspect-video w-full rounded-xl border border-border shadow-sm" />

    <ToggleGroup.Root
      type="single"
      variant="tile"
      size="tile"
      spacing={3}
      aria-label={m['wallpaper.card.title']()}
      {value}
      onValueChange={choose}
      class="grid w-full grid-cols-2 sm:grid-cols-3"
    >
      {#each wallpaperPresets as preset (preset.id)}
        <ToggleGroup.Item value={`preset:${preset.id}`}>
          <span class="block aspect-video w-full overflow-hidden rounded-md border border-border/60">
            <DesktopWallpaper wallpaper={{ selected: { kind: 'preset', preset: preset.id }, photoUrl: null }} class="size-full" />
          </span>
          {preset.getName()}
        </ToggleGroup.Item>
      {/each}
      {#if current.photoUrl}
        <ToggleGroup.Item value="photo">
          <span class="block aspect-video w-full overflow-hidden rounded-md border border-border/60">
            <DesktopWallpaper wallpaper={{ selected: { kind: 'photo' }, photoUrl: current.photoUrl }} class="size-full" />
          </span>
          {m['wallpaper.photo.name']()}
        </ToggleGroup.Item>
      {/if}
    </ToggleGroup.Root>

    {#if wallpaperStore.available}
      <div class="flex flex-col gap-2">
        <Input
          bind:ref={fileInput}
          type="file"
          accept={WALLPAPER_TYPES.join(',')}
          class="sr-only"
          tabindex={-1}
          aria-hidden="true"
          onchange={handleFile}
        />
        <div class="flex flex-col gap-3 sm:flex-row">
          <Button size="touch" variant="outline" disabled={wallpaperStore.busy} onclick={() => fileInput?.click()}>
            {#if wallpaperStore.busy}<Spinner />{:else}<ImagePlusIcon aria-hidden="true" />{/if}
            {current.photoUrl ? m['wallpaper.photo.replace']() : m['wallpaper.photo.add']()}
          </Button>
          {#if current.photoUrl}
            <Button size="touch" variant="destructive-outline" disabled={wallpaperStore.busy} onclick={removePhoto}>
              <Trash2Icon aria-hidden="true" />
              {m['wallpaper.photo.remove']()}
            </Button>
          {/if}
        </div>
        <HintText text={m['wallpaper.photo.hint']()} />
      </div>
    {/if}
  </Card.Content>
</Card.Root>
