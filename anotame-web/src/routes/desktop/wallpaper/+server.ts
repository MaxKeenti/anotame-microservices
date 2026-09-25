import { error, json, type RequestEvent } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	bucketConfigured,
	deleteObject,
	getObjectText,
	presignGet,
	putObject,
} from '$lib/server/assets-bucket';
import {
	DEFAULT_WALLPAPER,
	WALLPAPER_MAX_BYTES,
	WALLPAPER_TYPES,
	wallpaperPresets,
	type WallpaperSelection,
	type WallpaperState,
} from '$lib/config/wallpapers';

/**
 * The signed-in user's desktop wallpaper, kept in the assets bucket under
 * `users/<id>/`: a small JSON record plus the uploaded photo, if any. The
 * photo key carries a version so a new upload never serves a cached old one.
 *
 * GET    → WallpaperState
 * PUT    → choose a preset or the photo      (JSON WallpaperSelection)
 * POST   → upload a photo and select it       (raw image body)
 * DELETE → remove the photo (falls back to the default preset)
 */

type Stored = { selected: WallpaperSelection; photoKey: string | null };

const DEFAULT: Stored = { selected: { kind: 'preset', preset: DEFAULT_WALLPAPER }, photoKey: null };

async function currentUserId(event: RequestEvent): Promise<string> {
	// Same check the admin layout uses: the identity service validates the
	// jwt cookie, which event.fetch forwards through the /api proxy.
	const res = await event.fetch('/api/identity/auth/me');
	if (res.status === 401 || res.status === 403) error(401, 'Not signed in');
	if (!res.ok) error(502, 'Could not verify the session');
	const user = await res.json();
	if (!user?.id) error(401, 'Not signed in');
	return String(user.id);
}

function recordKey(userId: string) {
	return `users/${userId}/wallpaper.json`;
}

async function readStored(userId: string): Promise<Stored> {
	const text = await getObjectText(recordKey(userId));
	if (!text) return DEFAULT;
	try {
		return { ...DEFAULT, ...JSON.parse(text) };
	} catch {
		return DEFAULT;
	}
}

async function writeStored(userId: string, stored: Stored) {
	await putObject(recordKey(userId), JSON.stringify(stored), 'application/json');
}

async function toState(stored: Stored): Promise<WallpaperState> {
	return {
		selected: stored.selected,
		photoUrl: stored.photoKey ? await presignGet(stored.photoKey) : null,
	};
}

function requireBucket() {
	if (!bucketConfigured()) error(503, 'Wallpaper storage is not configured');
}

export const GET: RequestHandler = async (event) => {
	requireBucket();
	const userId = await currentUserId(event);
	return json(await toState(await readStored(userId)), {
		headers: { 'Cache-Control': 'private, no-store' },
	});
};

export const PUT: RequestHandler = async (event) => {
	requireBucket();
	const userId = await currentUserId(event);
	const body = (await event.request.json().catch(() => null)) as WallpaperSelection | null;
	const stored = await readStored(userId);

	if (body?.kind === 'preset' && wallpaperPresets.some((p) => p.id === body.preset)) {
		stored.selected = { kind: 'preset', preset: body.preset };
	} else if (body?.kind === 'photo' && stored.photoKey) {
		stored.selected = { kind: 'photo' };
	} else {
		error(400, 'Unknown wallpaper');
	}

	await writeStored(userId, stored);
	return json(await toState(stored));
};

export const POST: RequestHandler = async (event) => {
	requireBucket();
	const userId = await currentUserId(event);
	const contentType = event.request.headers.get('content-type')?.split(';')[0].trim() ?? '';
	if (!WALLPAPER_TYPES.includes(contentType)) error(415, 'Use a JPEG, PNG, or WebP image');

	const declared = Number(event.request.headers.get('content-length') ?? 0);
	if (declared > WALLPAPER_MAX_BYTES) error(413, 'Image is too large');
	const image = await event.request.arrayBuffer();
	if (image.byteLength === 0) error(400, 'Empty image');
	if (image.byteLength > WALLPAPER_MAX_BYTES) error(413, 'Image is too large');

	const stored = await readStored(userId);
	const previous = stored.photoKey;
	const photoKey = `users/${userId}/wallpaper-${Date.now()}`;
	await putObject(photoKey, image, contentType);

	stored.photoKey = photoKey;
	stored.selected = { kind: 'photo' };
	await writeStored(userId, stored);
	if (previous) await deleteObject(previous).catch(() => {});

	return json(await toState(stored));
};

export const DELETE: RequestHandler = async (event) => {
	requireBucket();
	const userId = await currentUserId(event);
	const stored = await readStored(userId);
	if (stored.photoKey) await deleteObject(stored.photoKey).catch(() => {});
	stored.photoKey = null;
	if (stored.selected.kind === 'photo') stored.selected = DEFAULT.selected;
	await writeStored(userId, stored);
	return json(await toState(stored));
};
