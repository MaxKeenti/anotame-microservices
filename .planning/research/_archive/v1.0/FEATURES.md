# Features Research

**Domain:** Quarkus 3.x — Exception handling, health checks, profile-gated config
**Milestone:** Code quality / security hardening on existing microservices
**Confidence:** HIGH — all patterns are stable Quarkus 3.x core APIs

---

## 1. Structured JSON Exception Handling (`@ServerExceptionMapper`)

### Pattern

Quarkus REST (JAX-RS) uses `@ServerExceptionMapper` (preferred over `ExceptionMapper<T>` in Quarkus REST):

```java
@Provider
public class GlobalExceptionHandler {

    @ServerExceptionMapper
    public RestResponse<ErrorResponse> handleDomainException(DomainException ex) {
        return RestResponse.status(ex.getHttpStatus(), new ErrorResponse(ex.getMessage()));
    }

    @ServerExceptionMapper
    public RestResponse<ErrorResponse> handleConstraintViolation(ConstraintViolationException ex) {
        List<String> messages = ex.getConstraintViolations().stream()
            .map(v -> v.getPropertyPath() + ": " + v.getMessage())
            .toList();
        return RestResponse.status(Response.Status.BAD_REQUEST, new ErrorResponse("Validation failed", messages));
    }

    @ServerExceptionMapper
    public RestResponse<ErrorResponse> handleGeneric(Exception ex) {
        return RestResponse.status(Response.Status.INTERNAL_SERVER_ERROR,
            new ErrorResponse("Internal server error"));
    }
}
```

### Error Response DTO

```java
@Data
@AllArgsConstructor
public class ErrorResponse {
    private String message;
    private List<String> details;

    public ErrorResponse(String message) {
        this.message = message;
        this.details = List.of();
    }
}
```

### Sales-service existing handler reference

`sales-service` already has a `GlobalExceptionHandler` — its pattern should be the template for identity, catalog, and operations services.

### Table Stakes
- All 4 services must return consistent JSON error shape: `{ "message": "...", "details": [] }`
- HTTP status codes must be semantically correct (400 for validation, 401 for auth, 404 for not found, 409 for conflict, 500 for unexpected)
- Stack traces must NEVER appear in production responses

---

## 2. Typed Domain Exceptions

### Pattern

```java
// Base
public abstract class DomainException extends RuntimeException {
    private final Response.Status httpStatus;

    protected DomainException(String message, Response.Status status) {
        super(message);
        this.httpStatus = status;
    }

    public Response.Status getHttpStatus() { return httpStatus; }
}

// Concrete exceptions
public class InvalidCredentialsException extends DomainException {
    public InvalidCredentialsException() {
        super("Invalid username or password", Response.Status.UNAUTHORIZED);
    }
}

public class UserAlreadyExistsException extends DomainException {
    public UserAlreadyExistsException(String username) {
        super("User already exists: " + username, Response.Status.CONFLICT);
    }
}

public class ResourceNotFoundException extends DomainException {
    public ResourceNotFoundException(String resource, Object id) {
        super(resource + " not found: " + id, Response.Status.NOT_FOUND);
    }
}
```

### Services that need typed exceptions
- **identity-service**: `AuthService` throws bare `RuntimeException` for invalid credentials and duplicate usernames
- **sales-service**: Missing `ResourceNotFoundException` for order/customer not found
- All services: generic `Exception` catch → should surface as typed domain exception

---

## 3. Quarkus Profile-Based Property Overrides

### Syntax

```properties
# Default (all profiles)
quarkus.hibernate-orm.log.sql=false

# Dev profile only (overrides default when running in dev mode)
%dev.quarkus.hibernate-orm.log.sql=true
%dev.quarkus.hibernate-orm.log.format-sql=true
%dev.quarkus.hibernate-orm.log.bind-param=true

# Prod profile only
%prod.quarkus.hibernate-orm.log.sql=false
%prod.anotame.auth.cookie.secure=true
```

### Profile activation
- `quarkus:dev` → activates `dev` profile automatically
- `java -jar quarkus-run.jar` → activates `prod` profile (Railway deploys use this)
- `@QuarkusTest` → activates `test` profile

### Properties to gate per profile in this project

| Property | Default | `%dev` override |
|----------|---------|-----------------|
| `quarkus.hibernate-orm.log.sql` | `false` | `true` |
| `quarkus.hibernate-orm.log.format-sql` | `false` | `true` |
| `anotame.auth.cookie.secure` | `true` | `false` |
| `quarkus.flyway.migrate-at-start` | `true` | `true` (or `false` for `drop-and-create` dev workflow) |

---

## 4. SmallRye Health — Quarkus Health Endpoints

### Extension

```xml
<dependency>
    <groupId>io.quarkus</groupId>
    <artifactId>quarkus-smallrye-health</artifactId>
</dependency>
```

### Built-in DB health check

Adding `quarkus-smallrye-health` with `quarkus-jdbc-postgresql` automatically registers a database connectivity health check. No code needed.

### Endpoints provided

| Endpoint | Purpose |
|----------|---------|
| `GET /q/health` | Combined liveness + readiness |
| `GET /q/health/live` | Liveness only |
| `GET /q/health/ready` | Readiness (includes DB check) |

### Custom health check (optional)

```java
@Readiness
@ApplicationScoped
public class DatabaseHealthCheck implements HealthCheck {
    @Override
    public HealthCheckResponse call() {
        return HealthCheckResponse.up("database");
    }
}
```

---

## 5. Docker Compose Health Check Integration

```yaml
services:
  identity-service:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8081/q/health/ready"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 60s  # JVM startup buffer

  sales-service:
    depends_on:
      anotame-db:
        condition: service_healthy
      identity-service:
        condition: service_healthy  # if JWT validation depends on identity
```

### Port mapping per service

| Service | Port | Health URL |
|---------|------|-----------|
| identity-service | 8081 | `http://localhost:8081/q/health/ready` |
| catalog-service | 8082 | `http://localhost:8082/q/health/ready` |
| sales-service | 8083 | `http://localhost:8083/q/health/ready` |
| operations-service | 8084 | `http://localhost:8084/q/health/ready` |

### `start_period` note
Quarkus JVM startup with Hibernate ORM takes 15-45 seconds cold. Set `start_period: 60s` to avoid false-failure health checks on first boot.

---

## Summary

| Feature | Effort | Priority |
|---------|--------|---------|
| `GlobalExceptionHandler` in all 4 services | Low — copy from sales-service | HIGH |
| Typed domain exceptions in identity-service | Medium | HIGH |
| Profile-gated SQL logging | Trivial — property change only | MEDIUM |
| SmallRye Health extension + docker-compose healthchecks | Low | MEDIUM |
| `%prod.` cookie secure flag | Trivial | HIGH (security) |

---
*Research date: 2026-03-31*
