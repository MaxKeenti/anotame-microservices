// Open state of the ⌘K command palette, shared so the keyboard shortcut, the
// menu bar, and the palette itself agree on it.
let _open = $state(false);

export const commandPaletteStore = {
	get open(): boolean {
		return _open;
	},
	set open(value: boolean) {
		_open = value;
	},
	toggle() {
		_open = !_open;
	},
};
