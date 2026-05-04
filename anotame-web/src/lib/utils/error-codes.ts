import * as m from '$lib/paraglide/messages.js';
import type { ApiError } from '$lib/services/ApiError';

/**
 * Maps a backend errorCode to a localized user-facing message via Paraglide.
 * Falls back to a generic error message when the code is unknown.
 *
 * Use this as a last resort in generic catch blocks — prefer specific status-code
 * checks (e.g. e.status === 409) with dedicated message keys for known flows.
 */
export function resolveApiError(error: ApiError): string {
  switch (error.errorCode) {
    case 'VALIDATION_FAILED':
      return m['error.code.validationFailed']();
    case 'DOMAIN_EXCEPTION':
      return m['error.code.domainException']();
    case 'NOT_FOUND':
      return m['error.code.notFound']();
    case 'CONFLICT':
      return m['error.code.conflict']();
    case 'INVALID_REQUEST':
      return m['error.code.invalidRequest']();
    case 'REQUEST_FAILED':
      return m['error.code.requestFailed']();
    case 'INTERNAL_ERROR':
      return m['error.code.internalError']();
    default:
      return m['error.code.requestFailed']();
  }
}
