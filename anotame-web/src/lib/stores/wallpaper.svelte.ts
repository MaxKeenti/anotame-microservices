import {
	DEFAULT_WALLPAPER,
	WALLPAPER_MAX_BYTES,
	type WallpaperSelection,
	type WallpaperState,
} from '$lib/config/wallpapers';

// The signed-in user's desktop wallpaper, synced with /desktop/wallpaper
// (stored per user in the assets bucket, so it follows them across devices).

const ENDPOINT = '/desktop/wallpaper';
/** Longest side of an uploaded photo; larger ones are scaled down first. */
const MAX_EDGE = 2560;

let _state = $state<WallpaperState>({
	selected: { kind: 'preset', preset: DEFAULT_WALLPAPER },
	photoUrl: null,
});
let _available = $state(true);
let _busy = $state(false);

async function request(init?: RequestInit): Promise<WallpaperState> {
	const res = await fetch(ENDPOINT, init);
	if (res.status === 503) _available = false;
	if (!res.ok) throw new Error(`Wallpaper request failed: HTTP ${res.status}`);
	return res.json();
}

/** Re-encodes big photos to WebP within MAX_EDGE, keeping uploads small. */
async function shrink(file: File): Promise<Blob> {
	const bitmap = await createImageBitmap(file);
	const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
	if (scale === 1 && file.size <= 1.5 * 1024 * 1024) {
		bitmap.close();
		return file;
	}
	const canvas = document.createElement('canvas');
	canvas.width = Math.round(bitmap.width * scale);
	canvas.height = Math.round(bitmap.height * scale);
	canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
	bitmap.close();
	return new Promise((resolve, reject) =>
		canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not encode image'))), 'image/webp', 0.85)
	);
}

export const wallpaperStore = {
	get state(): WallpaperState {
		return _state;
	},
	/** False when the server has no bucket configured; the picker hides uploads. */
	get available(): boolean {
		return _available;
	},
	get busy(): boolean {
		return _busy;
	},

	async load() {
		try {
			_state = await request();
		} catch (err) {
			console.warn('Failed to load wallpaper:', err);
		}
	},

	async select(selection: WallpaperSelection) {
		const previous = _state;
		_state = { ..._state, selected: selection };
		try {
			_state = await request({
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(selection),
			});
		} catch (err) {
			_state = previous;
			throw err;
		}
	},

	async upload(file: File) {
		_busy = true;
		try {
			const image = await shrink(file);
			if (image.size > WALLPAPER_MAX_BYTES) throw new Error('Image is too large');
			_state = await request({
				method: 'POST',
				headers: { 'Content-Type': image.type || file.type },
				body: image,
			});
		} finally {
			_busy = false;
		}
	},

	async removePhoto() {
		_busy = true;
		try {
			_state = await request({ method: 'DELETE' });
		} finally {
			_busy = false;
		}
	},
};
