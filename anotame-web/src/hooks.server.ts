import { env } from '$env/dynamic/public';
import type { Handle } from '@sveltejs/kit';

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

export const handle: Handle = async ({ event, resolve }) => {
	const { request } = event;
	const url = new URL(request.url);

	// Only intercept requests under /api/
	if (!url.pathname.startsWith('/api/')) {
		return resolve(event);
	}

	// Strip the leading /api/ prefix to get the service path
	const apiPath = url.pathname.slice('/api/'.length);
	const targetBase = resolveBackendUrl(apiPath);

	if (!targetBase) {
		console.warn(`[proxy] No backend mapping found for path: ${url.pathname}`);
		return new Response(
			JSON.stringify({ error: `No backend configured for ${url.pathname}` }),
			{ status: 404, headers: { 'Content-Type': 'application/json' } },
		);
	}

	// Preserve the original query string
	const fullTargetUrl = url.search ? `${targetBase}${url.search}` : targetBase;

	// Build forwarded headers — preserve Content-Type so the backend can
	// correctly parse the request body (e.g. application/json).
	const forwardedHeaders = new Headers();

	const contentType = request.headers.get('Content-Type');
	if (contentType) {
		forwardedHeaders.set('Content-Type', contentType);
	}

	// Forward Authorization header when present (Bearer tokens, etc.)
	const authorization = request.headers.get('Authorization');
	if (authorization) {
		forwardedHeaders.set('Authorization', authorization);
	}

	// Forward cookies so HttpOnly session cookies reach the backend
	const cookie = request.headers.get('Cookie');
	if (cookie) {
		forwardedHeaders.set('Cookie', cookie);
	}

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
			console.error(
				`[proxy] Failed to read request body for ${request.method} ${fullTargetUrl}:`,
				err,
			);
			return new Response(JSON.stringify({ error: 'Failed to read request body' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' },
			});
		}
	}

	console.log(`[proxy] ${request.method} ${url.pathname} → ${fullTargetUrl}`);

	let backendResponse: Response;
	try {
		backendResponse = await fetch(fullTargetUrl, {
			method: request.method,
			headers: forwardedHeaders,
			body,
			// Do not follow redirects automatically — let the client handle them
			redirect: 'manual',
		});
	} catch (err) {
		console.error(`[proxy] Network error reaching ${fullTargetUrl}:`, err);
		return new Response(
			JSON.stringify({ error: `Backend unreachable: ${(err as Error).message}` }),
			{ status: 502, headers: { 'Content-Type': 'application/json' } },
		);
	}

	console.log(`[proxy] ← ${backendResponse.status} from ${fullTargetUrl}`);

	// Forward the response back to the browser. Set-Cookie must be propagated
	// so HttpOnly auth cookies are set correctly on the client.
	const responseHeaders = new Headers();

	const responseContentType = backendResponse.headers.get('Content-Type');
	if (responseContentType) {
		responseHeaders.set('Content-Type', responseContentType);
	}

	const setCookie = backendResponse.headers.get('Set-Cookie');
	if (setCookie) {
		responseHeaders.set('Set-Cookie', setCookie);
	}

	const responseBody = await backendResponse.arrayBuffer();

	return new Response(responseBody.byteLength > 0 ? responseBody : null, {
		status: backendResponse.status,
		headers: responseHeaders,
	});
};
