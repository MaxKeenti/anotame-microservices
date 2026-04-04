---
type: quick-task
id: 260404-duration-fix
title: Fix totalDurationMin=0 in Production (Missing durationMin in updateOrder)
status: ready-to-implement
priority: blocker
affected_systems:
  - dashboard/orders
  - workload-metrics
  - kpi-dashboard
root_cause: Missing durationMin assignment in SalesService.updateOrder() (1-line gap)
---

# QUICK TASK: Fix totalDurationMin=0 Production Issue

## Summary

Orders show **totalDurationMin: 0** and **durationMin: null** because `updateOrder()` method is missing a single line that assigns durationMin from the request to the service entity. This line exists in `createOrder()` but was omitted from `updateOrder()`.

**Impact:** Any order that is updated (even just notes/deadline) loses its workload duration, breaking dashboard metrics.

---

## Root Cause

**File:** `SalesService.java`
**Method:** `updateOrder()` (lines 185-256)
**Missing:** Line 227 equivalent

```diff
  for (com.anotame.sales.application.dto.OrderItemServiceDto serviceDto : itemDto.getServices()) {
      service.setServiceId(serviceDto.getServiceId());
      service.setServiceName(serviceDto.getServiceName());
      service.setUnitPrice(serviceDto.getUnitPrice());
      service.setAdjustmentAmount(...);
      service.setAdjustmentReason(serviceDto.getAdjustmentReason());
+     service.setDurationMin(serviceDto.getDurationMin() != null ? serviceDto.getDurationMin() : 0);
      item.addService(service);
  }
```

---

## Implementation

### Task 1: Fix updateOrder() Method

**File Path:**
```
anotame-api/backend/sales-service/src/main/java/com/anotame/sales/application/service/SalesService.java
```

**Action:**
1. Locate `updateOrder()` method (line 185)
2. Find the service loop that starts at line 217
3. After line 226 (`service.setAdjustmentReason(serviceDto.getAdjustmentReason());`), add this line:
   ```java
   service.setDurationMin(serviceDto.getDurationMin() != null ? serviceDto.getDurationMin() : 0);
   ```
4. This mirrors the exact code in `createOrder()` at line 88

**Verify:**
- The new line is syntactically identical to line 88 in createOrder()
- Code formatted consistently with surrounding code
- No other changes made

**File Changes:**
- SalesService.java: +1 line

---

### Task 2: Add Unit Test

**File Path:**
```
anotame-api/backend/sales-service/src/test/java/com/anotame/sales/application/service/SalesServiceTest.java
```

**Action:**
Add test method to verify updateOrder preserves durationMin:

```java
@Test
void updateOrderPreservesDurationMinValues() {
    // Setup: Create order with service that has durationMin = 45
    CreateOrderRequest createRequest = buildOrderRequest();
    createRequest.getItems().get(0).getServices().get(0).setDurationMin(45);

    // Create order
    OrderResponse created = salesService.createOrder(createRequest, userId, branchId);
    UUID orderId = created.getId();

    // Verify creation worked
    assertEquals(45, created.getItems().get(0).getServices().get(0).getDurationMin());
    assertTrue(created.getTotalDurationMin() > 0);

    // Update: Change order notes (should preserve durationMin)
    CreateOrderRequest updateRequest = buildOrderRequest();
    updateRequest.getItems().get(0).getServices().get(0).setDurationMin(45);
    updateRequest.setNotes("Updated notes");

    OrderResponse updated = salesService.updateOrder(orderId, updateRequest);

    // Verify durationMin persisted
    assertEquals(45, updated.getItems().get(0).getServices().get(0).getDurationMin(),
        "durationMin should be 45 after update");
    assertTrue(updated.getTotalDurationMin() > 0,
        "totalDurationMin should be calculated and > 0");
}
```

**Verify:**
- Test compiles
- Test fails before fix, passes after fix
- No other tests broken

**File Changes:**
- SalesServiceTest.java: +1 test method (~15 lines)

---

### Task 3: Integration Test (SQL Verification)

**File Path (for documentation):**
```
.planning/quick-tasks/test-duration-fix-integration.sql
```

**Action:**
Create SQL script to verify the fix at database level:

```sql
-- Test script: Verify durationMin persisted after order update

-- 1. Check that new orders have durationMin populated
SELECT
    oi.id_order_item,
    s.service_name,
    ois.duration_min,
    o.total_duration_min
FROM tco_order_item_service ois
JOIN tco_order_item oi ON ois.id_order_item = oi.id_order_item
JOIN tco_order o ON oi.id_order = o.id_order
JOIN cci_service s ON ois.id_service = s.id_service
WHERE o.created_at > NOW() - INTERVAL '1 hour'
  AND o.status NOT IN ('RECEIVED', 'PENDING')
ORDER BY o.created_at DESC
LIMIT 5;

-- Expected: duration_min values populated (not null), total_duration_min > 0

-- 2. Specifically test an updated order
-- After running manual test: Create order → Update → Verify
SELECT
    id_order,
    ticket_number,
    total_duration_min,
    status,
    updated_at
FROM tco_order
WHERE ticket_number = '{test_order_ticket_number}'
ORDER BY updated_at DESC;

-- Expected: total_duration_min should match the sum of service durations
```

