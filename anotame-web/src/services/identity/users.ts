import { API_IDENTITY } from "@/lib/api";
import { UserResponse, CreateUserRequest } from "@/types/dtos";

const getAuthHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
    };
};

export async function getAllUsers(): Promise<UserResponse[]> {
    const res = await fetch(`${API_IDENTITY}/users`, {
        cache: 'no-store',
        headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error("Failed to fetch users");
    return res.json();
}

export async function createUser(req: CreateUserRequest): Promise<UserResponse> {
    const res = await fetch(`${API_IDENTITY}/users`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(req)
    });
    if (!res.ok) {
        const err = await res.text();
        throw new Error(err || "Failed to create user");
    }
    return res.json();
}
