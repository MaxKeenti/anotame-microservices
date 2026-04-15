# Quick Task Summary: 260413-unc

## Description
Fixed unsafe null type conversion warnings in `SalesService` and `OrderAuditLogPersistenceAdapter`.

## Changes
- Modified `anotame-api/backend/sales-service/src/main/java/com/anotame/sales/application/service/SalesService.java`: Replaced `.toList()` with `.collect(java.util.stream.Collectors.toList())` in `getAuditLog`.
- Modified `anotame-api/backend/sales-service/src/main/java/com/anotame/sales/infrastructure/persistence/adapter/OrderAuditLogPersistenceAdapter.java`: Replaced `.toList()` with `.collect(java.util.stream.Collectors.toList())` in `findByOrderId`.

## Verification Results
- Ran `./mvnw clean compile -pl sales-service -am` in `anotame-api/backend`.
- **Status**: BUILD SUCCESS.
- **IDE**: Warnings should be resolved (manual verification by user).

## Commits
- 260413-unc: Fix unsafe null type conversions in sales-service
