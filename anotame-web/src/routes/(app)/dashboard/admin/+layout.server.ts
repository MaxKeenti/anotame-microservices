import type { LayoutServerLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: LayoutServerLoad = async ({ fetch }) => {
	// Verify user is authenticated and has ADMIN role at server level
	// This provides defense-in-depth against direct URL access
	try {
		const response = await fetch('/api/identity/me', {
			method: 'GET',
			headers: { 'Content-Type': 'application/json' },
		});

		if (!response.ok) {
			// Not authenticated or session expired
			throw error(403, {
				message: 'Not authorized to access admin section',
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
