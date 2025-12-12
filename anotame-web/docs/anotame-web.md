# Anotame Web Architecture (NextJS)

## Technology Stack
*   **Framework**: NextJS 14 (App Router)
*   **Language**: TypeScript
*   **Styling**: TailwindCSS
*   **State Management**: React Context / Zustand (if needed)
*   **Fetching**: Server Actions / SWR / TanStack Query

## Project Structure
*   `/app`: App Router pages and layouts.
*   `/components`: Reusable UI components (Buttons, Inputs, Cards).
*   `/lib`: Utilities, shared constants, and API clients.
*   `/types`: TypeScript interfaces mirroring the API DTOs.

## Key Features
1.  **Server Side Rendering (SSR)**: Critical for Dashboard performance and SEO (if public).
2.  **Role-Based Access**: Middleware to protect routes based on JWT Roles (Admin vs Employee).
3.  **Modern UI**: utilizing Tailwind for a responsive, "clean" aesthetic as requested.
