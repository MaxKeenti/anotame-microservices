---
phase: quick
plan: 260403-tqw
type: execute
wave: 1
depends_on: []
files_modified: [anotame-api/backend/sales-service/src/main/java/com/anotame/sales/infrastructure/web/controller/OrdersResource.java]
autonomous: true
requirements: []
user_setup: []

must_haves:
  truths:
    - "Orders can be created by users without branch_id claim in JWT (backward compatibility)"
    - "Users with missing branch_id claim fall back to default branch UUID (Oaxaca #113)"
    - "Orders created without branch_id use default branch correctly"
    - "user_id claim remains required (no fallback for user_id)"
  artifacts:
    - path: "anotame-api/backend/sales-service/src/main/java/com/anotame/sales/infrastructure/web/controller/OrdersResource.java"
      provides: "JWT claim extraction with optional branch_id fallback"
      contains: "branchId = UUID.fromString(defaultBranchId)"
  key_links:
    - from: "OrdersResource.createOrder()"
      to: "SalesService.createOrderDTO()"
      via: "UUID branchId parameter"
      pattern: "salesService.createOrderDTO\\(request, userId, branchId\\)"
---

<objective>
Restore optional branch_id JWT claim with default fallback for backward compatibility with existing sessions.

Purpose: Users registered before v1.0 branch_id claims were added (or sessions without branch_id) are currently blocked from creating orders. This fix restores the original design pattern that falls back to the default branch UUID when branch_id is missing or null.

Output: Updated OrdersResource.createOrder() that accepts missing branch_id and uses Oaxaca #113 (ea22f4a4-5504-43d9-92f9-30cc17b234d1) as fallback.
</objective>

<execution_context>
This is a quick fix for production backward compatibility. The issue was introduced in 260403-tcn when strict validation was added to prevent NullPointerException, but this broke the intentional optional-with-fallback pattern used for newly registered users and legacy sessions.
</execution_context>

<context>
@.planning/STATE.md
@AI_RULES.md

Current Implementation (lines 35-38 in OrdersResource.java):
```java
String branchIdClaim = (String) jwt.getClaim("branch_id");
if (branchIdClaim == null || branchIdClaim.isEmpty()) {
    throw new jakarta.ws.rs.BadRequestException("Missing or invalid branch_id claim in JWT token");
}
```

Default Branch UUID (Oaxaca #113): ea22f4a4-5504-43d9-92f9-30cc17b234d1
</context>

<tasks>

<task type="auto">
  <name>Task 1: Restore optional branch_id with default fallback in OrdersResource</name>
  <files>anotame-api/backend/sales-service/src/main/java/com/anotame/sales/infrastructure/web/controller/OrdersResource.java</files>
  <action>
Modify OrdersResource.createOrder() to restore optional branch_id pattern:

1. Keep user_id validation as-is (required with BadRequestException if missing/empty)
2. Change branch_id validation to optional fallback pattern:
   - If branch_id claim is null or empty: use default branch UUID ea22f4a4-5504-43d9-92f9-30cc17b234d1 (Oaxaca #113)
   - If branch_id claim exists and is valid: use the claim value
   - Parse the branch_id or default to UUID

3. Add a comment above the branch_id extraction explaining this is intentional backward compatibility for:
   - Newly registered users without branch_id claim
   - Legacy sessions from before v1.0
   - v1.0 rollout users during transition period

Example pattern:
```java
String branchIdClaim = (String) jwt.getClaim("branch_id");
// Intentional backward compatibility: branch_id is optional with fallback to default branch (Oaxaca #113)
// This supports newly registered users, legacy sessions, and v1.0 rollout without requiring re-login
UUID branchId = (branchIdClaim != null && !branchIdClaim.isEmpty())
    ? UUID.fromString(branchIdClaim)
    : UUID.fromString("ea22f4a4-5504-43d9-92f9-30cc17b234d1");
```

4. Verify no other files reference the strict branch_id validation from 260403-tcn
  </action>
  <verify>
    <automated>grep -n "branch_id.*BadRequest\|branch_id.*invalid" anotame-api/backend/sales-service/src/main/java/com/anotame/sales/infrastructure/web/controller/OrdersResource.java && echo "FAIL: Strict validation still present" || echo "PASS: Strict branch_id validation removed"</automated>
    <automated>cd anotame-api/backend/sales-service && mvn clean compile -q && echo "PASS: Code compiles" || echo "FAIL: Compilation error"</automated>
  </verify>
  <done>
  - branch_id claim is optional in createOrder()
  - Missing/null branch_id falls back to UUID ea22f4a4-5504-43d9-92f9-30cc17b234d1
  - user_id remains required
  - Comment documents backward compatibility intent
  - Code compiles without errors
  - BadRequestException for branch_id is removed
  </done>
</task>

</tasks>

<verification>
1. Code Change: branch_id validation changed from strict (BadRequestException) to optional with fallback
2. Compilation: Maven compiles without errors
3. Backward Compatibility: Users without branch_id claim can create orders using default branch
4. Comment: Code includes explanation of intentional backward compatibility handling
</verification>

<success_criteria>
- OrdersResource.createOrder() accepts requests without branch_id claim
- Missing branch_id defaults to Oaxaca #113 UUID
- user_id claim remains required
- Code compiles successfully
- Change aligns with original v1.0 design for optional branch_id with fallback
</success_criteria>

<output>
After completion, summarize changes and verify via:
- `grep -A 10 "String branchIdClaim" anotame-api/backend/sales-service/src/main/java/com/anotame/sales/infrastructure/web/controller/OrdersResource.java`
- `cd anotame-api/backend/sales-service && mvn clean compile -q`
</output>
