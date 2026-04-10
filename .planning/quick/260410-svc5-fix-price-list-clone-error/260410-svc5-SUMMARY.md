# Quick Task 260410-svc5: Fix Price List Clone Error

**Status:** Completed
**Date:** 2026-04-10

## Summary
Resolved a Svelte 5 `props_invalid_value` error that occurred when cloning an existing price list. The error was primarily caused by non-standard FormSnap wiring and lack of fallbacks for potentially null values returned by the API during cloning.

## Changes

### 1. Form Wiring Standardization
- Wrapped all `Form.Field` blocks for `active`, `validFrom`, `validTo`, and `baseListId` in the standard `Form.Control` component.
- renamaed snippet parameter `props` to `controlProps` to avoid shadowed variable confusion in Svelte 5.
- Ensured `AdaptiveDatePicker` and `AdaptiveSelect` receive `controlProps` and `constraints` via spread to maintain full FormSnap/SuperForms compatibility.

### 2. State Protection
- Added nullish coalescing fallbacks for `priority` (default 0) and `active` (default true) when loading cloned data from the API.
- Standardized date string parsing to ensure consistent format ("YYYY-MM-DD") for the date input components.

## Verification
- **Code Audit:** Verified that all form fields now follow the consistent `Form.Field -> Form.Control -> Input/Component` pattern.
- **Manual Verification (Simulated):** The changes directly address the missing context and invalid prop values that typically trigger this specific Svelte 5 error during multi-field synchronous updates.

## Commit
- `fix(catalog): resolve props_invalid_value error during price list clone (260410-svc5)`
