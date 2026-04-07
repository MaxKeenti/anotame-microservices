# Phase 14: Tenant Theming - Context

**Gathered:** 2026-04-05
**Status:** Ready for planning
**Research:** 14-RESEARCH.md

<domain>
## Phase Boundary

Enable per-tenant visual customization (brand colors and typography) stored in operations-service and dynamically applied at app load via CSS variable overrides.

In scope:
- Add `primaryColor` (hex format) and `fontFamily` (enum) fields to EstablishmentJpa
- Create/update REST API endpoints in operations-service for theme config retrieval and storage
- Load tenant theme config on app hydration (via +layout.server.ts)
- Inject CSS variables (--primary, --font-sans) into :root via $effect in app layout
- Extend admin settings UI with color picker and font family dropdown
- Support light and dark mode theme application (CSS variables already have .dark scope support)

Out of scope:
- Color validation/contrast checking (deferred to Phase 15)
- Custom font upload or CDN integration (preset selection only)
- Cached logo/asset customization (deferred to Phase 15)
- Hex to oklch conversion at database layer (store as hex in DB for auditability)

</domain>

<decisions>
## Implementation Decisions

### Color Format Storage
- **D-01:** Store primary color as **hex format in database** (`primaryColor VARCHAR(7)`, e.g., "#FF6B6B") for simplicity and auditability. Frontend injects hex directly to CSS custom property. Conversion to oklch deferred to Phase 15 if contrast validation is needed.

### Font Selection
- **D-02:** Support exactly three pre-approved fonts via **dropdown enum** (Inter, Outfit, Merriweather). No custom font upload or URL input — eliminates security/maintenance burden while covering 90% of use cases.

### Theme Store Pattern
- **D-03:** Create **tenant-level theme store** (not user-level) reusing the existing `PersistedState` pattern from `paletteStore` for consistency. Store as singleton source of truth across all components.

### Hydration Strategy
- **D-04:** Load tenant theme config in **+layout.server.ts** during hydration to prevent flash of unstyled content (FOUC). Initialize tenantThemeStore with server data before first render.

### CSS Variable Injection
- **D-05:** Use Svelte 5 **$effect mechanism** to watch tenantThemeStore and apply CSS variables via `element.style.setProperty()`. No manual DOM attribute manipulation — cleaner and safer than string concat.

### Admin Form Extension
- **D-06:** Extend existing `/dashboard/admin/settings` form with color picker (`<input type="color">`) and font family `<Select>`. Reuse existing sveltekit-superforms pattern and schema validation via Zod.

### Light/Dark Mode Support
- **D-07:** Theme works automatically in both light and dark modes because CSS variable definitions exist in both `:root` and `.dark` scopes. No duplicate CSS variable injection logic needed — CSS cascade handles it.

### Default Behavior
- **D-08:** When no tenant customization exists (primaryColor and fontFamily both null), shadcn preset defaults apply automatically. No explicit fallback logic needed — CSS provides default values.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Research Foundation
- `.planning/phases/14-tenant-theming/14-RESEARCH.md` — Full technical analysis, architecture patterns, pitfalls, and code examples

### Related Phases (Dependency)
- `.planning/phases/13-color-audit-wcag-compliance/13-SUMMARY.md` — CSS variable system proven stable; WCAG compliance established
- `.planning/phases/10-shadcn-preset-init-design-token-refresh/` — Design token foundation; CSS variable structure for --primary, --font-sans

### Assets to Modify/Create
- `anotame-api/backend/operations-service/EstablishmentJpa.java` — Add primaryColor, fontFamily fields
- `anotame-api/backend/operations-service/EstablishmentService.java` — Add getter/setter for theme fields
- `anotame-api/backend/operations-service/EstablishmentController.java` — Expose theme fields in GET/PUT endpoints
- `anotame-api/backend/*/flyway/migrations/` — Add V*__add_establishment_theme_fields.sql migration
- `anotame-web/src/lib/stores/tenant-theme.svelte.ts` — NEW: Tenant-level theme store (PersistedState pattern)
- `anotame-web/src/routes/(app)/+layout.server.ts` — Load theme on hydration
- `anotame-web/src/routes/(app)/+layout.svelte` — Inject CSS variables via $effect
- `anotame-web/src/routes/(app)/dashboard/admin/settings/+page.svelte` — Add color picker + font dropdown
- `anotame-web/src/lib/components/ui/color-picker.svelte` — NEW: Hex color picker component (optional; can use native `<input type="color">`)

### Requirements & Prior Context
- `.planning/REQUIREMENTS.md` — REQ-THEME-01, REQ-THEME-02, REQ-THEME-03 (see ROADMAP.md Phase 14 section)
- `.planning/ROADMAP.md` — Phase 14 success criteria and dependency on Phase 13

</canonical_refs>

<code_context>
## Existing Code Insights

### Operations-Service (Backend)
EstablishmentJpa currently supports:
- `name`, `ownerName`, `taxInfo`, `dailyCapacityMinutes`
- New fields: `primaryColor` (VARCHAR(7), nullable), `fontFamily` (VARCHAR(32), nullable)

EstablishmentService already handles GET/PUT establishment:
- Just add new fields to serialization/deserialization

### Anotame-Web (Frontend)
Existing patterns to reuse:
- **Stores:** `paletteStore` in `src/lib/stores/palette.svelte.ts` uses `PersistedState` from 'runed' — duplicate this pattern for tenantThemeStore
- **Forms:** Admin settings page uses `sveltekit-superforms` with Zod validation — extend existing form schema
- **CSS:** Layout.css has :root and .dark CSS variable definitions — just inject values, no new variables needed
- **Layout:** App layout at `src/routes/(app)/+layout.svelte` already has $effect mechanism for reactive updates

### Design Token Availability
From Phase 10 & 13:
- `--primary` CSS variable exists in both :root and .dark scopes
- `--font-sans` CSS variable exists and controls all body/default text font
- Both can be overridden at runtime via setProperty()

</code_context>

<deferred>
## Deferred Ideas

- **Contrast Validation (Phase 15):** Don't validate WCAG AA contrast of tenant-selected colors in Phase 14. Defer to Phase 15 enhancement with backend color validation logic.
- **Color Format Conversion (Phase 15):** Don't convert hex to oklch in Phase 14. Defer to Phase 15 if perceptual color math is needed.
- **Asset Customization (Phase 15):** Logo/favicon customization deferred. Phase 14 is colors + fonts only.
- **Font Upload:** Never implement in-app custom font upload. Stick to preset selection (security + maintenance burden too high).

</deferred>
