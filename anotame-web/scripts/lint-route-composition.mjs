#!/usr/bin/env bun
/**
 * Enforces ADR 0006: route pages compose, they do not style.
 *
 * Flags bare HTML elements in `src/routes/` whose class attribute carries visual
 * utilities. Layout utilities on a wrapper are allowed, as are classes on
 * components (anything starting with an uppercase letter or containing a dot).
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROUTES = 'src/routes';
const BARE = 'div|p|span|h1|h2|h3|h4|h5|h6|li|ul|ol|dl|dt|dd|section|article|header|footer|nav|aside|main|table|thead|tbody|tr|td|th|form|label|figure|small|strong|em|b|i';
const VISUAL = /(?:^|\s)(?:text-(?!left|right|center|justify|wrap|nowrap|balance|ellipsis)|bg-|border(?:$|-|\s)|rounded|shadow-|font-|ring-|leading-|tracking-|divide-|opacity-|backdrop-)/;

function walk(dir) {
	return readdirSync(dir).flatMap((e) => {
		const p = join(dir, e);
		return statSync(p).isDirectory() ? walk(p) : p.endsWith('.svelte') ? [p] : [];
	});
}

const tag = new RegExp(`<(${BARE})\\b[^>]*?class=(?:"([^"]*)"|\\{([^}]*)\\})`, 'gs');
let total = 0;
const perFile = [];

for (const file of walk(ROUTES).sort()) {
	const src = readFileSync(file, 'utf8');
	let hits = 0;
	for (const m of src.matchAll(tag)) {
		const cls = m[2] ?? m[3] ?? '';
		if (VISUAL.test(cls)) hits++;
	}
	if (hits) {
		perFile.push([file, hits]);
		total += hits;
	}
}

perFile.sort((a, b) => b[1] - a[1]);
for (const [f, n] of perFile) console.log(String(n).padStart(4), f);
console.log(`\n${total} violations across ${perFile.length} files`);
