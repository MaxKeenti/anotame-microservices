# Anotame Backend

Java 21 Quarkus microservices for Anotame. Each service owns its own PostgreSQL database and follows the project hexagonal architecture conventions in `../../AI_RULES.md`.

## Services

- `identity-service` on port `8081`: authentication and user management
- `catalog-service` on port `8082`: garments, services, and price lists
- `sales-service` on port `8083`: customers, orders, payments, and receipts
- `operations-service` on port `8084`: shifts, thresholds, and work orders

## Local Development

Start the database containers from the repository root:

```bash
docker compose up -d
```

Run a service in Quarkus dev mode from this directory:

```bash
./mvnw quarkus:dev -pl identity-service
./mvnw quarkus:dev -pl catalog-service
./mvnw quarkus:dev -pl sales-service
./mvnw quarkus:dev -pl operations-service
```

Flyway migrations run at service startup. Do not apply manual SQL seed scripts for normal local development.
