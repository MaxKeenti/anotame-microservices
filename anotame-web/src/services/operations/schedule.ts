import { API_OPERATIONS } from "@/lib/api";
import { WorkDay, Holiday } from "@/types/dtos";

export async function getScheduleConfig(): Promise<WorkDay[]> {
    const res = await fetch(`${API_OPERATIONS}/schedule/config`, { cache: 'no-store' });
    if (!res.ok) throw new Error("Failed to fetch schedule");
    return res.json();
}

export async function updateScheduleConfig(days: WorkDay[]): Promise<WorkDay[]> {
    const res = await fetch(`${API_OPERATIONS}/schedule/config`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(days)
    });
    if (!res.ok) throw new Error("Failed to update schedule");
    return res.json();
}

export async function getHolidays(): Promise<Holiday[]> {
    const res = await fetch(`${API_OPERATIONS}/schedule/holidays`, { cache: 'no-store' });
    if (!res.ok) throw new Error("Failed to fetch holidays");
    return res.json();
}

export async function addHoliday(date: string, description: string): Promise<Holiday> {
    const res = await fetch(`${API_OPERATIONS}/schedule/holidays`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ date, description })
    });
    if (!res.ok) throw new Error("Failed to add holiday");
    return res.json();
}

export async function deleteHoliday(id: string): Promise<void> {
    const res = await fetch(`${API_OPERATIONS}/schedule/holidays/${id}`, {
        method: 'DELETE'
    });
    if (!res.ok) throw new Error("Failed to delete holiday");
}
