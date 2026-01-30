import { API_SALES } from "@/lib/api";
import { CustomerDto } from "@/types/dtos";

export async function searchCustomers(query: string, token?: string): Promise<CustomerDto[]> {
    try {
        const res = await fetch(`${API_SALES}/api/customers/search?query=${encodeURIComponent(query)}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                ...(token && { Authorization: `Bearer ${token}` }),
            },
        });

        if (!res.ok) {
            console.warn("Search customer failed", res.status);
            return [];
        }
        return await res.json();
    } catch (error) {
        console.error("Error searching customers:", error);
        return [];
    }
}

export async function createCustomer(customer: CustomerDto, token?: string): Promise<CustomerDto | null> {
    try {
        const res = await fetch(`${API_SALES}/api/customers`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(token && { Authorization: `Bearer ${token}` }),
            },
            body: JSON.stringify(customer)
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.message || errorData.error || "Failed to create customer");
        }
        return await res.json();
    } catch (error: any) {
        console.error("Error creating customer", error);
        throw new Error(error.message || "Network error creating customer");
    }
}

export async function updateCustomer(id: string, customer: CustomerDto, token?: string): Promise<CustomerDto | null> {
    try {
        const res = await fetch(`${API_SALES}/api/customers/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                ...(token && { Authorization: `Bearer ${token}` }),
            },
            body: JSON.stringify(customer)
        });

        if (!res.ok) {
            throw new Error("Failed to update customer");
        }
        return await res.json();
    } catch (error) {
        console.error("Error updating customer", error);
        return null;
    }
}

export async function deleteCustomer(id: string, token?: string): Promise<boolean> {
    try {
        const res = await fetch(`${API_SALES}/api/customers/${id}`, {
            method: "DELETE",
            headers: {
                ...(token && { Authorization: `Bearer ${token}` }),
            },
        });

        return res.ok;
    } catch (error) {
        console.error("Error deleting customer", error);
        return false;
    }
}
