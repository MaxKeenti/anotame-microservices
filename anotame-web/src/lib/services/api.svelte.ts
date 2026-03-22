export const API_IDENTITY = "/api/identity";
export const API_CATALOG = "/api/catalog";
export const API_SALES = "/api/sales";
export const API_OPERATIONS = "/api/operations";

type FetchOptions = RequestInit & {
    skipAuthRedirect?: boolean;
};

class ApiService {
    async request<T>(input: RequestInfo | URL, init?: FetchOptions): Promise<T> {
        const headers = new Headers(init?.headers);

        if (!headers.has("Content-Type") && !(init?.body instanceof FormData)) {
            headers.set("Content-Type", "application/json");
        }

        const config: RequestInit = {
            ...init,
            headers,
            credentials: "include" // Essential for HttpOnly cookies as in the legacy system
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

        try {
            const text = await response.text();
            return text ? JSON.parse(text) : {} as T;
        } catch (e: any) {
            throw new Error(`Invalid JSON response: ${e.message || e}`);
        }
    }

    // Example methods mapped from legacy
    async getOrder(id: string): Promise<any> {
        return this.request<any>(`${API_SALES}/orders/${id}`);
    }

    async updateOrder(id: string, data: any): Promise<any> {
        return this.request<any>(`${API_SALES}/orders/${id}`, {
            method: "PUT",
            body: JSON.stringify(data),
        });
    }
}

export const apiService = new ApiService();
