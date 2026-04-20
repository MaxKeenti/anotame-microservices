---
phase: 22-i18n-naming-convention-locale-infrastructure
plan: "22-03"
subsystem: frontend-i18n
tags: [paraglide, i18n, sveltekit, hooks, auth, locale-switcher, svelte5]
dependency_graph:
  requires:
    - phase: 22-01
      provides: [paraglide-compilation-pipeline, seed-messages, app.html lang attribute]
    - phase: 22-02
      provides: [user.locale-column, locale-patch-endpoint, locale-in-auth-response]
  provides:
    - paraglide-ssr-middleware-wired
    - locale-cookie-set-on-login
    - changeLocale-method-in-authservice
    - functional-locale-switcher-in-settings
  affects: [phase-23-string-extraction, any-feature-using-locale-context]
tech-stack:
  added: []
  patterns:
    - "paraglideMiddleware wraps SSR resolve in hooks.server.ts; API /api/* proxy short-circuits before locale processing"
    - "PARAGLIDE_LOCALE cookie (Paraglide v2 default cookie name) is the locale persistence mechanism"
    - "Paraglide v2 message functions use dot-notation bracket access: m[\"settings.page.title\"]() not m.settingsPageTitle()"
    - "Locale soft-swap via setLocale(newLocale, { reload: false }) + invalidateAll() avoids full page reload"
key-files:
  created: []
  modified:
    - anotame-web/src/hooks.server.ts
    - anotame-web/src/lib/services/auth.svelte.ts
    - anotame-web/src/routes/(app)/dashboard/settings/+page.svelte
key-decisions:
  - "API proxy short-circuits before paraglideMiddleware — avoids AsyncLocalStorage overhead for backend calls"
  - "Cookie name is PARAGLIDE_LOCALE (Paraglide v2 runtime default), not 'locale' as the plan specified"
  - "Message functions accessed via bracket notation m[\"settings.page.title\"]() — Paraglide v2 exports with dot-key string names, not camelCase"
  - "setLocale called with { reload: false } + invalidateAll() for soft locale swap without full page reload"
  - "Locale button labels (Español/English) are NOT translated — always shown in native language per CONTEXT.md decision"
patterns-established:
  - "Paraglide SSR: import paraglideMiddleware from $lib/paraglide/server; wrap resolve inside middleware callback; use transformPageChunk to inject locale into %lang%"
  - "Locale persistence: PARAGLIDE_LOCALE cookie set client-side; read by Paraglide cookie strategy on next SSR request"
requirements-completed: [I18N-01, I18N-06]
duration: 8min
completed: "2026-04-20"
---

# Phase 22 Plan 03: SSR Locale Hook + Settings Page Locale Switcher Summary

**Paraglide middleware wired into SvelteKit hooks.server.ts, locale cookie management added to AuthService, and settings page locale card replaced with a functional ES/EN switcher backed by the PATCH /users/{id}/locale endpoint.**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-04-20
- **Completed:** 2026-04-20
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- `hooks.server.ts` now wraps all non-API SSR requests in `paraglideMiddleware`, injecting the resolved locale into the HTML `lang` attribute via `transformPageChunk`
- `AuthService` stores and clears the `PARAGLIDE_LOCALE` cookie on login/logout and exposes a `changeLocale()` method that PATCHes the backend and updates local state
- Settings page language card is fully functional: 2 buttons (Español/México, English), active variant highlighting, soft locale swap on click with toast feedback

## Task Commits

1. **Task 1: Integrate Paraglide middleware into hooks.server.ts** - `e53e4e1` (feat)
2. **Task 2: Add locale to User interface and cookie management in AuthService** - `ab29f60` (feat)
3. **Task 3: Replace settings page placeholder with working locale switcher** - `838f353` (feat)

## Files Created/Modified

- `anotame-web/src/hooks.server.ts` - Added `paraglideMiddleware` import and wrapping; API proxy preserved as early-return path before middleware
- `anotame-web/src/lib/services/auth.svelte.ts` - Added `locale: string` to `User` interface; added `setLocaleCookie()`, `changeLocale()`; login sets cookie, logout clears it
- `anotame-web/src/routes/(app)/dashboard/settings/+page.svelte` - Added Paraglide imports, `handleLocaleChange` function, replaced placeholder card with locale switcher, replaced hardcoded strings with message functions

## Decisions Made

