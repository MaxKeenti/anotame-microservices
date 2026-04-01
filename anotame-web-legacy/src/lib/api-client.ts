import { API_IDENTITY } from "./api";

type FetchOptions = RequestInit & {
    skipAuthRedirect?: boolean;
};

export async function apiClient<T>(input: RequestInfo | URL, init?: FetchOptions): Promise<T> {
    const headers = new Headers(init?.headers);

    if (!headers.has("Content-Type") && !(init?.body instanceof FormData)) {
        headers.set("Content-Type", "application/json");
    }

    const config: RequestInit = {
        ...init,
        headers,
        credentials: "include", // Essential for HttpOnly cookies
    };

    const response = await fetch(input, config);

    if (!response.ok) {
        if (response.status === 401 && !init?.skipAuthRedirect) {
            // Redirect to login if unauthorized
            if (typeof window !== "undefined" && !window.location.pathname.includes("/login")) {
                window.location.href = "/login";
            }
        }
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    // Handle empty responses
    if (response.status === 204) {
        return {} as T;
    }

    // Safely attempt to parse JSON
    try {
        const text = await response.text();
        return text ? JSON.parse(text) : {} as T;
    } catch (e: any) {
        throw new Error(`Invalid JSON response: ${e.message || e}`);
    }
}
