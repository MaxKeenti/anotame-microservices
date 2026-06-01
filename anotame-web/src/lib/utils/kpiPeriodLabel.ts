export type KpiGranularity = 'day' | 'week' | 'month';

const ISO_DAY = /^(\d{4})-(\d{2})-(\d{2})$/;
const ISO_MONTH = /^(\d{4})-(\d{2})$/;
const ISO_WEEK = /^(?:\d{4}-)?W?(\d{1,2})$/i;

export function getFinancialKpiPeriodLabel(
  period: string,
  granularity: KpiGranularity,
  locale = 'es-MX'
): string {
  const normalized = period.trim();

  if (granularity === 'week') {
    return formatWeekPeriod(normalized);
  }

  if (granularity === 'month') {
    const monthDate = parseMonthPeriod(normalized);
    return monthDate
      ? monthDate.toLocaleDateString(locale, { month: 'short', year: '2-digit' })
      : normalized;
  }

  const dayDate = parseDayPeriod(normalized);
  return dayDate
    ? dayDate.toLocaleDateString(locale, { weekday: 'short', month: 'numeric', day: 'numeric' })
    : normalized;
}

function formatWeekPeriod(period: string): string {
  const match = ISO_WEEK.exec(period);
  if (!match) {
    return period;
  }

  const week = Number(match[1]);
  return Number.isInteger(week) && week >= 1 && week <= 53 ? `W${week}` : period;
}

function parseDayPeriod(period: string): Date | null {
  const match = ISO_DAY.exec(period);
  if (!match) {
    return parseValidDate(period);
  }

  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return date.getFullYear() === Number(match[1]) &&
    date.getMonth() === Number(match[2]) - 1 &&
    date.getDate() === Number(match[3])
    ? date
    : null;
}

function parseMonthPeriod(period: string): Date | null {
  const match = ISO_MONTH.exec(period);
  if (!match) {
    return parseValidDate(period);
  }

  const month = Number(match[2]);
  return month >= 1 && month <= 12 ? new Date(Number(match[1]), month - 1, 1) : null;
}

function parseValidDate(period: string): Date | null {
  const date = new Date(period);
  return Number.isNaN(date.getTime()) ? null : date;
}
