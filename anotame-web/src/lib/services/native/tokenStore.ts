import { Preferences } from '@capacitor/preferences';

const KEY = 'anotame_jwt';

export const tokenStore = {
	async get(): Promise<string | null> {
		const { value } = await Preferences.get({ key: KEY });
		return value;
	},
	async set(token: string): Promise<void> {
		await Preferences.set({ key: KEY, value: token });
	},
	async clear(): Promise<void> {
		await Preferences.remove({ key: KEY });
	}
};
