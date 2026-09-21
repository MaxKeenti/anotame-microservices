import { error } from '@sveltejs/kit';
import { BACKEND_UNAVAILABLE_ERROR, isBackendUnavailableStatus } from '$lib/errors/backend-unavailable';
import type { PageServerLoad } from './$types';
import type { PublicHandlingTicketResponse } from '$lib/types/dtos';

export const load: PageServerLoad = async ({ params, fetch, setHeaders }) => {
  setHeaders({
    'Cache-Control': 'no-store',
    'Referrer-Policy': 'no-referrer',
    'X-Robots-Tag': 'noindex, nofollow',
  });

  const response = await fetch(`/api/sales/tickets/handling/${encodeURIComponent(params.token)}`);
  if (isBackendUnavailableStatus(response.status)) {
    throw error(503, BACKEND_UNAVAILABLE_ERROR);
  }
  if (!response.ok) {
    throw error(404, 'Ticket not available');
  }

  return { ticket: await response.json() as PublicHandlingTicketResponse };
};
