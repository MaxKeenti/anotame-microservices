# Testing Patterns

**Analysis Date:** 2026-03-31

## Summary

Testing coverage in this project is minimal to nonexistent. The primary testing mechanism is a bash-based integration script (`test_integration.sh`) that exercises a live Docker deployment. No automated unit or integration tests exist in any of the four microservices. There are no frontend tests. This is a significant coverage gap requiring prioritized remediation.

---

## Test Framework Inventory

### Backend

**Framework declared:** Maven Surefire Plugin 3.5.2 (present in all service `pom.xml` files).

**JUnit 5:** Available transitively through the Quarkus BOM but no test dependencies are explicitly declared in any service `pom.xml`. Quarkus 3.27.2 brings `quarkus-junit5` and `rest-assured` through the BOM.

**Test directories:**
- `anotame-api/backend/sales-service/src/test/` — **does not exist**
- `anotame-api/backend/operations-service/src/test/` — **does not exist**
- `anotame-api/backend/catalog-service/src/test/` — **does not exist**
- `anotame-api/backend/identity-service/src/test/` — **does not exist**
- `anotame-api/backend/src/test/java/com/anotame_api/backend/BackendApplicationTests.java` — one trivial Spring Boot context-load test (this file is a leftover from an earlier scaffold; the actual services use Quarkus, not Spring Boot)

**Test classes found:** 1 (legacy scaffold only; not applicable to production services)

### Frontend

**Test framework:** None. No `vitest.config.*`, `jest.config.*`, `playwright.config.*`, or equivalent exists in `anotame-web/`.

**Test files:** Zero `*.test.ts` or `*.spec.ts` files outside of `node_modules/`.

---

## How to Run Existing Tests

### Backend unit tests (per service)

```bash
# From a service directory (e.g., sales-service)
cd anotame-api/backend/sales-service
mvn test
# NOTE: No test files exist — this will report 0 tests run
```

### Integration test (requires running Docker stack)

```bash
# Start the full stack first
docker compose up --build -d

# Then run the integration script
./test_integration.sh
```

The `test_integration.sh` script:
1. Registers a new user against identity-service (`http://localhost:8081`)
2. Logs in and obtains a JWT token
3. Fetches garments from catalog-service (`http://localhost:8082`)
4. Fetches services from catalog-service
5. Creates an order in sales-service (`http://localhost:8083`)
6. Asserts a `ticketNumber` is present in the response

The script uses `curl` and `jq`. It exits with code 1 on any failure.

**Known issue in test_integration.sh:** The `TOKEN=$(echo $LOGIN_RESPONSE)` line does not parse the JWT from the login response. The token is not extracted; the variable is set to the entire raw response body. As a result, authenticated requests in step 5 use a malformed `Authorization: Bearer` header. The test may pass if the sales endpoint does not strictly enforce auth in the Docker configuration.

---

## What Should Be Tested (Recommended Patterns)

Since tests must be written from scratch, use the following Quarkus-native patterns when adding them.

### Quarkus Unit Test Pattern

Add `quarkus-junit5` and `rest-assured` dependencies to each service `pom.xml`:

```xml
<dependency>
    <groupId>io.quarkus</groupId>
    <artifactId>quarkus-junit5</artifactId>
    <scope>test</scope>
</dependency>
<dependency>
    <groupId>io.rest-assured</groupId>
    <artifactId>rest-assured</artifactId>
    <scope>test</scope>
</dependency>
```

Place test files at: `src/test/java/com/anotame/<service>/`

### Controller/Integration Test Pattern (Quarkus @QuarkusTest)

```java
// src/test/java/com/anotame/sales/infrastructure/web/controller/OrdersResourceTest.java
package com.anotame.sales.infrastructure.web.controller;

import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.notNullValue;

@QuarkusTest
class OrdersResourceTest {

    @Test
    void testGetOrdersReturns200() {
        given()
          .when().get("/orders")
          .then()
             .statusCode(200);
    }

    @Test
    void testCreateOrderValidation() {
        given()
          .contentType("application/json")
          .body("{}")
          .when().post("/orders")
          .then()
             .statusCode(400);
    }
}
```

### Application Service Unit Test Pattern (plain JUnit 5)

Services depend on port interfaces — mock them with Mockito:

```java
// src/test/java/com/anotame/sales/application/service/SalesServiceTest.java
package com.anotame.sales.application.service;

import com.anotame.sales.application.port.output.OrderRepositoryPort;
import com.anotame.sales.application.port.output.CustomerRepositoryPort;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import static org.assertj.core.api.Assertions.assertThat;

class SalesServiceTest {

    private final OrderRepositoryPort orderRepo = Mockito.mock(OrderRepositoryPort.class);
    private final CustomerRepositoryPort customerRepo = Mockito.mock(CustomerRepositoryPort.class);
    private final SalesService service = new SalesService(orderRepo, customerRepo);

    @Test
    void createOrder_withValidRequest_savesOrder() {
        // Arrange
        // ... set up mock return values
        // Act
        // ... call service method
        // Assert
        Mockito.verify(orderRepo).save(Mockito.any());
    }
}
```

