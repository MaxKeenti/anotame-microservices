import { authService } from '../services/auth.svelte';
import { goto } from '$app/navigation';
import { browser } from '$app/environment';
import { onMount } from 'svelte';

export function useAuthGuard(adminOnly: boolean, redirectTo?: string): { checking: boolean, allowed: boolean };
export function useAuthGuard(redirectTo?: string): { checking: boolean, allowed: boolean };
export function useAuthGuard(arg1: boolean | string = '/login', arg2 = '/login') {
    const adminOnly = typeof arg1 === 'boolean' ? arg1 : false;
    const redirectTo = typeof arg1 === 'string' ? arg1 : arg2;

    let checking = $state(true);
    let allowed = $state(false);

    onMount(() => {
        const user = authService.user;
        const isAuthenticated = authService.isAuthenticated;
        const isAuthorized = !adminOnly || (user?.role === 'ADMIN');

        if (!isAuthenticated || !isAuthorized) {
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

    onMount(() => {
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
