---
status: testing
phase: 14-tenant-theming
source: [".planning/phases/14-tenant-theming/14-01-SUMMARY.md"]
started: 2026-04-05T18:20:00Z
updated: 2026-04-05T18:20:00Z
---

## Current Test
number: 1
name: Cold Start Smoke Test
expected: |
  Kill any running server/service. Clear ephemeral state (temp DBs, caches, lock files). Start the application from scratch. Server boots without errors, any seed/migration completes, and a primary query (health check, homepage load, or basic API call) returns live data.
awaiting: user response

## Tests

### 1. Cold Start Smoke Test
expected: |
  Kill any running server/service. Clear ephemeral state (temp DBs, caches, lock files). Start the application from scratch. Server boots without errors, any seed/migration completes, and a primary query (health check, homepage load, or basic API call) returns live data.
result: [pending]

### 2. Database Migration Verification
expected: |
  Run database migrations (Flyway). The `tce_establishment` table should now have `primary_color` (VARCHAR(7)) and `font_family` (VARCHAR(32)) columns. No errors during migration.
result: [pending]

### 3. GET /establishment API returns theme fields
expected: |
  Call the GET `/api/operations/establishment` endpoint. The JSON response should include `primaryColor` and `fontFamily` fields (initially null or with seeded values).
result: [pending]

### 4. PUT /establishment API persists theme fields
expected: |
  Call the PUT `/api/operations/establishment` endpoint with a payload containing `primaryColor: "#FF5733"` and `fontFamily: "Outfit"`. The response should indicate success. A subsequent GET call should return these updated values.
result: [pending]

## Summary

total: 4
passed: 0
issues: 0
pending: 4
skipped: 0

## Gaps

[none yet]
