import { API_CATALOG } from "@/lib/api";
import { ServiceResponse } from "@/types/dtos";

export async function getServices(): Promise<ServiceResponse[]> {
    const res = await fetch(`${API_CATALOG}/catalog/services`);
    if (!res.ok) throw new Error("Failed to fetch services");
    return res.json();
}
