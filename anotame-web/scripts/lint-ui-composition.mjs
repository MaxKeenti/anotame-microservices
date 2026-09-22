#!/usr/bin/env node
/**
 * Enforces ADR 0007: primitive-first UI, variants over call-site styling.
 *
 * Runs over hand-written Svelte files (`src/lib/components/**` outside the
 * generated `ui/` primitives, and `src/routes/**`) and fails the build when a file:
 *   - uses a raw <button>, <input>, <select>, <textarea> or <table> instead of a
 *     primitive (the magnifying dock tile is the one sanctioned exception);
 *   - sizes a <Button> with `h-*`, `w-*`, `size-*` or adds `touch-manipulation`,
 *     instead of the `touch` / `touch-lg` / `xl` / `icon-touch` sizes;
 *   - gives <Dialog.Content> a bare `max-w-*`, which drops the mobile gutter
 *     (widen with an `sm:`-prefixed class instead);
 *   - hand-rolls a spinner (`animate-spin`) instead of <Spinner>;
 *   - formats money by hand (`$${…}`, `${x.toFixed(2)}`, `$` before `{…}` in
 *     markup) instead of `formatCurrency`;
 *   - hard-codes an Intl locale (`'es-MX'`, `'en-US'`…) outside `formatUtils`;
 *   - declares props with the `$props<{…}>()` generic form;
 *   - sets page measure or entry animation on a dashboard route (`max-w-*`,
 *     `animate-in`), which `PageContainer` owns;
 *   - sizes or rounds a field (`h-11`…`h-16`, `rounded-*` on Input, Textarea,
 *     InputGroup, Select.Trigger or the adaptive pickers) instead of `inputSize`;
 *   - re-rounds a <Button> or <Card.Root> (`rounded-*`), which their variants own;
 *   - leaves an icon-only <Button> (`size="icon…"`) without an `aria-label`;
 *   - styles a raw <label> (anything but `sr-only`) instead of FormField or
 *     CheckboxField.
 *
 * Usage: node scripts/lint-ui-composition.mjs
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const SRC = join(ROOT, 'src');
const PRIMITIVES = join(SRC, 'lib', 'components', 'ui') + sep;
const DASHBOARD_ROUTES = join(SRC, 'routes', '(app)', 'dashboard') + sep;

/** Files allowed a raw control, with the reason recorded in ADR 0007. */
const RAW_CONTROL_ALLOW = new Set([join('src', 'lib', 'components', 'layout', 'dock-tile.svelte')]);
/** The single place an Intl locale is spelled out. */
const LOCALE_ALLOW = new Set([join('src', 'lib', 'utils', 'formatUtils.ts')]);

function walk(dir) {
	return readdirSync(dir).flatMap((entry) => {
		const path = join(dir, entry);
		if (statSync(path).isDirectory()) return walk(path);
		return /\.(svelte|ts)$/.test(path) && !path.endsWith('.d.ts') ? [path] : [];
	});
}

const lineOf = (src, index) => src.slice(0, index).split('\n').length;

/** Blanks out <script> blocks and comments, keeping line numbers intact. */
function markupOnly(src) {
	return src
		.replace(/<script\b[\s\S]*?<\/script>/g, (m) => m.replace(/[^\n]/g, ' '))
		.replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n]/g, ' '));
}

/** The opening tag starting at `index`, reading past `>` inside `{…}` expressions. */
function openingTag(src, index) {
	let depth = 0;
	for (let i = index; i < src.length; i++) {
		const c = src[i];
		if (c === '{') depth++;
		else if (c === '}') depth--;
		else if (c === '>' && depth === 0) return src.slice(index, i + 1);
	}
	return src.slice(index);
}

/** Static class tokens of a tag: the quoted `class="…"` value, if any. */
function classTokens(tag) {
	const m = /\sclass="([^"]*)"/.exec(tag);
	return m ? m[1].split(/\s+/).filter(Boolean) : [];
}

const problems = [];
const report = (file, line, message) => problems.push({ file: relative(ROOT, file), line, message });

