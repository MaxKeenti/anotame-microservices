import { API_CATALOG } from "@/lib/api";
import { PriceListRequest, PriceListResponse } from "@/types/dtos";

export async function getPriceLists(): Promise<PriceListResponse[]> {
    const res = await fetch(`${API_CATALOG}/pricelists`);
    if (!res.ok) throw new Error("Failed to fetch price lists");
    return res.json();
}

export async function getPriceList(id: string): Promise<PriceListResponse> {
    const res = await fetch(`${API_CATALOG}/pricelists/${id}`);
    if (!res.ok) throw new Error("Failed to fetch price list");
    return res.json();
}

export async function createPriceList(data: PriceListRequest): Promise<PriceListResponse> {
    const res = await fetch(`${API_CATALOG}/pricelists`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create price list");
    return res.json();
}

export async function deletePriceList(id: string): Promise<void> {
    const res = await fetch(`${API_CATALOG}/pricelists/${id}`, {
        method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete price list");
}
