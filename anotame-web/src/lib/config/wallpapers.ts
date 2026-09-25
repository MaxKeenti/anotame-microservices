import * as m from '$lib/paraglide/messages';

/**
 * Built-in desktop wallpapers. Gradients are built from theme tokens, so they
 * follow the tenant colour and dark mode like the rest of the UI.
 */
export type WallpaperPreset = {
	id: string;
	getName: () => string;
	/** Background classes for the wallpaper surface. */
	class: string;
};

export const wallpaperPresets: WallpaperPreset[] = [
	{ id: 'plain', getName: () => m['wallpaper.preset.plain'](), class: 'bg-background' },
	{ id: 'anotame', getName: () => m['wallpaper.preset.anotame'](), class: 'bg-linear-to-br from-primary/35 via-background to-primary/15' },
	{ id: 'sunrise', getName: () => m['wallpaper.preset.sunrise'](), class: 'bg-linear-to-br from-warning/40 via-background to-destructive/25' },
	{ id: 'mint', getName: () => m['wallpaper.preset.mint'](), class: 'bg-linear-to-br from-success/35 via-background to-info/25' },
	{ id: 'sky', getName: () => m['wallpaper.preset.sky'](), class: 'bg-linear-to-b from-info/40 via-background to-primary/15' },
	{ id: 'dusk', getName: () => m['wallpaper.preset.dusk'](), class: 'bg-linear-to-tr from-primary/40 via-destructive/15 to-info/30' },
];

export const DEFAULT_WALLPAPER = 'anotame';

/** What the user chose: a preset, or their uploaded photo. */
export type WallpaperSelection = { kind: 'preset'; preset: string } | { kind: 'photo' };

/** The user's wallpaper as the server returns it. */
export type WallpaperState = {
	selected: WallpaperSelection;
	/** Time-limited URL of the uploaded photo, when there is one. */
	photoUrl: string | null;
};

export const WALLPAPER_MAX_BYTES = 10 * 1024 * 1024;
export const WALLPAPER_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
