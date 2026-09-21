import { env } from '$env/dynamic/public';
import type { Handle, HandleFetch, HandleServerError, RequestEvent } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { paraglideMiddleware } from '$lib/paraglide/server';
import { BACKEND_UNAVAILABLE_ERROR, UNHANDLED_ERROR, isBackendUnavailableError } from '$lib/errors/backend-unavailable';
import {
	REQUEST_ID_HEADER,
	apiDebugLogsEnabled,
	backendTimeoutMs,
	classifyFetchError,
	classifyResponseStatus,
	colorForStatus,
	describeError,
	formatLog,
	getLoggableBody,
	getLoggableHeaders,
	redactUrl,
} from '$lib/server/request-log';

/** Accepted shape for a caller-supplied request ID; anything else is replaced. */
const REQUEST_ID_PATTERN = /^[A-Za-z0-9-]{8,64}$/;

/** Static files and build output skip request tracking and page logging. */
const STATIC_FILE_EXTENSION =
	/\.(css|js|mjs|map|png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|ttf|txt|xml|webmanifest)$/i;

/** Backend response headers passed through to the browser. */
const FORWARDED_RESPONSE_HEADERS = [
	'Content-Type',
	'Cache-Control',
	'Referrer-Policy',
	'X-Robots-Tag',
	'X-Content-Type-Options',
];

/**
 * Maps an incoming /api/<service>/... path segment to the correct backend
 * base URL. Environment variables are injected at runtime (and baked in at
 * build time via the Dockerfile ARGs) so the same image works in every
 * environment.
 *
 * Returns null when no service mapping is found for the given path.
 */
function resolveBackendUrl(apiPath: string): string | null {
	const {
		PUBLIC_IDENTITY_URL,
		PUBLIC_CATALOG_URL,
		PUBLIC_SALES_URL,
		PUBLIC_OPERATIONS_URL,
	} = env;

	if (apiPath.startsWith('identity/') || apiPath === 'identity') {
		const base = PUBLIC_IDENTITY_URL ?? 'http://localhost:8081';
		const rest = apiPath.slice('identity'.length);
		return `${base}${rest}`;
	}
	if (apiPath.startsWith('catalog/') || apiPath === 'catalog') {
		const base = PUBLIC_CATALOG_URL ?? 'http://localhost:8082';
		const rest = apiPath.slice('catalog'.length);
		return `${base}${rest}`;
	}
	if (apiPath.startsWith('sales/') || apiPath === 'sales') {
		const base = PUBLIC_SALES_URL ?? 'http://localhost:8083';
		const rest = apiPath.slice('sales'.length);
		return `${base}${rest}`;
	}
	if (apiPath.startsWith('operations/') || apiPath === 'operations') {
		const base = PUBLIC_OPERATIONS_URL ?? 'http://localhost:8084';
		const rest = apiPath.slice('operations'.length);
		return `${base}${rest}`;
	}

	return null;
}

function proxyError(errorCode: string, message: string, status: number, requestId: string): Response {
	return new Response(
		JSON.stringify({ errorCode, message, details: [], requestId }),
		{ status, headers: { 'Content-Type': 'application/json', [REQUEST_ID_HEADER]: requestId } },
	);
}

function isPublicApiEndpoint(apiPath: string): boolean {
	return /\/(auth\/login|auth\/register)(\/|$|\?)/.test(apiPath)
		|| apiPath.startsWith('sales/tickets/shared/')
		|| apiPath.startsWith('sales/tickets/handling/')
		|| apiPath === 'operations/establishment/public-receipt-settings';
}

function isStaticRequest(pathname: string): boolean {
	return pathname.startsWith('/_app/') || STATIC_FILE_EXTENSION.test(pathname);
}

function elapsedMs(startedAt: number): number {
	return Math.round(performance.now() - startedAt);
}

/**
 * Assigns the request's correlation ID. SSR loads forward theirs through `handleFetch`,
 * so a page render and every `/api` call it triggers share one ID.
 */
const handleRequestId: Handle = ({ event, resolve }) => {
	const incoming = event.request.headers.get(REQUEST_ID_HEADER);
	event.locals.requestId = incoming && REQUEST_ID_PATTERN.test(incoming) ? incoming : crypto.randomUUID();
	event.locals.backendCalls = 0;
	event.locals.failedBackendCalls = 0;
	return resolve(event);
};

/**
 * Forwards an `/api/<service>/...` request to its backend, logging every failure and,
 * with `API_DEBUG_LOGS=true`, full redacted request/response payloads.
 */
