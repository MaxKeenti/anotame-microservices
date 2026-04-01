# Phase 1 Plan: Close UI Color Standardization

**Phase:** 1
**Plan:** 01
**Goal:** Merge `feat--ui-color-standardization` into `main` with all color token gaps closed and no hardcoded RGB values remaining in the SvelteKit source.
**Req IDs:** WIP-01

---

## Overview

The `feat--ui-color-standardization` branch contains the full SvelteKit rewrite and is a clean fast-forward against `main`. Two fixes are required before merging: 14 semantic state CSS tokens referenced throughout the app are missing from `layout.css` (causing colorless order status badges at runtime), and one `rgba(239,68,68,0.4)` arbitrary value in `WorkloadCalendar.svelte` violates the project rule against hardcoded color values when a theme token exists. After both fixes, the plan runs the build, merges to `main`, and verifies the Railway deploy workflow is unaffected.

---

## Tasks

### Task 1: Add missing semantic state tokens to `layout.css`

**File**: `anotame-web/src/routes/layout.css`

**Action**: Edit

Add the following CSS variable definitions in three places inside the file. The insertion points are exact — match the surrounding whitespace style (tab-indented inside blocks).

**1a. Inside the `:root { }` block, after the `--destructive` line (currently line 22):**

```css
	--success: oklch(0.696 0.17 162);
	--success-foreground: oklch(1 0 0);
	--success-muted: oklch(0.948 0.052 162);
	--success-text: oklch(0.37 0.12 162);
	--warning: oklch(0.75 0.15 75);
	--warning-foreground: oklch(1 0 0);
	--warning-muted: oklch(0.97 0.05 90);
	--warning-text: oklch(0.45 0.13 75);
	--info: oklch(0.65 0.15 250);
	--info-foreground: oklch(1 0 0);
	--info-muted: oklch(0.94 0.04 250);
	--info-text: oklch(0.4 0.12 250);
	--destructive-muted: oklch(0.95 0.04 25);
	--destructive-text: oklch(0.4 0.15 25);
```

**1b. Inside the `.dark { }` block, after the `--destructive` line (currently line 57):**

Dark mode values use slightly adjusted lightness to maintain contrast on dark backgrounds:

```css
	--success: oklch(0.75 0.16 162);
	--success-foreground: oklch(0.145 0 0);
	--success-muted: oklch(0.25 0.06 162);
	--success-text: oklch(0.85 0.12 162);
	--warning: oklch(0.80 0.14 75);
	--warning-foreground: oklch(0.145 0 0);
	--warning-muted: oklch(0.26 0.05 90);
	--warning-text: oklch(0.88 0.10 75);
	--info: oklch(0.70 0.14 250);
	--info-foreground: oklch(0.145 0 0);
	--info-muted: oklch(0.24 0.05 250);
	--info-text: oklch(0.82 0.10 250);
	--destructive-muted: oklch(0.26 0.05 25);
	--destructive-text: oklch(0.85 0.12 25);
```

**1c. Inside the `@theme inline { }` block, after the `--color-destructive` line (currently line 94):**

```css
	--color-success: var(--success);
	--color-success-foreground: var(--success-foreground);
	--color-success-muted: var(--success-muted);
	--color-success-text: var(--success-text);
	--color-warning: var(--warning);
	--color-warning-foreground: var(--warning-foreground);
	--color-warning-muted: var(--warning-muted);
	--color-warning-text: var(--warning-text);
	--color-info: var(--info);
	--color-info-foreground: var(--info-foreground);
	--color-info-muted: var(--info-muted);
	--color-info-text: var(--info-text);
	--color-destructive-muted: var(--destructive-muted);
	--color-destructive-text: var(--destructive-text);
```

**Verify**: Open `layout.css` and confirm:
- The 14 `--success-*`, `--warning-*`, `--info-*`, and `--destructive-muted`/`--destructive-text` variables appear in `:root`.
- The same variable names appear in `.dark` with distinct dark-mode values.
- The corresponding `--color-*` aliases appear in `@theme inline`.

---

### Task 2: Replace `rgba` arbitrary value in `WorkloadCalendar.svelte`

