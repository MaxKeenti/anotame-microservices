import { API_CATALOG } from "@/lib/api";
import { PriceListRequest, PriceListResponse } from "@/types/dtos";
import { apiClient } from "@/lib/api-client";

export async function getPriceLists(): Promise<PriceListResponse[]> {
    return apiClient<PriceListResponse[]>(`${API_CATALOG}/pricelists`, { cache: 'no-store' });
}

export async function getPriceList(id: string): Promise<PriceListResponse> {
    return apiClient<PriceListResponse>(`${API_CATALOG}/pricelists/${id}`, { cache: 'no-store' });
}

export async function createPriceList(data: PriceListRequest): Promise<PriceListResponse> {
    return apiClient<PriceListResponse>(`${API_CATALOG}/pricelists`, {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function updatePriceList(id: string, data: PriceListRequest): Promise<PriceListResponse> {
    return apiClient<PriceListResponse>(`${API_CATALOG}/pricelists/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
    });
}

export async function deletePriceList(id: string): Promise<void> {
    await apiClient(`${API_CATALOG}/pricelists/${id}`, {
        method: "DELETE",
    });
}
