import { PersistedState } from 'runed';
import { authService } from '$lib/services/auth.svelte';

export type UserPalette = {
	primary: string | null;
	accent: string | null;
	destructive: string | null;
};

const DEFAULT_PALETTE: UserPalette = {
	primary: null,
	accent: null,
	destructive: null,
};

// All users' palettes stored as one map: { [userId]: UserPalette }
const _allPalettes = new PersistedState<Record<string, UserPalette>>('user_palettes', {});

export const paletteStore = {
	get current(): UserPalette {
		const userId = authService.user?.id;
		if (!userId) return DEFAULT_PALETTE;
		return _allPalettes.current[userId] ?? DEFAULT_PALETTE;
	},

	set(updates: Partial<UserPalette>) {
		const userId = authService.user?.id;
		if (!userId) return;
		_allPalettes.current = {
			..._allPalettes.current,
			[userId]: { ...this.current, ...updates },
		};
	},

	reset() {
		const userId = authService.user?.id;
		if (!userId) return;
		const copy = { ..._allPalettes.current };
		delete copy[userId];
		_allPalettes.current = copy;
	},

	hasCustom(): boolean {
		return Object.values(this.current).some((v) => v !== null);
	},
};
