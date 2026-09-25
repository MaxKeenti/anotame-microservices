// Open state of the Launchpad overlay, shared so the dock and pages (such as
// the home page's shortcut) can both open it.
let _open = $state(false);

export const launchpadStore = {
	get open(): boolean {
		return _open;
	},
	set open(value: boolean) {
		_open = value;
	},
};
