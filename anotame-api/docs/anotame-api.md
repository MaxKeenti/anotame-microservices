# Anotame API Architecture (Spring Boot)

## Technology Stack
*   **Language**: Java 17+
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

### 3. Catalog Service (`catalog-service`)
*   **Port**: 8082
*   **Responsibility**: Managing the "Menu" of services and garments.
*   **Entities**: `GarmentType` (code, name), `Service` (price, duration).
*   **Endpoints**:
    *   `GET /catalog/garments`: List active garment types.
    *   `GET /catalog/services`: List active services/repairs.

### 4. Sales Service (`sales-service`)
*   **Port**: 8083
*   **Responsibility**: Core transactional logic (Orders, Customers).
*   **Entities**: `tco_order` (The Ticket), `tco_customer` (The Client Profile), `tco_order_history` (Workflow).

### 5. Operations Service (`operations-service`)
*   **Port**: 8084
*   **Responsibility**: Managing physical stores and staff assignments.
*   **Entities**: `tce_establishment`, `tce_branch`, `tce_employee_assignment`.

*   **Architecture Patterns**:
    *   **Controller-Service-Repository**: Standard Spring layering.
    *   **DTOs**: Dedicated DTOs for API requests/responses.
    *   **Seeders**: `CommandLineRunner` in `catalog-service` to init data.
    *   **Stateless**: No server-side sessions. All auth is via Bearer Tokens (JWT).

## Implementation Status (Phase 2 Complete)
*   [x] **Identity Service**: Full JWT Implementation (Register/Login). Port 8081.
*   [x] **Catalog Service**: Entities Management + Data Seeder. Port 8082.
*   [x] **Sales Service**: Order Creation + Customer Resolution. Port 8083.
*   [ ] **Operations Service**: Pending implementation.
