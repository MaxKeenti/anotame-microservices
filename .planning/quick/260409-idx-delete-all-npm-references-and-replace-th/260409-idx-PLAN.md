---
phase: quick
plan: 260409-idx
type: execute
objective: Delete all npm references and replace with bun
description: "Complete migration from npm to bun, removing npm-specific files and updating all documentation to use bun commands"

scope:
  - Replace npm references in documentation (npm run → bun run, npm install → bun install)
  - Remove npm-specific config files (.npmrc, package-lock.json)
  - Verify bun.lock exists and is being used
  - Update all command examples in docs

files_to_update:
  - docs/walkthrough.md (contains "npm run dev")
  - anotame-web/.npmrc (delete)
  - README.md (verify no npm references)
  - Other docs (check for npm references)

files_verified_as_clean:
  - anotame-web/package.json (already compatible with bun, uses bun.lock)
  - anotame-web/bun.lock (already exists)

---

## Objective

Complete migration from npm to bun package manager across the entire anotame-microservices project. This ensures consistent tooling, faster install times, and cleaner dependency management.

**Why this matters:** 
- Bun is already partially integrated (bun.lock exists, @oven/bun-darwin-aarch64 in node_modules)
- All scripts should reference bun to avoid confusion and ensure reproducibility
- Stale npm config files should be removed to prevent accidental npm usage

**Output:** 
- All documentation updated with bun commands
- npm-specific files removed
- Consistent project setup experience for new developers

---

## Tasks

### Task 1: Update Documentation — Replace npm with bun Commands

**What:** Replace all `npm` references in markdown documentation with `bun` equivalents.

**Files to update:**
- `docs/walkthrough.md` — Replace `npm run dev` with `bun run dev`
- `README.md` — Verify no npm references (quick check)
- Any other docs with npm commands

**Current references found:**
- `docs/walkthrough.md:` Line with `npm run dev` in Step 3 (Frontend startup)

**Action:**
1. Open `docs/walkthrough.md`
2. Find the line `npm run dev` in Step 3 (Start Frontend section)
3. Replace with `bun run dev`
4. Save file
5. Verify no other npm references exist in docs/ directory with:
   ```bash
   grep -r "npm " docs/ --include="*.md"
   ```
   Should return zero results after update.

**Verification:**
- Run grep command above: `grep -r "npm " docs/ --include="*.md"` returns nothing
- Visual scan of docs/walkthrough.md shows `bun run dev` in Step 3
- All documentation uses bun for package management commands

**Done when:**
- `docs/walkthrough.md` uses `bun run dev` instead of `npm run dev`
- No npm references remain in any docs/*.md files
- All commands follow bun syntax (bun install, bun run, etc.)

---

### Task 2: Remove npm-Specific Configuration Files

**What:** Delete npm config files that are no longer needed and could cause confusion or accidental npm usage.

**Files to delete:**
- `anotame-web/.npmrc` — npm engine-strict config (obsolete with bun)
- Any `package-lock.json` files (replaced by bun.lock)

**Current state:**
- `anotame-web/.npmrc` exists with `engine-strict=true`
- No package-lock.json files found in the project
- `anotame-web/bun.lock` already exists and should be the source of truth

**Action:**
1. Delete `anotame-web/.npmrc` file:
   ```bash
   rm anotame-web/.npmrc
   ```
2. Verify deletion:
   ```bash
   ls -la anotame-web/.npmrc
   ```
   Should return "No such file or directory" error
3. Confirm bun.lock exists:
   ```bash
   ls -la anotame-web/bun.lock
   ```
   Should return file info
4. Search for any stray package-lock.json:
   ```bash
   find . -name "package-lock.json" -type f
   ```
   Should return nothing

**Verification:**
- `anotame-web/.npmrc` no longer exists
- `anotame-web/bun.lock` exists and is present
- No `package-lock.json` files in the project
- Running `ls anotame-web/.npmrc 2>&1 | grep "cannot access"` shows file is gone

**Done when:**
- `.npmrc` file removed from anotame-web/
- No package-lock.json files remain
- Only bun.lock exists as dependency lock file
- Project is clean of npm-specific config files

---

### Task 3: Verify Bun Setup and Script Compatibility

**What:** Confirm that bun is properly configured and all scripts in package.json work with bun.

**Current state:**
- `anotame-web/package.json` has scripts: dev, build, preview, prepare, check, check:watch
- `anotame-web/bun.lock` exists
- Bun is installed (@oven/bun-darwin-aarch64 in node_modules)

**Action:**
1. Verify bun version is installed:
   ```bash
   bun --version
   ```
   Should return version number (e.g., 1.x.y)

2. Check that bun can read package.json:
   ```bash
   cd anotame-web && bun run --list
   ```
   Should show all defined scripts: dev, build, preview, prepare, check, check:watch

3. Verify bun.lock is properly maintained (no package-lock.json interference):
   ```bash
   cd anotame-web && ls -la | grep -E "bun.lock|package-lock"
   ```
   Should show only bun.lock, not package-lock.json

4. Quick compatibility check (don't install, just verify structure):
   ```bash
   cd anotame-web && bun run prepare
   ```
   Should complete without errors (svelte-kit sync)

**Verification:**
- `bun --version` returns a valid version
- `bun run --list` shows all scripts (dev, build, preview, prepare, check, check:watch)
- Only `bun.lock` exists, no `package-lock.json`
- `bun run prepare` completes successfully

**Done when:**
- Bun is installed and accessible
- All package.json scripts are recognized by bun
- Only bun.lock is used (no npm lock files)
- The prepare script runs without errors (verifies bun can execute scripts)

---

## Summary

This quick phase accomplishes a complete npm → bun migration:

1. **Documentation updated** — All examples use bun commands
2. **Npm config removed** — .npmrc and any package-lock.json deleted
3. **Bun verified** — All scripts work and bun.lock is the source of truth

**Key files modified:**
- `docs/walkthrough.md` — Updated command examples
- `anotame-web/.npmrc` — Deleted

**Key verifications:**
- All npm references replaced with bun
- No npm config files remain
- Bun scripts are executable
- Dependency lock file is bun.lock only

**Next steps after completion:**
- Team members should clone/pull changes
- All development should use `bun run` instead of `npm run`
- CI/CD pipelines (if any) should use bun commands
