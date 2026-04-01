import { authService } from '../services/auth.svelte';
import { goto } from '$app/navigation';
import { browser } from '$app/environment';

export function useAuthGuard(redirectTo = '/login') {
    let checking = $state(true);
    let allowed = $state(false);

    $effect(() => {
        if (!browser) return;
        // In a real scenario, you might also want to verify token expiration using the API
        if (!authService.isAuthenticated) {
            goto(redirectTo);
        } else {
            allowed = true;
        }
        checking = false;
    });

    return {
        get checking() { return checking; },
        get allowed() { return allowed; }
    };
}

export function useGuestGuard(redirectTo = '/dashboard') {
    let checking = $state(true);
    let allowed = $state(false);

    $effect(() => {
        if (!browser) return;
        
        if (authService.isAuthenticated) {
            goto(redirectTo);
        } else {
            allowed = true;
        }
        checking = false;
    });

    return {
        get checking() { return checking; },
        get allowed() { return allowed; }
    };
}
