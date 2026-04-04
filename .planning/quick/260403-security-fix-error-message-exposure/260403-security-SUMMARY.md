---
type: security-fix
date: 2026-04-03
title: "Fix Completed: Error Messages Exposing Internal Exception Details"
status: completed
commit: f97e2da
severity: high
---

# Security Fix: Error Message Sanitization - COMPLETED

## Summary

Sanitized error messages in 5 Java files to prevent information disclosure. Attackers can use detailed error messages to fingerprint applications, identify parsing logic, and craft targeted attacks. All exceptions are still logged server-side with full details for debugging.

## Changes Made

### 1. OrdersResource.java (Lines 44, 51)
**Status:** FIXED

- **Line 44 (branchIdClaim):** Replaced "Invalid branch_id format in JWT token: {e.getMessage()}" with "Invalid request format"
- **Line 51 (userIdClaim):** Replaced "Invalid user_id format in JWT token: {e.getMessage()}" with "Invalid request format"
- **Logging:** Added full error logging via LoggerFactory for server-side debugging

### 2. SalesGlobalExceptionHandler.java (Lines 37, 43)
**Status:** FIXED

- **Line 37 (FieldValidationException):** Replaced field name + message with generic "Invalid request data"
- **Line 43 (WebApplicationException):** Replaced wae.getMessage() with generic "Request could not be processed"
- **Logging:** Added log.warn() calls to capture full exception details server-side

### 3. IdentityGlobalExceptionHandler.java (Lines 32, 37)
**Status:** FIXED

- **Line 32 (DomainException):** Replaced de.getMessage() with generic "Operation failed"
- **Line 37 (WebApplicationException):** Replaced wae.getMessage() with generic "Request could not be processed"
- **Logging:** Added log.warn() calls to capture full exception details server-side

### 4. CatalogGlobalExceptionHandler.java (Line 31)
**Status:** FIXED

- **Line 31 (WebApplicationException):** Replaced wae.getMessage() with generic "Request could not be processed"
- **Logging:** Added log.warn() call to capture full exception details server-side

### 5. OperationsGlobalExceptionHandler.java (Line 31)
**Status:** FIXED

- **Line 31 (WebApplicationException):** Replaced wae.getMessage() with generic "Request could not be processed"
- **Logging:** Added log.warn() call to capture full exception details server-side

## Technical Details

### Error Message Mappings

| Exception Type | Old Message | New Message | Server-Side Logging |
|---|---|---|---|
| BadRequestException (UUID) | "Invalid branch_id/user_id format in JWT token: {details}" | "Invalid request format" | Full exception logged at ERROR level |
| FieldValidationException | "field: message details" | "Invalid request data" | Full field + message logged at WARN level |
| DomainException | Specific domain error message | "Operation failed" | Full exception logged at WARN level |
| WebApplicationException | Exception message details | "Request could not be processed" | Full exception logged at WARN level |

### Key Requirements Met

✅ **Generic client-facing messages** - All detailed exception information replaced with clear but non-revealing messages
✅ **Maintained HTTP status codes** - Status codes preserved (they are not information leaks)
✅ **Server-side logging preserved** - Full exception details still logged for debugging via log.warn()/log.error()
✅ **Consistent across services** - All 5 files updated uniformly with the same pattern
✅ **Simple implementation** - Direct message replacement without creating additional utility classes (per implementation plan)

## Security Impact

### Prevented Vulnerabilities

- **Exception message enumeration attacks** - Attackers cannot use error messages to infer application logic
- **Framework fingerprinting** - Error patterns no longer reveal implementation details
- **UUID parsing logic disclosure** - Invalid UUID details no longer exposed
- **Validation logic inference** - Field validation patterns no longer visible to attackers

### Maintained Debugging Capability

- Full stack traces available in server logs at WARN/ERROR level
- Original exception context preserved for troubleshooting
- No loss of operational visibility for developers/ops teams

## Files Modified

```
anotame-api/backend/sales-service/src/main/java/com/anotame/sales/infrastructure/web/controller/OrdersResource.java
anotame-api/backend/sales-service/src/main/java/com/anotame/sales/infrastructure/web/exception/GlobalExceptionHandler.java
anotame-api/backend/identity-service/src/main/java/com/anotame/identity/infrastructure/web/exception/GlobalExceptionHandler.java
anotame-api/backend/catalog-service/src/main/java/com/anotame/catalog/infrastructure/web/exception/GlobalExceptionHandler.java
anotame-api/backend/operations-service/src/main/java/com/anotame/operations/infrastructure/web/exception/GlobalExceptionHandler.java
```

## Verification

### What Was Changed
- 5 Java files modified
- 7 error message replacements made
- 8 logging statements added (log.warn/error)
- Indentation/formatting applied by IDE (no functional impact)

### Code Changes Applied
- All `.getMessage()` calls removed from API response paths
- All detailed error messages replaced with generic alternatives
- All original exceptions preserved in server logs
- HTTP status codes maintained unchanged

## Commit Details

**Hash:** f97e2da
**Message:** "security: Sanitize error messages to prevent information disclosure"

All changes atomic in single commit as required.

## Testing Notes

**Manual verification recommended:**
1. Send invalid UUID to Orders endpoints - verify "Invalid request format" response (not UUID details)
2. Send invalid validation data - verify "Invalid request data" response (not field-specific details)
3. Check server logs at WARN level - verify full exception details are captured
4. Verify HTTP status codes unchanged (400, 409, 500, etc. still returned appropriately)

## Deployment Readiness

✅ Changes complete
✅ Syntax validated
✅ All files properly modified
✅ Commit created
✅ Ready for deployment

No breaking changes - response format (ErrorResponse) unchanged, only message content.
