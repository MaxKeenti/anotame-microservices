# Anotame Microservices

A microservices-based backend for the Anotame platform, built with Java Quarkus and Hexagonal Architecture.

## Architecture

The system consists of 4 backend services and 1 SvelteKit frontend:

- **identity-service** (port 8081): User registration, authentication, JWT issuance
- **catalog-service** (port 8082): Garment types, services, price lists
- **sales-service** (port 8083): Order creation and management
- **operations-service** (port 8084): Shifts, employee assignments, work orders
- **anotame-web**: SvelteKit frontend (port 3000 in dev)

All backend services follow Hexagonal Architecture (domain / application / infrastructure layers).

Each service owns its own PostgreSQL database — no shared database, no cross-service foreign keys.

## Prerequisites

- Docker Desktop (for local database containers)
- Java 21
- Maven (or use the `./mvnw` wrapper in `anotame-api/backend`)

## Local Development

### 1. Start the database containers

From the repo root:

```bash
docker compose up -d
```

This starts 4 independent PostgreSQL containers:

| Container | Host Port | DB Name |
|-----------|-----------|---------|
| identity-db | 5431 | identity |
| catalog-db | 5432 | catalog |
| sales-db | 5433 | sales |
| operations-db | 5434 | operations |

> **Note:** catalog-db binds to host port 5432, which is the PostgreSQL default. If you have a local PostgreSQL server installed, stop it before running `docker compose up` to avoid a port conflict.

PgAdmin is also available at http://localhost:5050 (login: admin@anotame.com / admin).

### 2. Start a service in dev mode

Run a service from the backend directory:

```bash
cd anotame-api/backend
./mvnw quarkus:dev -pl identity-service
```

On first start, Flyway automatically creates the schema in the service's database container. No manual SQL execution is needed.

Repeat for each service you need running:

```bash
./mvnw quarkus:dev -pl catalog-service
./mvnw quarkus:dev -pl sales-service
./mvnw quarkus:dev -pl operations-service
```

### 3. Start the frontend

```bash
cd anotame-web
bun install
bun run dev
```

The frontend is available at http://localhost:3000.

### One-time migration from the old setup

If you previously ran `docker compose up` with the old shared database container, a `postgres_data` volume may still exist. Remove it with:

```bash
docker volume rm anotame-microservices_postgres_data
```

This volume is no longer used and safe to delete.

## Project Structure

```
anotame-api/backend/
  identity-service/     Java Quarkus — auth and users
  catalog-service/      Java Quarkus — garments, services, price lists
  sales-service/        Java Quarkus — orders
  operations-service/   Java Quarkus — shifts and work orders
anotame-web/            SvelteKit frontend
docker-compose.yml      Local dev database containers (4 PostgreSQL)
.env                    Local dev env vars (JWT keys, cookie config)
```

## Environment Variables

Copy `.env.example` to a local `.env` file and populate the JWT key pair.

When running `quarkus:dev`, each service reads its datasource URL from its `%dev` profile in `application.properties` — no `QUARKUS_DATASOURCE_JDBC_URL` env var is needed locally.

In production (Railway), the following env vars must be set per service:
- `QUARKUS_DATASOURCE_JDBC_URL`
- `QUARKUS_DATASOURCE_USERNAME`
- `QUARKUS_DATASOURCE_PASSWORD`
- `PORT`
- `SMALLRYE_JWT_SIGN_KEY` (identity-service only)
- `MP_JWT_VERIFY_PUBLICKEY` (all services)
