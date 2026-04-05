# Phase 14: Tenant Theming - Assumptions

**Date:** 2026-04-05
**For User Validation Before Execution**

## Architectural Assumptions

1. **Operations-Service API is running and accessible** during execution
   - Assumption: The operations-service instance is available at the configured API_OPERATIONS endpoint
   - Impact: If unavailable, theme load in +layout.server.ts will fail and return defaults (graceful)
   - Validation: Confirm operations-service is running before Wave 1 execution

2. **EstablishmentJpa schema can be modified** without requiring data migration backfill
   - Assumption: New fields (primaryColor, fontFamily) are nullable, so existing records don't need updates
   - Impact: Zero data migration risk; existing installations get null values (fallback to default theme)
   - Validation: User confirms operations-service supports Flyway migrations

3. **CSS variables (--primary, --font-sans) are already defined** in layout.css
   - Assumption: Both variables exist in :root and .dark scopes from Phase 10/13
   - Impact: We only inject values, don't create new variables
   - Validation: Read layout.css and confirm both variables are present

4. **Fonts (Inter, Outfit, Merriweather) are already @imported** in layout.css
   - Assumption: All three fonts have @fontsource-variable or @import declarations
   - Impact: CSS variable override works immediately without needing to load fonts
   - Validation: Check layout.css @import statements

5. **SvelteKit 5 $effect mechanism is working** in app layout
   - Assumption: Existing effects in +layout.svelte run correctly after hydration
   - Impact: New $effect for theme injection will work with same lifecycle
   - Validation: Confirm existing $effect in app layout executes on mount

6. **Authentication context is available** in +layout.server.ts and +layout.svelte
   - Assumption: Can access current user/establishment context to load theme
   - Impact: Theme loading tied to active session (single-tenant per browser session)
   - Validation: Confirm auth guards are in place on (app) route group

## Technical Assumptions

7. **Hex color format** is sufficient for user input and CSS injection
   - Assumption: Native `<input type="color">` returns hex, CSS variables accept hex
   - Risk: CSS might not render hex in custom property until browser supports it (modern browsers do)
   - Mitigation: Test in target browsers; store as hex in DB, inject as-is to CSS

8. **PersistedState from 'runed' library** works for tenant-level state (not just user-level)
   - Assumption: localStorage key is unique per tenant/establishment
   - Risk: Multi-tenant browsers could see previous tenant's theme if localStorage isn't scoped
   - Mitigation: Key by establishment ID in store initialization (not just generic 'tenant_theme')

9. **sveltekit-superforms schema extension** is backward compatible
   - Assumption: Adding two optional fields to existing establishment schema doesn't break other forms
   - Risk: If schema is shared across multiple forms, changes could affect others
   - Mitigation: Verify schema scope in admin settings +page.server.ts before modification

10. **Color picker component** can use native HTML `<input type="color">` without external library
    - Assumption: No need for external color picker library (chroma, tinycolor, etc.)
    - Risk: Mobile color picker UX varies by browser
    - Mitigation: Provide text hex input fallback alongside color picker

## Integration Assumptions

11. **Admin settings page** already exists at `/dashboard/admin/settings`
    - Assumption: Page has proper access control (admin-only) and form structure
    - Impact: We extend existing form, not create new page
    - Validation: Confirm page exists and is protected

12. **Form submission in admin settings** already posts to operations-service API
    - Assumption: Existing form has a server action or client-side API call that updates establishment
    - Impact: We wire new fields into existing submission flow
    - Validation: Review current form submission logic

13. **Client can reach `/api/operations/establishment` endpoint** via fetch in +layout.server.ts
    - Assumption: SvelteKit's `fetch` in server load has network access to operations-service
    - Risk: Network errors during hydration could delay page load
    - Mitigation: Wrap in try/catch, return default theme on error

14. **Light/dark mode toggle works independently** of theme injection
    - Assumption: Existing mode-watcher or similar handles .dark class on documentElement
    - Impact: Theme CSS variables are injected, then dark mode class controls which scope applies
    - Validation: Confirm dark mode switching doesn't interfere with theme store

## Data Assumptions

15. **Theme values are non-critical** and can gracefully degrade
    - Assumption: App is fully functional with default theme if tenant theme fails to load
    - Impact: Theme load failures don't block app launch
    - Validation: Confirm failure handling in +layout.server.ts returns usable defaults

## Rollback Assumptions

16. **Flyway migration is reversible**
    - Assumption: Each Flyway migration has a corresponding down migration (V*__add_establishment_theme_fields.sql + V*_reverse.sql)
    - Impact: Can roll back database schema without data loss
    - Validation: User confirms rollback strategy before migration deployment

17. **Theme store initialization is idempotent**
    - Assumption: Clearing localStorage and reloading app returns to default theme
    - Impact: No persisted theme state survives app reset
    - Validation: Verify localStorage.clear() + reload returns to Anotame defaults

## User Acceptance Assumptions

18. **Color picker workflow is intuitive** for non-technical admins
    - Assumption: Hex color picker + text input is sufficient UX (no advanced color space picker needed)
    - Risk: Admin might expect oklch or HSL picker
    - Mitigation: Document hex format in UI label; provide helpful placeholder like "#FF6B6B"

19. **Three preset fonts cover tenant branding needs**
    - Assumption: Inter, Outfit, Merriweather provide enough typographic variety for most SMBs
    - Risk: Tenant wants a font not in the preset
    - Mitigation: Deferred to Phase 15+ if custom fonts are requested; current scope is adequate

20. **Tenant theme persists correctly across browser sessions**
    - Assumption: Once tenant saves a color, reloading or navigating back shows the same color
    - Risk: If server-side load fails, localStorage backup applies (might be stale)
    - Mitigation: Server-side load is primary; localStorage is fallback only

---

## Pre-Execution Checklist

Before Wave 1 execution, confirm:

- [ ] Operations-service API is running and accessible at configured endpoint
- [ ] EstablishmentJpa supports schema modifications via Flyway
- [ ] layout.css contains --primary and --font-sans variables in both :root and .dark scopes
- [ ] Inter, Outfit, Merriweather fonts are @imported in layout.css
- [ ] SvelteKit 5 $effect is working in app layout (existing effects function)
- [ ] Admin settings page exists at /dashboard/admin/settings
- [ ] Dark mode toggle works independently of theme state
- [ ] Confirm which browser versions need color picker support (target modern browsers only)
- [ ] Rollback strategy documented (Flyway reverse migrations in place)

If any assumptions are incorrect, halt planning and notify user before proceeding.
