import { PersistedState } from 'runed';
import type { WorkflowMode } from '$lib/types/dtos';

export type { WorkflowMode };

/**
 * The establishment's workflow (docs/adr/0011): `FULL` moves orders through
 * every status from the Operations page; `SIMPLE` shows only received and
 * delivered, handled from the Orders page.
 */

// Persisted so a reload while the settings service is unreachable keeps the
// shop on the workflow it was using, instead of falling back to the default.
const _mode = new PersistedState<WorkflowMode>('workflow_mode', 'FULL');

export const workflowStore = {
	get mode(): WorkflowMode {
		return _mode.current === 'SIMPLE' ? 'SIMPLE' : 'FULL';
	},
	get simple(): boolean {
		return this.mode === 'SIMPLE';
	},
	/** Applies the mode read from the establishment; `null` (not loaded) keeps the last known one. */
	set(mode: WorkflowMode | null | undefined) {
		if (mode && mode !== _mode.current) _mode.current = mode;
	},
};
