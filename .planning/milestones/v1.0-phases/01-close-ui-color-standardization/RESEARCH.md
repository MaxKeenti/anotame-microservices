# Phase 1 Research: Close UI Color Standardization

**Date**: 2026-03-31
**Status**: Gaps found

---

## Branch State

**Branch:** `feat--ui-color-standardization`
**Diverged from main at:** `80b58fa` (fix: persist order item unit price...)
**Commits unique to this branch (27 total):**

```
d23a62e docs: add milestone 1 roadmap
949bdb8 docs: add milestone 1 requirements
7067aad docs: complete project research
499b556 chore: add project config
74b85a9 docs: initialize project
0ae4c54 chore: align Java version to 21, clean up parent POM, add standardization plan
f49d631 docs: refresh codebase map with all 7 structured documents
4af3257 feat: implement GSD agent framework with workflows, skills, and templates
1b568cb feat: add date validation constraints to UI pickers
2f54a0c chore: Unify AI rulesets
1a79196 feat: add allowClear support to AdaptiveSelect
8a0a5ea feat: implement dashboard metrics DTO and pricelist management routes/UI
daeb842 feat: implement adaptive datetime picker and new dashboard routes
de56680 feat: Add adaptive desktop UI components
af7e127 feat: Add new UI components (calendar, popover, select, alert-dialog)
65136e0 feat: Implement orders listing page
2cf6431 feat: implement order detail page
eee8ea6 feat: Introduce sonner toast notifications and textarea component
9e64d65 feat: Add order management and order creation wizard
3c0ddae feat: Implement initial user authentication flow and foundational UI
51c51a8 feat: Initialize new SvelteKit web application (move legacy to anotame-web-legacy)
37aa479 docs: clarify UI component strategy
88db4ec docs: Add development standards and conventions document
99d6ef6 refactor: Standardize UI by replacing native HTML elements with custom components
f62f384 feat: Implement web app manifest and update application icons
b832431 refactor: Update UI color classes to use semantic tokens and implement PWA assets
54fdf96 feat: Add Select, Table, Textarea, Badge, Spinner components
```

**Key color-work commit:** `b832431` ("refactor: Update UI color classes to use semantic tokens and implement PWA assets") — this is the commit that performed the token substitution. It targeted files in `anotame-web/src/app/` (the legacy Next.js app, which has since been moved to `anotame-web-legacy/`) and `anotame-web/src/utils/statusUtils.ts` (also legacy path, now relocated).

**Scale of branch:** 1,048 files changed across the full diff vs main. The SvelteKit app (`anotame-web/src/lib/` and `src/routes/`) has ~157 changed `.svelte` files — this is the bulk of the new Svelte 5 rewrite, not just color changes. The branch is effectively the entire SvelteKit rewrite on top of main.

**Merge conflict check:** `git merge --no-commit --no-ff main` returned "Already up to date" — no conflicts. The branch is a clean fast-forward candidate.

---

## Color Token Audit

**Token file location:** `anotame-web/src/routes/layout.css` (this file is new — it does not exist on main)

**Tokens defined (`:root` light + `.dark` overrides):**

| Token | Light value | Dark value |
|-------|-------------|------------|
| `--background` | `oklch(1 0 0)` | `oklch(0.145 0 0)` |
| `--foreground` | `oklch(0.145 0 0)` | `oklch(0.985 0 0)` |
| `--card` / `--card-foreground` | white / near-black | dark gray / white |
| `--popover` / `--popover-foreground` | same as card | same as card |
| `--primary` / `--primary-foreground` | near-black / white | light gray / dark |
| `--secondary` / `--secondary-foreground` | near-white / dark | dark gray / white |
| `--muted` / `--muted-foreground` | near-white / mid-gray | dark gray / mid-gray |
| `--accent` / `--accent-foreground` | near-white / dark | dark gray / white |
| `--destructive` | red oklch | lighter red oklch |
| `--border` | light gray | white 10% opacity |
| `--input` | light gray | white 15% opacity |
| `--ring` | mid-gray | mid-gray |
| `--chart-1` through `--chart-5` | blue spectrum | same |
| `--radius` | `0.625rem` | — |
| `--sidebar-*` (8 tokens) | defined | defined |

All tokens are exposed to Tailwind v4 via `@theme inline` — every token maps to a `--color-*` utility class.

**TODOs / commented-out values:** None found in `layout.css`.

**CRITICAL GAP — Missing semantic state tokens:**
The following tokens are referenced in components but are NOT defined in `layout.css`:

