import { apiService, API_SALES } from '$lib/services/api.svelte';
import { adaptiveConfirm } from '$lib/components/ui/responsive/confirm-state.svelte';
import { formatCurrency } from '$lib/utils/formatUtils';
import { toast } from 'svelte-sonner';
import * as m from '$lib/paraglide/messages';

type CancellableOrder = {
  id: string;
  ticketNumber: string;
  amountPaid?: number | null;
};

/**
 * Asks for confirmation and cancels an order that will not be made. The order
 * stays on record as cancelled; money already paid is returned afterwards with
 * a refund, so the confirmation says how much there is to give back.
 * Resolves to `true` when the order was cancelled.
 */
export async function confirmAndCancelOrder(order: CancellableOrder): Promise<boolean> {
  const paid = Number(order.amountPaid ?? 0);
  const ok = await adaptiveConfirm({
    title: m['orders.cancel.title'](),
    description: paid > 0
      ? m['orders.cancel.descriptionPaid']({ ticket: order.ticketNumber, amount: formatCurrency(paid) })
      : m['orders.cancel.description']({ ticket: order.ticketNumber }),
  });
  if (!ok) return false;

  try {
    await apiService.request(`${API_SALES}/orders/${order.id}/cancel`, { method: 'PATCH' });
    toast.success(m['orders.cancel.success'](), { description: order.ticketNumber });
    return true;
  } catch (e: any) {
    console.error(e);
    toast.error(m['orders.cancel.error'](), { description: e?.message });
    return false;
  }
}
