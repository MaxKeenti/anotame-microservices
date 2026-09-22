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
 *     CheckboxField;
 *   - styles a raw <a> instead of <NavLink> (navigation) or <Button href>
 *     (actions);
 *   - maps order/payment status codes to labels locally instead of calling
 *     `statusLabel` from `$lib/utils/status-labels`;
 *   - renders a `Command.Input` through a `child` snippet without binding the
 *     value on the inner control (bits-ui passes no value or input handler to
 *     `child`, so the search state never updates).
 *
 * It also checks the theme boundary and overlay primitives:
 *   - a `--<tone>-emphasis` token in `src/routes/layout.css` holds a literal
 *     colour instead of aliasing a palette token with `var(…)`;
 *   - a menu/select surface in `ui/` uses a translucent `bg-popover/<n>`, which
 *     lets rows behind the menu bleed through its items.
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
/** The link component itself is where anchor styling lives. */
const LINK_ALLOW = new Set([join('src', 'lib', 'components', 'common', 'nav-link.svelte')]);
/** The single place an Intl locale is spelled out. */
const LOCALE_ALLOW = new Set([join('src', 'lib', 'utils', 'formatUtils.ts')]);
/** The single place status codes are mapped to labels. */
const STATUS_LABEL_ALLOW = new Set([join('src', 'lib', 'utils', 'status-labels.ts')]);
const THEME = join(SRC, 'routes', 'layout.css');

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
	if (!STATUS_LABEL_ALLOW.has(rel)) {
		for (const m of raw.matchAll(/\bm\[\s*['"](?:order|payment)\.status\.|\bm\.(?:order|payment)_status_/g)) {
			report(file, lineOf(raw, m.index), 'status label mapped locally; use statusLabel() from $lib/utils/status-labels');
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

	if (!RAW_CONTROL_ALLOW.has(rel) && !LINK_ALLOW.has(rel)) {
		for (const m of src.matchAll(/<a\b/g)) {
			if (/\sclass=/.test(openingTag(src, m.index))) {
				report(file, lineOf(src, m.index), 'styled <a>; use <NavLink variant=…> for navigation or <Button href> for actions');
			}
		}
	}

	for (const m of src.matchAll(/<label\b/g)) {
		const tokens = classTokens(openingTag(src, m.index));
		if (tokens.length && !(tokens.length === 1 && tokens[0] === 'sr-only')) {
			report(file, lineOf(src, m.index), 'styled <label>; use FormField, CheckboxField or Field.Label');
		}
	}

	for (const m of src.matchAll(/<(CommandPrimitive\.Input|Command\.Input)\b[\s\S]*?<\/\1>/g)) {
		const snippet = /\{#snippet child\b[\s\S]*?\{\/snippet\}/.exec(m[0]);
		if (snippet && !/\bbind:value=/.test(snippet[0])) {
			report(file, lineOf(src, m.index), `<${m[1]}> child snippet without bind:value; bits-ui does not pass the value to child, bind it on the inner input`);
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

for (const file of walk(PRIMITIVES)) {
	const raw = readFileSync(file, 'utf8');
	for (const m of raw.matchAll(/\bbg-popover\/\d+/g)) {
		report(file, lineOf(raw, m.index), `translucent ${m[0]} on an overlay surface; use opaque bg-popover so items stay legible`);
	}
}

const theme = readFileSync(THEME, 'utf8');
for (const m of theme.matchAll(/--([a-z]+)-emphasis:\s*([^;]+);/g)) {
	if (!/^var\(/.test(m[2].trim())) {
		report(THEME, lineOf(theme, m.index), `--${m[1]}-emphasis holds a literal; add a palette token (e.g. --${m[1]}-strong) in :root and .dark and alias it`);
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