| Token class | Used in | Status |
|-------------|---------|--------|
| `bg-warning-muted` | `statusUtils.ts` (PENDING, all orders with that status) | MISSING |
| `text-warning-text` | `statusUtils.ts` | MISSING |
| `bg-info-muted` | `statusUtils.ts` (RECEIVED, IN_PROGRESS) | MISSING |
| `text-info-text` | `statusUtils.ts` | MISSING |
| `bg-success-muted` | `statusUtils.ts` (READY, PAID) | MISSING |
| `text-success-text` | `statusUtils.ts` | MISSING |
| `bg-destructive-muted` | `statusUtils.ts` + 2 inline uses in route pages | MISSING |
| `text-destructive-text` | `statusUtils.ts` | MISSING |
| `bg-success` / `text-success` | 5+ usages in route pages (kpi, orders, pricelists) | MISSING |
| `bg-warning` / `text-warning` / `border-warning` | orders `[id]` page | MISSING |
| `text-warning-foreground` | orders `[id]` page | MISSING |

These tokens existed in the legacy Next.js `globals.css` (defined as hex values like `#10b981`). They were carried forward into `statusUtils.ts` and several route pages, but the corresponding CSS variable definitions were never added to `layout.css`.

At runtime, all these Tailwind classes silently produce no styling (Tailwind v4 generates no output for undefined `--color-*` variables). Order status badges render without background or text color.

---

## Hardcoded Color Scan

### In `.svelte` files (source only, no node_modules):

**`WorkloadCalendar.svelte` — concrete palette colors (not tokens):**
```
line 10: 'bg-destructive shadow-[0_0_8px_rgba(239,68,68,0.4)]'  ← rgba hardcoded
line 11: 'bg-orange-500'
line 12: 'bg-yellow-500'
line 13: 'bg-emerald-500'
line 35: 'bg-emerald-500'  (legend item)
line 39: 'bg-yellow-500'  (legend item)
```

These are intentional data-visualization colors for a "workload heat map" (free / ok / medium / saturated). They are not status badges. Whether to tokenize them depends on interpretation of "done" (see Recommended Plan).

**`rgba(239,68,68,0.4)` in `WorkloadCalendar.svelte`:** This is a literal rgba value inside a Tailwind arbitrary-value shadow class. It is the only hardcoded RGB color in the entire SvelteKit source. It hardcodes the Tailwind `red-500` value and does not use a CSS variable.

### In `.ts` files:

**`receipt-generator.ts` line 56:**
```
border-bottom: 1px dashed #000;
```
This is inside an inline HTML string that generates a print receipt (thermal printer format). Using `#000` for print output is standard practice and arguably not a theming concern — print receipts intentionally use absolute black.

### Summary:
| File | Issue | Severity |
|------|-------|----------|
| `statusUtils.ts` | Uses 8 token classes undefined in `layout.css` | HIGH — visible rendering defect |
| Route pages (orders, pricelists, kpi) | Use `bg-success`, `bg-warning`, `text-success`, `text-warning-foreground` — all undefined | HIGH — visible rendering defect |
| `WorkloadCalendar.svelte` | Uses `bg-orange-500`, `bg-yellow-500`, `bg-emerald-500`, `rgba(239,68,68,0.4)` | MEDIUM — intentional chart colors, debatable |
| `receipt-generator.ts` | Uses `#000` in print HTML string | LOW — print context, acceptable |

---

## AI_RULES.md Color Conventions

From `AI_RULES.md` section 3 ("Frontend Standards"):

**Relevant rules:**
- "Use **Tailwind CSS v4**. Avoid arbitrary values when theme values exist." (Section 3, Styling)
- Implies: raw hex/rgb arbitrary values like `rgba(239,68,68,0.4)` should be replaced with token-based equivalents when a theme value exists.
- "Rely exclusively on Tailwind CSS v4 classes and `shadcn-svelte` components" — no inline styles.

**What "done" looks like per AI_RULES.md:**
1. No hardcoded hex/rgb/hsl values in Svelte component classes (except when genuinely no token applies).
2. All semantic states (success, warning, info, destructive variants) use tokens defined in `layout.css`.
3. Arbitrary values like `shadow-[0_0_8px_rgba(239,68,68,0.4)]` replaced with token-based alternatives (e.g., `shadow-[0_0_8px_var(--color-destructive)/40]`).
4. Build passes: `bun run build` exits 0 (currently passing).

---

## Merge Blockers

### Blocker 1 — Missing semantic state tokens in `layout.css` (HIGH)

