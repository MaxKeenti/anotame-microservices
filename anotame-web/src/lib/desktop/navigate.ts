import { goto } from '$app/navigation';
import { home } from '$lib/config/apps';
import { windowsStore } from './windows.svelte';

/**
 * Opens `href` the way the shell is currently working: in its app's window in
 * desktop mode, otherwise as a normal navigation. Use it instead of `goto` for
 * shell-level navigation (menus, palette); pages use `useRoute().goto`.
 *
 * `fromAppKey` marks an explicit choice inside that app (such as one of its
 * sections), which navigates its window even if the app is already open.
 */
export function navigate(href: string, opts: { fromAppKey?: string } = {}): Promise<void> {
	if (windowsStore.active) {
		if (href === home.href) windowsStore.minimizeAll();
		else if (windowsStore.open(href, opts)) return Promise.resolve();
	}
	return goto(href);
}
