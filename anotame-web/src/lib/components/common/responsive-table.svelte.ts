import { untrack } from 'svelte';
import {
	createTable,
	getCoreRowModel,
	getSortedRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	type ColumnDef,
	type SortingState,
	type PaginationState,
	type ColumnPinningState,
	type RowSelectionState,
	type VisibilityState,
	type ColumnFiltersState,
	type FilterFn,
	type Cell,
	type Row,
	type Table,
	type Updater,
	type RowData,
} from '@tanstack/table-core';

/**
 * Card layout grouping for a column, consumed by CardGridWrapper. Typed once here
 * so both wrappers and every column definition get `meta.cardGroup` for free.
 */
export type CardGroup = 'header' | 'body' | 'hidden';

declare module '@tanstack/table-core' {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	interface ColumnMeta<TData extends RowData, TValue> {
		cardGroup?: CardGroup;
		/**
		 * Turn the raw accessor value into display text. Keep accessors returning raw
		 * values (numbers, timestamps) so sorting compares values, not formatted text.
		 */
		format?: (value: TValue) => string;
		/**
		 * Offer a toolbar select that filters this column to one exact raw value.
		 * Only meaningful for client-side pagination, where every row is loaded.
		 */
		filterOptions?: { value: string; label: string }[];
	}
}

/** Props shared by DataTableWrapper and CardGridWrapper. */
export type ResponsiveTableProps<TData> = {
	columns: ColumnDef<TData>[];
	data: TData[];
	pageSize?: number;
	loading?: boolean;
	emptyMessage?: string;
  filterPlaceholder?: string;
  showFilter?: boolean;
  showPagination?: boolean;
	/** Offer the desktop "Columns" menu for hiding columns. */
	showColumnToggle?: boolean;
	actionCell?: import('svelte').Snippet<[Row<TData>]>;
	cellRenders?: Record<string, import('svelte').Snippet<[Row<TData>]>>;
	bulkActions?: boolean;
	bulkMode?: boolean;
	onSelectionChange?: (selectedRows: TData[]) => void;
	manualPagination?: boolean;
	pageIndex?: number;
	pageCount?: number;
	onPageChange?: (pageIndex: number) => void;
};

/**
 * Geometry of the bulk-selection column, defined once so the header checkbox and
 * the row checkboxes below it occupy the exact same box. Header and body cells
 * must carry `SELECT_COLUMN_CELL_CLASS` and wrap their control in
 * `SELECT_CONTROL_CLASS`; nothing else should hand-tune their padding.
 */
export const SELECT_COLUMN_CELL_CLASS = 'w-12 px-0';
export const SELECT_CONTROL_CLASS = 'flex size-12 items-center justify-center';
export const SELECT_CHECKBOX_CLASS = 'size-5';

/** Column ids that, when present, are picked as the default sort. */
const NAME_COLUMN_IDS = ['name', 'title', 'customer', 'ticketNumber', 'nombre'];

/** Resolve a column's identifier from `id` or `accessorKey`. */
export function getColumnId<TData>(col: ColumnDef<TData>): string {
	const c = col as ColumnDef<TData> & { id?: string; accessorKey?: string | number };
	return c.id ?? (c.accessorKey != null ? String(c.accessorKey) : '');
}

/** Resolve a column's header text, falling back to '' for non-string headers. */
export function getColumnHeader<TData>(col: ColumnDef<TData>): string {
	return typeof col.header === 'string' ? col.header : '';
}

/** Column ids the table owns; they can never be hidden, filtered or sorted by the user. */
const STRUCTURAL_COLUMN_IDS = ['__select__', 'actions'];

/** True for data columns the user may hide or filter (not selection/actions). */
export function isDataColumn(columnId: string): boolean {
	return !STRUCTURAL_COLUMN_IDS.includes(columnId);
}

/** Display text for a row's column: `meta.format` over the raw value, else the value itself. */
export function formatColumnValue<TData>(row: Row<TData>, columnId: string): string {
	const value = row.getValue(columnId);
	const format = row
		.getAllCells()
		.find((c) => c.column.id === columnId)?.column.columnDef.meta?.format;
	if (format) return format(value as never);
	return value == null ? '' : String(value);
}

