// In-memory record of what the user has opened this session, so the dock can
// behave like macOS: reopening an app returns to its last section, and apps
// outside the pinned set show up as recents.
let _lastSection = $state<Record<string, string>>({});
let _recentApps = $state<string[]>([]);

export const appSessionStore = {
	/** Href of the last section visited in each app, keyed by app key. */
	get lastSection(): Record<string, string> {
		return _lastSection;
	},
	/** App keys, most recently opened first. */
	get recentApps(): string[] {
		return _recentApps;
	},
	visit(appKey: string, sectionHref: string) {
		if (_lastSection[appKey] !== sectionHref) {
			_lastSection = { ..._lastSection, [appKey]: sectionHref };
		}
		if (_recentApps[0] !== appKey) {
			_recentApps = [appKey, ..._recentApps.filter((key) => key !== appKey)].slice(0, 10);
		}
	},
};
