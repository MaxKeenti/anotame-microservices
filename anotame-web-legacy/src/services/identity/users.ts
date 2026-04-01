import { API_IDENTITY } from "@/lib/api";
import { UserResponse, CreateUserRequest } from "@/types/dtos";
import { apiClient } from "@/lib/api-client";

export async function getAllUsers(): Promise<UserResponse[]> {
    return apiClient<UserResponse[]>(`${API_IDENTITY}/users`, {
        cache: 'no-store'
    });
}

export async function createUser(req: CreateUserRequest): Promise<UserResponse> {
    return apiClient<UserResponse>(`${API_IDENTITY}/users`, {
        method: 'POST',
        body: JSON.stringify(req)
    });
}
