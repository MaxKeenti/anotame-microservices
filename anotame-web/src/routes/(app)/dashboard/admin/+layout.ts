import type { LayoutLoad } from './$types';
import { error } from '@sveltejs/kit';
import { API_IDENTITY } from '$lib/services/api.svelte';

export const load: LayoutLoad = async ({ fetch }) => {
	// Defense-in-depth check — backend enforces ADMIN role on every
	// protected endpoint, this guards the dashboard against direct navigation.
	try {
		const response = await fetch(`${API_IDENTITY}/auth/me`, {
			method: 'GET',
			headers: { 'Content-Type': 'application/json' },
		});

		if (!response.ok) {
			throw error(403, {
				message: 'Not authorized to access admin section',
			});
		}

		const user = await response.json();

		if (!user || user.role !== 'ADMIN') {
			throw error(403, {
				message: 'Admin access required',
			});
		}

		return {
			user,
		};
	} catch (err: any) {
		if (err.status) {
			throw err;
		}

		throw error(403, {
			message: 'Unable to verify authorization',
		});
	}
};
