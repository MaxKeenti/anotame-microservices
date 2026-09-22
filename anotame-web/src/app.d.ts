// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
/// <reference types="vite-plugin-pwa/info" />
/// <reference types="vite-plugin-pwa/client" />

declare global {
	namespace App {
		interface Error {
			message: string;
			/** Reference shown to the user and logged with the failure, for support lookups. */
			errorId?: string;
		}
		interface Locals {
			/** Correlation ID shared by the page render, its `/api` calls and backend logs. */
			requestId: string;
			/** Backend calls proxied while serving this request. */
			backendCalls: number;
			/** Proxied backend calls that failed (network, timeout or 4xx/5xx). */
			failedBackendCalls: number;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
