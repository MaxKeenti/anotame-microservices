# Anotame Microservices

A microservices-based backend for the Anotame application, built with Spring Boot and Hexagonal Architecture.

## Architecture

The system consists of the following services:

*   **Identity Service**: Handles user registration and authentication (JWT).
*   **Catalog Service**: Manages garment types and services.
*   **Sales Service**: Handles order creation and management.
*   **Database**: PostgreSQL with PostGIS support (`anotame-db`).

All services follow the **Hexagonal Architecture** pattern:
*   `domain`: Core business logic and models.
*   `application`: Service layer and ports (interfaces).
*   `infrastructure`: Adapters for Persistence, Web (Controllers), and Security.

## Prerequisites

*   Docker Desktop
*   Java 21 (for local development/debugging)
*   Maven

## Running the System

The entire system is containerized. To start everything:

```bash
docker-compose up --build -d
```

This will start:
*   PostgreSQL (Port 5433)
*   pgAdmin (Port 5050)
*   Identity Service (Port 8081)
*   Catalog Service (Port 8082)
*   Sales Service (Port 8083)

## Testing

An automated integration test script is provided to verify the end-to-end flow:

```bash
./test_integration.sh
```

This script will:
1.  Register a new user in Identity Service.
2.  Login and retrieve a JWT.
3.  Fetch catalog data (Garments/Services) from Catalog Service.
4.  Create a new Order in Sales Service using the JWT and Catalog data.

## Project Structure

*   `anotame-api/backend`: Source code for microservices.
    *   `identity-service`
    *   `catalog-service`
    *   `sales-service`
*   `docker-compose.yml`: Orchestration configuration.
*   `test_integration.sh`: End-to-end verification script.

## Known Issues

*   **Data Loss on Navigation**: When creating a new customer from the Order Creation page, the application redirects to a new page, causing any unsaved order details to be lost.
