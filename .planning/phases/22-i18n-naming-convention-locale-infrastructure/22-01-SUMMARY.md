---
phase: 22
plan: "22-01"
subsystem: frontend-i18n
tags: [paraglide, i18n, vite, sveltekit, naming-convention]
dependency_graph:
  requires: []
  provides: [paraglide-compilation-pipeline, i18n-naming-convention, seed-messages]
  affects: [anotame-web/vite.config.ts, anotame-web/src/app.html, anotame-web/messages, anotame-web/project.inlang]
tech_stack:
  added: ["@inlang/paraglide-js (already in deps, now wired via Vite plugin)"]
  patterns: ["domain.component.purpose key naming convention (2-3 camelCase segments)"]
key_files:
  created:
    - anotame-web/messages/es.json
    - anotame-web/messages/en.json
    - anotame-web/scripts/lint-i18n-keys.js
    - anotame-web/project.inlang/.gitignore
  modified:
    - anotame-web/project.inlang/settings.json
    - anotame-web/vite.config.ts
    - anotame-web/src/app.html
    - anotame-web/.gitignore
    - anotame-web/package.json
decisions:
  - "sourceLanguageTag set to 'es' (Spanish is the authoritative source language for El hilvan)"
  - "Removed lint-rule modules from inlang settings (not needed for basic compilation pipeline)"
  - "Kept @inlang/paraglide-js in dependencies (not devDependencies) — runtime locale switching exports are needed client-side"
  - "Replaced pre-existing snake_case message keys with dotted convention — old keys had no codebase imports, safe to replace"
  - "Paraglide-generated project.inlang/.gitignore committed — Paraglide v2 manages its own ignore rules"
metrics:
  duration: "3 minutes"
  completed_date: "2026-04-20"
  tasks_completed: 4
  files_changed: 9
---

# Phase 22 Plan 01: Paraglide Init + Naming Convention + Seed Messages Summary

Paraglide JS v2 compilation pipeline wired end-to-end: `paraglideVitePlugin` in Vite, `settings.json` with `es` as source language, 9 seed messages in `domain.component.purpose` naming convention, lint script enforcing the convention, and `app.html` updated for dynamic `lang` attribute injection.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Install Paraglide JS and initialize project | b67e2de | settings.json, vite.config.ts, app.html, .gitignore |
| 2 | Create seed message files with naming convention | 93d1fa7 | messages/es.json, messages/en.json |
| 3 | Create i18n key naming convention lint script | c56dc25 | scripts/lint-i18n-keys.js, package.json |
| 4 | Verify Paraglide compilation and dev server | a28554d | project.inlang/.gitignore |

## Verification Results

- `@inlang/paraglide-js` present in package.json dependencies: PASS
- `paraglideVitePlugin` configured in vite.config.ts with `project.inlang` and `outdir: src/lib/paraglide`: PASS
- `messages/es.json` and `messages/en.json` each have 9 keys: PASS
- All keys match `/^[a-z][a-zA-Z]*(\.[a-z][a-zA-Z]*){1,2}$/`: PASS
- `bun run lint:i18n` exits 0: PASS
- `bun run build` exits 0 with "Compilation complete (message-modules)": PASS
- `src/lib/paraglide/messages.js` and `runtime.js` generated: PASS
- `bun run check` exits 0 (0 errors): PASS
- `app.html` contains `lang="%lang%"`: PASS

## Deviations from Plan

### Auto-noted discoveries

**1. [Pre-existing] @inlang/paraglide-js already in dependencies**
- Found during: Task 1
- Issue: Package was already installed (in `dependencies`, not `devDependencies`). Plan specified `bun add -d` for dev install.
- Fix: Accepted existing placement — `dependencies` is correct since runtime locale-switching exports (`setLocale`, `getLocale`) are used client-side.
- No action needed.

**2. [Pre-existing] Message files existed with snake_case keys**
- Found during: Task 2
- Issue: `messages/es.json` and `messages/en.json` already existed with 32 snake_case keys (e.g., `login_title`, `bulk_count`) that violate the new naming convention. None were imported anywhere in the codebase.
- Fix: Replaced content with 9 seed keys using the new `domain.component.purpose` convention. Old messages are lost but had no live consumers — they were pre-seeded but never wired.
- Files: messages/es.json, messages/en.json

**3. [Rule 2 - Missing feature] $schema key exclusion in lint script**
- Found during: Task 3
- Issue: The plan's lint script code did not skip `$schema` meta-key present in message files. `$schema` would fail the regex.
- Fix: Added `if (key === '$schema') continue;` before the regex test in lint-i18n-keys.js.

**4. [Generated artifact] project.inlang/.gitignore created by Paraglide v2**
- Found during: Task 4
- Issue: Running `bun run build` caused Paraglide v2 to auto-generate `project.inlang/.gitignore` (ignores all compiled artifacts, keeps settings.json tracked). This is intentional Paraglide v2 behavior.
- Fix: Committed the file — it's a required artifact for correct project.inlang version control behavior.

## Known Stubs

None — seed messages are real strings extracted from the settings page. No placeholder text.

## Threat Flags

None — no new network endpoints, auth paths, or trust boundary changes. Message files and build config are frontend-only.

## Self-Check: PASSED

- anotame-web/project.inlang/settings.json: FOUND
- anotame-web/vite.config.ts (paraglideVitePlugin): FOUND
- anotame-web/messages/es.json (9 keys): FOUND
- anotame-web/messages/en.json (9 keys): FOUND
- anotame-web/scripts/lint-i18n-keys.js: FOUND
- anotame-web/src/app.html (lang="%lang%"): FOUND
- anotame-web/.gitignore (src/lib/paraglide/): FOUND
- Commit b67e2de: FOUND
- Commit 93d1fa7: FOUND
- Commit c56dc25: FOUND
- Commit a28554d: FOUND
