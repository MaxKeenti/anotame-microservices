import type { LayoutServerLoad } from './$types';
import { error, redirect } from '@sveltejs/kit';

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
			const next = encodeURIComponent(`${url.pathname}${url.search}`);
			throw redirect(303, `/login?sessionExpired=1&next=${next}`);
		}

		if (!response.ok) {
			throw error(403, {
				message: 'Unable to verify authorization',
			});
		}

		const user = await response.json();

		// Check if user has ADMIN role
		if (!user || user.role !== 'ADMIN') {
			throw error(403, {
				message: 'Admin access required',
			});
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

		// Network or other errors → deny access
		throw error(403, {
			message: 'Unable to verify authorization',
		});
	}
};
