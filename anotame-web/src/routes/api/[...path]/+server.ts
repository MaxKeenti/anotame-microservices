import { env } from '$env/dynamic/public';
import type { RequestHandler } from '@sveltejs/kit';

async function handleProxy({ request, url }: any) {
    const path = url.pathname;
    
    let target = '';
    let targetUrl = '';
    
    if (path.startsWith('/api/identity')) {
        target = env.PUBLIC_IDENTITY_URL || 'http://localhost:8081';
        targetUrl = target + path.replace('/api/identity', '');
    } else if (path.startsWith('/api/catalog')) {
        target = env.PUBLIC_CATALOG_URL || 'http://localhost:8082';
        targetUrl = target + path.replace('/api/catalog', '');
    } else if (path.startsWith('/api/sales')) {
        target = env.PUBLIC_SALES_URL || 'http://localhost:8083';
        targetUrl = target + path.replace('/api/sales', '');
    } else if (path.startsWith('/api/operations')) {
        target = env.PUBLIC_OPERATIONS_URL || 'http://localhost:8084';
        targetUrl = target + path.replace('/api/operations', '');
    } else {
        return new Response('API route proxy target not found', { status: 404 });
    }

    const headers = new Headers(request.headers);
    headers.set('host', new URL(target).host);

    const init: RequestInit = {
        method: request.method,
        headers,
    };

    if (request.method !== 'GET' && request.method !== 'HEAD') {
        init.body = request.body;
        // Specify duplex for node 18+ streaming support
        (init as any).duplex = 'half';
    }

    try {
        const response = await fetch(targetUrl + url.search, init);
        return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers
        });
    } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message || 'Verification Proxy Error' }), { status: 500, headers: { 'Content-Type': 'application/json' }});
    }
}

export const GET: RequestHandler = handleProxy;
export const POST: RequestHandler = handleProxy;
export const PUT: RequestHandler = handleProxy;
export const PATCH: RequestHandler = handleProxy;
export const DELETE: RequestHandler = handleProxy;
