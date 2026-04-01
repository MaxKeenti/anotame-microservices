import { PersistedState } from 'runed';
import { apiService, API_IDENTITY } from './api.svelte';

export interface User {
    id: string;
    username: string;
    email: string;
    role: string;
}

class AuthService {
    // Tracks current user, persists across reloads via localStorage
    private userState = new PersistedState<User | null>('auth_user', null);

    get user(): User | null {
        return this.userState.current;
    }

    get isAuthenticated(): boolean {
        return this.user !== null;
    }

    async login(credentials: any): Promise<void> {
        const response = await apiService.request<User>(`${API_IDENTITY}/auth/login`, {
            method: 'POST',
            body: JSON.stringify(credentials),
            skipAuthRedirect: true
        });
        
        // Save user data (the HttpOnly cookie handles the token natively)
        this.userState.current = response;
    }

    async logout(): Promise<void> {
        try {
            await apiService.request(`${API_IDENTITY}/auth/logout`, {
                method: 'POST',
                skipAuthRedirect: true
            });
        } finally {
            this.userState.current = null;
            if (typeof window !== "undefined") {
                window.location.href = '/login';
            }
        }
    }
}

export const authService = new AuthService();
