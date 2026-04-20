# Phase 22: i18n Naming Convention + Locale Infrastructure - Context

**Gathered:** 2026-04-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Establish the i18n foundations for v1.5: the message-key naming convention (SEED-002), Paraglide project initialization, per-user locale persistence in identity-service, SSR locale resolution in `hooks.server.ts`, and a working locale switcher on the existing settings page. This phase delivers INFRASTRUCTURE only — Phase 23 handles the actual string extraction and EN translation.

</domain>

<decisions>
## Implementation Decisions

### Locale Persistence & Session Flow
- **D-01:** Locale is returned as a field in the login response and stored in `PersistedState<User>` alongside `id`, `username`, `email`, `role`. The `User` interface gains a `locale: string` field.
- **D-02:** A separate, non-HttpOnly `locale` cookie is set by the frontend on login and on locale change. This cookie is readable by `hooks.server.ts` for SSR locale resolution. It is NOT part of the auth token / JWT.
- **D-03:** `hooks.server.ts` reads the `locale` cookie before calling `resolve()`. If present, calls Paraglide's `setLocale()` so SSR renders in the correct language. If absent (anonymous user), falls back to `Accept-Language` header detection with `es-MX` as the final fallback.
- **D-04:** The login page and any anonymous routes use `Accept-Language` to determine locale — if the browser prefers English, the login page renders in English; otherwise defaults to `es-MX`.
- **D-05:** On locale change in the settings page: (1) PATCH `/users/{id}/locale` to persist in identity-db, (2) update `authService.user.locale` in `PersistedState`, (3) set `locale` cookie, (4) call `setLocale()` + `invalidateAll()` for soft swap — no full page reload.

### Agent's Discretion
- Naming convention details: The `domain.component.purpose` pattern with 3-segment max and camelCase is locked from FEATURES.md research. The agent decides how to ship the lint rule (Vitest test, standalone script, or pre-commit hook) — whichever integrates best with the existing build pipeline (`bun run check`).
- Paraglide init strategy: The agent decides how many seed strings (if any) to extract in Phase 22 to prove the pipeline works end-to-end vs. leaving all extraction for Phase 23. A minimal proof (e.g., 5-10 strings on the settings page) is acceptable if it validates the setup without scope-creeping into full extraction.
- Error response migration: Deferred to Phase 23. Phase 22 does not change backend error response format. The error code pattern will be introduced when extraction happens.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### i18n Research
- `.planning/research/FEATURES.md` — §5 Message-Key Naming Convention (SEED-002): defines `domain.component.purpose` pattern, domain buckets, lint regex, and anti-patterns (no key reuse, no abbreviations, max 3 segments)
- `.planning/research/STACK.md` — Paraglide JS setup, Vite plugin config, alternatives rejected
- `.planning/research/ARCHITECTURE.md` — §Pattern 4: Soft Locale Swap (no full reload) — exact `setLocale()` + `invalidateAll()` flow
- `.planning/research/PITFALLS.md` — §Pitfall 7: SSR Locale Flash (hooks.server.ts must set locale BEFORE load runs)

### Seeds
- `.planning/seeds/SEED-002-paraglide-naming-refactor.md` — Original seed for naming convention (if exists)

### Project Standards
- `AI_RULES.md` — Architecture standards, Paraglide requirement
- `.planning/codebase/CONVENTIONS.md` — §Frontend Conventions: Svelte 5 runes, service pattern, file naming

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **Settings page** (`src/routes/(app)/dashboard/settings/+page.svelte`): Already has a placeholder "Idioma (Próximamente)" card at lines 143-151. Replace this card with a real locale `<select>` using native-language labels ("Español (México)", "English"). Follows the same Card.Root pattern as the theme and palette sections above it.
- **AuthService** (`src/lib/services/auth.svelte.ts`): Uses `PersistedState<User>` for client-side user data. The `User` interface needs a `locale` field added. Login response will include `locale` from identity-service.
- **apiService** (`src/lib/services/api.svelte.ts`): Centralized API calls with base constants (`API_IDENTITY`, `API_SALES`, etc.). The PATCH `/users/{id}/locale` call goes through this.
- **adaptiveConfirm** and toast patterns: Available for UX feedback on locale change.

### Established Patterns
- **PersistedState** (from `runed`): Used for auth user data. Locale will follow the same pattern — stored in `PersistedState<User>`, survives page reloads.
- **Card-based settings UI**: Theme, palette, and table preferences each get their own `Card.Root`. Locale switcher follows the same visual pattern.
- **BFF proxy in hooks.server.ts**: Currently 152 lines, purely proxies `/api/*` to backend services. Locale resolution adds to the beginning of the `handle` function (before the proxy logic).

### Integration Points
- **`hooks.server.ts`**: Add locale cookie reading + Paraglide `setLocale()` BEFORE the existing proxy logic (line 44 `export const handle`)
- **`vite.config.ts`**: Add `paraglideVitePlugin({ project: './project.inlang', outdir: './src/lib/paraglide' })` alongside existing `tailwindcss()` and `sveltekit()` plugins
- **identity-service V2 migration**: `ALTER TABLE tca_user ADD COLUMN locale VARCHAR(10) DEFAULT 'es-MX' NOT NULL` — additive, safe for live client
- **identity-service login endpoint**: Return `locale` field in login response JSON
- **identity-service**: New PATCH endpoint for `/users/{id}/locale`

</code_context>

<specifics>
## Specific Ideas

- The locale `<select>` on the settings page should use native-language labels: "Español (México)" and "English" — not translated labels like "Spanish" or "Inglés". This is a universal UX norm per FEATURES.md research.
- The settings page placeholder card (lines 143-151) should be replaced in-place — same visual weight, same Card.Root pattern as the other preference cards.
- Cookie name: `locale` (simple, descriptive). No prefix needed — it's the only locale cookie and not an auth cookie.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 22-i18n-naming-convention-locale-infrastructure*
*Context gathered: 2026-04-19*
