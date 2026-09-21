#!/usr/bin/env node
/**
 * Enforces ADR 0006: route pages compose, they do not style.
 *
 * Route files (`src/routes/**`) must build their UI from `$lib/components/ui`
 * primitives and `$lib/components/*` compositions. This gate fails the build when
 * a route:
 *   - puts visual utilities (colour, border, radius, shadow, type) on a bare HTML
 *     element or a link — layout utilities (flex, grid, gap, spacing) are fine;
 *   - uses a raw <button>, <input>, <select> or <textarea> instead of a primitive;
 *   - sets an inline `style` attribute.
 * It also fails when any `.svelte` file under `src/` contains a <style> block,
 * since styling is Tailwind-only, or when a hand-written component file is not
 * kebab-case (matching what `shadcn-svelte add` generates). Outside the generated
 * primitives it also rejects raw Tailwind palette colours (`bg-red-500`,
 * `text-white`, …): colour must come from the theme's semantic tokens (success,
 * warning, destructive, info, primary, muted…), which carry their own dark-mode
 * values.
 *
 * Usage: node scripts/lint-route-composition.mjs
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const SRC = join(ROOT, 'src');
const ROUTES = join(SRC, 'routes');

/** Bare elements that may carry layout classes but never visual ones. */
const BARE =
	'div|p|span|h1|h2|h3|h4|h5|h6|li|ul|ol|dl|dt|dd|section|article|header|footer|nav|aside|main|table|thead|tbody|tr|td|th|form|label|figure|small|strong|em|b|i|a';

/** Controls that always have a primitive in `$lib/components/ui`. */
const RAW_CONTROLS = /<(button|input|select|textarea)\b/g;

const VISUAL =
	/(?:^|[\s'"`{])(?:text-(?!left\b|right\b|center\b|justify\b|wrap\b|nowrap\b|balance\b|ellipsis\b|start\b|end\b)|bg-|border(?:$|-|\s)|rounded|shadow-|font-|ring-|leading-|tracking-|divide-|opacity-|backdrop-)/;

function walk(dir) {
	return readdirSync(dir).flatMap((entry) => {
		const path = join(dir, entry);
		return statSync(path).isDirectory() ? walk(path) : path.endsWith('.svelte') ? [path] : [];
	});
}

function lineOf(src, index) {
	return src.slice(0, index).split('\n').length;
}

/** Strips <script> and HTML comments so their text is never mistaken for markup. */
function markupOnly(src) {
	return src
		.replace(/<script\b[\s\S]*?<\/script>/g, (m) => m.replace(/[^\n]/g, ' '))
		.replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n]/g, ' '));
}

/**
 * Returns the value of a `class` attribute starting at `start`: a quoted string,
 * or a `{...}` expression with balanced braces (so template literals containing
 * `${...}` are read whole instead of being cut at their first `}`).
 */
function readClassValue(src, start) {
	const quote = src[start];
	if (quote === '"' || quote === "'") {
		const end = src.indexOf(quote, start + 1);
		return end === -1 ? '' : src.slice(start + 1, end);
	}
	if (quote === '{') {
		let depth = 0;
		for (let i = start; i < src.length; i++) {
			if (src[i] === '{') depth++;
			else if (src[i] === '}' && --depth === 0) return src.slice(start + 1, i);
		}
	}
	return '';
}

const problems = [];
const report = (file, line, message) =>
	problems.push({ file: relative(ROOT, file), line, message });

const COMPONENTS = join(SRC, 'lib', 'components');
for (const file of walk(COMPONENTS)) {
	const name = file.split(/[\\/]/).pop();
	if (!/^[a-z0-9]+(-[a-z0-9]+)*\.svelte$/.test(name)) {
		report(file, 1, `component file name is not kebab-case: ${name}`);
	}
}

const PALETTE =
	/\b(?:bg|text|border|from|via|to|ring|fill|stroke|outline|decoration|shadow|accent|caret|divide)-(?:red|green|emerald|amber|yellow|blue|sky|orange|rose|slate|gray|zinc|neutral|stone|lime|teal|cyan|indigo|violet|purple|fuchsia|pink)-\d{2,3}\b|\b(?:bg|text|border)-(?:white|black)\b/g;
const PRIMITIVES = join(SRC, 'lib', 'components', 'ui');

for (const file of walk(SRC)) {
	const src = readFileSync(file, 'utf8');
	const styleBlock = /<style\b/.exec(src);
	if (styleBlock) report(file, lineOf(src, styleBlock.index), '<style> block (styling is Tailwind-only)');

	if (file.startsWith(PRIMITIVES)) continue;
	for (const colour of src.matchAll(PALETTE)) {
		report(file, lineOf(src, colour.index), `raw palette colour "${colour[0]}"; use a semantic token`);
	}
}

for (const file of walk(ROUTES)) {
	const src = markupOnly(readFileSync(file, 'utf8'));

	const openTag = new RegExp(`<(${BARE})\\b`, 'g');
	for (const tag of src.matchAll(openTag)) {
		const tagEnd = src.indexOf('>', tag.index);
		const attrs = src.slice(tag.index, tagEnd === -1 ? undefined : tagEnd);
		const cls = /\sclass=/.exec(attrs);
		if (!cls) continue;
		const value = readClassValue(src, tag.index + cls.index + cls[0].length);
		if (VISUAL.test(value)) {
			report(file, lineOf(src, tag.index), `<${tag[1]}> carries visual classes: ${value.replace(/\s+/g, ' ').trim().slice(0, 80)}`);
		}
	}

	for (const control of src.matchAll(RAW_CONTROLS)) {
		report(file, lineOf(src, control.index), `raw <${control[1]}>; use the primitive from $lib/components/ui`);
	}

	for (const style of src.matchAll(/\sstyle=/g)) {
		report(file, lineOf(src, style.index), 'inline style attribute');
	}
}

if (problems.length === 0) {
	console.log('✓ Route composition: routes compose primitives and components.');
	process.exit(0);
}

problems.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);
for (const { file, line, message } of problems) console.error(`❌ ${file}:${line}  ${message}`);
console.error(
	`\n${problems.length} route-composition problem(s). See docs/adr/0006-route-pages-compose.md.`
);
process.exit(1);
