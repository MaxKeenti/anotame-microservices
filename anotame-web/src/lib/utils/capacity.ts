/**
 * Workload capacity levels and the semantic colours that represent them.
 *
 * Every view that colours a day by how full it is — calendar cells, the agenda,
 * the week widget, the KPI legend — reads from here, so a threshold or palette
 * change happens once. Classes use the theme's semantic tokens, which already
 * carry their own dark-mode values; no `dark:` overrides are needed.
 */

export type CapacityLevel = 'low' | 'medium' | 'high';

export interface CapacityThresholds {
	/** Below this percentage a day is comfortably loaded. */
	green: number;
	/** At or above this percentage a day is at risk. */
	amber: number;
}

/** Classifies a day's load against the establishment's thresholds. */
export function capacityLevel(percent: number, thresholds: CapacityThresholds): CapacityLevel {
	if (percent >= thresholds.amber) return 'high';
	if (percent >= thresholds.green) return 'medium';
	return 'low';
}

export interface CapacityTone {
	/** Solid fill for bars and swatches. */
	bar: string;
	/** Readable foreground for figures and labels. */
	text: string;
	/** Tinted background and border for a whole cell or card. */
	surface: string;
	/** Tinted pill for a compact figure. */
	chip: string;
}

export const CAPACITY_TONE: Record<CapacityLevel, CapacityTone> = {
	low: {
		bar: 'bg-success',
		text: 'text-success-text',
		surface: 'bg-success-muted border-success-border',
		chip: 'bg-success-muted text-success-text',
	},
	medium: {
		bar: 'bg-warning',
		text: 'text-warning-text',
		surface: 'bg-warning-muted border-warning-border',
		chip: 'bg-warning-muted text-warning-text',
	},
	high: {
		bar: 'bg-destructive',
		text: 'text-destructive-text',
		surface: 'bg-destructive-muted border-destructive-border',
		chip: 'bg-destructive-muted text-destructive-text',
	},
};

/** Tone for a load percentage, in one call. */
export function capacityTone(percent: number, thresholds: CapacityThresholds): CapacityTone {
	return CAPACITY_TONE[capacityLevel(percent, thresholds)];
}

/** A holiday is closed regardless of load, so it always reads as unavailable. */
export const HOLIDAY_TONE = CAPACITY_TONE.high;

/** Marks today in any calendar view. */
export const TODAY_RING = 'ring-2 ring-info ring-offset-2';
