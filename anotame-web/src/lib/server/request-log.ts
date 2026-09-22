import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';

/** Header carrying the per-request correlation ID between browser, SSR, proxy and backend. */
export const REQUEST_ID_HEADER = 'X-Request-Id';

/** Default budget for one proxied backend call before it is aborted and logged as a timeout. */
const DEFAULT_BACKEND_TIMEOUT_MS = 15_000;

/** Whether full request/response payloads are logged. Failures are logged regardless. */
export const apiDebugLogsEnabled = env.API_DEBUG_LOGS === 'true';

/** Milliseconds a backend call may take; overridable through `API_TIMEOUT_MS`. */
export const backendTimeoutMs = (() => {
	const parsed = Number(env.API_TIMEOUT_MS);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_BACKEND_TIMEOUT_MS;
})();

/** Header names whose values must never reach logs. */
const SENSITIVE_HEADERS = new Set<string>(['authorization', 'cookie', 'set-cookie']);

/** Payload fields whose values must never reach logs (compared lowercase). */
const SENSITIVE_FIELDS = new Set<string>([
	'accesstoken',
	'address',
	'authorization',
	'email',
	'jwt',
	'newpassword',
	'oldpassword',
	'password',
	'phone',
	'phonenumber',
	'refreshtoken',
	'rfc',
	'secret',
	'token',
]);

/** Public ticket/tag links grant access on their own, so the token segment is masked. */
const PUBLIC_TOKEN_PATH = /\/tickets\/(shared|handling)\/[^/?]+/;

const MAX_LOGGED_ARRAY_ITEMS = 20;
const MAX_LOGGED_STRING_LENGTH = 512;

const LOG_COLOR = {
	request: '\u001b[36m',
	success: '\u001b[32m',
	clientError: '\u001b[33m',
	serverError: '\u001b[31m',
	reset: '\u001b[0m',
} as const;

export type LogColor = Exclude<keyof typeof LOG_COLOR, 'reset'>;

/**
 * Masks bearer tokens embedded in a URL or path so it is safe to log.
 * @param url Absolute URL or path.
 * @returns The same URL with public ticket tokens replaced.
 */
export function redactUrl(url: string): string {
	return url.replace(PUBLIC_TOKEN_PATH, '/tickets/$1/[REDACTED]');
}

/**
 * Serializes headers for diagnostics with credentials redacted.
 * @param headers Request or response headers.
 * @returns Plain header record safe to log.
 */
export function getLoggableHeaders(headers: Headers): Record<string, string> {
	return Object.fromEntries(
		Array.from(headers.entries(), ([name, value]) => [
			name,
			SENSITIVE_HEADERS.has(name.toLowerCase()) ? '[REDACTED]' : value,
		]),
	);
}

/**
 * Recursively redacts sensitive fields and truncates oversized values.
 * @param value Parsed JSON payload or nested value.
 * @returns Structurally equivalent value safe to log.
 */
export function getLoggablePayload(value: unknown): unknown {
	if (Array.isArray(value)) {
		const items = value.slice(0, MAX_LOGGED_ARRAY_ITEMS).map(getLoggablePayload);
		return value.length > MAX_LOGGED_ARRAY_ITEMS
			? [...items, `[TRUNCATED: ${value.length - MAX_LOGGED_ARRAY_ITEMS} more items]`]
			: items;
	}

	if (typeof value === 'string') {
		return value.length > MAX_LOGGED_STRING_LENGTH
			? `${value.slice(0, MAX_LOGGED_STRING_LENGTH)}[TRUNCATED: ${value.length - MAX_LOGGED_STRING_LENGTH} more characters]`
			: value;
	}

	if (value && typeof value === 'object') {
		return Object.fromEntries(
			Object.entries(value).map(([name, fieldValue]) => [
				name,
				SENSITIVE_FIELDS.has(name.toLowerCase()) ? '[REDACTED]' : getLoggablePayload(fieldValue),
			]),
		);
	}

	return value;
}

/**
 * Decodes an already-buffered body for diagnostics.
 * @param body Raw body bytes, if any.
 * @param contentType Content-Type header of the message.
 * @returns Redacted JSON payload, a marker for non-JSON bodies, or `null` when empty.
 */
export function getLoggableBody(body: ArrayBuffer | undefined, contentType: string | null): unknown {
	if (!body || body.byteLength === 0) {
		return null;
	}
	if (!contentType?.includes('application/json')) {
		return '[NON_JSON_BODY]';
	}
	try {
		return getLoggablePayload(JSON.parse(new TextDecoder().decode(body)));
	} catch {
		return '[INVALID_JSON_BODY]';
	}
}

