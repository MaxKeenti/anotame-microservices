import { apiService, API_SALES } from '$lib/services/api.svelte';

interface CalendarDay {
  date: string;
  totalMinutesUsed: number;
  orderCount: number;
  scheduledRevenue: number;
  capacityPercent: number;
  isHoliday: boolean;
  isOpen: boolean;
}

interface CalendarMonthResponse {
  days: CalendarDay[];
}

export async function load({ url }: { url: URL }) {
  const month = url.searchParams.get('month');
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthParam = month || currentMonth;

  try {
    const response = await apiService.request<CalendarMonthResponse>(
      `${API_SALES}/orders/kpi/calendar?month=${monthParam}`
    );

    const [year, monthNum] = monthParam.split('-').map(Number);

    return {
      calendarData: response.days,
      year,
      month: monthNum,
      monthParam
    };
  } catch (error) {
    console.error('Failed to load calendar data:', error);
    const [year, monthNum] = monthParam.split('-').map(Number);
    return {
      calendarData: [],
      year,
      month: monthNum,
      monthParam,
      error: 'Failed to load calendar data'
    };
  }
}
