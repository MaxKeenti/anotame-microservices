/** Marker placed in `App.Error.message` so the error page can explain an outage to the user. */
export const BACKEND_UNAVAILABLE_ERROR = 'BACKEND_UNAVAILABLE';

/** Marker placed in `App.Error.message` for any other unexpected failure. */
export const UNHANDLED_ERROR = 'UNHANDLED_ERROR';

/** Proxy statuses meaning the backend never produced a usable answer. */
const UNAVAILABLE_STATUSES = new Set<number>([502, 503, 504]);

/** Error names raised when a call never produced an HTTP response. */
const UNAVAILABLE_ERROR_NAMES = new Set<string>(['AbortError', 'TimeoutError']);

/**
 * Whether an HTTP status coming back through the `/api` proxy means the backend is down.
 * @param status HTTP status code.
 */
export function isBackendUnavailableStatus(status: number): boolean {
	return UNAVAILABLE_STATUSES.has(status);
}

/**
 * Detects failures where the backend could not be reached or did not answer in time,
 * whether thrown by fetch itself or surfaced as an `ApiError`/response with a 502-504 status.
 * @param error Value thrown by a load, action or service call.
 */
export function isBackendUnavailableError(error: unknown): boolean {
	let current: unknown = error;
	for (let depth = 0; depth < 4 && current instanceof Error; depth++) {
		if (UNAVAILABLE_ERROR_NAMES.has(current.name)) {
			return true;
		}
		if (current instanceof TypeError && current.message === 'fetch failed') {
			return true;
		}
		const status = (current as Error & { status?: unknown }).status;
		if (typeof status === 'number' && isBackendUnavailableStatus(status)) {
			return true;
		}
		current = current.cause;
	}
	return false;
}
