import type { LayoutLoad } from './$types';
import { API_OPERATIONS } from '$lib/services/api.svelte';

export const load: LayoutLoad = async ({ fetch, depends }) => {
	depends('establishment:theme');

	let establishmentTheme = { primaryColor: null, fontFamily: null };

	try {
		const res = await fetch(`${API_OPERATIONS}/establishment`, {
			method: 'GET',
			headers: { 'Content-Type': 'application/json' },
		});

		if (!res.ok) {
			console.warn(`Failed to load establishment theme: HTTP ${res.status}`);
		} else {
			const establishment = await res.json();
			establishmentTheme = {
				primaryColor: establishment.primaryColor || null,
				fontFamily: establishment.fontFamily || null,
			};
		}
	} catch (err) {
		console.error('Failed to load tenant theme:', err);
	}

	return {
		establishmentTheme,
	};
};
