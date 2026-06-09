// In-memory state that lets a page temporarily replace the bottom dock with a
// contextual action bar (e.g. bulk editing). A page sets it while a selection
// is active and clears it when done; the (app) layout swaps the dock for this
// bar, which keeps the user on the page until they finish or cancel.
export type DockActionBar = {
	count: number;
	isAdmin: boolean;
	allDraft: boolean;
	onChangeStatus: (status: string) => Promise<void>;
	onDelete: () => Promise<void>;
	onCancel: () => void;
};

let _current = $state<DockActionBar | null>(null);

export const dockActionStore = {
	get current(): DockActionBar | null {
		return _current;
	},
	set(bar: DockActionBar) {
		_current = bar;
	},
	clear() {
		_current = null;
	},
};
