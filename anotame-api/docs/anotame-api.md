# Anotame API Architecture (Spring Boot)

## Technology Stack
*   **Language**: Java 21+
*   **Framework**: Spring Boot 3.2.3
*   **Build Tool**: Maven (Multi-Module Project)
*   **Database**: PostgreSQL 16 + PostGIS

## Project Modules (`anotame-api/backend`)

### 1. Parent (`anotame-parent`)
*   Manages versioning and common dependencies (Lombok, Spring Cloud, JPA).

### 2. Identity Service (`identity-service`)
*   **Port**: 8081 (default)
*   **Responsibility**: Authentication, Authorization, User Management.
*   **Entities**: `tca_user` (Users), `cca_role` (Roles).
*   **Architecture**: Hexagonal (Ports & Adapters).

### 3. Catalog Service (`catalog-service`)
*   **Port**: 8082
*   **Responsibility**: Managing the "Menu" of services and garments.
*   **Entities**: `GarmentType` (code, name), `Service` (price, duration).
*   **Architecture**: Hexagonal (Ports & Adapters).
*   **Endpoints**:
    *   `GET /catalog/garments`: List active garment types.
    *   `GET /catalog/services`: List active services/repairs.

### 4. Sales Service (`sales-service`)
*   **Port**: 8083
*   **Responsibility**: Core transactional logic (Orders, Customers).
*   **Entities**: `tco_order` (The Ticket), `tco_customer` (The Client Profile), `tco_order_history` (Workflow).
*   **Architecture**: Hexagonal (Ports & Adapters).

### 5. Operations Service (`operations-service`)
*   **Port**: 8084
*   **Responsibility**: Managing physical stores and staff assignments.
*   **Entities**: `tce_establishment`, `tce_branch`, `tce_employee_assignment`.

*   **Architecture Patterns**:
    *   **Hexagonal Architecture**: Domain logic decoupled from Frameworks/DB via Ports & Adapters.
    *   **DTOs**: Dedicated DTOs for API requests/responses.
    *   **Seeders**: `CommandLineRunner` in `catalog-service` to init data.
    *   **Stateless**: No server-side sessions. All auth is via Bearer Tokens (JWT).

## Implementation Status
*   [x] **Identity Service**: Refactored to Hexagonal. Login/Register active.
*   [x] **Catalog Service**: Refactored to Hexagonal. Seeding active.
*   [x] **Sales Service**: Refactored to Hexagonal. Order Processing active.
*   [ ] **Operations Service**: Pending implementation.
