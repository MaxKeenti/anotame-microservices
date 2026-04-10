---
phase: 16
fixed_at: 2025-01-10T14:45:00Z
review_path: .planning/phases/16-price-list-selection-in-order-wizard/16-REVIEW.md
iteration: 1
findings_in_scope: 2
fixed: 1
skipped: 1
status: partial
---

# Phase 16: Code Review Fix Report

**Fixed at:** 2025-01-10T14:45:00Z  
**Source review:** .planning/phases/16-price-list-selection-in-order-wizard/16-REVIEW.md  
**Iteration:** 1

**Summary:**
- Findings in scope: 2 (Critical + Warning)
- Fixed: 1
- Skipped: 1

## Fixed Issues

### WR-02: Missing Null Check for order.getCustomer() Before Property Access

**File modified:** `anotame-api/backend/sales-service/src/main/java/com/anotame/sales/application/service/SalesService.java`  
**Commit:** c6536f5  
**Applied fix:** Added null safety check at the beginning of `mapToResponse()` method (line 140-142):
```java
if (order.getCustomer() == null) {
    throw new RuntimeException("Order customer cannot be null");
}
```

This prevents `NullPointerException` that would occur if `order.getCustomer()` returned null on lines 144-148 where the customer properties are accessed without protection.

**Verification:** File syntax is valid Java. The null check is applied before any property access on the customer object, protecting all 5 subsequent `getCustomer()` calls in the method.

## Skipped Issues

### WR-01: Missing Audit Logging for priceListId and priceListName Updates

**File:** `anotame-api/backend/sales-service/src/main/java/com/anotame/sales/application/service/SalesService.java:207-334`  
**Reason:** Warning is conditional and not currently actionable

**Original issue:** The `updateOrder()` method does not include audit logging for `priceListId` or `priceListName` field changes. The review explicitly notes: "While price list selection is typically done at order creation, **if updates are later enabled**, changes would bypass audit trails."

**Assessment:** 
- `priceListId` and `priceListName` are NOT fields in `UpdateOrderRequest.java` (only in `CreateOrderRequest.java`)
- Price list selection occurs at order creation time, not during updates
- The warning is conditional ("IF these fields become updatable")
- Phase 16 focus is on selection in order creation, not on update capability
- Adding update capability would be a separate enhancement in future phases

**Recommendation:** Document this as a technical debt item for when price list update capability is added. At that time, audit logging should be implemented alongside the update feature. No action needed in phase 16.

---

_Fixed: 2025-01-10T14:45:00Z_  
_Fixer: gsd-code-fixer_  
_Iteration: 1_