/** Display text for a single cell. */
export function formatCellValue<TData>(cell: Cell<TData, unknown>): string {
	const value = cell.getValue();
	const format = cell.column.columnDef.meta?.format;
	if (format) return format(value as never);
	return value == null ? '' : String(value);
}

/**
 * Global search matches what the user sees, so a formatted date or amount is
 * searchable even though the column's raw value is a timestamp or a number.
 */
const displayTextFilter: FilterFn<unknown> = (row, columnId, filterValue: string) => {
	const needle = String(filterValue ?? '').trim().toLowerCase();
	if (!needle) return true;
	return formatColumnValue(row, columnId).toLowerCase().includes(needle);
};

/** Exact match on the raw value, for `meta.filterOptions` selects. */
const exactValueFilter: FilterFn<unknown> = (row, columnId, filterValue: string) =>
	!filterValue || String(row.getValue(columnId) ?? '') === filterValue;

/** Apply a tanstack updater (value or callback) against the current value. */
function resolveUpdater<T>(updater: Updater<T>, current: T): T {
	return typeof updater === 'function' ? (updater as (old: T) => T)(current) : updater;
}

/** Pick the initial sort: a recognised "name" column, else the first sortable one. */
function computeInitialSorting<TData>(columns: ColumnDef<TData>[]): SortingState {
	const sortableCols = columns.filter(
		(c) => c.enableSorting !== false && getColumnId(c) !== '__select__'
	);
	const nameCol = sortableCols.find((c) => NAME_COLUMN_IDS.includes(getColumnId(c)));
	const targetCol = nameCol ?? sortableCols[0];
	return targetCol ? [{ id: getColumnId(targetCol), desc: false }] : [];
}

export interface ResponsiveTableConfig<TData> {
	/** Reactive getters so the table tracks prop changes across the module boundary. */
	columns: () => ColumnDef<TData>[];
	data: () => TData[];
	/** Page size used while `manualPagination` is on. */
	pageSize: () => number;
	/** Page size seeded into local pagination state (may differ, e.g. a persisted pref). */
	initialPageSize: number;
	bulkActions: () => boolean;
	bulkMode: () => boolean;
	manualPagination: () => boolean;
	pageIndex: () => number;
	pageCount: () => number | undefined;
	/** Maintain a columnPinning slice of state (desktop table only). */
	enableColumnPinning?: boolean;
	onPageChange?: () => ((pageIndex: number) => void) | undefined;
	onSelectionChange?: () => ((selectedRows: TData[]) => void) | undefined;
}

export interface ResponsiveTableState<TData> {
	readonly table: Table<TData>;
	readonly effectiveColumns: ColumnDef<TData>[];
	globalFilter: string;
	sorting: SortingState;
	/** Current value of a column's `meta.filterOptions` select ('' when unfiltered). */
	getColumnFilter(columnId: string): string;
	setColumnFilter(columnId: string, value: string): void;
	/** Drop every selected row. Selection lives here, so callers cannot clear it alone. */
	clearSelection(): void;
}

/**
 * Shared sorting / filtering / pagination / selection machinery for the responsive
 * table wrappers. Call once from a component `<script>`; the runes here run inside
 * the calling component's reactive scope.
 */
