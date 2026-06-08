import { PersistedState } from 'runed';
import { apiService, API_IDENTITY } from './api.svelte';
import { isNativeApp } from '$lib/capacitor';
import { tokenStore } from './native/tokenStore';

interface LoginResponse {
    token: string;
    user: User;
}

export interface User {
    id: string;
    username: string;
    email: string;
    role: string;
    locale: string;
}

class AuthService {
    // Tracks current user, persists across reloads via localStorage
    private userState = new PersistedState<User | null>('auth_user', null);

    // Track hydration/loading status
    private loadingState = $state(true);

    constructor() {
        if (typeof window !== 'undefined') {
            // Signal loading is finished once the component or service is mounted/initialized
            // In a more complex app, you might wait for an actual token validation
            this.loadingState = false;
        }

        apiService.onUnauthorized = () => {
            this.clearLocalSession();
        };
    }

    clearLocalSession(): void {
        this.userState.current = null;
        if (isNativeApp()) {
            void tokenStore.clear();
        }
        if (typeof window !== "undefined" && !window.location.pathname.includes('/login')) {
            window.location.href = '/login';
        }
    }

    get loading(): boolean {
        return this.loadingState;
    }

    get user(): User | null {
        return this.userState.current;
    }

    get isAuthenticated(): boolean {
        return this.user !== null;
    }

    /**
     * Sets the Paraglide locale cookie (PARAGLIDE_LOCALE) so the SSR hook
     * picks up the correct locale on the next navigation.
     */
    private setLocaleCookie(locale: string) {
        if (typeof document !== 'undefined') {
            document.cookie = `PARAGLIDE_LOCALE=${locale};path=/;max-age=${60 * 60 * 24 * 365};SameSite=Lax`;
        }
    }

    async login(credentials: any): Promise<void> {
        const response = await apiService.request<LoginResponse>(`${API_IDENTITY}/auth/login`, {
            method: 'POST',
            body: JSON.stringify(credentials),
            skipAuthRedirect: true
        });

        // Native: persist the JWT for Bearer-token auth. Web ignores response.token
        // and relies on the HttpOnly cookie.
        if (isNativeApp()) {
            await tokenStore.set(response.token);
        }

        this.userState.current = response.user;
        this.setLocaleCookie(response.user.locale || 'es');
    }

    async logout(): Promise<void> {
        try {
            await apiService.request(`${API_IDENTITY}/auth/logout`, {
                method: 'POST',
                skipAuthRedirect: true
            });
        } finally {
            this.userState.current = null;
            if (isNativeApp()) {
                await tokenStore.clear();
            }
            // Clear the Paraglide locale cookie on logout
            if (typeof document !== 'undefined') {
                document.cookie = 'PARAGLIDE_LOCALE=;path=/;max-age=0';
            }
            if (typeof window !== "undefined") {
                window.location.href = '/login';
            }
        }
    }

    /**
     * PATCHes the user's locale preference on the backend, updates local state,
     * and sets the Paraglide locale cookie for subsequent SSR requests.
     */
    async changeLocale(newLocale: string): Promise<void> {
        if (!this.user) return;

        await apiService.request(`${API_IDENTITY}/users/${this.user.id}/locale`, {
            method: 'PATCH',
            body: JSON.stringify({ locale: newLocale })
        });

        this.userState.current = { ...this.user, locale: newLocale };
        this.setLocaleCookie(newLocale);
    }
}

export const authService = new AuthService();
