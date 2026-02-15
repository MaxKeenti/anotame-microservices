import { API_CATALOG } from "@/lib/api";
import { GarmentTypeResponse, GarmentTypeRequest } from "@/types/dtos";
import { apiClient } from "@/lib/api-client";

export async function getAllGarments(): Promise<GarmentTypeResponse[]> {
    return apiClient<GarmentTypeResponse[]>(`${API_CATALOG}/catalog/garments`);
}

export async function createGarment(data: GarmentTypeRequest): Promise<GarmentTypeResponse> {
    return apiClient<GarmentTypeResponse>(`${API_CATALOG}/catalog/garments`, {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function updateGarment(id: string, data: GarmentTypeRequest): Promise<GarmentTypeResponse> {
    return apiClient<GarmentTypeResponse>(`${API_CATALOG}/catalog/garments/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
    });
}

export async function deleteGarment(id: string): Promise<void> {
    await apiClient(`${API_CATALOG}/catalog/garments/${id}`, {
        method: "DELETE",
    });
}