for (const file of walk(SRC)) {
	if (file.startsWith(PRIMITIVES) || file.includes(`${sep}paraglide${sep}`)) continue;
	const rel = relative(ROOT, file);
	const raw = readFileSync(file, 'utf8');

	if (!LOCALE_ALLOW.has(rel)) {
		for (const m of raw.matchAll(/['"`](?:es|en)-[A-Z]{2}['"`]/g)) {
			report(file, lineOf(raw, m.index), `hard-coded locale ${m[0]}; use getIntlLocale() from $lib/utils/formatUtils`);
		}
	}
	for (const m of raw.matchAll(/`\$\$\{|\$\{[^}]*\.toFixed\(2\)\}/g)) {
		report(file, lineOf(raw, m.index), 'money formatted by hand; use formatCurrency');
	}

	if (!file.endsWith('.svelte')) continue;

	for (const m of raw.matchAll(/\$props<\s*\{/g)) {
		report(file, lineOf(raw, m.index), '$props<{…}>() generic form; declare `interface Props` and annotate');
	}

	const src = markupOnly(raw);

	if (!RAW_CONTROL_ALLOW.has(rel)) {
		for (const m of src.matchAll(/<(button|input|select|textarea|table)\b/g)) {
			report(file, lineOf(src, m.index), `raw <${m[1]}>; use the primitive from $lib/components/ui`);
		}
	}

	for (const m of src.matchAll(/<Button\b/g)) {
		const bad = classTokens(openingTag(src, m.index)).filter((t) =>
			/^(?:[a-z]+:)?(?:h|w|size)-\d/.test(t) || t === 'touch-manipulation'
		);
		if (bad.length) {
			report(file, lineOf(src, m.index), `<Button> sized with classes (${bad.join(' ')}); use size="touch|touch-lg|xl|icon-touch"`);
		}
	}

	const FIELDS = /<(Input|Textarea|InputGroup\.Root|Select\.Trigger|AdaptiveSelect|AdaptiveDatePicker|AdaptiveDateTimePicker)\b/g;
	for (const m of src.matchAll(FIELDS)) {
		const bad = classTokens(openingTag(src, m.index)).filter((t) => /^(?:h-1[1-6]|rounded(?:-.+)?)$/.test(t));
		if (bad.length) {
			report(file, lineOf(src, m.index), `<${m[1]}> sized or rounded with classes (${bad.join(' ')}); use inputSize="lg" or the default`);
		}
	}

	for (const m of src.matchAll(/<(Button|Card\.Root)\b/g)) {
		const bad = classTokens(openingTag(src, m.index)).filter((t) => /^rounded(?:-.+)?$/.test(t));
		if (bad.length) {
			report(file, lineOf(src, m.index), `<${m[1]}> re-rounded (${bad.join(' ')}); the variant owns the radius`);
		}
	}

	for (const m of src.matchAll(/<Button\b/g)) {
		const tag = openingTag(src, m.index);
		if (/\ssize="icon[^"]*"/.test(tag) && !/\saria-label(?:=|ledby=)/.test(tag)) {
			report(file, lineOf(src, m.index), 'icon-only <Button> without aria-label');
		}
	}

	for (const m of src.matchAll(/<label\b/g)) {
		const tokens = classTokens(openingTag(src, m.index));
		if (tokens.length && !(tokens.length === 1 && tokens[0] === 'sr-only')) {
			report(file, lineOf(src, m.index), 'styled <label>; use FormField, CheckboxField or Field.Label');
		}
	}

	for (const m of src.matchAll(/<Dialog\.Content\b/g)) {
		const bare = classTokens(openingTag(src, m.index)).filter((t) => /^max-w-/.test(t));
		if (bare.length) {
			report(file, lineOf(src, m.index), `<Dialog.Content> bare ${bare.join(' ')} drops the mobile gutter; use an sm:-prefixed width`);
		}
	}

	for (const m of src.matchAll(/\banimate-spin\b/g)) {
		report(file, lineOf(src, m.index), 'hand-rolled spinner; use <Spinner>');
	}

	for (const m of src.matchAll(/(?<![\w$])\$\{(?!@)/g)) {
		// `${` in markup (outside a template literal) is a literal dollar sign before an expression.
		const before = src.slice(Math.max(0, m.index - 200), m.index);
		if ((before.match(/`/g) ?? []).length % 2 === 0) {
			report(file, lineOf(src, m.index), 'literal "$" before a value; use formatCurrency');
		}
	}

	if (file.startsWith(DASHBOARD_ROUTES)) {
		for (const m of src.matchAll(/<(?:div|section|main|article)\b[^>]*?class="[^"]*?\b(max-w-\S+|animate-in)\b[^"]*"/g)) {
			report(file, lineOf(src, m.index), `${m[1]} on a dashboard page; PageContainer owns width and entry animation`);
		}
	}
}

if (problems.length === 0) {
	console.log('✓ UI composition: primitives and variants, no call-site drift.');
	process.exit(0);
}

problems.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);
for (const { file, line, message } of problems) console.error(`❌ ${file}:${line}  ${message}`);
console.error(`\n${problems.length} UI-composition problem(s). See docs/adr/0007-primitive-first-ui.md.`);
process.exit(1);
