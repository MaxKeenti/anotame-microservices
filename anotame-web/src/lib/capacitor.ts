import { Capacitor } from '@capacitor/core';
import { env } from '$env/dynamic/public';

export function isNativeApp(): boolean {
	return Capacitor.isNativePlatform();
}

const NATIVE_BASES = {
	identity: env.PUBLIC_IDENTITY_URL,
	catalog: env.PUBLIC_CATALOG_URL,
	sales: env.PUBLIC_SALES_URL,
	operations: env.PUBLIC_OPERATIONS_URL
} as const;

export type ApiServiceName = keyof typeof NATIVE_BASES;

export function getApiBase(service: ApiServiceName): string {
	if (!isNativeApp()) {
		return `/api/${service}`;
	}

	const baseUrl = NATIVE_BASES[service];
	if (!baseUrl) {
		throw new Error(`Missing PUBLIC_${service.toUpperCase()}_URL for native API access.`);
	}

	return baseUrl;
}
