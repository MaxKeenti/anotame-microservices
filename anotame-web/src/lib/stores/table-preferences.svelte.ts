import { PersistedState } from 'runed';

export const PAGE_SIZE_OPTIONS = [5, 10, 20, 50] as const;
type PageSizeOption = (typeof PAGE_SIZE_OPTIONS)[number];

const _pageSize = new PersistedState<number>('table_page_size', 20);

export const tablePreferences = {
	get pageSize(): number {
		const stored = _pageSize.current;
		return (PAGE_SIZE_OPTIONS as readonly number[]).includes(stored) ? stored : 20;
	},
	setPageSize(n: number): void {
		if ((PAGE_SIZE_OPTIONS as readonly number[]).includes(n)) {
			_pageSize.current = n as PageSizeOption;
		}
	},
};
