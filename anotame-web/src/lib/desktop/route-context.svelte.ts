import { getContext, setContext } from 'svelte';
import { page } from '$app/state';
import { goto, replaceState } from '$app/navigation';

/**
 * The route a page is rendered for. On a full page it is the app's URL; inside
 * a desktop window it is that window's own URL, so pages keep working when
 * several are on screen. Pages read params and navigate through this instead
 * of `page` / `goto` directly.
 */
export type RouteHandle = {
	readonly url: URL;
	readonly params: Record<string, string>;
	/** Navigates this page's frame: the window it lives in, or the whole app. */
	goto(href: string, opts?: { replaceState?: boolean }): Promise<void>;
	/** Rewrites the URL without reloading the page, e.g. to drop a one-shot query flag. */
	replaceUrl(href: string): void;
};

const KEY = Symbol('route-handle');

export function setWindowRoute(handle: RouteHandle) {
	setContext(KEY, handle);
}

const pageRoute: RouteHandle = {
	get url() {
		return page.url;
	},
	get params() {
		return page.params as Record<string, string>;
	},
	goto: (href, opts) => goto(href, opts),
	replaceUrl: (href) => replaceState(href, page.state),
};

/** Must be called during component initialisation. */
export function useRoute(): RouteHandle {
	return getContext<RouteHandle | undefined>(KEY) ?? pageRoute;
}
