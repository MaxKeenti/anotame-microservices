import { resolveApp, resolveSection } from '$lib/config/apps';
import { appSessionStore } from '$lib/stores/app-session.svelte';

/**
 * Window manager for the desktop mode (see docs/adr/0008). One window per app,
 * like macOS apps; each keeps its own URL and back history. The layout decides
 * when desktop mode is active; this store only holds and mutates the windows.
 */

export type AppWindow = {
	appKey: string;
	/** Path plus search, e.g. `/dashboard/orders/42?action=print`. */
	url: string;
	/** Earlier URLs, most recent last, for the window's back button. */
	history: string[];
	/** Bumped on every navigation that should reload the content. */
	rev: number;
	x: number;
	y: number;
	w: number;
	h: number;
	/** Stacking order; higher is in front. */
	z: number;
	minimized: boolean;
	maximized: boolean;
	/** Size before the window was tiled or snapped; dragging it away restores this. */
	preTile?: { w: number; h: number } | null;
};

/** Window placements from the Window menu and edge snapping, like macOS. */
export type TileLayout =
	| 'fill'
	| 'center'
	| 'left'
	| 'right'
	| 'top'
	| 'bottom'
	| 'top-left'
	| 'top-right'
	| 'bottom-left'
	| 'bottom-right';

type Bounds = { width: number; height: number };

/** Clearance kept free for the floating dock at the bottom of the desktop. */
export const DOCK_CLEARANCE = 88;
const MIN_W = 420;
const MIN_H = 280;
/** Smallest window, shared with the resize handles. */
export const MIN_WINDOW = { w: MIN_W, h: MIN_H };
/** Gap kept around tiled windows. */
const TILE_GAP = 8;
const CASCADE = 32;

let _windows = $state<AppWindow[]>([]);
let _bounds = $state<Bounds>({ width: 1280, height: 720 });
let _enabled = $state(true);
let _wide = $state(false);
/** The signed-in user's saved desktop has been loaded. */
let _ready = $state(false);
let _storageKey: string | null = null;
let _snapPreview = $state<TileLayout | null>(null);
let _zTop = 1;

function persist() {
	if (!_storageKey || typeof localStorage === 'undefined') return;
	const windows = _windows.map(({ rev: _rev, ...rest }) => rest);
	localStorage.setItem(_storageKey, JSON.stringify({ enabled: _enabled, windows }));
}

function clampGeometry(win: Pick<AppWindow, 'x' | 'y' | 'w' | 'h'>) {
	const maxH = Math.max(MIN_H, _bounds.height - DOCK_CLEARANCE);
	const w = Math.min(Math.max(win.w, MIN_W), _bounds.width);
	const h = Math.min(Math.max(win.h, MIN_H), maxH);
	// Keep at least the title bar reachable.
	const x = Math.min(Math.max(win.x, 0), Math.max(0, _bounds.width - w));
	const y = Math.min(Math.max(win.y, 0), Math.max(0, maxH - h));
	return { x, y, w, h };
}

/** Where a layout puts a window within the current desktop. */
export function tileGeometry(layout: TileLayout, current?: { w: number; h: number }) {
	const W = _bounds.width;
	const H = _bounds.height - DOCK_CLEARANCE;
	const g = TILE_GAP;
	const halfW = (W - g * 3) / 2;
	const halfH = (H - g * 3) / 2;
	switch (layout) {
		case 'fill':
			return { x: g, y: g, w: W - g * 2, h: H - g * 2 };
		case 'center': {
			const w = Math.min(current?.w ?? W * 0.7, W - g * 2);
			const h = Math.min(current?.h ?? H * 0.8, H - g * 2);
			return { x: (W - w) / 2, y: (H - h) / 2, w, h };
		}
		case 'left':
			return { x: g, y: g, w: halfW, h: H - g * 2 };
		case 'right':
			return { x: g * 2 + halfW, y: g, w: halfW, h: H - g * 2 };
		case 'top':
			return { x: g, y: g, w: W - g * 2, h: halfH };
		case 'bottom':
			return { x: g, y: g * 2 + halfH, w: W - g * 2, h: halfH };
		case 'top-left':
			return { x: g, y: g, w: halfW, h: halfH };
		case 'top-right':
			return { x: g * 2 + halfW, y: g, w: halfW, h: halfH };
		case 'bottom-left':
			return { x: g, y: g * 2 + halfH, w: halfW, h: halfH };
		case 'bottom-right':
			return { x: g * 2 + halfW, y: g * 2 + halfH, w: halfW, h: halfH };
	}
}

function defaultGeometry() {
	const offset = (_windows.length % 5) * CASCADE;
	const w = Math.min(1120, _bounds.width - 48);
	const h = _bounds.height - DOCK_CLEARANCE - 32;
	return clampGeometry({ x: 24 + offset, y: 16 + offset, w, h });
}

function find(appKey: string) {
	return _windows.find((w) => w.appKey === appKey);
}

function recordVisit(win: AppWindow) {
	const section = resolveSection(new URL(win.url, 'http://x').pathname);
	if (section) appSessionStore.visit(win.appKey, section.href);
}

function frontmost(): AppWindow | undefined {
	return _windows.filter((w) => !w.minimized).sort((a, b) => b.z - a.z)[0];
}

