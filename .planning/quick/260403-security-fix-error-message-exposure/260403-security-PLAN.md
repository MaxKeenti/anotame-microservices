---
phase: quick
type: security-fix
severity: high
date: 2026-04-03
title: "Fix Security Issue: Error Messages Exposing Internal Exception Details"

files_affected:
  - anotame-api/backend/sales-service/src/main/java/com/anotame/sales/infrastructure/web/controller/OrdersResource.java
  - anotame-api/backend/sales-service/src/main/java/com/anotame/sales/infrastructure/web/exception/GlobalExceptionHandler.java
  - anotame-api/backend/identity-service/src/main/java/com/anotame/identity/infrastructure/web/exception/GlobalExceptionHandler.java
  - anotame-api/backend/catalog-service/src/main/java/com/anotame/catalog/infrastructure/web/exception/GlobalExceptionHandler.java
  - anotame-api/backend/operations-service/src/main/java/com/anotame/operations/infrastructure/web/exception/GlobalExceptionHandler.java

affected_count: 5
---

# Security Fix: Error Message Exposure via getMessage()

## Problem Summary

Error handlers throughout the REST API layer are exposing internal exception details via `exception.getMessage()` directly in API responses. This leaks implementation details about:
- UUID parsing errors (BadRequestException from OrdersResource)
- JPA/Hibernate validation errors
- Framework-specific exceptions
- System internals

**Risk:** Attackers can use these details to fingerprint the application, identify parsing logic, and craft targeted attacks.

## Affected Files with Exact Locations

### 1. OrdersResource.java (CRITICAL - Direct Exposure)
**File:** `anotame-api/backend/sales-service/src/main/java/com/anotame/sales/infrastructure/web/controller/OrdersResource.java`

- **Line 44:** `throw new jakarta.ws.rs.BadRequestException("Invalid branch_id format in JWT token: " + e.getMessage());`
- **Line 51:** `throw new jakarta.ws.rs.BadRequestException("Invalid user_id format in JWT token: " + e.getMessage());`

**Current behavior:** Returns the raw `IllegalArgumentException` message from UUID.fromString(), e.g., "Invalid UUID string: xyz"

**Risk:** Direct exposure of UUID parsing validation logic in JWT claims

---

### 2. Sales Service GlobalExceptionHandler
**File:** `anotame-api/backend/sales-service/src/main/java/com/anotame/sales/infrastructure/web/exception/GlobalExceptionHandler.java`

- **Line 37:** `fve.getMessage()` exposed in FieldValidationException
- **Line 43:** `wae.getMessage()` exposed in WebApplicationException response

---

### 3. Identity Service GlobalExceptionHandler
**File:** `anotame-api/backend/identity-service/src/main/java/com/anotame/identity/infrastructure/web/exception/GlobalExceptionHandler.java`

- **Line 32:** `de.getMessage()` exposed directly for DomainException (includes user messages from service layer)
- **Line 37:** `wae.getMessage()` exposed in WebApplicationException

---

### 4. Catalog Service GlobalExceptionHandler
**File:** `anotame-api/backend/catalog-service/src/main/java/com/anotame/catalog/infrastructure/web/exception/GlobalExceptionHandler.java`

- **Line 31:** `wae.getMessage()` exposed in WebApplicationException response

---

### 5. Operations Service GlobalExceptionHandler
**File:** `anotame-api/backend/operations-service/src/main/java/com/anotame/operations/infrastructure/web/exception/GlobalExceptionHandler.java`

- **Line 31:** `wae.getMessage()` exposed in WebApplicationException response

---

## Implementation Plan

### Step 1: Create ErrorMessageSanitizer Utility

Create a shared utility in each service that sanitizes error messages for client exposure:

**Pattern for each service:** `src/main/java/com/anotame/{service}/infrastructure/web/util/ErrorMessageSanitizer.java`

**Key responsibilities:**
- Accept exception + HTTP status
- Log full exception details server-side (DEBUG level)
- Return generic, user-friendly message to client
- Handle specific exception types with appropriate messages

**Example implementation:**
```java
package com.anotame.sales.infrastructure.web.util;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class ErrorMessageSanitizer {
    private static final Logger log = LoggerFactory.getLogger(ErrorMessageSanitizer.class);

    /**
     * Sanitizes exception messages for API responses.
     * Logs full details server-side, returns generic message to client.
     */
    public static String sanitize(Exception exception, String defaultMessage) {
        // Log full exception server-side for debugging
        log.debug("Exception details for troubleshooting", exception);

        // Return generic message to client
        return defaultMessage;
    }

    /**
     * Sanitizes IllegalArgumentException from UUID parsing, etc.
     */
    public static String sanitizeValidationError(IllegalArgumentException e) {
        log.debug("Validation error - invalid format", e);
        return "Invalid format provided";
    }

    /**
     * Sanitizes framework exceptions
     */
    public static String sanitizeWebException(jakarta.ws.rs.WebApplicationException e) {
        log.debug("Web application exception", e);
        return switch(e.getResponse().getStatus()) {
            case 400 -> "Bad request";
            case 404 -> "Resource not found";
            case 409 -> "Conflict";
            default -> "An error occurred";
        };
    }
}
```

### Step 2: Update OrdersResource.java

**File:** `anotame-api/backend/sales-service/src/main/java/com/anotame/sales/infrastructure/web/controller/OrdersResource.java`

**Change lines 44 and 51:**

BEFORE:
```java
} catch (IllegalArgumentException e) {
    throw new jakarta.ws.rs.BadRequestException("Invalid user_id format in JWT token: " + e.getMessage());
}
```