**File**: `anotame-web/src/lib/components/dashboard/WorkloadCalendar.svelte`

**Action**: Edit

On line 10, replace the exact string:

```
'bg-destructive shadow-[0_0_8px_rgba(239,68,68,0.4)]'
```

with:

```
'bg-destructive shadow-[0_0_8px_oklch(from_var(--destructive)_l_c_h_/_40%)]'
```

This uses the CSS relative color syntax to derive the shadow color from the `--destructive` token rather than hardcoding the Tailwind red-500 value. The result is semantically equivalent to the original value in light mode and correctly follows the theme token in dark mode.

No other lines in this file require changes.

**Verify**: Line 10 of `WorkloadCalendar.svelte` reads:
```
        if (percentage >= 100) return 'bg-destructive shadow-[0_0_8px_oklch(from_var(--destructive)_l_c_h_/_40%)]';
```
No occurrence of `rgba(` remains in the file.

---

### Task 3: Build verification

**File**: n/a (command only)

**Action**: Run

From the `anotame-web/` directory:

```bash
bun run build
```

The command must exit 0. Warnings from `node_modules` are acceptable. Any TypeScript or Svelte compilation error is a blocker — stop and diagnose before proceeding.

**Verify**: `bun run build` exits 0. No errors in the output referencing files under `src/`.

---

### Task 4: Merge to `main`

**File**: n/a (git operations)

**Action**: Run

From the repository root:

```bash
git checkout main
git merge --no-ff feat--ui-color-standardization -m "feat: close UI color standardization — add semantic state tokens and fix hardcoded rgba"
```

Use `--no-ff` to preserve branch history. Do not rebase.

If the merge reports anything other than "Fast-forward" or a clean merge commit, stop and report the conflict before proceeding.

**Verify**: `git log --oneline -3` shows the merge commit on `main`. `git branch --merged main` includes `feat--ui-color-standardization`.

---

### Task 5: Post-merge verification

**File**: n/a (read-only checks)

**Action**: Verify

Run each check in order:

1. Confirm no color-related TODOs remain:
   ```bash
   grep -rn "TODO.*color\|TODO.*token\|TODO.*rgba\|rgba(" anotame-web/src/ --include="*.svelte" --include="*.ts" --include="*.css"
   ```
   Expected: zero matches (or only matches inside comments that are not action items).

2. Confirm no undefined token classes remain as the only use of `rgba(` in source:
   ```bash
   grep -rn "rgba(" anotame-web/src/ --include="*.svelte" --include="*.ts"
   ```
   Expected: zero matches.

3. Confirm build still passes from `main`:
   ```bash
   bun run build
   ```
   Expected: exit 0.

4. Confirm Railway deploy workflow is unaffected by checking that the existing Railway client workflow file is untouched:
   ```bash
   git show HEAD:.railway/ 2>/dev/null || echo "No .railway/ directory — Railway reads from root"
   git diff HEAD~1 HEAD -- "*.yml" "*.yaml" ".railway*"
   ```
   Expected: no changes to any Railway or CI configuration files in the merge commit.

**Verify**: All four checks above pass without errors.

---

## Commit Message

```
feat: close UI color standardization — add semantic state tokens and fix hardcoded rgba

- Add --success, --warning, --info, --destructive-muted/text tokens to layout.css
  in :root, .dark, and @theme inline blocks
- Replace rgba(239,68,68,0.4) in WorkloadCalendar.svelte with oklch relative color syntax
- Resolves WIP-01: order status badges now render with correct semantic colors
```

(This commit message is for the two code-change commits on the feature branch before merging. The merge commit message is provided in Task 4.)

---

## Success Verification

Maps to the three phase success criteria:

| Criterion | How to verify |
|-----------|---------------|
| 1. Branch merged to main with no open conflicts | `git log --oneline main` shows the merge commit; `git status` is clean |
| 2. Railway deploy succeeds from merged main | Task 5 check 4 confirms no CI/Railway config was altered; `bun run build` exits 0 on main (Task 5 check 3) |
| 3. No color-related TODOs or commented-out tokens remain | Task 5 checks 1 and 2 return zero matches for `rgba(` and TODO-color patterns |
