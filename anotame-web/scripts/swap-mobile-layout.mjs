#!/usr/bin/env node
// Copies scripts/templates/layout.mobile.ts -> src/routes/+layout.ts so the mobile
// build picks up `ssr = false` / `prerender = false` without affecting the web
// (adapter-node) build. Pair with restore-mobile-layout.mjs to clean up.
import { copyFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = resolve(here, 'templates/layout.mobile.ts');
const dest = resolve(here, '..', 'src/routes/+layout.ts');

if (!existsSync(src)) {
	console.error(`[swap-mobile-layout] Missing source: ${src}`);
	process.exit(1);
}

copyFileSync(src, dest);
console.log(`[swap-mobile-layout] Wrote ${dest}`);