AFTER:
```java
} catch (IllegalArgumentException e) {
    log.debug("Invalid user_id UUID format in JWT", e);
    throw new jakarta.ws.rs.BadRequestException("Invalid user credentials provided");
}
```

Do the same for line 44 (branch_id): change message to "Invalid branch configuration".

**Add import:**
```java
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
```

**Add field:**
```java
private static final Logger log = LoggerFactory.getLogger(OrdersResource.class);
```

---

### Step 3: Update All GlobalExceptionHandlers

#### Sales Service Handler
**File:** `anotame-api/backend/sales-service/src/main/java/com/anotame/sales/infrastructure/web/exception/GlobalExceptionHandler.java`

**Line 37 change:** Replace `fve.getMessage()` with `"Invalid data provided"`

**Line 43 change:** Replace `wae.getMessage()` with `ErrorMessageSanitizer.sanitizeWebException(wae)`

**New action:** Import ErrorMessageSanitizer, add logging context

---

#### Identity Service Handler
**File:** `anotame-api/backend/identity-service/src/main/java/com/anotame/identity/infrastructure/web/exception/GlobalExceptionHandler.java`

**Line 32 change:** Replace `de.getMessage()` with `"Invalid request"` (generic) + log the actual message

**Line 37 change:** Replace `wae.getMessage()` with `ErrorMessageSanitizer.sanitizeWebException(wae)`

---

#### Catalog Service Handler
**File:** `anotame-api/backend/catalog-service/src/main/java/com/anotame/catalog/infrastructure/web/exception/GlobalExceptionHandler.java`

**Line 31 change:** Replace `wae.getMessage()` with `ErrorMessageSanitizer.sanitizeWebException(wae)`

---

#### Operations Service Handler
**File:** `anotame-api/backend/operations-service/src/main/java/com/anotame/operations/infrastructure/web/exception/GlobalExceptionHandler.java`

**Line 31 change:** Replace `wae.getMessage()` with `ErrorMessageSanitizer.sanitizeWebException(wae)`

---

## Verification Strategy

### Before Deployment
1. **Manual API Testing:** Call each endpoint with invalid input
   - UUID endpoints with non-UUID values
   - JWT tokens with malformed claims
   - Invalid validation data

   Verify responses show generic messages (not exception details)

2. **Log Verification:** Check server logs at DEBUG level
   - Full exception details ARE captured server-side
   - No exception details leak to client

3. **Code Review:** Ensure no `.getMessage()` calls remain in response paths

### Automated Checks
```bash
# Search for remaining getMessage() in error responses
grep -r "getMessage()" anotame-api/backend/*/src/main/java/com/anotame/*/infrastructure/web/exception/
grep -r "getMessage()" anotame-api/backend/*/src/main/java/com/anotame/*/infrastructure/web/controller/

# Should return empty or only safe usages (logging context)
```

---

## Security Checklist

- [ ] No raw `exception.getMessage()` in any API response
- [ ] All exception details logged server-side (DEBUG level) for troubleshooting
- [ ] UUID validation errors return generic message
- [ ] DomainException messages sanitized
- [ ] WebApplicationException messages sanitized
- [ ] Field validation messages generalized
- [ ] ErrorMessageSanitizer utility created and used consistently
- [ ] All 4 services updated uniformly
- [ ] Manual testing confirms generic error messages in responses
- [ ] Server logs confirm full details still captured

---

## Risk Mitigation

**This fix prevents:**
- Exception message enumeration attacks
- Framework/library fingerprinting via error patterns
- Disclosure of parsing/validation logic
- Information leakage about internal data structures

**Server-side visibility maintained:**
- Full exception stack traces in DEBUG logs
- Message context preserved for troubleshooting
- No loss of debugging capability

---

## Timeline
- **Coding:** 15-20 minutes (create utility, update 5 files)
- **Testing:** 10 minutes (manual API tests + log verification)
- **Review & Deploy:** 5 minutes

**Total:** ~30 minutes

---

## Files to Commit

```
anotame-api/backend/sales-service/src/main/java/com/anotame/sales/infrastructure/web/util/ErrorMessageSanitizer.java (NEW)
anotame-api/backend/sales-service/src/main/java/com/anotame/sales/infrastructure/web/controller/OrdersResource.java
anotame-api/backend/sales-service/src/main/java/com/anotame/sales/infrastructure/web/exception/GlobalExceptionHandler.java
anotame-api/backend/identity-service/src/main/java/com/anotame/identity/infrastructure/web/util/ErrorMessageSanitizer.java (NEW)
anotame-api/backend/identity-service/src/main/java/com/anotame/identity/infrastructure/web/exception/GlobalExceptionHandler.java
anotame-api/backend/catalog-service/src/main/java/com/anotame/catalog/infrastructure/web/util/ErrorMessageSanitizer.java (NEW)
anotame-api/backend/catalog-service/src/main/java/com/anotame/catalog/infrastructure/web/exception/GlobalExceptionHandler.java
anotame-api/backend/operations-service/src/main/java/com/anotame/operations/infrastructure/web/util/ErrorMessageSanitizer.java (NEW)
anotame-api/backend/operations-service/src/main/java/com/anotame/operations/infrastructure/web/exception/GlobalExceptionHandler.java
```

---

## Success Criteria

✅ All error handlers return generic messages to clients
✅ Full exception details captured in server logs (DEBUG level)
✅ No `getMessage()` exposed in REST API responses
✅ Manual testing confirms generic error messages
✅ Can still debug issues via server logs
✅ All services updated uniformly
