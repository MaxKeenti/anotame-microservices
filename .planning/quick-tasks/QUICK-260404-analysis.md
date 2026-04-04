# QUICK TASK: Fix totalDurationMin=0 and Missing durationMin in Production

**Date:** 2026-04-03
**Issue:** Orders show totalDurationMin=0 and durationMin=null despite previous fix attempt (260403-qh0)

---

## CURRENT STATE ANALYSIS

### What Code Shows Now

**Database Schema (V1__baseline.sql:271)**
✓ Column exists: `total_duration_min integer`

**Entity Mapping (OrderEntity.java)**
✓ Mapped correctly: `private Integer totalDurationMin = 0;`

**Service Layer (SalesService.java)**
- `createOrder()` (lines 67-111): Calculates & sets totalDurationMin ✓
- `updateOrder()` (lines 185-256): Calculates & sets totalDurationMin ✓
- `mapToResponse()` (line 168): Includes totalDurationMin in response ✓

**Persistence (OrderPersistenceAdapter.java)**
✓ Saves totalDurationMin (line 56)
✓ Loads totalDurationMin (line 184)

**Response DTO (OrderResponse.java)**
✓ Field exists: `private Integer totalDurationMin;` (line 24)

---

## ROOT CAUSE IDENTIFIED

### The Bug: Missing durationMin Assignment in updateOrder()

**Location:** `SalesService.updateOrder()` lines 217-232

**Problem Code:**
```java
// Lines 217-232 in updateOrder() — MISSING durationMin!
if (itemDto.getServices() != null) {
    for (com.anotame.sales.application.dto.OrderItemServiceDto serviceDto : itemDto.getServices()) {
        com.anotame.sales.domain.model.OrderItemService service = new com.anotame.sales.domain.model.OrderItemService();
        service.setServiceId(serviceDto.getServiceId());
        service.setServiceName(serviceDto.getServiceName());
        service.setUnitPrice(serviceDto.getUnitPrice());
        service.setAdjustmentAmount(
                serviceDto.getAdjustmentAmount() != null ? serviceDto.getAdjustmentAmount()
                        : BigDecimal.ZERO);
        service.setAdjustmentReason(serviceDto.getAdjustmentReason());
        // ^^^ MISSING: service.setDurationMin(...) ^^^

        item.addService(service);
        // ... rest of loop
    }
}
```

**Correct Code (from createOrder, lines 78-95):**
```java
if (itemDto.getServices() != null) {
    for (com.anotame.sales.application.dto.OrderItemServiceDto serviceDto : itemDto.getServices()) {
        com.anotame.sales.domain.model.OrderItemService service = new com.anotame.sales.domain.model.OrderItemService();
        // ... other fields ...
        service.setDurationMin(serviceDto.getDurationMin() != null ? serviceDto.getDurationMin() : 0);
        // ^^^ THIS LINE EXISTS IN createOrder BUT IS MISSING IN updateOrder ^^^

        item.addService(service);
    }
}
```

### Impact Chain

1. **New Orders (createOrder)**: ✓ Works correctly
   - durationMin is set from request
   - totalDurationMin is calculated (line 108)
   - Values persisted to DB and returned in response

2. **Updated Orders (updateOrder)**: ✗ Fails silently
   - durationMin NOT set (missing line 227)
   - durationMin stored as NULL in database
   - totalDurationMin calculated as 0 (line 248 sums null values → 0)
   - Dashboard queries see null/0 values
   - Frontend receives 0 for workload metrics

3. **Why Previous Fix Failed**
   - Quick task 260403-qh0 added the durationMin field and mapping
   - But only fixed `createOrder()`, not `updateOrder()`
   - Any order modified after deployment lost its durationMin
   - Existing production orders with updates show 0

---

## FIX IMPLEMENTATION PLAN

### Task 1: Add Missing durationMin Assignment in updateOrder()

**File:** `anotame-api/backend/sales-service/src/main/java/com/anotame/sales/application/service/SalesService.java`

