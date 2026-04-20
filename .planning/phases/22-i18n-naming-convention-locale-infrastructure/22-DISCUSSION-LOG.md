# Phase 22: i18n Naming Convention + Locale Infrastructure - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-19
**Phase:** 22-i18n-naming-convention-locale-infrastructure
**Areas discussed:** Locale persistence & session flow

---

## Locale Persistence & Session Flow

### Question 1: How does the server know the user's locale for SSR?

| Option | Description | Selected |
|--------|-------------|----------|
| Option A: Locale in login response + separate locale cookie | Login returns locale, frontend sets a plain `locale` cookie readable by hooks.server.ts. No JWT changes needed. | ✓ |
| Option B: Locale as JWT claim | Add locale to JWT. hooks.server.ts decodes JWT for locale. Tight coupling — locale change requires new token. | |
| Option C: Agent decides | Let the agent pick the best approach. | |

**User's choice:** Option A — locale in login response + separate locale cookie
**Notes:** Simplest approach — no JWT changes, hooks reads a plain cookie. Aligns with existing pattern of PersistedState for client-side user data.

### Question 2: What should happen on the login page (pre-authentication)?

| Option | Description | Selected |
|--------|-------------|----------|
| Option A: Always Spanish (es-MX hardcoded) | Login page is always in Spanish. Simple. | |
| Option B: Check browser Accept-Language | If browser prefers English, show login in English; otherwise es-MX. | ✓ |
| Option C: Agent decides | Let the agent pick. | |

**User's choice:** Option B — check browser Accept-Language for anonymous pages
**Notes:** User said "I think it's better" — provides a more welcoming experience for English-speaking walk-ins who might use the system.

---

## Agent's Discretion

- Naming convention lint rule delivery mechanism (Vitest test, script, or pre-commit hook)
- Number of seed strings to extract in Phase 22 vs. deferring all to Phase 23
- Error response migration timing (deferred to Phase 23 by explicit scope decision)

## Deferred Ideas

None — discussion stayed within phase scope
