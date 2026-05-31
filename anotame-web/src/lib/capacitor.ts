import { Capacitor } from '@capacitor/core';
import {
	PUBLIC_IDENTITY_URL,
	PUBLIC_CATALOG_URL,
	PUBLIC_SALES_URL,
	PUBLIC_OPERATIONS_URL
} from '$env/static/public';

export function isNativeApp(): boolean {
	return Capacitor.isNativePlatform();
}

const NATIVE_BASES = {
	identity: PUBLIC_IDENTITY_URL,
	catalog: PUBLIC_CATALOG_URL,
	sales: PUBLIC_SALES_URL,
	operations: PUBLIC_OPERATIONS_URL
} as const;

export type ApiServiceName = keyof typeof NATIVE_BASES;

export function getApiBase(service: ApiServiceName): string {
	return isNativeApp() ? NATIVE_BASES[service] : `/api/${service}`;
}