/**
 * Formats a structured log record: indented JSON locally, one line elsewhere so Railway
 * parses it into filterable fields. Colors are only applied in dev.
 * @param record Structured log record.
 * @param color Semantic color used for local terminals.
 * @returns JSON text, optionally wrapped in ANSI color codes.
 */
export function formatLog(record: Record<string, unknown>, color: LogColor): string {
	const json = JSON.stringify(record, null, dev ? 2 : undefined);
	return dev ? `${LOG_COLOR[color]}${json}${LOG_COLOR.reset}` : json;
}

/**
 * Picks the log color for an HTTP status.
 * @param status HTTP status code.
 */
export function colorForStatus(status: number): LogColor {
	return status >= 500 ? 'serverError' : status >= 400 ? 'clientError' : 'success';
}

/**
 * Where a failed backend call most likely broke, so logs answer "frontend or backend?" directly.
 * - `network`: the service could not be reached (DNS, refused connection, TLS, cold container).
 * - `timeout`: the service was reached but did not answer within `API_TIMEOUT_MS`.
 * - `gateway`: an intermediary (Railway edge) failed with 502/503/504.
 * - `backend`: the service answered with another 5xx.
 * - `auth`: the service rejected the session (401/403).
 * - `request`: the service rejected what the frontend sent (other 4xx).
 */
export type BackendFailureOrigin = 'network' | 'timeout' | 'gateway' | 'backend' | 'auth' | 'request';

const TIMEOUT_ERROR_CODES = new Set<string>([
	'ETIMEDOUT',
	'UND_ERR_CONNECT_TIMEOUT',
	'UND_ERR_HEADERS_TIMEOUT',
	'UND_ERR_BODY_TIMEOUT',
]);

const TIMEOUT_ERROR_NAMES = new Set<string>(['AbortError', 'TimeoutError']);

/** Maximum depth walked along an error's `cause` chain. */
const MAX_CAUSE_DEPTH = 4;

/**
 * Finds the first system error code (e.g. `ECONNREFUSED`) along the cause chain.
 * Node's fetch throws `TypeError: fetch failed` and keeps the real reason in `cause.code`.
 * @param error Value thrown by a fetch.
 * @returns The error code, or `null` when none is present.
 */
export function getErrorCode(error: unknown): string | null {
	let current: unknown = error;
	for (let depth = 0; depth < MAX_CAUSE_DEPTH && current instanceof Error; depth++) {
		const code = (current as Error & { code?: unknown }).code;
		if (typeof code === 'string' && code.length > 0) {
			return code;
		}
		current = current.cause;
	}
	return null;
}

/**
 * Classifies a backend call that threw before returning a response.
 * @param error Value thrown by the backend fetch.
 * @returns `timeout` for aborted or timed-out calls, `network` otherwise.
 */
export function classifyFetchError(error: unknown): BackendFailureOrigin {
	const code = getErrorCode(error);
	if (code !== null && TIMEOUT_ERROR_CODES.has(code)) {
		return 'timeout';
	}

	let current: unknown = error;
	for (let depth = 0; depth < MAX_CAUSE_DEPTH && current instanceof Error; depth++) {
		if (TIMEOUT_ERROR_NAMES.has(current.name)) {
			return 'timeout';
		}
		current = current.cause;
	}

	return 'network';
}

/**
 * Classifies a backend response by the layer that most likely produced its failure status.
 * @param status HTTP status returned by the backend.
 * @returns Failure origin, or `null` when the response is not a failure.
 */
export function classifyResponseStatus(status: number): BackendFailureOrigin | null {
	if (status < 400) return null;
	if (status === 401 || status === 403) return 'auth';
	if (status === 502 || status === 503 || status === 504) return 'gateway';
	if (status >= 500) return 'backend';
	return 'request';
}

/**
 * Reduces a thrown value to loggable fields, keeping the root cause Node's fetch hides.
 * @param error Any thrown value.
 * @returns Name, redacted message, code and first cause.
 */
export function describeError(error: unknown): Record<string, unknown> {
	if (!(error instanceof Error)) {
		return { name: 'NonError', message: String(getLoggablePayload(String(error))) };
	}

	const code = getErrorCode(error);
	const cause = error.cause;
	return {
		name: error.name,
		message: String(getLoggablePayload(error.message)),
		...(code === null ? {} : { code }),
		...(cause instanceof Error
			? { cause: cause.name, causeMessage: String(getLoggablePayload(cause.message)) }
			: {}),
		...(dev && error.stack ? { stack: error.stack } : {}),
	};
}
