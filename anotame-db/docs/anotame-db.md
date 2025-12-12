# Anotame Database Architecture (PostgreSQL)

## Overview
The database is designed with **Microservices** and **Reliability** as core principles. It follows strict naming conventions and normalization.

## 1. Naming Standards
*   **Snake Case**: `user_id`, `created_at` (No `PascalCase`).
*   **Prefixes**:
    *   `tca_`: **Core Actors** (Identity Context)
    *   `tco_`: **Core Operations** (Sales Context)
    *   `tce_`: **Establishment** (Operations Context)
    *   `cci_` / `cca_`: **Catalogs** (Configuration)

## 2. Key Reliability Patterns
*   **UUIDs**: All tables use `UUID` primary keys (`gen_random_uuid()`). This allows ID generation in the application layer and easier database merging.
*   **Soft Deletes**: Transactional tables use `deleted_at` timestamp. Records are never physically removed, preserving audit trails.
*   **Finite State Machine**: The `tco_order_history` table tracks every status change (PENDING -> READY), enabling "Time-in-State" analytics.

## 3. Bounded Contexts (The Split)
We explicitly separated "Users" from "Customers".
*   **Identity (`tca`)**: Holds technical users (Employees) who log in.
*   **Sales (`tco`)**: Holds Customer Profiles. A customer does not need a login to have a ticket.
*   *Benefit*: The Sales service does not break if the Identity service changes its schema.