Add Mockito to the service `pom.xml` to use this pattern:

```xml
<dependency>
    <groupId>org.mockito</groupId>
    <artifactId>mockito-core</artifactId>
    <scope>test</scope>
</dependency>
```

### Quarkus Test with Database (TestContainers approach)

For persistence adapter tests that need a real DB, Quarkus integrates with Testcontainers via Dev Services. With `quarkus-jdbc-postgresql` on the classpath, Quarkus Dev Services automatically starts a PostgreSQL container during tests when no `quarkus.datasource.jdbc.url` is set.

```java
@QuarkusTest
class OrderPersistenceAdapterTest {

    @Inject
    OrderPersistenceAdapter adapter;

    @Test
    @Transactional
    void save_andFindById_roundTrip() {
        // Quarkus Dev Services provides real Postgres automatically
        Order order = new Order();
        // ... populate
        Order saved = adapter.save(order);
        assertThat(adapter.findById(saved.getId())).isPresent();
    }
}
```

---

## Frontend Testing (Not Yet Implemented)

No frontend tests exist. If adding frontend tests, use **Vitest** (aligns with the Vite build tool already in use).

Install:
```bash
bun add -D vitest @testing-library/svelte jsdom
```

Add to `package.json`:
```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

Vitest config at `vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte({ hot: !process.env.VITEST })],
  test: {
    environment: 'jsdom',
    globals: true
  }
});
```

Unit test pattern for utility functions:
```typescript
// src/lib/utils/formatUtils.test.ts
import { describe, it, expect } from 'vitest';
import { formatCurrency } from './formatUtils';

describe('formatCurrency', () => {
  it('formats positive amounts', () => {
    expect(formatCurrency(1234.5)).toBe('$1,234.50');
  });
});
```

---

## Test File Naming and Location Conventions

When tests are added, follow these conventions:

**Backend:**
- Location: `src/test/java/com/anotame/<service>/<layer>/` mirroring the main source tree
- Naming: `<ClassName>Test.java` (unit) or `<ClassName>IT.java` (integration)
- Examples:
  - `SalesServiceTest.java`
  - `OrdersResourceIT.java`
  - `OrderPersistenceAdapterIT.java`

**Frontend:**
- Location: co-located with the file under test, same directory
- Naming: `<filename>.test.ts`
- Examples:
  - `src/lib/utils/formatUtils.test.ts`
  - `src/lib/utils/statusUtils.test.ts`

---

## Coverage Gaps

Every area of the codebase is untested. Priority order for adding coverage:

### Critical (High Impact)

| Area | Files | Risk |
|---|---|---|
| Order creation & total calculation | `anotame-api/backend/sales-service/src/main/java/com/anotame/sales/application/service/SalesService.java` | Business logic bugs in pricing silently affect revenue |
| Dashboard metrics calculation | `SalesService.getDashboardMetrics()` | Complex date arithmetic with no safety net |
| JWT auth flow | `anotame-api/backend/identity-service/src/main/java/com/anotame/identity/application/service/AuthService.java` | Auth bypass if logic regresses |
| Domain→entity mapping | `OrderPersistenceAdapter.toDomain()` / `save()` | Data loss/corruption on every persist operation |

### High Priority

| Area | Files | Risk |
|---|---|---|
| `GlobalExceptionHandler` error format | `anotame-api/backend/sales-service/src/main/java/com/anotame/sales/infrastructure/web/exception/GlobalExceptionHandler.java` | Frontend error handling breaks if response format changes |
| `ApiService` error parsing | `anotame-web/src/lib/services/api.svelte.ts` | Silent failures when backend error format changes |
| Customer deduplication logic | `SalesService.resolveCustomer()` | Duplicate customers created silently |
| Price list effective price calculation | `anotame-api/backend/catalog-service/src/main/java/com/anotame/catalog/infrastructure/web/controller/CatalogController.java` | Wrong prices shown/applied |

### Medium Priority

| Area | Files | Risk |
|---|---|---|
| Bean validation constraints | All `*Request.java` DTOs | Inconsistent validation behavior across services |
| `OrderWizardState` draft persistence | `anotame-web/src/lib/services/orders/OrderWizardState.svelte.ts` | Draft data loss for users |
| Soft delete behavior | All `*Entity.java` / `*Jpa.java` with `@SQLRestriction` | Deleted records reappearing |
| Zod form schemas | In-component schemas (e.g., `customer-dialog.svelte`) | Validation gaps in form submission |

---

## Integration Test Script Notes

The existing `test_integration.sh` at the project root:
- Requires running services: identity on `8081`, catalog on `8082`, sales on `8083`
- Requires `curl` and `jq` installed
- Does **not** clean up test data after running (creates a user and an order that persist in the database)
- The token extraction bug (line 36: `TOKEN=$(echo $LOGIN_RESPONSE)`) means the script does not actually test authenticated endpoints correctly
- Does not test: update, delete, error cases, pagination, or catalog CRUD

---

*Testing analysis: 2026-03-31*
