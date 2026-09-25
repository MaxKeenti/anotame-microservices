import type { Component } from 'svelte';

/**
 * Maps a dashboard URL to the page and layout components SvelteKit would
 * render for it, so a window can mount the same route without navigating.
 * Built from the route files themselves, so new pages need no registration.
 */

type ComponentModule = { default: Component<any> };
type Loader = () => Promise<ComponentModule>;

// `(app)` is matched with `*` because parentheses are glob syntax.
const pageModules = import.meta.glob<ComponentModule>('/src/routes/*/dashboard/**/+page.svelte');
const layoutModules = import.meta.glob<ComponentModule>('/src/routes/*/dashboard/**/+layout.svelte');

const APP_ROOT = '/src/routes/(app)';

type RouteDef = {
	pattern: RegExp;
	paramNames: string[];
	/** Route directory with groups kept, e.g. `/dashboard/orders/[id]`. */
	dir: string;
	load: Loader;
	/** Dynamic segments; fewer wins, so `/orders/new` beats `/orders/[id]`. */
	dynamicCount: number;
};

function toRouteDef(file: string, load: Loader): RouteDef {
	const dir = file.slice(APP_ROOT.length).replace(/\/\+page\.svelte$/, '');
	const paramNames: string[] = [];
	const source = dir
		.split('/')
		.filter((segment) => segment && !/^\(.+\)$/.test(segment))
		.map((segment) => {
			const param = /^\[(\w+)\]$/.exec(segment);
			if (param) {
				paramNames.push(param[1]);
				return '([^/]+)';
			}
			return segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		})
		.join('/');
	return { pattern: new RegExp(`^/${source}/?$`), paramNames, dir, load, dynamicCount: paramNames.length };
}

const routes: RouteDef[] = Object.entries(pageModules)
	.filter(([file]) => file.startsWith(`${APP_ROOT}/`))
	.map(([file, load]) => toRouteDef(file, load))
	.sort((a, b) => a.dynamicCount - b.dynamicCount);

/** Layouts between the `(app)` shell and the page, outermost first. */
function layoutLoadersFor(dir: string): Loader[] {
	const loaders: Loader[] = [];
	const segments = dir.split('/').filter(Boolean);
	for (let i = 1; i <= segments.length; i++) {
		const file = `${APP_ROOT}/${segments.slice(0, i).join('/')}/+layout.svelte`;
		if (layoutModules[file]) loaders.push(layoutModules[file]);
	}
	return loaders;
}

export type WindowRouteMatch = {
	params: Record<string, string>;
	/** Resolves layouts then the page, outermost first. */
	loadStack: () => Promise<Component<any>[]>;
};

/** The route a window can host for `pathname`; the home page is the desktop itself, never a window. */
export function matchWindowRoute(pathname: string): WindowRouteMatch | undefined {
	if (pathname === '/dashboard' || pathname === '/dashboard/') return undefined;
	for (const route of routes) {
		const match = route.pattern.exec(pathname);
		if (!match) continue;
		const params = Object.fromEntries(
			route.paramNames.map((name, i) => [name, decodeURIComponent(match[i + 1])])
		);
		const loaders = [...layoutLoadersFor(route.dir), route.load];
		return {
			params,
			loadStack: async () => (await Promise.all(loaders.map((load) => load()))).map((m) => m.default),
		};
	}
	return undefined;
}
