/**
 * Localized labels for backend order and payment status codes.
 *
 * Badges, the bulk-action bar, and the audit log all read from here, so a new
 * status or wording change happens once. Unknown codes fall back to the raw code.
 */
import * as m from '$lib/paraglide/messages';

const STATUS_LABELS: Record<string, () => string> = {
  RECEIVED: () => m['order.status.received'](),
  IN_PROGRESS: () => m['order.status.inProgress'](),
  READY: () => m['order.status.ready'](),
  DELIVERED: () => m['order.status.delivered'](),
  CANCELLED: () => m['order.status.cancelled'](),
  PENDING: () => m['payment.status.pending'](),
  PAID: () => m['payment.status.paid'](),
  UNPAID: () => m['payment.status.unpaid'](),
};

export function statusLabel(code: string): string {
  return STATUS_LABELS[code]?.() ?? code;
}