**Impact:** Order status badges across the entire app render with no color. `statusUtils.ts` references `bg-warning-muted`, `bg-info-muted`, `bg-success-muted`, `bg-destructive-muted` and their text counterparts — none are defined. Route pages use `bg-success`, `text-success`, `bg-warning`, `text-warning`, `text-warning-foreground` — also undefined.

**Resolution:** Add the missing CSS variable definitions to `layout.css` under both `:root` and `.dark` blocks, and register them in `@theme inline`.

Suggested values (matching the legacy `globals.css` intent, converted to oklch):
- `--success`: oklch(0.696 0.17 162) — emerald
- `--success-foreground`: oklch(1 0 0)
- `--success-muted`: oklch(0.948 0.052 162)
- `--success-text`: oklch(0.37 0.12 162)
- `--warning`: oklch(0.75 0.15 75) — amber
- `--warning-foreground`: oklch(1 0 0)
- `--warning-muted`: oklch(0.97 0.05 90)
- `--warning-text`: oklch(0.45 0.13 75)
- `--info`: oklch(0.65 0.15 250) — blue
- `--info-foreground`: oklch(1 0 0)
- `--info-muted`: oklch(0.94 0.04 250)
- `--info-text`: oklch(0.4 0.12 250)
- `--destructive-muted`: oklch(0.95 0.04 25)
- `--destructive-text`: oklch(0.4 0.15 25)

### Blocker 2 — `rgba(239,68,68,0.4)` arbitrary value in `WorkloadCalendar.svelte` (LOW-MEDIUM)

**Impact:** Violates the AI_RULES.md rule against arbitrary values when theme values exist. The `--color-destructive` token is available, so the shadow can reference it.

**Resolution:** Replace `shadow-[0_0_8px_rgba(239,68,68,0.4)]` with `shadow-[0_0_8px_oklch(from_var(--destructive)_l_c_h_/_40%)]` or define a named shadow utility. This is a low-risk, one-line fix.

### Non-Blockers (acceptable for merge)

- `WorkloadCalendar.svelte` uses `bg-orange-500`, `bg-yellow-500`, `bg-emerald-500` — these are data-visualization colors for a workload heat map legend. Using concrete Tailwind palette colors for chart/data visualization is a common and acceptable pattern when no semantic token applies. The AI_RULES.md rule "avoid arbitrary values when theme values exist" is satisfied since these are named palette utilities, not arbitrary values.
- `receipt-generator.ts` uses `#000` in a print HTML string — print context, acceptable.
- `bun run build` currently exits 0, so there is no TypeScript or Svelte compilation error.
- No merge conflicts (fast-forward merge confirmed).

---

## Recommended Plan

In order:

1. **Add missing semantic state tokens to `layout.css`**
   - Add `:root` definitions for `--success`, `--success-foreground`, `--success-muted`, `--success-text`, `--warning`, `--warning-foreground`, `--warning-muted`, `--warning-text`, `--info`, `--info-foreground`, `--info-muted`, `--info-text`, `--destructive-muted`, `--destructive-text`.
   - Add corresponding `.dark` overrides.
   - Register all new tokens in `@theme inline` block (e.g., `--color-success: var(--success);`).
   - Verify: order status badges render with color in browser.

2. **Fix `rgba` arbitrary value in `WorkloadCalendar.svelte`**
   - Replace `shadow-[0_0_8px_rgba(239,68,68,0.4)]` with a token-referenced alternative.
   - One-line change, low risk.

3. **Run `bun run build` — confirm exit 0**
   - Already passing; confirm it stays passing after token additions.

4. **Merge `feat--ui-color-standardization` into `main`**
   - No conflicts detected.
   - Merge is a fast-forward (main is the ancestor).
   - Use `--no-ff` to preserve branch history if desired.

5. **Verify Railway deploy succeeds from merged main**
   - The build artifact exists (`build/` in repo from `.svelte-kit/adapter-node`).
   - Existing Railway client workflow should be unaffected.

---

## Sources

- Direct inspection of `anotame-web/src/routes/layout.css` (HEAD)
- `git log 80b58fa..HEAD --oneline` — branch commit list
- `git diff main...HEAD --name-only` — changed file list
- `git show b832431` — color standardization commit detail
- `git merge --no-commit --no-ff main` — conflict probe (result: already up to date)
- `bun run build` in `anotame-web/` — build probe (result: exit 0, warnings from node_modules only)
- `anotame-web/src/lib/utils/statusUtils.ts` — token usage inspection
- `anotame-web/src/lib/components/dashboard/WorkloadCalendar.svelte` — hardcoded color inspection
- `AI_RULES.md` — project color/theming conventions
