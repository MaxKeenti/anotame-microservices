# Anotame API Architecture (Spring Boot)

## Technology Stack
*   **Language**: Java 17+
*   **Framework**: Spring Boot 3
*   **Data Access**: Spring Data JPA
*   **Security**: Spring Security + JWT
*   **Build Tool**: Maven

## Microservices Breakdown

### 1. Identity Service (`identity-service`)
*   **Responsibility**: Authentication, Authorization, User Management.
*   **Entities**: `tca_user` (Users), `cca_role` (Roles).
*   **Endpoints**: `/auth/login`, `/auth/refresh`, `/users`.

### 2. Catalog Service (`catalog-service`)
*   **Responsibility**: Managing the "Menu" of services and garments. Read-heavy.
*   **Entities**: `cci_service` (Repairs), `cci_garment_type` (Pants, Shirts).
*   **Endpoints**: `/catalog/services`, `/catalog/garments`.

### 3. Sales Service (`sales-service`)
*   **Responsibility**: Core transactional logic. Managing Customers (CRM) and Orders.
*   **Entities**: `tco_order` (The Ticket), `tco_customer` (The Client Profile), `tco_order_history` (Workflow).
*   **Endpoints**: `/orders` (Create/Track), `/customers` (CRM).

### 4. Operations Service (`operations-service`)
*   **Responsibility**: Managing physical stores and staff assignments.
*   **Entities**: `tce_establishment`, `tce_branch`, `tce_employee_assignment`.
*   **Endpoints**: `/branches`, `/staff`.

## Architecture patterns
*   **Controller-Service-Repository**: Standard Spring layering.
*   **DTOs**: Never expose Entities directly. Use Request/Response DTOs.
*   **Stateless**: No server-side sessions. All auth is via Bearer Tokens (JWT).
