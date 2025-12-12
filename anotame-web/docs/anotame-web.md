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
    *   `AuthContext`: Global state for User/Token.
    *   `AuthProvider`: Wraps RootLayout.
    *   `/login`: Custom login page with redirect logic.
2.  **Dashboard**:
    *   `/dashboard`: Overview with KPIs (Revenue, Orders).
    *   `/dashboard/orders/new`: Complex form for creating tickets.
3.  **Layouts**: `DashboardLayout` provides persistent Sidebar and Header.
4.  **Responsiveness**: Mobile-first design using standard Tailwind breakpoints.
