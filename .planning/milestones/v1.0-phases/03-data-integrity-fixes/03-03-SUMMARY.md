# Plan 03-03 Summary

**Status**: Complete
**Completed**: 2026-04-01

## What was done
- Added `@Inject JsonWebToken jwt` field to `OrdersResource`
- Removed `@HeaderParam("X-User-Name") String username` parameter from `createOrder`
- JWT claims `user_id` and `branch_id` extracted at controller layer via `jwt.getClaim()`
- Rollout fallback for missing `branch_id` claim (old in-flight tokens during transition window)
- `SalesService.createOrder()` signature changed: `(request, String username)` → `(request, UUID userId, UUID branchId)`
- `order.setBranchId(branchId)` replaces hardcoded `UUID.fromString("ea22f4a4-...")`
- `order.setCreatedBy(userId)` replaces `UUID.nameUUIDFromBytes(username.getBytes())`

## Files modified
- `anotame-api/backend/sales-service/src/main/java/com/anotame/sales/infrastructure/web/controller/OrdersResource.java`
- `anotame-api/backend/sales-service/src/main/java/com/anotame/sales/application/service/SalesService.java`

## Commit
`78b549e`: feat(data-01,data-03): read branchId and createdBy from JWT in sales-service

## Deployment note
Deploy identity-service (03-01 changes) BEFORE this service in production.
All active user sessions will receive the new claims on next login.
Once all sessions have refreshed, remove the `// TODO: remove fallback` block in `OrdersResource`.
