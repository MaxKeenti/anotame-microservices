import { error } from '@sveltejs/kit';
import { BACKEND_UNAVAILABLE_ERROR, isBackendUnavailableStatus } from '$lib/errors/backend-unavailable';
import type { PageServerLoad } from './$types';
import type { PublicReceiptSettings, PublicTicketResponse } from '$lib/types/dtos';

export const load: PageServerLoad = async ({ params, fetch, setHeaders }) => {
  setHeaders({
    'Cache-Control': 'no-store',
    'Referrer-Policy': 'no-referrer',
    'X-Robots-Tag': 'noindex, nofollow',
  });

  const ticketResponse = await fetch(`/api/sales/tickets/shared/${encodeURIComponent(params.token)}`);
  if (isBackendUnavailableStatus(ticketResponse.status)) {
    throw error(503, BACKEND_UNAVAILABLE_ERROR);
  }
  if (!ticketResponse.ok) {
    throw error(404, 'Ticket not available');
  }

  const ticket = await ticketResponse.json() as PublicTicketResponse;
  let establishment: PublicReceiptSettings = { name: 'ANOTAME' };
  try {
    const settingsResponse = await fetch('/api/operations/establishment/public-receipt-settings');
    if (settingsResponse.ok) establishment = await settingsResponse.json() as PublicReceiptSettings;
  } catch {
    // A ticket remains usable if non-essential receipt branding is temporarily unavailable.
  }

  return { ticket, establishment };
};
