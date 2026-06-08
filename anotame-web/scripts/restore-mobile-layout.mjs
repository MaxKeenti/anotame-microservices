#!/usr/bin/env node
// Removes the generated src/routes/+layout.ts left behind by
// swap-mobile-layout.mjs. Safe to run when the file is absent.
import { existsSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const target = resolve(here, '..', 'src/routes/+layout.ts');

if (existsSync(target)) {
	rmSync(target);
	console.log(`[restore-mobile-layout] Removed ${target}`);
} else {
	console.log('[restore-mobile-layout] Nothing to remove.');
}
