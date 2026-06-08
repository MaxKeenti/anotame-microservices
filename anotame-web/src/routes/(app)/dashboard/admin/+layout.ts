import type { LayoutLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { API_IDENTITY } from '$lib/services/api.svelte';
import { isNativeApp } from '$lib/capacitor';
import { tokenStore } from '$lib/services/native/tokenStore';

function redirectToLogin(url: URL, reason: string, details: Record<string, unknown> = {}) {
	const next = encodeURIComponent(`${url.pathname}${url.search}`);
	console.warn('[admin-auth] Redirecting to login', {
		reason,
		path: `${url.pathname}${url.search}`,
		...details,
	});

	throw redirect(303, `/login?sessionExpired=1&next=${next}`);
}

export const load: LayoutLoad = async ({ fetch, url }) => {
	// Backend enforces ADMIN role on protected endpoints; this guard protects direct navigation.
	try {
		const headers = new Headers({ 'Content-Type': 'application/json' });
		const native = isNativeApp();

		if (native) {
			const token = await tokenStore.get();
			if (token) {
				headers.set('Authorization', `Bearer ${token}`);
			}
		}

		const response = await fetch(`${API_IDENTITY}/auth/me`, {
			method: 'GET',
			headers,
			...(native ? {} : { credentials: 'include' as const }),
		});

		if (response.status === 401 || response.status === 403) {
			redirectToLogin(url, 'auth-me-denied', { status: response.status });
		}

		if (!response.ok) {
			redirectToLogin(url, 'auth-me-unexpected-status', { status: response.status });
		}

		const user = await response.json();

		if (!user || user.role !== 'ADMIN') {
			redirectToLogin(url, 'admin-role-required', { role: user?.role ?? null });
		}

		return {
			user,
		};
	} catch (err: any) {
		if (err.status) {
			throw err;
		}

		redirectToLogin(url, 'auth-me-verification-error', {
			error: err instanceof Error ? err.message : String(err),
		});
	}
};
