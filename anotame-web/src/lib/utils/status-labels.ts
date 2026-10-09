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

/** Statuses an order can still be delivered or cancelled from. */
export const OPEN_ORDER_STATUSES = ['RECEIVED', 'IN_PROGRESS', 'READY'];

export function isOpenOrderStatus(code: string): boolean {
  return OPEN_ORDER_STATUSES.includes(code);
}

/**
 * The status a shop on the simple workflow sees: the steps between received
 * and delivered are not part of its flow, so an order still on one of them
 * (left there before the switch) reads as received.
 */
export function workflowStatus(code: string, simple: boolean): string {
  return simple && isOpenOrderStatus(code) ? 'RECEIVED' : code;
}
