---
id: SEED-002
status: dormant
planted: 2026-04-03
planted_during: v1.2 — UI Standardization
trigger_when: During next i18n/localization phase
scope: Small
---

# SEED-002: Refactor i18n Message Naming Conventions with Paraglide

## Why This Matters

Establishing consistent naming conventions for i18n message keys early makes the codebase maintainable as we scale internationalization support. When all messages are centralized in one place (via Paraglide), it's the ideal time to standardize the naming structure — avoiding scattered conventions that become harder to refactor later.

## When to Surface

**Trigger:** During next i18n/localization phase

This seed should be presented during `/gsd:new-milestone` when the milestone scope includes:
- Full Paraglide integration and message centralization
- Internationalization or localization feature work
- A phase explicitly focused on i18n standardization

## Scope Estimate

**Small** — A few hours of focused naming refactoring and key migration.
This is a quick pass to align all message keys to a single convention (e.g., `page.section.action` pattern) once messages are centralized.

## Breadcrumbs

Current i18n-related files in the codebase:

- `anotame-web/package.json` — dependencies including Paraglide setup
- `.planning/PROJECT.md` — current milestone and tech stack context
- `.planning/codebase/STACK.md` — frontend framework and localization approach
- `AI_RULES.md` — development conventions that should guide naming

## Notes

**Why manually refactor?**
Doing this manual refactoring when all messages are in one place (Paraglide's centralized structure) ensures:
- Complete visibility of current naming patterns
- One-time opportunity to establish a clean, consistent convention
- Easier to audit and enforce going forward
- Avoids legacy naming pollution across the codebase

**Follow-up questions for when this surfaces:**
- What naming convention should we adopt? (e.g., `domain.section.action`, `page.element.verb`)
- Should we audit/refactor existing component prop names and function signatures to match?
