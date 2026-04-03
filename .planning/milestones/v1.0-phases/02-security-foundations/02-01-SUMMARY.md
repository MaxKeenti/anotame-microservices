# Phase 2 Plan 01: Untrack `.env` and harden `.gitignore` Summary

**Status**: Complete
**Completed**: 2026-04-01

---

## One-liner

Removed `.env` from git index via `git rm --cached`, added explicit `.env` gitignore rule, and added PGADMIN/JWT placeholder vars to both `.env` and `.env.example`.

---

## What was done

- Added `.env` exact-match line to `.gitignore` at line 450 (separate from the existing `.env*.local` glob)
- Added clarifying comment above `*.pem` rule: "PEM key files (applies globally — JWT keys must never be committed)"
- Ran `git rm --cached .env` — `.env` is now permanently untracked from git
- Appended `PGADMIN_DEFAULT_PASSWORD`, `SMALLRYE_JWT_SIGN_KEY`, `MP_JWT_VERIFY_PUBLICKEY` placeholder entries to `.env`
- Appended matching placeholder entries with full usage instructions to `.env.example`

---

## Commit

`cc8a7f0`: security(SEC-01): untrack .env from git, harden .gitignore

Files changed: `.gitignore` (modified), `.env` (deleted from tracking), `.env.example` (modified)

---

## Verification

- `git ls-files .env` returns empty (no output) ✓
- `git check-ignore -v .env` matches `.gitignore:450:.env` ✓
- `git check-ignore -v privateKey.pem` matches `.gitignore:441:*.pem` ✓
- `.env` exists locally on disk ✓
- `.env.example` has `PGADMIN_DEFAULT_PASSWORD`, `SMALLRYE_JWT_SIGN_KEY`, `MP_JWT_VERIFY_PUBLICKEY` entries ✓
- `git show --stat HEAD` lists only `.gitignore`, `.env`, `.env.example` ✓

---

## Deviations from Plan

None - plan executed exactly as written.

---

## Known Stubs

None — no UI rendering or data wiring involved in this plan.

---

## Self-Check: PASSED

- `.planning/phases/02-security-foundations/02-01-SUMMARY.md` — this file (created)
- Commit `cc8a7f0` exists: confirmed via `git log --oneline -1`
- `.env` untracked: `git ls-files .env` returns empty
- `.env` on disk: `test -f .env` passes
