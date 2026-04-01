import { API_CATALOG } from "@/lib/api";
import { ServiceResponse, ServiceRequest } from "@/types/dtos";
import { apiClient } from "@/lib/api-client";

export async function getServices(): Promise<ServiceResponse[]> {
    return apiClient<ServiceResponse[]>(`${API_CATALOG}/catalog/services`);
}

export async function createService(data: ServiceRequest): Promise<ServiceResponse> {
    return apiClient<ServiceResponse>(`${API_CATALOG}/catalog/services`, {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function updateService(id: string, data: ServiceRequest): Promise<ServiceResponse> {
    return apiClient<ServiceResponse>(`${API_CATALOG}/catalog/services/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
    });
}

export async function deleteService(id: string): Promise<void> {
    await apiClient(`${API_CATALOG}/catalog/services/${id}`, {
        method: "DELETE",
    });
}
