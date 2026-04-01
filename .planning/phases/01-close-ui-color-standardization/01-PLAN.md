# Phase 1 Plan: Close UI Color Standardization

**Phase:** 1
**Plan:** 01
**Goal:** Merge `feat--ui-color-standardization` into `main` with all color token gaps closed and no hardcoded RGB values remaining in the SvelteKit source.
**Req IDs:** WIP-01

---

## Overview

The `feat--ui-color-standardization` branch contains the full SvelteKit rewrite and is a clean fast-forward against `main`. Before merging, three workstreams must complete:

1. **Token gaps**: 14 semantic state CSS tokens referenced throughout the app are missing from `layout.css` (causing colorless order status badges at runtime). One `rgba(239,68,68,0.4)` arbitrary value in `WorkloadCalendar.svelte` violates the project rule against hardcoded color values.

2. **Per-user color palette**: Each user can customize the three primary app colors (`--primary`, `--accent`, `--destructive`) by entering hex values. A color swatch circle previews the selection inline. Preferences persist per-user in localStorage (keyed by user ID). The current theme remains the default; users can reset at any time.

3. **Wire and merge**: Palette store applied on layout mount via CSS variable injection, then clean merge to `main`.

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

### Task 3: Create per-user palette store

**File**: `anotame-web/src/lib/stores/palette.svelte.ts` *(new file)*

**Action**: Create

```typescript
import { PersistedState } from 'runed';
import { authService } from '$lib/services/auth.svelte';

export type UserPalette = {
	primary: string | null;
	accent: string | null;
	destructive: string | null;
};

const DEFAULT_PALETTE: UserPalette = {
	primary: null,
	accent: null,
	destructive: null,
};

// All users' palettes stored as one map: { [userId]: UserPalette }
const _allPalettes = new PersistedState<Record<string, UserPalette>>('user_palettes', {});

export const paletteStore = {
	get current(): UserPalette {
		const userId = authService.user?.id;
		if (!userId) return DEFAULT_PALETTE;
		return _allPalettes.current[userId] ?? DEFAULT_PALETTE;
	},

	set(updates: Partial<UserPalette>) {
		const userId = authService.user?.id;
		if (!userId) return;
		_allPalettes.current = {
			..._allPalettes.current,
			[userId]: { ...this.current, ...updates },
		};
	},

	reset() {
		const userId = authService.user?.id;
		if (!userId) return;
		const copy = { ..._allPalettes.current };
		delete copy[userId];
		_allPalettes.current = copy;
	},

	hasCustom(): boolean {
		return Object.values(this.current).some((v) => v !== null);
	},
};
```

**Notes:**
- `null` means "use the layout.css default" — the CSS variable override is removed and the stylesheet value applies.
- Keyed by `authService.user?.id` so each user on a shared device retains their own palette.
- `PersistedState` is already used in `OrderWizardState.svelte.ts` — same import pattern applies.

**Verify**: File exists at `src/lib/stores/palette.svelte.ts`. TypeScript compilation passes (`bun run build`).

---

### Task 4: Wire palette store into the app layout

**File**: `anotame-web/src/routes/(app)/+layout.svelte`

**Action**: Edit

Add the palette import and a `$effect` to the `<script>` block. The effect runs on mount and whenever `paletteStore.current` changes, applying overrides to the document root. When a value is `null`, the inline style property is removed and the `layout.css` default takes over.

Replace the existing `<script>` block:

```svelte
<script lang="ts">
  import { useAuthGuard } from '$lib/guards/index.svelte';
  import MenuModal from '$lib/components/layout/menu-modal.svelte';
  import { paletteStore } from '$lib/stores/palette.svelte';

  let { children } = $props();
  const guard = useAuthGuard('/login');

  let isMenuOpen = $state(false);
  let isProfileOpen = $state(false);

  $effect(() => {
    const palette = paletteStore.current;
    const el = document.documentElement;
    const vars: Array<[string, string | null]> = [
      ['--primary', palette.primary],
      ['--accent', palette.accent],
      ['--destructive', palette.destructive],
    ];
    for (const [prop, value] of vars) {
      if (value) {
        el.style.setProperty(prop, value);
      } else {
        el.style.removeProperty(prop);
      }
    }
  });
</script>
```

**Verify**: No TypeScript errors. When a user sets a color in settings, the UI updates immediately without a page reload. When reset, the default theme color is restored.

---

### Task 5: Add color palette section to settings page

**File**: `anotame-web/src/routes/(app)/dashboard/settings/+page.svelte`

**Action**: Edit

Replace the entire file content with the following. The new card ("Paleta de colores") is inserted between the Apariencia card and the Idioma card. The hex input validates format on input and only applies valid 6-digit hex values (with or without leading `#`).

