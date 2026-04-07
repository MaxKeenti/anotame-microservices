# Phase 12-01 Summary: CRUD Dialog Migration

Completed the migration of all 4 CRUD dialog components to the standardized `superforms` + `Form.*` field kit pattern.

## Changes

### 1. Form Kit Adoption
- Migrated the following files to use `Form.Field`, `Form.Control`, `Form.Label`, and `Form.FieldErrors`:
  - `anotame-web/src/lib/components/customers/customer-dialog.svelte`
  - `anotame-web/src/lib/components/catalog/garment-dialog.svelte`
  - `anotame-web/src/lib/components/catalog/service-dialog.svelte`
  - `anotame-web/src/lib/components/users/user-dialog.svelte`
- Removed all raw `<label>` tags and manual `{#if $errors.x}` blocks.
- Switched to `SPA: true` mode for all forms to maintain existing client-side API logic.

### 2. UI Enhancements
- Added `Loader2` spinner (animated) to the submit buttons in all 4 dialogs.
- Buttons now show "Guardando..." while `isSubmitting` is true and are disabled to prevent double-submission.
- Added missing success toasts to `customer-dialog.svelte` for both Create and Update actions.

## Verification
- **Grep Audit**: Verified absence of `<label for=` and `{#if $errors.` patterns.
- **Diagnostics**: `bun run check` performed. Existing errors in `items-step.svelte` (unrelated) persist; no new template errors introduced in the dialogs.

## Commit
`2d8727d` feat(web): migrate CRUD dialogs to superforms and Form.* kit
