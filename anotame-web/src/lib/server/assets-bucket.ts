import { AwsClient } from 'aws4fetch';
import { env } from '$env/dynamic/private';

/**
 * The `anotame-assets` Railway bucket (S3-compatible, private). Credentials
 * come from the web service's `S3_*` variables, which reference the bucket in
 * each Railway environment. Requests are signed with SigV4 through aws4fetch,
 * which runs on both Bun (production) and Node (vite dev).
 */

type Bucket = { client: AwsClient; base: string };

let cached: Bucket | null | undefined;

function bucket(): Bucket | null {
	if (cached !== undefined) return cached;
	const { S3_BUCKET, S3_ENDPOINT, S3_REGION, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY } = env;
	if (!S3_BUCKET || !S3_ENDPOINT || !S3_ACCESS_KEY_ID || !S3_SECRET_ACCESS_KEY) {
		cached = null;
		return cached;
	}
	const endpoint = new URL(S3_ENDPOINT);
	cached = {
		client: new AwsClient({
			accessKeyId: S3_ACCESS_KEY_ID,
			secretAccessKey: S3_SECRET_ACCESS_KEY,
			service: 's3',
			region: S3_REGION || 'auto',
		}),
		// Railway buckets use virtual-hosted–style URLs.
		base: `${endpoint.protocol}//${S3_BUCKET}.${endpoint.host}`,
	};
	return cached;
}

export function bucketConfigured(): boolean {
	return bucket() !== null;
}

function objectUrl(b: Bucket, key: string): string {
	return `${b.base}/${key.split('/').map(encodeURIComponent).join('/')}`;
}

function requireBucket(): Bucket {
	const b = bucket();
	if (!b) throw new Error('Assets bucket is not configured (S3_* variables missing)');
	return b;
}

export async function putObject(key: string, body: ArrayBuffer | string, contentType: string): Promise<void> {
	const b = requireBucket();
	const res = await b.client.fetch(objectUrl(b, key), {
		method: 'PUT',
		body,
		headers: { 'Content-Type': contentType },
	});
	if (!res.ok) throw new Error(`Bucket PUT ${key} failed: HTTP ${res.status}`);
}

/** The object's text, or null when it does not exist. */
export async function getObjectText(key: string): Promise<string | null> {
	const b = requireBucket();
	const res = await b.client.fetch(objectUrl(b, key));
	if (res.status === 404) return null;
	if (!res.ok) throw new Error(`Bucket GET ${key} failed: HTTP ${res.status}`);
	return res.text();
}

export async function deleteObject(key: string): Promise<void> {
	const b = requireBucket();
	const res = await b.client.fetch(objectUrl(b, key), { method: 'DELETE' });
	if (!res.ok && res.status !== 404) throw new Error(`Bucket DELETE ${key} failed: HTTP ${res.status}`);
}

/**
 * A time-limited GET URL the browser can load directly (bucket egress is
 * free). The signing time is rounded to the hour so the URL — and the
 * browser's cached copy — stays the same within that hour.
 */
export async function presignGet(key: string, expiresSeconds = 2 * 60 * 60): Promise<string> {
	const b = requireBucket();
	const hour = new Date();
	hour.setUTCMinutes(0, 0, 0);
	const datetime = hour.toISOString().replace(/[:-]|\.\d{3}/g, '');
	const signed = await b.client.sign(`${objectUrl(b, key)}?X-Amz-Expires=${expiresSeconds}`, {
		aws: { signQuery: true, datetime },
	});
	return signed.url;
}
