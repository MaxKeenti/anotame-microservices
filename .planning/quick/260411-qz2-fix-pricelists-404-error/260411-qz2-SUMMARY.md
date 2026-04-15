# Quick Task 260411-qz2: Fix pricelists 404 error when creating orders

**Status:** Complete
**Date:** 2026-04-11

## What was done

Fixed duplicate `/api/` segment in price list API URLs within the order wizard's `price-list-step.svelte` component.

## Root Cause

The component was using `${API_CATALOG}/api/pricelists` which resolved to `/api/catalog/api/pricelists`. After proxy stripping, this became `http://localhost:8082/api/pricelists` — but the catalog-service only exposes `/pricelists` (no `/api` prefix). All other components correctly use `${API_CATALOG}/pricelists`.

## Changes

- `anotame-web/src/lib/components/orders/wizard/price-list-step.svelte`: Removed extra `/api/` from 2 URL paths (lines 31, 63)

## Verification

- URLs now resolve correctly: `/api/catalog/pricelists` → proxy → `http://localhost:8082/pricelists`
- Matches the pattern used by all other components (pricelists page, services page, garments page)