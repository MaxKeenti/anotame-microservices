#!/usr/bin/env node
// Post-processes the static build for Capacitor:
//   - Replaces the %lang% placeholder in build/index.html with "es"
//     (ADR-0003 designates Spanish as the authoritative locale). Paraglide's
//     client runtime swaps strings on hydration based on PARAGLIDE_LOCALE.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const indexPath = resolve(here, '..', 'build/index.html');

if (!existsSync(indexPath)) {
	console.error(`[finalize-mobile-build] Missing ${indexPath} — did vite build run?`);
	process.exit(1);
}

const original = readFileSync(indexPath, 'utf8');
const replaced = original.replace(/%lang%/g, 'es');

if (original === replaced) {
	console.log('[finalize-mobile-build] No %lang% placeholder found; leaving file unchanged.');
} else {
	writeFileSync(indexPath, replaced);
	console.log('[finalize-mobile-build] Substituted %lang% -> es in build/index.html');
}
