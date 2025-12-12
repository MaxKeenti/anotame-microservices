# Architecture Analysis & Migration Plan: Anotame.NET

## 1. Project Goal: Full Re-platforming

The goal is to migrate the legacy ASP.NET MVC monolith to a modern Microservices-based architecture using **NextJS** and **Java Spring Boot**, while completely refactoring the database to **PostgreSQL** following strict normalization standards.

### Current Architecture (Legacy)
*   **Stack**: ASP.NET MVC 5, .NET Framework 4.7.2.
*   **Database**: MSSQL (LocalDB) with `PascalCase` tables and stored procedures.
*   **Issues**: Tight coupling, unsafe queries (`ToList().Count()`), stateful session auth.

## 2. Target Architecture

### Technology Stack
*   **Frontend**: **NextJS** (React).
    *   Server Side Rendering (SSR) for performance.
    *   TailwindCSS for styling (modern standard).
*   **Backend**: **Java Spring Boot 3**.
    *   **Microservices** approach.
    *   **Spring Data JPA** for database access.
    *   **Spring Security** + JWT for stateless authentication.
*   **Database**: **PostgreSQL**.
    *   Full schema redesign using the provided "Best Practices" template (snake_case, strict normalization).

### Database Strategy: Bounded Contexts & Reliability
We will strictly follow **Domain-Driven Design (DDD)** principles to ensure services can be decoupled.

**1. Reliability Patterns**
*   **IDs**: Use **UUID v4** for all Primary Keys to allow collision-free generation and easier merging.
*   **Soft Deletes**: Use `deleted_at` (Timestamp) instead of boolean flags to preserve historical data context.
*   **Audit**: All transactional tables include `created_at`, `updated_at`, and `created_by` (where applicable).

**2. Domain Separation (The "Person" Split)**
Following the "Bounded Context" advice, we will **NOT** have a single shared "Person" table.
*   **Identity Context**: Owns `tca_user` and `tca_employee_profile`. Concerns: Auth, Internal Roles, HR.
*   **Sales Context**: Owns `tco_customer`. Concerns: Measurements, Preferences, Order History.
*   *Rational*: An employee is managed by HR; a customer is managed by Sales. Their lifecycles are different.

**3. State Management**
*   **Order Workflow**: We will implement a **Finite State Machine (FSM)** tracked via a `tco_order_history` table. This allows us to measure KPIs (e.g., "Time from Received to Finished").

---

## 3. Implementation Roadmap

### Phase 1: Database Design & Core Setup
1.  **Schema Definition**: Create `anotame-db/init.sql` implementing the Bounded Context schema with `UUID` and `deleted_at`.
2.  **Repo Setup**: Initialize the multi-module structure.

### Phase 2: Backend Microservices (Spring Boot)
| Service | Responsibility | key Domains |
| :--- | :--- | :--- |
| **Identity Service** | Auth, Internal Users (Employees/Admins). | `tca_user`, `tca_role` |
| **Catalog Service** | Services (Arreglos), Garment Types, Prices. | `cci_service`, `cci_garment` |
| **Operations Service** | Branches, Employees, Schedules. | `tce_branch`, `tce_establishment` |
| **Sales Service** | Customers, Orders, Garments, Order History. | `tco_order`, `tco_customer` |

### Phase 3: Frontend Implementation (NextJS)
1.  **Design System**: Setup Tailwind and basic Layouts.
2.  **Auth Integration**: Login screens consuming Identity Service.
3.  **Dashboard**: Operations views consuming the microservices.
