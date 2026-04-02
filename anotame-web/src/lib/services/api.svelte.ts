export const API_IDENTITY = "/api/identity";
export const API_CATALOG = "/api/catalog";
export const API_SALES = "/api/sales";
export const API_OPERATIONS = "/api/operations";

export class ApiValidationError extends Error {
  public validationErrors: Record<string, string>;

  constructor(message: string, errors: Record<string, string>) {
    super(message);
    this.name = "ApiValidationError";
    this.validationErrors = errors;
  }
}

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
      credentials: "include", // Essential for HttpOnly cookies as in the legacy system
    };

    const response = await fetch(input, config);

    if (!response.ok) {
      if (response.status === 401 && !init?.skipAuthRedirect) {
        // Redirect to login if unauthorized
        if (
          typeof window !== "undefined" &&
          !window.location.pathname.includes("/login")
        ) {
          window.location.href = "/login";
        }
      }

      // --- Extract backend error payload ---
      let backendMessage = `API Error: ${response.status} ${response.statusText}`;
      try {
        const errorText = await response.text();
        if (errorText) {
          const errorData = JSON.parse(errorText);

          // Format 1: New unified shape {"message": "...", "details": [...]}
          if (errorData.message) {
            backendMessage = errorData.message;
          // Format 2: Legacy shape {"error": "Message"} — kept for backward compat during migration
          } else if (errorData.error) {
            backendMessage = errorData.error;
          }
          // Format 2: ConstraintViolations {"phoneNumber": "Phone number already in use"}
          else if (
            typeof errorData === "object" &&
            Object.keys(errorData).length > 0
          ) {
            // Throw our custom error with the object attached!
            throw new ApiValidationError("Validation Error", errorData);
          }
        }
      } catch (parseError) {
        if (parseError instanceof ApiValidationError) throw parseError; // Re-throw if it's ours
        console.warn("Could not parse error response as JSON", parseError);
      }

      // Throw the extracted backend message so Svelte can catch it
      throw new Error(backendMessage);
    }

    // Handle empty responses
    if (response.status === 204) {
      return {} as T;
    }

    try {
      const text = await response.text();
      return text ? JSON.parse(text) : ({} as T);
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