export function createResponsiveTable<TData>(
	config: ResponsiveTableConfig<TData>
): ResponsiveTableState<TData> {
	let sorting = $state<SortingState>(untrack(() => computeInitialSorting(config.columns())));
	let globalFilter = $state('');
	let pagination = $state<PaginationState>({ pageIndex: 0, pageSize: config.initialPageSize });
	let columnPinning = $state<ColumnPinningState>({ left: [], right: [] });
	let rowSelection = $state<RowSelectionState>({});
	let columnVisibility = $state<VisibilityState>({});
	let columnFilters = $state<ColumnFiltersState>([]);

	const effectivePagination = $derived(
		config.manualPagination()
			? { pageIndex: config.pageIndex(), pageSize: config.pageSize() }
			: pagination
	);

	const selectionColumn = {
		id: '__select__',
		size: 48,
		enableSorting: false,
		enableHiding: false,
		header: '__select__',
		cell: '__select__',
	} as unknown as ColumnDef<TData>;

	const effectiveColumns = $derived(
		config.bulkActions() && config.bulkMode()
			? [selectionColumn, ...config.columns()]
			: config.columns()
	);

	// Reset pagination whenever a filter changes.
	$effect(() => {
		void globalFilter;
		void columnFilters;
		untrack(() => {
			if (config.manualPagination()) {
				config.onPageChange?.()?.(0);
			} else {
				pagination = { pageIndex: 0, pageSize: pagination.pageSize };
			}
		});
	});

	// Clear selection when bulk mode is turned off.
	$effect(() => {
		if (!config.bulkMode()) {
			rowSelection = {};
		}
	});

	// Clear selection when the underlying data changes.
	$effect(() => {
		void config.data();
		if (config.bulkActions()) {
			untrack(() => {
				rowSelection = {};
			});
		}
	});

	const table = $derived.by(() => {
		const bulk = config.bulkActions();
		const manual = config.manualPagination();
		return createTable<TData>({
			data: config.data(),
			columns: effectiveColumns,
			defaultColumn: {
				// Missing dates/amounts go to the bottom whichever way the column is sorted.
				sortUndefined: 'last',
				filterFn: exactValueFilter as FilterFn<TData>,
			},
			globalFilterFn: displayTextFilter as FilterFn<TData>,
			getColumnCanGlobalFilter: (column) =>
				isDataColumn(column.id) && column.accessorFn != null,
			state: {
				sorting,
				globalFilter,
				columnVisibility,
				columnFilters,
				pagination: effectivePagination,
				...(config.enableColumnPinning ? { columnPinning } : {}),
				...(bulk ? { rowSelection } : {}),
			},
			manualPagination: manual,
			pageCount: manual ? config.pageCount() : undefined,
			onStateChange: () => {},
			onSortingChange: (updater) => {
				sorting = resolveUpdater(updater, sorting);
			},
			onGlobalFilterChange: (updater) => {
				globalFilter = resolveUpdater(updater, globalFilter);
			},
			onColumnVisibilityChange: (updater) => {
				columnVisibility = resolveUpdater(updater, columnVisibility);
			},
			onColumnFiltersChange: (updater) => {
				columnFilters = resolveUpdater(updater, columnFilters);
			},
			onPaginationChange: (updater) => {
				const next = resolveUpdater(updater, effectivePagination);
				if (manual) {
					config.onPageChange?.()?.(next.pageIndex);
				} else {
					pagination = next;
				}
			},
			...(config.enableColumnPinning
				? {
						onColumnPinningChange: (updater) => {
							columnPinning = resolveUpdater(updater, columnPinning);
						},
					}
				: {}),
			...(bulk
				? {
						enableRowSelection: true,
						onRowSelectionChange: (updater) => {
							rowSelection = resolveUpdater(updater, rowSelection);
						},
					}
				: {}),
			getCoreRowModel: getCoreRowModel(),
			getSortedRowModel: getSortedRowModel(),
			getFilteredRowModel: getFilteredRowModel(),
			getPaginationRowModel: getPaginationRowModel(),
			renderFallbackValue: null,
		});
	});

	// Notify when the selection changes.
	$effect(() => {
		const notifySelectionChange = config.onSelectionChange?.();
		if (!config.bulkActions() || !notifySelectionChange) return;
		const selected = table.getSelectedRowModel().rows.map((r) => r.original);
		untrack(() => notifySelectionChange(selected));
	});

	return {
		get table() {
			return table;
		},
		get effectiveColumns() {
			return effectiveColumns;
		},
		get globalFilter() {
			return globalFilter;
		},
		set globalFilter(v: string) {
			globalFilter = v;
		},
		get sorting() {
			return sorting;
		},
		set sorting(v: SortingState) {
			sorting = v;
		},
		getColumnFilter(columnId: string) {
			return String(columnFilters.find((f) => f.id === columnId)?.value ?? '');
		},
		setColumnFilter(columnId: string, value: string) {
			const rest = columnFilters.filter((f) => f.id !== columnId);
			columnFilters = value ? [...rest, { id: columnId, value }] : rest;
		},
		clearSelection() {
			rowSelection = {};
		},
	};
}
