import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

function redirectToLogin(url: URL, reason: string, details: Record<string, unknown> = {}) {
	const next = encodeURIComponent(`${url.pathname}${url.search}`);
	console.warn('[admin-auth] Redirecting to login', {
		reason,
		path: `${url.pathname}${url.search}`,
		...details,
	});

	throw redirect(303, `/login?sessionExpired=1&next=${next}`);
}

export const load: LayoutServerLoad = async ({ fetch, url }) => {
	// Verify user is authenticated and has ADMIN role at server level
	// This provides defense-in-depth against direct URL access
	try {
		const response = await fetch('/api/identity/auth/me', {
			method: 'GET',
			headers: { 'Content-Type': 'application/json' },
		});

		if (response.status === 401 || response.status === 403) {
			// Not authenticated or session expired
			redirectToLogin(url, 'auth-me-denied', { status: response.status });
		}

		if (!response.ok) {
			redirectToLogin(url, 'auth-me-unexpected-status', { status: response.status });
		}

		const user = await response.json();

		// Check if user has ADMIN role
		if (!user || user.role !== 'ADMIN') {
			redirectToLogin(url, 'admin-role-required', { role: user?.role ?? null });
		}

		// User is authorized, return their data for child pages
		return {
			user,
		};
	} catch (err: any) {
		// If it's already a SvelteKit error, re-throw it
		if (err.status) {
			throw err;
		}

		redirectToLogin(url, 'auth-me-verification-error', {
			error: err instanceof Error ? err.message : String(err),
		});
	}
};