```svelte
<script lang="ts">
  import { mode, setMode, resetMode } from 'mode-watcher';
  import * as Card from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import SunIcon from 'lucide-svelte/icons/sun';
  import MoonIcon from 'lucide-svelte/icons/moon';
  import MonitorIcon from 'lucide-svelte/icons/monitor';
  import { paletteStore, type UserPalette } from '$lib/stores/palette.svelte';

  type ColorKey = keyof UserPalette;

  const colorEntries: { key: ColorKey; label: string; defaultHex: string }[] = [
    { key: 'primary',     label: 'Principal',   defaultHex: '#303030' },
    { key: 'accent',      label: 'Acento',      defaultHex: '#f5f5f5' },
    { key: 'destructive', label: 'Destructivo',  defaultHex: '#dc2626' },
  ];

  function normalizeHex(raw: string): string | null {
    const clean = raw.trim().replace(/^#/, '');
    return /^[0-9a-fA-F]{6}$/.test(clean) ? `#${clean}` : null;
  }

  function handleInput(key: ColorKey, raw: string) {
    const hex = normalizeHex(raw);
    if (hex) paletteStore.set({ [key]: hex });
    else if (raw === '' || raw === '#') paletteStore.set({ [key]: null });
  }

  function previewColor(key: ColorKey): string {
    return paletteStore.current[key] ?? colorEntries.find((e) => e.key === key)!.defaultHex;
  }
</script>