- **Cookie name `PARAGLIDE_LOCALE`:** The plan specified a `locale` cookie, but Paraglide v2 reads `PARAGLIDE_LOCALE` (from `runtime.js` `cookieName` export). Aligned `setLocaleCookie()` to use `PARAGLIDE_LOCALE` so Paraglide's cookie strategy picks it up automatically on the next SSR request.
- **Bracket notation for message functions:** The plan specified `m.settingsPageTitle()` (camelCase), but Paraglide v2 exports with dot-separated string keys: `export { settings_page_title as "settings.page.title" }`. Used `m["settings.page.title"]()` bracket notation instead.
- **Soft swap with `{ reload: false }`:** `setLocale` with default `reload: true` triggers a full page navigation. Used `setLocale(newLocale, { reload: false })` + `invalidateAll()` to update translations and SvelteKit data without a hard reload.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Cookie name corrected from `locale` to `PARAGLIDE_LOCALE`**
- **Found during:** Task 2 (AuthService implementation) while reading `src/lib/paraglide/runtime.js`
- **Issue:** Plan specified `document.cookie = 'locale=...'` but Paraglide v2's cookie strategy reads `PARAGLIDE_LOCALE` cookie (exported as `cookieName = "PARAGLIDE_LOCALE"` in runtime.js). Using `locale` would mean the cookie is never detected by Paraglide's strategy, silently falling back to `baseLocale` ("es") on every SSR request.
- **Fix:** Used `PARAGLIDE_LOCALE` in both `setLocaleCookie()` and the logout clear expression. Also used `PARAGLIDE_LOCALE=;max-age=0` in logout.
- **Files modified:** `auth.svelte.ts`
- **Committed in:** ab29f60

**2. [Rule 1 - Bug] Message function access changed from camelCase to bracket notation**
- **Found during:** Task 3 (settings page implementation) while reading generated `src/lib/paraglide/messages/_index.js`
- **Issue:** Plan specified `m.settingsLanguageTitle()` (camelCase), but Paraglide v2 exports keys as `"settings.language.title"` string identifiers. `m.settingsLanguageTitle` is `undefined` at runtime; only `m["settings.language.title"]` resolves to the function.
- **Fix:** Used bracket notation `m["settings.page.title"]()`, `m["settings.appearance.title"]()`, etc. for all 8 message function calls.
- **Files modified:** `+page.svelte`
- **Committed in:** 838f353

---

**Total deviations:** 2 auto-fixed (2 Rule 1 bugs)
**Impact on plan:** Both fixes were required for correct runtime behavior. Without them, locale detection and message rendering would have silently failed. No scope changes.

## Issues Encountered

None — both deviations were straightforward runtime API mismatches discovered by reading the generated Paraglide output before writing code.

## Known Stubs

None — the locale switcher is fully wired: `handleLocaleChange` PATCHes the backend, updates `PersistedState`, sets the `PARAGLIDE_LOCALE` cookie, and calls `setLocale` + `invalidateAll`. All message functions render real translated strings from `messages/es.json` and `messages/en.json`.

## Threat Flags

None — no new network endpoints, unauthenticated surfaces, or trust boundary changes. The `changeLocale` call goes through the existing authenticated `/api/identity/users/{id}/locale` PATCH endpoint already validated by Plan 22-02.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Paraglide locale pipeline is fully end-to-end: cookie set on login → SSR hook reads it → correct locale in SSR HTML → settings page can change it
- Phase 23 (Paraglide String Extraction) can now use the established patterns: `m["key.name"]()` bracket notation, `PARAGLIDE_LOCALE` cookie, `paraglideMiddleware` already in hooks
- `bun run build` exits 0, `bun run check` exits 0 (0 errors)

## Self-Check

- anotame-web/src/hooks.server.ts (paraglideMiddleware): FOUND
- anotame-web/src/lib/services/auth.svelte.ts (locale: string, changeLocale, PARAGLIDE_LOCALE): FOUND
- anotame-web/src/routes/(app)/dashboard/settings/+page.svelte (no Próximamente, locale switcher): FOUND
- Commit e53e4e1: FOUND
- Commit ab29f60: FOUND
- Commit 838f353: FOUND
- bun run build: PASS (exit 0)
- bun run check: PASS (0 errors)

## Self-Check: PASSED

---
*Phase: 22-i18n-naming-convention-locale-infrastructure*
*Completed: 2026-04-20*
