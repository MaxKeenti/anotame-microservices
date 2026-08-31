import { redirect } from '@sveltejs/kit';

// The KPI dashboard is a set of tabs; /operacion is the one people open daily.
export function load() {
  redirect(307, '/dashboard/admin/kpi/operacion');
}