<div class="space-y-6 max-w-3xl mx-auto animate-in fade-in duration-300">
  <div>
    <h1 class="text-3xl font-heading font-bold text-foreground">Preferencias</h1>
    <p class="text-muted-foreground">Configura tu experiencia y visualización del sistema.</p>
  </div>

  <Card.Root>
    <Card.Header>
      <Card.Title>Apariencia</Card.Title>
      <Card.Description>Personaliza el tema visual para la aplicación.</Card.Description>
    </Card.Header>
    <Card.Content>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Button
          variant={mode.current === 'light' ? 'default' : 'outline'}
          class="h-24 flex flex-col gap-2 touch-manipulation"
          onclick={() => setMode('light')}
        >
          <SunIcon class="w-6 h-6" />
          Claro
        </Button>
        <Button
          variant={mode.current === 'dark' ? 'default' : 'outline'}
          class="h-24 flex flex-col gap-2 touch-manipulation"
          onclick={() => setMode('dark')}
        >
          <MoonIcon class="w-6 h-6" />
          Oscuro
        </Button>
        <Button
          variant={mode.current === undefined ? 'default' : 'outline'}
          class="h-24 flex flex-col gap-2 touch-manipulation"
          onclick={() => resetMode()}
        >
          <MonitorIcon class="w-6 h-6" />
          Sistema
        </Button>
      </div>
    </Card.Content>
  </Card.Root>

  <Card.Root>
    <Card.Header>
      <Card.Title>Paleta de colores</Card.Title>
      <Card.Description>
        Personaliza los colores principales. Ingresa un valor hexadecimal (#rrggbb). Deja vacío para usar el color predeterminado.
      </Card.Description>
    </Card.Header>
    <Card.Content class="space-y-4">
      {#each colorEntries as { key, label, defaultHex }}
        <div class="flex items-center gap-3">
          <div
            class="w-8 h-8 rounded-full border border-border shrink-0"
            style="background-color: {previewColor(key)}"
          ></div>
          <span class="w-28 text-sm font-medium shrink-0">{label}</span>
          <input
            type="text"
            class="flex-1 h-9 px-3 border border-input rounded-md bg-background text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder={defaultHex}
            value={paletteStore.current[key] ?? ''}
            oninput={(e) => handleInput(key, e.currentTarget.value)}
          />
          {#if paletteStore.current[key]}
            <Button
              variant="ghost"
              size="sm"
              class="shrink-0"
              onclick={() => paletteStore.set({ [key]: null })}
            >
              Restaurar
            </Button>
          {/if}
        </div>
      {/each}

      {#if paletteStore.hasCustom()}
        <div class="pt-2 border-t border-border">
          <Button variant="outline" size="sm" onclick={() => paletteStore.reset()}>
            Restaurar todos los colores
          </Button>
        </div>
      {/if}
    </Card.Content>
  </Card.Root>

  <Card.Root>
    <Card.Header>
      <Card.Title>Idioma (Próximamente)</Card.Title>
      <Card.Description>Configuración de idioma en progreso mediante Paraglide.</Card.Description>
    </Card.Header>
    <Card.Content>
      <p class="text-sm text-muted-foreground">Las traducciones están en desarrollo. El sistema operará temporalmente en Español general.</p>
    </Card.Content>
  </Card.Root>
</div>
```

**Notes:**
- `previewColor` falls back to the approximate hex equivalent of the default oklch token, so the circle always shows a reference color even before the user enters anything.
- `normalizeHex` accepts both `#dc2626` and `dc2626` formats. Empty input resets the slot to `null`.
- `paletteStore.current[key]` is reactive via Svelte 5 runes — the circle updates on every valid keystroke.

**Verify**: Settings page renders with three color rows. Typing a valid hex into "Principal" immediately updates the circle swatch and changes the UI's primary color. Clicking "Restaurar" reverts that slot. "Restaurar todos los colores" appears only when at least one color is customized. Reloading the page preserves the saved palette.

---

### Task 7: Build verification

**File**: n/a (command only)

**Action**: Run

From the `anotame-web/` directory:

```bash
bun run build
```

The command must exit 0. Warnings from `node_modules` are acceptable. Any TypeScript or Svelte compilation error is a blocker — stop and diagnose before proceeding.

**Verify**: `bun run build` exits 0. No errors in the output referencing files under `src/`.

---

### Task 8: Merge to `main`

**File**: n/a (git operations)

**Action**: Run

From the repository root:

```bash
git checkout main
git merge --no-ff feat--ui-color-standardization -m "feat: close UI color standardization — semantic tokens, rgba fix, per-user color palette"
```

Use `--no-ff` to preserve branch history. Do not rebase.

If the merge reports anything other than "Fast-forward" or a clean merge commit, stop and report the conflict before proceeding.

**Verify**: `git log --oneline -3` shows the merge commit on `main`. `git branch --merged main` includes `feat--ui-color-standardization`.

---

### Task 9: Post-merge verification

**File**: n/a (read-only checks)

**Action**: Verify

Run each check in order:

1. Confirm no color-related TODOs remain:
   ```bash
   grep -rn "TODO.*color\|TODO.*token\|TODO.*rgba\|rgba(" anotame-web/src/ --include="*.svelte" --include="*.ts" --include="*.css"
   ```
   Expected: zero matches (or only matches inside comments that are not action items).

2. Confirm `rgba(` is gone from all source files:
   ```bash
   grep -rn "rgba(" anotame-web/src/ --include="*.svelte" --include="*.ts"
   ```
   Expected: zero matches.

3. Confirm palette store exists:
   ```bash
   test -f anotame-web/src/lib/stores/palette.svelte.ts && echo "OK"
   ```
   Expected: `OK`.

4. Confirm build passes from `main`:
   ```bash
   bun run build
   ```
   Expected: exit 0.

5. Confirm Railway deploy workflow is unaffected:
   ```bash
   git show HEAD:.railway/ 2>/dev/null || echo "No .railway/ directory — Railway reads from root"
   git diff HEAD~1 HEAD -- "*.yml" "*.yaml" ".railway*"
   ```
   Expected: no changes to any Railway or CI configuration files in the merge commit.

**Verify**: All five checks above pass without errors.

---

## Commit Message

Use separate commits for each logical workstream on the feature branch before merging:

**Commit A** (token gaps + rgba fix):
```
fix: add missing semantic state tokens and replace rgba arbitrary value

- Add --success, --warning, --info, --destructive-muted/text tokens to layout.css
  in :root, .dark, and @theme inline blocks
- Replace rgba(239,68,68,0.4) in WorkloadCalendar.svelte with CSS relative color syntax
- Order status badges now render with correct semantic colors
```

**Commit B** (palette feature):
```
feat: add per-user color palette customization

- Add paletteStore (PersistedState, keyed by user ID) in src/lib/stores/palette.svelte.ts
- Wire CSS variable overrides into (app)/+layout.svelte via $effect
- Add "Paleta de colores" card to settings page with hex inputs and swatch circles
- Default theme unchanged; users can override primary, accent, destructive individually
```

**Merge commit** (Task 8):
```
feat: close UI color standardization — semantic tokens, rgba fix, per-user color palette
```

---

## Success Verification

Maps to phase success criteria:

| Criterion | How to verify |
|-----------|---------------|
| 1. Branch merged to main with no open conflicts | `git log --oneline main` shows the merge commit; `git status` is clean |
| 2. Railway deploy unaffected | Task 9 check 5 confirms no CI/Railway config altered; `bun run build` exits 0 on main |
| 3. No color TODOs or rgba values remain | Task 9 checks 1 and 2 return zero matches |
| 4. Per-user palette works | Task 9 check 3 confirms store file exists; manual test: setting a hex updates the UI immediately and persists after reload |
