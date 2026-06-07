import { env } from '$env/dynamic/public';
import type { Handle } from '@sveltejs/kit';
import { paraglideMiddleware } from '$lib/paraglide/server';

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

function proxyError(errorCode: string, message: string, status: number): Response {
	return new Response(
		JSON.stringify({ errorCode, message, details: [] }),
		{ status, headers: { 'Content-Type': 'application/json' } },
	);
}

export const handle: Handle = async ({ event, resolve }) => {
	const { request } = event;
	const url = new URL(request.url);

	// API proxy requests do NOT need locale resolution — short-circuit before
	// paraglideMiddleware to avoid AsyncLocalStorage overhead for API calls.
	if (url.pathname.startsWith('/api/')) {
		// Strip the leading /api/ prefix to get the service path
		const apiPath = url.pathname.slice('/api/'.length);
		const targetBase = resolveBackendUrl(apiPath);

		if (!targetBase) {
			console.warn(`[proxy] No backend mapping found for path: ${url.pathname}`);
			return proxyError(
				'BACKEND_NOT_CONFIGURED',
				`No backend configured for ${url.pathname}`,
				404,
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

		// Forward cookies so HttpOnly session cookies reach the backend.
		// Strip the jwt cookie on unauthenticated endpoints (/auth/login,
		// /auth/register) — a stale JWT causes Quarkus SmallRye to reject
		// with 401 even on paths marked "permit".
		const cookie = request.headers.get('Cookie');
		if (cookie) {
			const isPublicAuth = /\/(auth\/login|auth\/register)(\/|$|\?)/.test(apiPath);
			if (isPublicAuth) {
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
				return proxyError('INVALID_REQUEST_BODY', 'Failed to read request body', 400);
			}
		}

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
			return proxyError(
				'BACKEND_UNREACHABLE',
				`Backend unreachable: ${(err as Error).message}`,
				502,
			);
		}

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
	}

	// Non-API requests: apply Paraglide locale middleware.
	// Paraglide reads the PARAGLIDE_LOCALE cookie automatically (cookie strategy),
	// falls back to globalVariable, then baseLocale ("es").
	return paraglideMiddleware(event.request, ({ request: localizedRequest, locale }) => {
		event.request = localizedRequest;

		return resolve(event, {
			transformPageChunk: ({ html }) => html.replace('%lang%', locale),
		});
	});
};
