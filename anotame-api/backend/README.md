# Anotame API Microservices

This project consists of a set of microservices for the Anotame application, built with Spring Boot and following Hexagonal Architecture.

## Services

- **identity-service** (Port 8081): Handles authentication and user management.
- **catalog-service** (Port 8082): Manages products and services catalog.
- **sales-service** (Port 8083): Manages customer orders.
- **operations-service** (Port 8084): Manages order fulfillment and work orders.
- **Operations Service**: Handles `WorkOrder` tracking and processing.

## Running with Docker

The project supports Docker Compose for running the infrastructure and services.

### Prerequisites
- Docker
- Java 21 (for local dev)
- Maven

### Steps
1. Build the project:
   ```bash
   mvn clean package
   ```
2. Run with Docker Compose:
   ```bash
   docker-compose up --build
   ```

## Architecture
Each service follows the Hexagonal Architecture (Ports & Adapters) to ensure separation of concerns and testability.
