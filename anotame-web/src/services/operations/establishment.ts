import { API_OPERATIONS } from "@/lib/api";
import { Establishment } from "@/types/dtos";

export async function getSettings(): Promise<Establishment> {
    const res = await fetch(`${API_OPERATIONS}/establishment`, { cache: 'no-store' });
    if (!res.ok) throw new Error("Failed to fetch settings");
    return res.json();
}

export async function updateSettings(est: Establishment): Promise<Establishment> {
    const res = await fetch(`${API_OPERATIONS}/establishment`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(est)
    });
    if (!res.ok) throw new Error("Failed to update settings");
    return res.json();
}
