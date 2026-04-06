import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ fetch, depends }) => {
	// Register dependency so invalidateAll() works if needed
	depends('establishment:theme');

	// ADD THEME LOADING:
	let establishmentTheme = { primaryColor: null, fontFamily: null };

	try {
		const res = await fetch('/api/operations/establishment', {
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
		// Return default theme on error (app still loads with Anotame defaults)
	}

	return {
		establishmentTheme,
	};
};
