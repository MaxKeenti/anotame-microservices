import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

// Operations only exists on the full workflow (docs/adr/0011). On the simple
// one, a bookmark, a restored window, or an old link lands on Orders instead.
export const load: PageLoad = async ({ parent }) => {
  const { workflowMode } = await parent();
  if (workflowMode === 'SIMPLE') redirect(307, '/dashboard/orders');
};
