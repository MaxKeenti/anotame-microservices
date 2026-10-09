import type { LayoutServerLoad } from './$types';
import type { WorkflowMode } from '$lib/stores/workflow.svelte';

export const load: LayoutServerLoad = async ({ fetch, depends }) => {
	// Lets the business settings page refresh this after a save
	depends('establishment:settings');

	// ADD THEME LOADING:
	let establishmentTheme = { primaryColor: null, fontFamily: null };
	// null = not loaded; the client then keeps the last mode it knew
	let workflowMode: WorkflowMode | null = null;

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
			workflowMode = establishment.workflowMode === 'SIMPLE' ? 'SIMPLE' : 'FULL';
		}
	} catch (err) {
		console.error('Failed to load tenant theme:', err);
		// Return default theme on error (app still loads with Anotame defaults)
	}

	return {
		establishmentTheme,
		workflowMode,
	};
};