async function proxyApiRequest(event: RequestEvent): Promise<Response> {
	const { request, locals } = event;
	const url = new URL(request.url);
	const { requestId } = locals;

	// Strip the leading /api/ prefix to get the service path
	const apiPath = url.pathname.slice('/api/'.length);
	const targetBase = resolveBackendUrl(apiPath);

	if (!targetBase) {
		console.warn(formatLog({
			type: 'proxy-unmapped',
			requestId,
			path: redactUrl(url.pathname),
		}, 'clientError'));
		return proxyError('BACKEND_NOT_CONFIGURED', 'No backend configured for this path', 404, requestId);
	}

	// Preserve the original query string
	const fullTargetUrl = url.search ? `${targetBase}${url.search}` : targetBase;
	const loggedUrl = redactUrl(fullTargetUrl);

	// Build forwarded headers — preserve Content-Type so the backend can
	// correctly parse the request body (e.g. application/json).
	const forwardedHeaders = new Headers();
	forwardedHeaders.set(REQUEST_ID_HEADER, requestId);

	const contentType = request.headers.get('Content-Type');
	if (contentType) {
		forwardedHeaders.set('Content-Type', contentType);
	}

	// Forward Authorization header when present (Bearer tokens, etc.)
	const authorization = request.headers.get('Authorization');
	if (authorization) {
		forwardedHeaders.set('Authorization', authorization);
	}

	// Forward cookies so HttpOnly session cookies reach the backend.
	// Strip the jwt cookie on unauthenticated endpoints (/auth/login,
	// /auth/register) — a stale JWT causes Quarkus SmallRye to reject
	// with 401 even on paths marked "permit".
	const cookie = request.headers.get('Cookie');
	if (cookie) {
		if (isPublicApiEndpoint(apiPath)) {
			const filtered = cookie
				.split(';')
				.map(c => c.trim())
				.filter(c => !c.startsWith('jwt='))
				.join('; ');
			if (filtered) {
				forwardedHeaders.set('Cookie', filtered);
			}
		} else {
			forwardedHeaders.set('Cookie', cookie);
		}
	}

	const requestContext = {
		requestId,
		method: request.method,
		url: loggedUrl,
	};

	// Buffer the body — request.body is a ReadableStream and can only be
	// consumed once. Reading it into an ArrayBuffer here prevents
	// "body already used" errors and guarantees the downstream service
	// receives the complete, unmodified payload.
	let body: ArrayBuffer | undefined;
	if (request.method !== 'GET' && request.method !== 'HEAD') {
		try {
			const buffer = await request.arrayBuffer();
			body = buffer.byteLength > 0 ? buffer : undefined;
		} catch (err) {
			console.error(formatLog({
				type: 'proxy-invalid-body',
				...requestContext,
				error: describeError(err),
			}, 'clientError'));
			return proxyError('INVALID_REQUEST_BODY', 'Failed to read request body', 400, requestId);
		}
	}

	if (apiDebugLogsEnabled) {
		const loggableBody = getLoggableBody(body, contentType);
		console.info(formatLog({
			type: 'backend-request',
			...requestContext,
			headers: getLoggableHeaders(forwardedHeaders),
			...(loggableBody === null ? {} : { body: loggableBody }),
		}, 'request'));
	}

	locals.backendCalls++;
	const startedAt = performance.now();
	let backendResponse: Response;
	let responseBody: ArrayBuffer;
	try {
		backendResponse = await fetch(fullTargetUrl, {
			method: request.method,
			headers: forwardedHeaders,
			body,
			// Do not follow redirects automatically — let the client handle them
			redirect: 'manual',
			// A hanging service otherwise stalls the request until the platform kills it, with no log.
			signal: AbortSignal.any([request.signal, AbortSignal.timeout(backendTimeoutMs)]),
		});
		responseBody = await backendResponse.arrayBuffer();
	} catch (err) {
		locals.failedBackendCalls++;
		const failureOrigin = classifyFetchError(err);
		// Always logged: without it an outage is indistinguishable from a frontend bug.
		console.error(formatLog({
			type: 'backend-error',
			...requestContext,
			failureOrigin,
			error: describeError(err),
			durationMs: elapsedMs(startedAt),
		}, 'serverError'));
		return failureOrigin === 'timeout'
			? proxyError('BACKEND_TIMEOUT', 'The service took too long to respond', 504, requestId)
			: proxyError('BACKEND_UNREACHABLE', 'The service is temporarily unavailable', 502, requestId);
	}

	const durationMs = elapsedMs(startedAt);
	const failureOrigin = classifyResponseStatus(backendResponse.status);
	if (failureOrigin !== null) {
		locals.failedBackendCalls++;
	}

	const responseLog = {
		type: 'backend-response',
		...requestContext,
		...(failureOrigin === null ? {} : { failureOrigin }),
		status: backendResponse.status,
		durationMs,
	};
	if (apiDebugLogsEnabled) {
		const loggableBody = getLoggableBody(responseBody, backendResponse.headers.get('Content-Type'));
		console.info(formatLog({
			...responseLog,
			headers: getLoggableHeaders(backendResponse.headers),
			...(loggableBody === null ? {} : { body: loggableBody }),
		}, colorForStatus(backendResponse.status)));
	} else if (failureOrigin !== null) {
		// Compact failure record kept outside debug mode; bodies stay behind the debug flag.
		const log = formatLog(responseLog, colorForStatus(backendResponse.status));
		if (backendResponse.status >= 500) {
			console.error(log);
		} else {
			console.warn(log);
		}
	}

	// Forward the response back to the browser. Set-Cookie must be propagated
	// so HttpOnly auth cookies are set correctly on the client.
	const responseHeaders = new Headers({ [REQUEST_ID_HEADER]: requestId });

	for (const headerName of FORWARDED_RESPONSE_HEADERS) {
		const value = backendResponse.headers.get(headerName);
		if (value) responseHeaders.set(headerName, value);
	}

	const setCookie = backendResponse.headers.get('Set-Cookie');
	if (setCookie) {
		responseHeaders.set('Set-Cookie', setCookie);
	}

	return new Response(responseBody.byteLength > 0 ? responseBody : null, {
		status: backendResponse.status,
		headers: responseHeaders,
	});
}

