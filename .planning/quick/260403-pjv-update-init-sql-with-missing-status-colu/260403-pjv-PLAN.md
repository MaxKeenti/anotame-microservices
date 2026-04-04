---
quick_plan: true
mode: quick
type: execute
created_at: 2026-04-03
issue: "Production database error: column oe1_0.status does not exist when creating orders"
status: ready
---

## QUICK PLAN: Add Missing Status Column to Order Table

**Problem:** Fresh database initialization from init.sql is missing the `status` column for the order entity, causing "column oe1_0.status does not exist" error when creating orders.

**Root Cause:** The `OrderEntity.java` defines a `status` field that maps to the database column, but init.sql either lacks the column definition or it's not correctly aligned with the JPA mapping.

**Solution Scope:**
1. Verify/fix the status column definition in init.sql
2. Ensure the column is properly positioned in the tco_order table
3. Test the fix with a fresh database

---

## Tasks

### Task 1: Verify and Correct Status Column in init.sql

**Files:**
- anotame-db/init.sql

**Action:**
The status column MUST be present in the tco_order table definition (lines 193-230) with this specification:
```sql
status VARCHAR(255) NOT NULL DEFAULT 'RECEIVED'
```

This column should appear in the CREATE TABLE statement for tco_order, positioned after the financial/payment columns and before workflow dates. The column name MUST match the JPA field `@Column(nullable = false) private String status` in OrderEntity.java.

If missing or incorrectly defined, add or correct it to match the schema above. The column should store the overall order status as a string (RECEIVED, PROCESSING, COMPLETED, CANCELLED, etc.).

**Verify:**
```bash
grep -A 40 "CREATE TABLE tco_order" /Users/maximilianogonzalezcalzada/Library/Mobile\ Documents/com~apple~CloudDocs/source/personal/anotame-microservices/anotame-db/init.sql | grep -E "status\s+(VARCHAR|TEXT)"
```

Expected output: `status VARCHAR(255) NOT NULL DEFAULT 'RECEIVED'`

**Done:**
- Status column explicitly defined in init.sql CREATE TABLE tco_order
- Column type matches JPA mapping (VARCHAR 255, NOT NULL, default 'RECEIVED')
- No duplicate status columns

---

### Task 2: Test Fresh Database with Updated init.sql

**Files:**
- (integration test - docker-compose + database)

**Action:**
Start fresh database with the corrected init.sql to confirm:
1. Database schema initializes without errors
2. The status column is created and accessible
3. New orders can be created without "column does not exist" error

Run this sequence:
```bash
cd /Users/maximilianogonzalezcalzada/Library/Mobile\ Documents/com~apple~CloudDocs/source/personal/anotame-microservices

# Clean and rebuild (fresh init.sql)
docker-compose down -v
docker-compose up --build -d

# Wait for postgres to start
sleep 10

# Test: Create an order (verify status column exists)
curl -X POST http://localhost:8080/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "550e8400-e29b-41d4-a716-446655440000",
    "items": [
      {
        "garmentTypeId": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
        "serviceId": "255705ed-9fd8-4dea-8137-05ebecca31a8"
      }
    ]
  }'
```

Expected: 201 response with order object including status field set to 'RECEIVED'

**Verify:**
```bash
# Check if status column exists and has correct type
docker-compose exec postgres psql -U anotame_user -d anotame \
  -c "\d tco_order" | grep status
```

Expected output shows: `status | character varying(255)` with NOT NULL constraint

**Done:**
- Fresh database successfully initializes from corrected init.sql
- Status column exists and is queryable
- Order creation API returns 201 without "column does not exist" error
- Status field in response shows 'RECEIVED' as default

---

## Success Criteria

- init.sql contains properly defined status column in tco_order table
- Fresh database schema creation succeeds
- Orders can be created without database column errors
- Status column is accessible and has correct default value

