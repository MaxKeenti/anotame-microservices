import { PersistedState } from 'runed';

export type TenantTheme = {
	primaryColor: string | null; // Hex format: "#FF6B6B", nullable
	fontFamily: 'Inter' | 'Outfit' | 'Merriweather' | null; // Preset fonts or null
};

const DEFAULT_THEME: TenantTheme = {
	primaryColor: null,
	fontFamily: null,
};

// PersistedState automatically persists to localStorage, survives page reload
const _theme = new PersistedState<TenantTheme>('tenant_theme', DEFAULT_THEME);

export const tenantThemeStore = {
	get current(): TenantTheme {
		return _theme.current ?? DEFAULT_THEME;
	},

	set(updates: Partial<TenantTheme>) {
		_theme.current = { ...this.current, ...updates };
	},

	hasCustom(): boolean {
		return this.current.primaryColor !== null || this.current.fontFamily !== null;
	},

	reset() {
		_theme.current = DEFAULT_THEME;
	},
};
