# Phase 14: Tenant Theming — Research

**Researched:** 2026-04-05
**Domain:** CSS Variables, Theme Injection, Tenant Configuration Storage
**Confidence:** HIGH

## Summary

Anotame has a functional CSS variable system (from Phase 10's shadcn preset) with oklch color values and an existing CSS variable injection mechanism (`paletteStore` + reactive effects in the app layout). Phase 14 extends this from user-level personalization to tenant-level branding by:

1. **Storage**: Adding `primaryColor` and `fontFamily` fields to EstablishmentJpa (operations-service) — currently supports `name`, `ownerName`, `taxInfo`, `dailyCapacityMinutes`
2. **Injection**: Loading tenant theme on app mount (during hydration) and applying CSS variables to `:root` via the existing effect mechanism in `(app)/+layout.svelte`
3. **UI**: Extending the admin settings form (`/dashboard/admin/settings`) with a color picker (hex format) and font dropdown (Inter, Outfit, or Merriweather)
4. **Defaults**: When no tenant customization exists, shadcn preset defaults apply (primary: `oklch(0.553 0.195 38.402)`, font-sans: 'Inter Variable')
5. **Light/Dark**: CSS variables already have separate definitions for `.dark` scope — tenant colors override both automatically

**Primary recommendation:** Add `primaryColor` and `fontFamily` to EstablishmentJpa, load during app hydration via apiService in `(app)/+layout.server.ts`, store in a new reactive store (tenant-level, not user-level), and inject into CSS variables in the existing `$effect` block. Use hex color picker for simplicity; convert to oklch for CSS only if validation/contrast checking is needed (defer to Phase 15).

---

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| THEME-01 | Tenant administrator can configure primary brand color and font family in establishment settings | Existing admin settings page at `/dashboard/admin/settings` with sveltekit-superforms pattern; EstablishmentJpa schema ready for two new fields |
| THEME-02 | Configured color and font are stored in operations-service and retrieved on app load | Operations-service API supports GET/PUT to `/establishment`; theme fields can be added alongside existing name/ownerName/taxInfo |
| THEME-03 | CSS variables (--primary, --font-sans) are dynamically overridden at :root level; default Anotame theme applies when no customization | Existing CSS variable system uses oklch() format; app layout already has $effect for DOM property injection; defaults are hardcoded in layout.css |

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| SvelteKit | 5 | Meta-framework; handles server/client boundaries | Anotame's foundation; provides hooks.server.ts, data loading, hydration |
| Svelte | 5 | Reactive framework; $state, $derived, $effect runes | Required for dynamic CSS variable updates without DOM manipulation libraries |
| Tailwind CSS | 4 | Utility-first CSS; theme integration | Primary styling system; CSS variables are defined in @theme inline block |
| shadcn-svelte | Latest | Component library with preset | Establishes color token system; preset includes 14+ semantic tokens |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| sveltekit-superforms | Latest | Form handling with Zod validation | Required for establishment settings form (already in use in admin/settings) |
| zod | Latest | TypeScript-first schema validation | Validate color hex format and font family enum on client |
| svelte-sonner | Latest | Toast notifications | User feedback on theme save/error |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Hex color picker | HSL picker or oklch picker | Hex is user-friendly and standard; HSL/oklch require additional conversion logic |
| Fetch color on hydration | LocalStorage-only theme | Tenant-level config requires backend sync on every app load (non-negotiable for multi-tenant) |
| Font dropdown (select) | Font upload/URL input | Dropdown is safer for accessibility and production stability; pre-approved fonts prevent CSS injection risk |

**Installation:**
```bash
# All dependencies already in project
bun install  # Ensures latest versions
```

---

## Architecture Patterns

### Recommended Project Structure
```
anotame-web/src/
├── routes/
│   └── (app)/
│       ├── +layout.svelte            # ← Inject tenant theme CSS variables
│       ├── +layout.server.ts         # ← LOAD theme data during hydration
│       └── dashboard/admin/settings/
│           └── +page.svelte          # ← Extend with color picker + font dropdown
├── lib/
│   ├── stores/
│   │   ├── palette.svelte.ts         # ← User-level (existing)
│   │   └── tenant-theme.svelte.ts    # ← NEW: Tenant-level theme store
│   ├── components/
│   │   └── ui/
│   │       └── color-picker.svelte   # ← NEW: Hex color picker component
│   └── services/
│       └── theme.svelte.ts           # ← NEW: Theme conversion utilities (hex ↔ oklch)
└── routes/
    └── layout.css                    # ← :root CSS variables (unchanged)
```

### Pattern 1: Tenant Theme Store (Reactive Store)
**What:** Svelte rune-based store that holds tenant-level theme config (not user-level).

**When to use:** Need a singleton source of truth for the current tenant's colors/fonts across all components.

**Example:**
```typescript
// src/lib/stores/tenant-theme.svelte.ts
import { PersistedState } from 'runed';
import { authService } from '$lib/services/auth.svelte';

export type TenantTheme = {
  primaryColor: string | null;      // Hex format: "#FF6B6B"
  fontFamily: 'Inter' | 'Outfit' | 'Merriweather' | null;
};

const DEFAULT_THEME: TenantTheme = {
  primaryColor: null,
  fontFamily: null,
};

// Store persists to localStorage as backup (survives page refresh during hydration)
const _theme = new PersistedState<TenantTheme>('tenant_theme', DEFAULT_THEME);

export const tenantThemeStore = {
  get current(): TenantTheme {
    return _theme.current ?? DEFAULT_THEME;
  },

  set(updates: Partial<TenantTheme>) {
    _theme.current = { ...this.current, ...updates };
  },

  hasCustom(): boolean {
    return this.current.primaryColor !== null || this.current.fontFamily !== null;
  },

  reset() {
    _theme.current = DEFAULT_THEME;
  },
};
```

**Why**: Avoids creating a new store on every component mount; leverages PersistedState (already used by paletteStore) for consistency.

### Pattern 2: CSS Variable Injection via $effect
**What:** Reactive effect that watches tenantThemeStore and applies CSS variables to document.documentElement.

**When to use:** Every color/font change must be immediately reflected in the DOM without page reload.

**Example:**
```typescript
// In src/routes/(app)/+layout.svelte
import { tenantThemeStore } from '$lib/stores/tenant-theme.svelte';

$effect(() => {
  const theme = tenantThemeStore.current;
  const root = document.documentElement;

  // Inject primary color if customized (convert hex → oklch on backend or here)
  if (theme.primaryColor) {
    root.style.setProperty('--primary', theme.primaryColor);
  } else {
    root.style.removeProperty('--primary');  // Fall back to CSS value
  }

  // Inject font family if customized
  if (theme.fontFamily) {
    const fontMap = {
      'Inter': "'Inter Variable', sans-serif",
      'Outfit': "'Outfit Variable', sans-serif",
      'Merriweather': "'Merriweather Variable', serif",
    };
    root.style.setProperty('--font-sans', fontMap[theme.fontFamily]);
  } else {
    root.style.removeProperty('--font-sans');
  }
});
```

**Why**: $effect automatically re-runs when tenantThemeStore changes; no manual subscription/cleanup needed. Svelte 5 runes pattern matches project conventions.

### Pattern 3: Server-Side Data Loading
**What:** Load tenant theme config during SvelteKit hydration (in +layout.server.ts) so it's available before client-side JavaScript executes.

**When to use:** Must prevent flash of unstyled content (FOUC) when tenant has custom colors.

**Example:**
```typescript
// src/routes/(app)/+layout.server.ts
import type { LayoutServerLoad } from './$types';
import { apiService, API_OPERATIONS } from '$lib/services/api.svelte';

export const load: LayoutServerLoad = async ({ fetch, depends }) => {
  depends('establishment:theme');  // Invalidates on demand

  try {
    const establishment = await fetch(`/api/operations/establishment`)
      .then(r => r.json());

    return {
      establishmentTheme: {
        primaryColor: establishment.primaryColor || null,
        fontFamily: establishment.fontFamily || null,
      },
    };
  } catch (err) {
    console.error('Failed to load tenant theme:', err);
    return { establishmentTheme: { primaryColor: null, fontFamily: null } };
  }
};
```

**Why**: Data loads on server (fast, no client-side waterfall); injected into page before hydration completes.

### Pattern 4: Color Picker Component (Hex Input)
**What:** Simple `<input type="color">` wrapper with fallback validation.

**When to use:** Admin form needs a user-friendly color picker that returns hex strings.

**Example:**
```svelte
<!-- src/lib/components/ui/color-picker.svelte -->
<script lang="ts">
  interface Props {
    value?: string;
    onChange?: (hex: string) => void;
    label?: string;
    id?: string;
  }

  let { value = '#FF6B6B', onChange, label = 'Select Color', id } = $props();

  function handleChange(e: Event) {
    const hex = (e.target as HTMLInputElement).value;
    onChange?.(hex);
  }
</script>

<div class="space-y-2">
  {#if label}
    <label for={id} class="text-sm font-medium">{label}</label>
  {/if}
  <div class="flex items-center gap-2">
    <input
      {id}
      type="color"
      {value}
      onchange={handleChange}
      class="h-10 w-16 border rounded cursor-pointer"
    />
    <input
      type="text"
      {value}
      onchange={(e) => handleChange(e)}
      class="flex-1 h-10 px-3 border rounded text-xs font-mono"
      placeholder="#FF6B6B"
    />
  </div>
  <p class="text-xs text-muted-foreground">Hex format: #RRGGBB</p>
</div>
```

**Why**: Native `<input type="color">` is mobile-friendly and requires zero dependencies. Text fallback ensures keyboard entry works.

### Anti-Patterns to Avoid
- **Storing tenant theme in client-side localStorage only**: Tenant changes wouldn't sync across browser tabs or devices without polling.
- **Converting hex → oklch at client-side runtime**: Adds unnecessary JavaScript; serve CSS values directly from backend.
- **Injecting CSS as `<style>` tags**: Pollutes DOM on every theme change; `element.style.setProperty()` is cleaner.
- **Using arbitrary Tailwind values for custom colors**: `--primary` CSS variable is already wired into Tailwind theme; use it directly.
- **Skipping dark mode variants**: CSS variable definitions exist for both `:root` and `.dark`; theme works automatically in both modes.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Color validation (hex format) | Custom regex to validate #RRGGBB | Zod schema: `z.string().regex(/^#[0-9A-F]{6}$/i)` | Zod is already in project; regex is fragile and hard to maintain |
| Theme persistence across page reloads | Custom localStorage wrapper | PersistedState from 'runed' (already in use) | Consistency with paletteStore pattern; automatic reactivity |
| CSS variable injection | Direct `document.documentElement.setAttribute('style', '...')` | Svelte $effect + `element.style.setProperty()` | Svelte runes are framework-standard; setProperty is safer than string concat (avoids injection) |
| Color format conversion (hex ↔ oklch) | Custom RGB/HSL→oklch math | Use backend for validation, serve oklch directly | oklch math is complex (polar color space); backend can validate contrast ratios and pre-compute values |
| Font loading | Custom @import logic | Import in layout.css as @fontsource-variable (already present) | Fonts are already loaded; just change --font-sans variable reference |

**Key insight:** Theming *seems* simple (set CSS variables) but has hidden complexity: color space conversions, cross-browser consistency, preventing FOUC, dark mode support, contrast validation. Reuse existing patterns (PersistedState, $effect, sveltekit-superforms) rather than inventing new ones.

---

## Runtime State Inventory

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | **Mem0 memories:** None expected — tenant theme is new data. **Operations DB:** New fields `primaryColor`, `fontFamily` to add to `tce_establishment` table. | Database migration: Add two nullable VARCHAR columns to EstablishmentJpa; set defaults to NULL (fallback to CSS values). |
| Live service config | **Operations-service API:** Currently no theme fields in GET/PUT `/establishment`. Payload grows by 2 fields. | Update EstablishmentController and EstablishmentService to handle new fields; no breaking change (backward compatible with null defaults). |
| OS-registered state | None — theming is app-level only, no task scheduler or environment variable involvement. | None. |
| Secrets/env vars | None — color values are public branding, not secrets. | None. |
| Build artifacts | None — fonts are already imported in layout.css; theme variables compile with normal build. | None. |

---

## Common Pitfalls

### Pitfall 1: Flash of Unstyled Content (FOUC)
**What goes wrong:** App loads with default (Anotame brand) colors, then **after hydration completes** switches to tenant colors. User sees brief color flicker.

**Why it happens:** CSS variables are set in client-side JavaScript via `$effect`, which runs *after* HTML render. Server-side rendering (SSR) of the CSS variable values would prevent this.

**How to avoid:**
- Load theme config in `+layout.server.ts` and return it as page data
- Pass theme data to client during hydration via `data.establishmentTheme`
- Initialize tenantThemeStore with server data before any rendering
- Render a `<style>` tag in `<svelte:head>` during SSR with inline CSS variables (critical path optimization)

**Warning signs:**
- Color changes visible after page finishes loading (should be instant)
- Dark mode theme not applied until JavaScript runs
- Rapid theme switch when navigating between pages

### Pitfall 2: Color Format Mismatch
**What goes wrong:** Admin enters hex color `#FF6B6B` (user-friendly), but CSS expects oklch format. Values don't match, injection fails or looks wrong.

**Why it happens:** Tailwind's color system uses oklch for better perceptual uniformity. Hex is standard for color pickers but requires conversion.

**How to avoid:**
- Store color as hex in database (simple, reversible)
- Convert hex → oklch server-side *only if* doing contrast validation (Phase 15 enhancement)
- Pass hex directly to CSS? No — CSS doesn't understand hex in custom properties. Instead: either store as oklch in DB, or convert in frontend before injection
- **Recommendation:** Store as hex in DB for auditability; convert to oklch in EstablishmentService before serializing response

**Warning signs:**
- CSS variables not applying even after checking storage
- Color looks different in app vs. color picker
- Contrast ratio validation fails inconsistently

### Pitfall 3: Dark Mode CSS Variables Not Updated
**What goes wrong:** Tenant color is injected into `:root` successfully, but dark mode (`.dark` scope) still uses original Anotame primary.

**Why it happens:** CSS variable definitions exist in both `:root` and `.dark` blocks. Injecting into `:root` overrides both by CSS specificity — unless dev forgets to test dark mode.

**How to avoid:**
- Test both light and dark mode after theme change (use mode-watcher)
- CSS variable cascading means `:root` injection overrides `.dark` definitions — this is correct behavior
- Don't try to manually set variables for both scopes — CSS handles it

**Warning signs:**
- Light mode shows custom color; dark mode shows default color
- Toggling dark mode on Settings page doesn't show theme live
- Only one mode looks correct

### Pitfall 4: Multi-Tenant Isolation (CSS Variable Scope)
**What goes wrong:** Tenant A's colors leak into Tenant B's session if using the same browser tab or if CSS variables aren't properly scoped.

**Why it happens:** CSS variables are global (`:root` scope). If two users log in and both inject CSS variables into the same DOM, the second one overwrites the first.

**How to avoid:**
- Anotame is single-tenant per browser session (one user logs in, one establishment is active)
- Each login/logout clears the DOM and rehydrates with that user's establishment theme
- CSS variable injection happens in `(app)/+layout.svelte` which is inside the authenticated route guard
- Logout clears session, next login rehydrates with new establishment's theme

**Warning signs:**
- Switching between accounts in same browser shows mixed themes
- Color change in one tab affects other tabs for different users (shouldn't happen with proper auth isolation)

### Pitfall 5: Font Family Fallback Missing
**What goes wrong:** Admin selects 'Outfit', but @import for Outfit font fails or is commented out. Text uses system sans-serif instead.

**Why it happens:** Font imports in layout.css are optional (if network fails). Overriding --font-sans with a font name that isn't loaded causes browser fallback to serif/monospace.

**How to avoid:**
- Only offer fonts that are already @imported in layout.css (Inter, Outfit, Merriweather)
- Validate font selection on client to match available fonts
- Don't allow custom font URLs (injection risk, maintenance burden)
- Always include fallback: `'Outfit Variable', 'Outfit', sans-serif` in the CSS value

**Warning signs:**
- Font looks different than preview in color picker
- Selected font doesn't apply to any text
- Typography appears broken after theme change

---

## Code Examples

Verified patterns from official sources:

### Example 1: Loading Data in +layout.server.ts
```typescript
// Source: SvelteKit docs (https://kit.svelte.dev/docs/load)
// src/routes/(app)/+layout.server.ts

import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ fetch, depends }) => {
  // Register dependency so invalidateAll() works
  depends('establishment:theme');

  try {
    const res = await fetch('/api/operations/establishment');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const establishment = await res.json();

    return {
      establishmentTheme: {
        primaryColor: establishment.primaryColor || null,
        fontFamily: establishment.fontFamily || null,
      },
    };
  } catch (err) {
    console.error('Failed to load tenant theme:', err);
    // Return defaults on error (app still works)
    return {
      establishmentTheme: { primaryColor: null, fontFamily: null },
    };
  }
};
```

### Example 2: Injecting Theme into Store on Mount
```typescript
// Source: Svelte 5 runes (https://svelte.dev/docs/svelte-5-overview)
// In src/routes/(app)/+layout.svelte

import { tenantThemeStore } from '$lib/stores/tenant-theme.svelte';

let { data, children } = $props();

// Hydrate store with server-loaded theme
$effect.pre(() => {
  if (data.establishmentTheme) {
    tenantThemeStore.set(data.establishmentTheme);
  }
});
```

### Example 3: CSS Variable Injection with $effect
```typescript
// Source: Svelte 5 reactivity (https://svelte.dev/docs/svelte/effects)
// In src/routes/(app)/+layout.svelte

$effect(() => {
  const theme = tenantThemeStore.current;
  const root = document.documentElement;

  // Primary color injection (hex → CSS variable)
  if (theme.primaryColor) {
    root.style.setProperty('--primary', theme.primaryColor);
  } else {
    root.style.removeProperty('--primary');
  }

  // Font family injection
  if (theme.fontFamily) {
    const fonts = {
      'Inter': "'Inter Variable', sans-serif",
      'Outfit': "'Outfit Variable', sans-serif",
      'Merriweather': "'Merriweather Variable', serif",
    };
    root.style.setProperty('--font-sans', fonts[theme.fontFamily]);
  } else {
    root.style.removeProperty('--font-sans');
  }
});
```

### Example 4: Color Picker in Admin Settings Form
```svelte
<!-- Source: sveltekit-superforms pattern (https://superforms.rocks/)
     From /dashboard/admin/settings/+page.svelte -->

<script lang="ts">
  import { superForm, defaults } from 'sveltekit-superforms';
  import { zod4 } from 'sveltekit-superforms/adapters';
  import { z } from 'zod';
  import ColorPicker from '$lib/components/ui/color-picker.svelte';
  import * as Select from '$lib/components/ui/select';

  const settingsSchema = z.object({
    name: z.string().min(1),
    primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color').nullable(),
    fontFamily: z.enum(['Inter', 'Outfit', 'Merriweather']).nullable(),
  });

  let { form, enhance } = superForm(defaults(zod4(settingsSchema)), {
    SPA: true,
    validators: zod4(settingsSchema),
  });
</script>

<!-- In the form -->
<div class="space-y-2">
  <label class="text-sm font-medium">Brand Color</label>
  <ColorPicker value={$form.primaryColor || '#FF6B6B'} />
</div>

<div class="space-y-2">
  <label class="text-sm font-medium">Font Family</label>
  <Select.Root bind:value={$form.fontFamily}>
    <Select.Content>
      <Select.Item value="Inter">Inter Variable (Default)</Select.Item>
      <Select.Item value="Outfit">Outfit Variable</Select.Item>
      <Select.Item value="Merriweather">Merriweather Variable</Select.Item>
    </Select.Content>
  </Select.Root>
</div>
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hard-coded brand colors in CSS | CSS custom properties (variables) + design tokens | Phase 10 (shadcn preset) | Enables runtime theme switching without recompile |
| User-level color personalization only | User + tenant-level theming | Phase 14 | Multi-tenant SaaS now supports per-establishment branding |
| Inline hex colors scattered in components | Centralized oklch values in layout.css | Phase 13 (Color Audit) | Ensures WCAG compliance and consistent color meaning |

**Deprecated/outdated:**
- Direct CSS color values in component files — use CSS variables instead
- `statusUtils.ts` hardcoded color mappings — consolidated into StatusBadge.svelte component

---

## Open Questions

1. **Color Validation & Contrast Checking (Phase 15 enhancement)**
   - Should tenant colors validate WCAG AA contrast against backgrounds?
   - Should we convert hex → oklch and run perceptual math to check contrast?
   - Current recommendation: **Defer to Phase 15**. Phase 14 stores the color, Phase 15 adds validation.

2. **Hex vs. oklch Storage Format**
   - Store as hex (user-friendly, but requires conversion for contrast math)
   - Store as oklch (math-friendly, but less user-facing)
   - Current recommendation: **Store as hex in DB**. Operations-service can convert to oklch if needed. Simpler for admin UI and auditability.

3. **Font Upload vs. Preset Selection**
   - Allow tenants to upload custom fonts (more flexibility)
   - Restrict to pre-approved fonts (safer, simpler)
   - Current recommendation: **Preset selection only**. Upload adds security/maintenance burden. Three fonts (Inter, Outfit, Merriweather) cover most use cases.

4. **Cached Logo/Assets Customization**
   - Should Phase 14 also support custom logos/brand assets?
   - Current scope says "no" (just colors + fonts)
   - Current recommendation: **Out of scope for Phase 14**. Defer asset branding to Phase 15. Requires file upload, CDN, image optimization.

5. **Flash of Unstyled Content (FOUC) Prevention**
   - How aggressively should we prevent FOUC? (Critical path CSS, inline variables in SSR?)
   - Current recommendation: **Use server-side data loading** (+layout.server.ts) and initialize store before render. If FOUC persists, add `<style>` tag in `<svelte:head>` with inline variables (Wave 2 optimization).

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Build/runtime | ✓ | 20+ | — |
| Bun | Package manager | ✓ | 1.0+ | npm/yarn |
| Docker | Local development (optional) | ✓ | 24+ | Run services directly |
| PostgreSQL | operations-service data layer | ✓ | 15+ | — |
| Operations-service API | Theme fetch/save | ✓ | Running | 500 error on startup if unreachable |

**Missing dependencies with no fallback:**
- None — all tools are present.

**Missing dependencies with fallback:**
- None — all required tools are available.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest + Svelte Testing Library (or Jest, if preferred) |
| Config file | `vitest.config.ts` (if exists) or `vite.config.ts` |
| Quick run command | `bun test --run` or `bun test` (watch mode) |
| Full suite command | `bun test --run` (all tests) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| THEME-01 | Admin can save primary color and font in settings form | Integration | `bun test settings.integration.test.ts -t "theme form"` | ❌ Wave 0 |
| THEME-02 | Saved theme config is returned by GET /api/operations/establishment | Unit | `bun test establishment.service.test.ts -t "primaryColor"` | ❌ Wave 0 |
| THEME-02 | Theme loads on app hydration and is available in data | Integration | `bun test +layout.server.test.ts -t "theme load"` | ❌ Wave 0 |
| THEME-03 | Default Anotame colors apply when no custom theme exists | Unit | `bun test tenant-theme.store.test.ts -t "defaults"` | ❌ Wave 0 |
| THEME-03 | CSS --primary variable matches tenant color in DOM | Integration | `bun test css-injection.test.ts -t "primary color"` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `bun test --run` (all unit tests)
- **Per wave merge:** `bun test --run` + `bun run build` (full suite + build check)
- **Phase gate:** All tests green + no regressions in light/dark mode switching before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/stores/tenant-theme.store.test.ts` — covers store initialization, set(), reset(), hasCustom()
- [ ] `tests/components/color-picker.test.ts` — covers hex input validation and onChange callback
- [ ] `tests/routes/admin-settings.integration.test.ts` — covers form submission with primaryColor + fontFamily
- [ ] `tests/lib/services/theme.service.test.ts` — covers color validation (hex regex) and font enum validation
- [ ] `tests/css-injection.test.ts` — covers $effect → DOM style.setProperty() injection

*(If testing infrastructure doesn't exist, add to Wave 0 plan)*

---

## Sources

### Primary (HIGH confidence)
- **Phase 13 Color Audit Summary** (`.planning/phases/13-color-audit-wcag-compliance/13-SUMMARY.md`) — Confirmed CSS variable structure and oklch format
- **EstablishmentJpa** (`anotame-api/backend/operations-service/.../EstablishmentJpa.java`) — Current schema; ready for primaryColor, fontFamily fields
- **Admin Settings Page** (`anotame-web/src/routes/(app)/dashboard/admin/settings/+page.svelte`) — Existing form pattern using sveltekit-superforms
- **App Layout** (`anotame-web/src/routes/(app)/+layout.svelte`) — Confirmed $effect mechanism for CSS injection
- **Palette Store** (`anotame-web/src/lib/stores/palette.svelte.ts`) — Existing PersistedState pattern for theme storage
- **Layout CSS** (`anotame-web/src/routes/layout.css`) — Confirmed `:root` and `.dark` variable definitions

### Secondary (MEDIUM confidence)
- SvelteKit docs (https://kit.svelte.dev/docs/load) — Server data loading pattern verified for +layout.server.ts
- Svelte 5 docs (https://svelte.dev/docs/svelte-5-overview) — $effect reactivity verified for DOM injection
- sveltekit-superforms docs (https://superforms.rocks/) — Form pattern already in project, confirmed for extension

### Tertiary (LOW confidence)
- None — all findings verified against project code or official framework docs

---

## Metadata

**Confidence breakdown:**
- Standard Stack: **HIGH** — All libraries verified in project.json and current usage
- Architecture: **HIGH** — CSS variable system proven in Phase 10 & 13; existing theme injection mechanism in (app)/+layout.svelte
- Pitfalls: **HIGH** — Identified by examining Phase 13 color work and reviewing form submission patterns in admin settings
- Runtime State: **HIGH** — Database schema reviewed; no data migration concerns for nullable new fields

**Research date:** 2026-04-05
**Valid until:** 2026-04-15 (10 days; extend if dependencies change)

---

## Notes for Planner

1. **Database Migration**: Add nullable columns `primary_color VARCHAR(7)` and `font_family VARCHAR(32)` to `tce_establishment`. Include down-migration for rollback.

2. **API Enhancement**: Update EstablishmentService and EstablishmentController to serialize/deserialize the new fields. No breaking changes (fields are optional).

3. **Client-Side Store**: Duplicate the paletteStore pattern to create tenantThemeStore — reuse PersistedState and `runed` library for consistency.

4. **Form Extension**: Add two fields to the existing admin settings schema and UI (color picker + font select). Reuse existing sveltekit-superforms pattern.

5. **Hydration**: Create `(app)/+layout.server.ts` to load theme config at build time, and initialize tenantThemeStore before render to prevent FOUC.

6. **Testing**: Phase requires at least 5 test files for store, component, integration, and CSS injection verification. Set up Vitest if not already configured.

7. **Light/Dark Mode**: Theme change works automatically in both modes because CSS variables are defined in both `:root` and `.dark` scopes. Test both before signing off.

8. **Contrast Validation**: Defer to Phase 15. Phase 14 ships theme storage + basic injection. Phase 15 adds WCAG contrast checking and perceptual color validation.