/**
 * Serves `/api` through the proxy (skipping locale resolution and its AsyncLocalStorage
 * overhead) and everything else through Paraglide, with page-level logs in debug mode.
 */
const handleRoutes: Handle = async ({ event, resolve }) => {
	const { pathname } = event.url;

	if (pathname.startsWith('/api/')) {
		return proxyApiRequest(event);
	}

	// Non-API requests: apply Paraglide locale middleware.
	// Paraglide reads the PARAGLIDE_LOCALE cookie automatically (cookie strategy),
	// falls back to globalVariable, then baseLocale ("es").
	const render = () =>
		paraglideMiddleware(event.request, ({ request: localizedRequest, locale }) => {
			event.request = localizedRequest;

			return resolve(event, {
				transformPageChunk: ({ html }) => html.replace('%lang%', locale),
			});
		});

	if (!apiDebugLogsEnabled || isStaticRequest(pathname)) {
		return render();
	}

	const pageContext = {
		requestId: event.locals.requestId,
		method: event.request.method,
		path: redactUrl(pathname),
	};
	console.info(formatLog({ type: 'page-request', ...pageContext }, 'request'));
	const startedAt = performance.now();
	const response = await render();
	console.info(formatLog({
		type: 'page-response',
		...pageContext,
		routeId: event.route.id,
		status: response.status,
		durationMs: elapsedMs(startedAt),
	}, colorForStatus(response.status)));
	return response;
};

export const handle: Handle = sequence(handleRequestId, handleRoutes);

/**
 * Stamps SSR `fetch('/api/...')` calls with the page's request ID so the proxy and the
 * backend log them under the same correlation ID as the page render.
 */
export const handleFetch: HandleFetch = ({ event, request, fetch }) => {
	if (new URL(request.url).origin !== event.url.origin || !event.locals.requestId) {
		return fetch(request);
	}
	const headers = new Headers(request.headers);
	headers.set(REQUEST_ID_HEADER, event.locals.requestId);
	return fetch(new Request(request, { headers }));
};

export const handleError: HandleServerError = ({ error, event, status, message }) => {
	const errorId = crypto.randomUUID();

	// failedBackendCalls of 0 means the error originated in the frontend itself.
	console.error(formatLog({
		type: 'unhandled-error',
		errorId,
		requestId: event.locals.requestId,
		failedBackendCalls: event.locals.failedBackendCalls ?? 0,
		status,
		message,
		path: redactUrl(event.url.pathname),
		routeId: event.route.id,
		error: describeError(error),
	}, 'serverError'));

	return {
		message: isBackendUnavailableError(error) ? BACKEND_UNAVAILABLE_ERROR : UNHANDLED_ERROR,
		errorId,
	};
};