**Change:** Add one line after line 226 (after `service.setAdjustmentReason(...)`)

```java
// After line 226, add:
service.setDurationMin(serviceDto.getDurationMin() != null ? serviceDto.getDurationMin() : 0);
```

**Why This Works:**
- Mirrors the exact logic in createOrder() (line 88)
- Ensures durationMin is set when updating items
- totalDurationMin calculation (lines 245-251) will then work correctly
- Dashboard will receive accurate workload data

---

## VERIFICATION STRATEGY

### Unit Test (Automated)

Create test in `/sales-service/src/test/java/com/anotame/sales/application/service/SalesServiceTest.java`:

```java
@Test
void testUpdateOrderPreservesDurationMin() {
    // 1. Create order with services (durationMin = 45)
    OrderResponse created = salesService.createOrder(requestWithDurationMin45, userId, branchId);
    UUID orderId = created.getId();

    // Verify created order
    assert created.getTotalDurationMin() > 0;
    assert created.getItems().get(0).getServices().get(0).getDurationMin() == 45;

    // 2. Update order (change description only)
    CreateOrderRequest updateRequest = copyRequest(created);
    updateRequest.getItems().get(0).setNotes("Updated notes");

    OrderResponse updated = salesService.updateOrder(orderId, updateRequest);

    // 3. Verify durationMin persisted
    assert updated.getTotalDurationMin() > 0 : "totalDurationMin should not be 0 after update";
    assert updated.getItems().get(0).getServices().get(0).getDurationMin() == 45 : "durationMin should be 45";
}
```

### Integration Test

```sql
-- After updating an order with services containing durationMin values
SELECT id_order, total_duration_min FROM tco_order WHERE id_order = '{order_id}';
SELECT duration_min FROM tco_order_item_service WHERE id_item_service IN (
  SELECT id_item_service FROM tco_order_item_service
  WHERE id_order_item IN (SELECT id_order_item FROM tco_order_item WHERE id_order = '{order_id}')
);

-- Expected: total_duration_min > 0, duration_min values populated
```

### Manual Verification (Production Debugging)

1. **Create new order** with services (durationMin visible)
2. **Update existing order** → Edit notes or deadline
3. **GET /orders/{id}** → Verify totalDurationMin persists
4. **GET /orders/kpi/dashboard** → Verify workload metrics display

---

## ATOMIC COMMIT SUMMARY

```
fix(sales-service): restore durationMin assignment in updateOrder() flow

When updating an order, durationMin was not being copied from the request
to the OrderItemService entity. This caused:
- Updated orders to have null durationMin in database
- totalDurationMin calculated as 0
- Workload metrics not displayed in dashboards

Root cause: Line 227 in SalesService.updateOrder() was missing the
durationMin assignment that exists in createOrder() (line 88).

Fix: Add single line to copy durationMin from DTO to service entity,
matching the exact logic used in order creation.

Files changed:
- SalesService.java: +1 line (durationMin assignment)

Testing:
- Unit test: Verify updateOrder preserves durationMin values
- Integration test: Query DB to confirm duration_min populated after update
- Manual: Create → Update → Verify totalDurationMin displayed
```

---

## DECISION RECORD

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| Root Cause | Missing line in updateOrder() method | Code inspection shows exact 1-line gap vs createOrder() |
| Fix Location | SalesService.updateOrder(), after line 226 | Minimal change, maintains consistency with createOrder() |
| Fix Type | Code addition, no refactor | Preserves existing logic, addresses the exact gap |
| Backward Compatibility | Safe | Existing order structure unchanged, only fixes missing data |
| Production Data Recovery | Manual | Need separate bulk update task if existing orders need values recalculated |

---

## NEXT STEPS

1. Apply the 1-line fix to SalesService.java
2. Add unit test to verify behavior
3. Deploy to staging → run integration test
4. Deploy to production → monitor dashboard metrics
5. (Separate task) Backfill existing orders with totalDurationMin recalculation if needed
