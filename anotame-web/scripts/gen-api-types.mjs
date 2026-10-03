#!/usr/bin/env node
/**
 * Generates `src/lib/types/api/<service>.d.ts` from each backend service's OpenAPI contract
 * (`anotame-api/backend/<service>-service/openapi/openapi.yaml`, rewritten by every Maven build).
 *
 *   bun run gen:api    regenerate after the backend contract changed
 *   bun run lint:api   fail when the committed types no longer match the contract
 *
 * The web image is built from `anotame-web/` alone, so the contracts are absent there; the
 * check is skipped in that case and the committed types are used as they are.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import openapiTS, { astToString } from 'openapi-typescript';

const SERVICES = ['identity', 'catalog', 'sales', 'operations'];
const webRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const backendRoot = join(webRoot, '..', 'anotame-api', 'backend');
const outDir = join(webRoot, 'src', 'lib', 'types', 'api');
const check = process.argv.includes('--check');

if (!existsSync(backendRoot)) {
	console.log('[api-types] backend contracts not available here; using the committed types.');
	process.exit(0);
}

const stale = [];
for (const service of SERVICES) {
	const contract = join(backendRoot, `${service}-service`, 'openapi', 'openapi.yaml');
	const target = join(outDir, `${service}.d.ts`);
	if (!existsSync(contract)) {
		console.error(`[api-types] missing ${relative(webRoot, contract)} — build the backend first (./mvnw package).`);
		process.exit(1);
	}

	// Jackson writes every property, so a schema without an explicit `required` list has them
	// all present; nullable ones are declared as such by the backend.
	const ast = await openapiTS(pathToFileURL(contract), { propertiesRequiredByDefault: true, silent: true });
	const source =
		'/**\n' +
		` * Generated from anotame-api/backend/${service}-service/openapi/openapi.yaml.\n` +
		' * Do not edit: run `bun run gen:api` after the backend contract changes.\n' +
		' */\n\n' +
		astToString(ast);

	if (check) {
		if (!existsSync(target) || readFileSync(target, 'utf8') !== source) stale.push(service);
	} else {
		mkdirSync(outDir, { recursive: true });
		writeFileSync(target, source);
		console.log(`[api-types] wrote ${relative(webRoot, target)}`);
	}
}

if (stale.length > 0) {
	console.error(`[api-types] out of date: ${stale.join(', ')}. Run \`bun run gen:api\` and commit the result.`);
	process.exit(1);
}
if (check) console.log('[api-types] generated types match the backend contracts.');
