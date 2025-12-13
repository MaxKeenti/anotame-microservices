# Anotame Web Architecture (NextJS)

## Technology Stack
*   **Framework**: NextJS 15 (App Router)
*   **Language**: TypeScript
*   **Styling**: TailwindCSS 4
*   **State Management**: React Context / Zustand (if needed)

## Design System ("Premium")
*   **Fonts**:
    *   **Headings**: `Outfit` (Modern, elegant sans).
    *   **Body**: `Inter` (Clean, legible).
*   **Palette**:
    *   **Primary**: Indigo (`#4f46e5`) -> Actionable elements.
    *   **Background**: Slate 50 (`#f8fafc`) -> Clean, light base.
    *   **Surface**: White (`#ffffff`) -> Cards and elevate areas.

## Project Structure
*   `src/app`: App Router pages.
    *   `layout.tsx`: Root layout with Font configuration.
    *   `globals.css`: Tailwind theme and CSS variables.
    *   `(dashboard)`: Protected routes using `DashboardLayout`.
*   `src/components`:
    *   `layout/Sidebar.tsx`: Main navigation.
    *   `layout/DashboardLayout.tsx`: Wrapper for auth-protected pages.
    *   `ui/`: Atomic components (Buttons, Inputs).

## Key Features
1.  **Authentication (JWT)**:
    *   `AuthContext`: Connects to `identity-service` (Port 8081) for real login.
    *   `AuthProvider`: Manages Token storage (localStorage) and Router protection.
    *   `/login`: Functional Login Form.
2.  **Dashboard**:
    *   `/dashboard`: Overview with KPIs.
    *   `/dashboard/orders/new`: Full integration with `catalog-service` (Port 8082) for fetching items and `sales-service` (Port 8083) for submitting orders.
3.  **Layouts**: `DashboardLayout` provides persistent Sidebar and Header.
4.  **Responsiveness**: Mobile-first design using standard Tailwind breakpoints.