export const windowsStore = {
	get windows(): AppWindow[] {
		return _windows;
	},
	/** The window in front, which owns the address bar, menu bar, and dock highlight. */
	get focused(): AppWindow | undefined {
		return frontmost();
	},
	get bounds(): Bounds {
		return _bounds;
	},
	/** Windows are in use: the user wants them and the screen is wide enough. */
	get active(): boolean {
		return _ready && _enabled && _wide;
	},
	/** Set by the shell from the viewport width. */
	setWide(value: boolean) {
		_wide = value;
	},
	/** The user's preference; desktop mode also needs a wide enough screen. */
	get enabled(): boolean {
		return _enabled;
	},
	set enabled(value: boolean) {
		_enabled = value;
		persist();
	},

	/** Loads the signed-in user's saved desktop on this device. */
	restore(username: string, canOpen: (appKey: string) => boolean) {
		_storageKey = `anotame:desktop:${username}`;
		try {
			const saved = JSON.parse(localStorage.getItem(_storageKey) ?? 'null');
			_enabled = saved?.enabled ?? true;
			_windows = ((saved?.windows ?? []) as Omit<AppWindow, 'rev'>[])
				.filter((w) => canOpen(w.appKey))
				.map((w) => ({ ...w, rev: 0 }));
			_zTop = Math.max(1, ..._windows.map((w) => w.z));
		} catch {
			_windows = [];
		}
		_ready = true;
	},

	setBounds(width: number, height: number) {
		if (width <= 0 || height <= 0) return;
		if (width === _bounds.width && height === _bounds.height) return;
		_bounds = { width, height };
		for (const win of _windows) {
			if (!win.maximized) Object.assign(win, clampGeometry(win));
		}
	},

	/**
	 * Opens `href` in its app's window. From outside a window (dock, Launchpad,
	 * menus) an already-open app is just brought forward when `href` is only its
	 * section entry point, so reopening an app keeps a detail page in place.
	 */
	open(href: string, opts: { fromAppKey?: string } = {}): boolean {
		const pathname = new URL(href, 'http://x').pathname;
		const match = resolveApp(pathname);
		if (!match) return false;
		const existing = find(match.app.key);
		if (existing) {
			const fromInside = opts.fromAppKey === existing.appKey;
			const isEntryPoint = href === match.section.href;
			const sameSection =
				resolveSection(new URL(existing.url, 'http://x').pathname)?.key === match.section.key;
			if (existing.url !== href && (fromInside || !isEntryPoint || !sameSection)) {
				this.navigate(existing.appKey, href);
			}
			existing.minimized = false;
			this.focus(existing.appKey);
			return true;
		}
		const win: AppWindow = {
			appKey: match.app.key,
			url: href,
			history: [],
			rev: 0,
			z: ++_zTop,
			minimized: false,
			maximized: false,
			...defaultGeometry(),
		};
		_windows.push(win);
		recordVisit(win);
		persist();
		return true;
	},

	/** Moves a window to `href`; `replace` skips the back history, `silent` keeps the content mounted. */
	navigate(appKey: string, href: string, opts: { replace?: boolean; silent?: boolean } = {}) {
		const win = find(appKey);
		if (!win) return;
		if (!opts.replace && win.url !== href) win.history = [...win.history, win.url].slice(-30);
		win.url = href;
		if (!opts.silent) win.rev++;
		recordVisit(win);
		persist();
	},

	back(appKey: string) {
		const win = find(appKey);
		const previous = win?.history.at(-1);
		if (!win || previous === undefined) return;
		win.history = win.history.slice(0, -1);
		win.url = previous;
		win.rev++;
		recordVisit(win);
		persist();
	},

	focus(appKey: string) {
		const win = find(appKey);
		if (!win || (win.z === _zTop && !win.minimized)) return;
		win.z = ++_zTop;
		win.minimized = false;
		recordVisit(win);
		persist();
	},

	/** Edge-snap target while a window is dragged, drawn as a preview. */
	get snapPreview(): TileLayout | null {
		return _snapPreview;
	},
	setSnapPreview(layout: TileLayout | null) {
		if (_snapPreview !== layout) _snapPreview = layout;
	},

	/** Places a window in a layout, remembering its size to restore on drag. */
	tile(appKey: string, layout: TileLayout) {
		const win = find(appKey);
		if (!win) return;
		if (layout !== 'center' && !win.preTile) win.preTile = { w: win.w, h: win.h };
		const geometry = tileGeometry(layout, win);
		Object.assign(win, clampGeometry(geometry), { maximized: false, minimized: false });
		if (layout === 'center') win.preTile = null;
		win.z = ++_zTop;
		persist();
	},

	/** Drops the remembered pre-tile size, returning it (for dragging a tiled window away). */
	takePreTile(appKey: string): { w: number; h: number } | null {
		const win = find(appKey);
		const size = win?.preTile ?? null;
		if (win) win.preTile = null;
		return size;
	},

	/** Restores every minimized window, like "Bring All to Front". */
	bringAllToFront() {
		for (const win of [..._windows].sort((a, b) => a.z - b.z)) {
			win.minimized = false;
			win.z = ++_zTop;
		}
		persist();
	},

	/** Shows the desktop, like clicking Finder's "Show Desktop". */
	minimizeAll() {
		for (const win of _windows) win.minimized = true;
		persist();
	},

	close(appKey: string) {
		_windows = _windows.filter((w) => w.appKey !== appKey);
		persist();
	},

	minimize(appKey: string) {
		const win = find(appKey);
		if (!win) return;
		win.minimized = true;
		persist();
	},

	toggleMaximize(appKey: string) {
		const win = find(appKey);
		if (!win) return;
		win.maximized = !win.maximized;
		this.focus(appKey);
		persist();
	},

	/** Moves or resizes a window, kept inside the desktop. */
	setGeometry(appKey: string, geometry: Partial<Pick<AppWindow, 'x' | 'y' | 'w' | 'h'>>, save = false) {
		const win = find(appKey);
		if (!win) return;
		Object.assign(win, clampGeometry({ ...win, ...geometry }), { maximized: false });
		if (save) persist();
	},
};
