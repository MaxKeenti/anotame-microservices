# Quick Task Summary: 260413-ann

## Description
Refactored audit log collection to use `Collectors.toCollection(ArrayList::new)` to resolve strict nullability annotation warnings in the IDE.

## Changes
- Modified `SalesService.java`: Replaced `collect(Collectors.toList())` with `collect(Collectors.toCollection(ArrayList::new))` in `getAuditLog`.
- Modified `OrderAuditLogPersistenceAdapter.java`: Replaced `collect(Collectors.toList())` with `collect(Collectors.toCollection(ArrayList::new))` in `findByOrderId`.

## Verification Results
- Ran `./mvnw clean compile -pl sales-service -am`.
- **Status**: BUILD SUCCESS.
- **IDE**: Should resolve "Unsafe null type conversion" warnings related to `Collector` generic types.

## Commits
- 260413-ann: Fix Collector annotation warnings in sales-service
