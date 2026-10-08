import { getContext, setContext } from 'svelte';
import type { DashboardMetricsResponse } from '$lib/types/dtos';

export type DashboardMetrics = DashboardMetricsResponse;

/**
 * Shared state for the KPI tabs. The layout owns the dashboard payload and the
 * establishment settings so switching tabs does not refetch them; each tab
 * reads what it renders through this context.
 */
export interface KpiDashboard {
  readonly metrics: DashboardMetrics | null;
  readonly isLoading: boolean;
  readonly capacity: number;
  readonly thresholdGreen: number;
  readonly thresholdAmber: number;
  readonly atRiskDaysThreshold: number;
  /** Month driving the cohort finance figures (billed/collected/pending). */
  readonly selectedYear: number;
  readonly selectedMonth: number;
  readonly monthLoading: boolean;
  selectMonth(year: number, month: number): Promise<void>;
}

const KPI_DASHBOARD_KEY = Symbol('kpi-dashboard');

export function setKpiDashboard(dashboard: KpiDashboard): void {
  setContext(KPI_DASHBOARD_KEY, dashboard);
}

export function getKpiDashboard(): KpiDashboard {
  return getContext<KpiDashboard>(KPI_DASHBOARD_KEY);
}

export function getMonthParam(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}
