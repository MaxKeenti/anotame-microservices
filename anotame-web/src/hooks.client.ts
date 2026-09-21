import type { HandleClientError } from '@sveltejs/kit';
import {
	BACKEND_UNAVAILABLE_ERROR,
	UNHANDLED_ERROR,
	isBackendUnavailableError,
} from '$lib/errors/backend-unavailable';

/**
 * Mirrors the server `handleError` for client-side navigations: logs the failure under an
 * `errorId` the user can quote, and hands the error page a stable code instead of raw text.
 */
export const handleError: HandleClientError = ({ error, status, message }) => {
	const errorId = crypto.randomUUID();
	console.error('[unhandled-error]', { errorId, status, message, error });

	return {
		message: isBackendUnavailableError(error) ? BACKEND_UNAVAILABLE_ERROR : UNHANDLED_ERROR,
		errorId,
	};
};
