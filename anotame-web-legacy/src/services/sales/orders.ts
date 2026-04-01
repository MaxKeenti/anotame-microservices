import { API_SALES } from "@/lib/api";
import { OrderResponse } from "@/types/dtos";
import { apiClient } from "@/lib/api-client";

export async function getAllOrders(): Promise<OrderResponse[]> {
    return apiClient<OrderResponse[]>(`${API_SALES}/orders`);
}
