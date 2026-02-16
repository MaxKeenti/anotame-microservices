// Use relative paths to leverage Next.js Rewrites (avoids CORS & 3rd party cookie issues)
export const API_IDENTITY = "/api/identity";
export const API_CATALOG = "/api/catalog";
export const API_SALES = "/api/sales";
export const API_OPERATIONS = "/api/operations";

import { apiClient } from "./api-client";
import { CreateOrderRequest, OrderResponse } from "@/types/dtos";

export async function getOrder(id: string): Promise<OrderResponse> {
    return apiClient<OrderResponse>(`${API_SALES}/orders/${id}`);
}

export async function updateOrder(id: string, data: CreateOrderRequest): Promise<OrderResponse> {
    return apiClient<OrderResponse>(`${API_SALES}/orders/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
    });
}

