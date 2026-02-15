import { API_SALES } from "@/lib/api";
import { CustomerDto } from "@/types/dtos";
import { apiClient } from "@/lib/api-client";

export async function searchCustomers(query: string): Promise<CustomerDto[]> {
    try {
        return await apiClient<CustomerDto[]>(`${API_SALES}/api/customers/search?query=${encodeURIComponent(query)}`);
    } catch (error) {
        console.error("Error searching customers:", error);
        return [];
    }
}

export async function createCustomer(customer: CustomerDto): Promise<CustomerDto | null> {
    try {
        return await apiClient<CustomerDto>(`${API_SALES}/api/customers`, {
            method: "POST",
            body: JSON.stringify(customer)
        });
    } catch (error: any) {
        console.error("Error creating customer", error);
        throw new Error(error.message || "Network error creating customer");
    }
}

export async function updateCustomer(id: string, customer: CustomerDto): Promise<CustomerDto | null> {
    try {
        return await apiClient<CustomerDto>(`${API_SALES}/api/customers/${id}`, {
            method: "PUT",
            body: JSON.stringify(customer)
        });
    } catch (error) {
        console.error("Error updating customer", error);
        return null;
    }
}

export async function deleteCustomer(id: string): Promise<boolean> {
    try {
        await apiClient(`${API_SALES}/api/customers/${id}`, {
            method: "DELETE",
        });
        return true;
    } catch (error) {
        console.error("Error deleting customer", error);
        return false;
    }
}
