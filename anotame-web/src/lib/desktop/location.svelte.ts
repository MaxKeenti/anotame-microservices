import { page } from '$app/state';
import { windowsStore } from './windows.svelte';

/**
 * The path the user is looking at: the focused window's in desktop mode (the
 * home page when none is), otherwise the page's. Read it inside `$derived`.
 */
export function currentPathname(): string {
	if (!windowsStore.active) return page.url.pathname;
	const focused = windowsStore.focused;
	return focused ? new URL(focused.url, 'http://x').pathname : '/dashboard';
}
