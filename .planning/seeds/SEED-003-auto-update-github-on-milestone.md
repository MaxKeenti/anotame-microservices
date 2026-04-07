---
id: SEED-003
status: dormant
planted: 2026-04-03
planted_during: v1.2 — UI Standardization
trigger_when: After each milestone completes
scope: Small
---

# SEED-003: Auto-Update README.md and GitHub Fields on Milestone Completion

## Why This Matters

README and GitHub metadata files are often the first thing new developers and external users see. Automating these updates ensures our documentation always reflects the current product state, preventing confusion from stale information. This builds credibility and reduces onboarding friction.

**Current state:** README.md and GitHub fields drift from PROJECT.md and actual implementation — manual updates get forgotten.

## When to Surface

**Trigger:** After each milestone completes

This seed should be presented during `/gsd:complete-milestone` or early in `/gsd:new-milestone` when:
- A milestone has just been archived
- Documentation refresh is a natural step in the transition
- We want to establish a pattern of keeping external-facing docs fresh

## Scope Estimate

**Small** — A few hours to set up the automation.
- Extract current milestone state from `PROJECT.md` and git history
- Template/script to update README.md, GitHub repo description, and issue/PR templates
- Hook or manual trigger that runs at milestone boundary
- Optionally integrate into GSD workflow (e.g., `/gsd:complete-milestone` runs this automatically)

## Breadcrumbs

Key files for this automation:

- `README.md` — Root repository documentation (outdated, needs refresh)
- `anotame-web/README.md` — Frontend-specific docs
- `.planning/PROJECT.md` — Single source of truth for current state
- `.planning/REQUIREMENTS.md` — Feature and requirement tracking
- `.planning/milestones/` — Per-milestone documentation
- `.github/` — GitHub-specific config (repo description, PR templates, issue templates)
- `.claude/get-shit-done/` — GSD workflow hooks and scripts

## Notes

**What to update automatically:**

1. **README.md (root)**
   - Current version and milestone status
   - Tech stack overview (backend framework, frontend, database, deployment)
   - Architecture summary
   - Quick start / running instructions

2. **anotame-web/README.md**
   - Current UI patterns and framework version
   - Key features implemented in this milestone
   - Development setup

3. **GitHub fields**
   - Repo description
   - About section (pinned README)
   - PR template (reference current patterns)
   - Issue template (reference current tech stack)

**Implementation options:**

- **Option A:** Shell script (`scripts/update-github-docs.sh`) that reads PROJECT.md and templated updates
- **Option B:** TypeScript/Node script that parses frontmatter and generates updates
- **Option C:** Integrate into GSD as a post-milestone-completion hook

**Consider:**
- Should this be manual (developer runs it) or automatic (CI/CD trigger)?
- What's the single source of truth format? (PROJECT.md YAML frontmatter? Separate metadata file?)
- Should we version the docs (tag in git) or just keep them current?
