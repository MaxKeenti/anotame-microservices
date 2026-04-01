# Legacy Architecture Analysis & Migration Archive

*This document unifies the previous implementation plans and UI refactoring specifications for the Next.js frontend architecture, which has now been archived in favor of Svelte 5 + SvelteKit.*

## Legacy Implementation Roadmap

### Phase 1: Database Design & Core Setup [COMPLETED]
1.  **Schema Definition**: `anotame-db/init.sql` created with Bounded Contexts, UUIDs, and Soft Deletes.
2.  **Repo Structure**: Monorepo established.
3.  **Infrastructure**: `docker-compose.yml` running Postgres + PostGIS.

### Phase 2: Backend Microservices (Spring Boot) [COMPLETED]
*   **Structure**: Maven Multi-Module Project initialized.
*   **Modules**: `identity-service`, `catalog-service`, `sales-service`, `operations-service` scaffolds created.

### Phase 3: Backend Refactor (Hexagonal Architecture) [COMPLETED]
*   **Goal**: Decouple Domain Logic from Infrastructure (Spring/JPA) using Ports & Adapters.
*   **Changes**:
    *   Moved to **JDK 21**.
    *   Refactored `identity-service`, `catalog-service`, and `sales-service`.
    *   Implemented Repository Ports and Persistence Adapters.

### Phase 4: Frontend Implementation (NextJS) [COMPLETED]
*(Note: Work was completed but this entire layer is being migrated to Svelte 5)*
1.  **Design System**: Tailwind theme, Fonts (Inter/Outfit), and Global CSS.
2.  **Layouts**: Sidebar, DashboardLayout, and Landing Page.
3.  **Auth Integration**: Login & Register screens consuming Identity Service.
4.  **Dashboard**: Operations views (KPIs, Recent Orders) consuming microservices.
5.  **Customer Management**: Search, Create, Edit (`/dashboard/customers`).
6.  **Order Management**: New Order creation (`/dashboard/orders/new`) with Payment support and Ticket Printing.
7.  **Dockerization**: Added `Dockerfile` and `docker-compose` entry for `anotame-web`.

### Phase 5: Closing System Gaps (From Migration Analysis) [COMPLETED]
1.  **Work Scheduling**: Implement Days Off, Holidays, and Shifts (medium priority).
2.  **Advanced Pricing**: Implement Multiple Price Lists and Temporal Validity.
3.  **Refinement**: Polish Receipt printing layout and handle multiple repairs per item.

### Phase 6: System Polish & Production Readiness [COMPLETED]
*(Note: Features are moving to Svelte plan)*
1.  **Establishment Settings**: UI to configure Store Name, Tax Info (RFC), and Receipt Header.
2.  **Employee Management**: Admin UI to create users, assign roles, and manage access.
3.  **Production Verification**: Verify full Docker persistence and deployment readiness.

---

## Legacy UI Refactor Specifications (NextJS)

### Dashboard
- **!important** UI must be optimized for screens of a resolution of 1024 x 768px or less.
- **!important** UI must be touchscreen first, mouse second.
- Buttons must be big enough to be pressed with a finger.
- Order creation must be fast and easy, handled through a wizard divided in 3 steps:
    1. Customer information.
    2. Garment and service selection.
    3. Payment and confirmation.
- Each step must have a clear and concise title, presenting only necessary information.
- Our dashboard shouldn't display a sidebar, instead it should display a button that calls a modal "Menu" accessible from the top bar.
- The dashboard/orders page should display the orders in a list view, with the most recent at the top. Order details page displays snapshot info.

### Garment and Service filtering
- Filtering should be done by database relationship (name), not code.

### Draft orders
- Orders that couldn't be completed should be stored in a draft table, accessible from dashboard/orders, editable, and convertible to regular orders.

### Pending
- The UI should be responsive for mobile devices.
