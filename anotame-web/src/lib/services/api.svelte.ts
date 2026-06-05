import { ApiError } from './ApiError';
import type { OrderResponse, CreateOrderRequest } from '$lib/types/dtos';

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
  public onUnauthorized?: () => void;

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
        if (this.onUnauthorized) {
          this.onUnauthorized();
        } else if (
          typeof window !== "undefined" &&
          !window.location.pathname.includes("/login")
        ) {
          window.location.href = "/login";
        }
      }

      // --- Extract backend error payload ---
      let backendMessage = `API Error: ${response.status} ${response.statusText}`;
      let errorData: any = undefined;
      let errorCode: string | undefined = undefined;
      try {
        const errorText = await response.text();
        if (errorText) {
          errorData = JSON.parse(errorText);

          // Extract machine-readable error code (I18N-05)
          if (errorData.errorCode) {
            errorCode = errorData.errorCode;
          }

          // Format 1: New unified shape {"errorCode": "...", "message": "...", "details": [...]}
          if (errorData.message) {
            backendMessage = errorData.message;
          // Format 2: Legacy shape {"error": "Message"} — kept for backward compat during migration
          } else if (errorData.error) {
            backendMessage = errorData.error;
          }
          // Format 3: Quarkus Constraint Violations {"violations": [{"field": "...", "message": "..."}]}
          else if (errorData.violations && Array.isArray(errorData.violations)) {
            const mappedErrors: Record<string, string> = {};
            errorData.violations.forEach((v: any) => {
              // Strip method prefix if present (e.g. "createOrder.request.committedDeadline" -> "committedDeadline")
              const field = v.field.includes('.') ? v.field.split('.').pop()! : v.field;
              mappedErrors[field] = v.message;
            });
            throw new ApiValidationError("Validation Error", mappedErrors);
          }
          // Format 4: Generic object catch-all
          else if (
            typeof errorData === "object" &&
            Object.keys(errorData).length > 0
          ) {
            throw new ApiValidationError("Validation Error", errorData);
          }
        }
      } catch (parseError) {
        if (parseError instanceof ApiValidationError) throw parseError; // Re-throw if it's ours
        console.warn("Could not parse error response as JSON", parseError);
      }

      // Throw ApiError with status code so catch blocks can check error.status / error.errorCode
      throw new ApiError(backendMessage, response.status, errorData, errorCode);
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
  async getOrder(id: string): Promise<OrderResponse> {
    return this.request<OrderResponse>(`${API_SALES}/orders/${id}`);
  }

  async updateOrder(id: string, data: CreateOrderRequest): Promise<OrderResponse> {
    return this.request<OrderResponse>(`${API_SALES}/orders/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }
}

export const apiService = new ApiService();