**Verify:**
- Script syntax correct
- Can run against production database
- Returns expected results

**File Changes:**
- test-duration-fix-integration.sql: new file

---

## Verification Strategy

### Automated
```bash
# Run affected unit tests
mvn test -Dtest=SalesServiceTest#updateOrderPreservesDurationMinValues

# Run full sales service test suite
mvn test -f anotame-api/backend/sales-service
```

**Expected Output:** All tests pass, including new test

### Manual Verification Steps

1. **Create a new order with services:**
   ```bash
   curl -X POST http://localhost:8080/orders \
     -H "Authorization: Bearer {jwt_token}" \
     -H "Content-Type: application/json" \
     -d '{
       "items": [{
         "garmentName": "Shirt",
         "services": [{"serviceId": "...", "serviceName": "Wash", "durationMin": 45}]
       }]
     }'
   ```
   Check response: `totalDurationMin` should be > 0

2. **Update that order (change notes only):**
   ```bash
   curl -X PUT http://localhost:8080/orders/{order_id} \
     -H "Authorization: Bearer {jwt_token}" \
     -H "Content-Type: application/json" \
     -d '{
       "notes": "Updated notes",
       "items": [{...same as above...}]
     }'
   ```
   Check response: `totalDurationMin` should still be > 0 (NOT 0)

3. **Verify dashboard displays workload:**
   ```bash
   curl -X GET http://localhost:8080/orders/kpi/dashboard \
     -H "Authorization: Bearer {jwt_token}"
   ```
   Check: `dailyWorkload` array should have non-zero `totalMinutesUsed` values

4. **Check database:**
   ```sql
   SELECT total_duration_min FROM tco_order WHERE id_order = '{order_id}';
   SELECT duration_min FROM tco_order_item_service
   WHERE id_order_item IN (
     SELECT id_order_item FROM tco_order_item WHERE id_order = '{order_id}'
   );
   ```
   Expected: `total_duration_min` > 0, `duration_min` values populated

---

## Deployment Strategy

### Stage 1: Code Changes
1. Apply fix to SalesService.java (1 line)
2. Add unit test
3. Create integration test SQL

### Stage 2: Testing
1. Run unit tests locally
2. Run full test suite on CI
3. Verify in staging environment

### Stage 3: Production Deployment
1. Deploy to production (standard deployment process)
2. Run manual verification steps against production
3. Monitor dashboard metrics for improvement

### Stage 4: Data Recovery (Separate Task)
- If existing orders need duration recalculated:
  - Create separate migration task
  - Use batch update with stored procedure or bulk operation
  - Recalculate totalDurationMin for all orders with null/0 values

---

## Success Criteria

- [ ] Unit test added and passing
- [ ] Integration test SQL executes without error
- [ ] Manual verification: New order shows correct totalDurationMin
- [ ] Manual verification: Updated order preserves totalDurationMin (not 0)
- [ ] Dashboard displays workload metrics correctly
- [ ] No other tests broken
- [ ] Code reviewed and merged to main

---

## Files to Modify

| File | Change | Impact |
|------|--------|--------|
| `SalesService.java` | Add 1 line: `service.setDurationMin(...)` | Fixes updateOrder() flow |
| `SalesServiceTest.java` | Add 1 test method | Prevents regression |
| (New) `test-duration-fix-integration.sql` | Create SQL verification script | Enables database-level testing |

---

## Atomic Commit Message

```
fix(sales-service): restore durationMin assignment in updateOrder() flow

When updating an order, durationMin was not being copied from the request
DTO to the OrderItemService entity. This caused:

- Updated orders to have null durationMin in database
- totalDurationMin calculated as 0 (sum of null values)
- Workload metrics not displayed in dashboards
- KPI dashboard workload chart showing empty data

Root cause: SalesService.updateOrder() (line 217-232) was missing the
durationMin assignment that exists in createOrder() (line 88).

Fix: Add single line to copy durationMin from DTO to service entity,
matching the exact logic used in order creation flow.

Testing:
- New unit test: SalesServiceTest#updateOrderPreservesDurationMinValues
- Integration test: SQL queries verify duration_min populated after update
- Manual verification: Create → Update → Verify totalDurationMin persists

Fixes: Production issue where totalDurationMin shows 0 in dashboards
Related: Previous quick task 260403-qh0 (partial fix)
```

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Logic error in fix | Very Low | Critical | 1-line fix mirrors existing code in createOrder() |
| Test failure | Low | Medium | Unit test catches regression immediately |
| Production data loss | None | — | Read-only operation, no data deleted |
| Performance regression | Very Low | Low | Single assignment line, zero perf impact |

---

## Timeline

- **Analysis:** Complete (root cause identified)
- **Implementation:** 5 minutes (1-line fix)
- **Testing:** 10 minutes (run test suite)
- **Review:** 5 minutes
- **Deployment:** Standard process
- **Verification:** 5 minutes (manual checks)

**Total Implementation Time:** ~25 minutes
