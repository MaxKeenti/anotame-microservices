# Anotame Microservices - Development Standards & Conventions

This document outlines the architectural, structural, and coding standards for the Anotame Microservices project. All future agents and developers must adhere to these guidelines to ensure consistency across the codebase.

## 1. Architecture Overview
- **Monorepo Structure**: Contains `anotame-api` (Backend), `anotame-web` (Frontend), and `anotame-db` (Database).
- **Backend**: Java Spring Boot 3 Microservices (Identity, Catalog, Sales, Operations).
- **Frontend**: Next.js 16 (App Router) + React 19.
- **Database**: PostgreSQL with PostGIS support.
- **Containerization**: All services are run via Docker using `docker-compose.yml`.

## 2. Backend Standards (Java Spring Boot)
The backend strictly adheres to **Hexagonal Architecture** and **Domain-Driven Design (DDD)** principles.

### Architecture Layers
- **Domain**: Core business logic, entities, and models. Do not leak framework-specific dependencies here.
- **Application**: Service layer containing business use cases, orchestrating domain logic, and defining ports (interfaces).
- **Infrastructure**: Adapters for Persistence (JPA), Web (REST Controllers), and external services (Security, Email, etc.).

### Database & Entity Guidelines
- **Bounded Contexts**: Data is segregated by domain (e.g., Identity owns employees, Sales owns customers). Avoid massive shared tables; duplicate references if cross-context data is strictly needed or communicate via events/HTTP.
- **Primary Keys**: Use **UUID v4** exclusively for entity IDs.
- **Soft Deletes**: Use `deleted_at` (LocalDateTime) and `is_deleted` (boolean). Apply `@SQLDelete` and `@SQLRestriction("is_deleted = false")` on JPA entities.
- **Audit Fields**: Every transactional table must include `created_at` (`@CreationTimestamp`) and `updated_at` (`@UpdateTimestamp`).
- **Naming Conventions**: Use `snake_case` for database tables and columns (e.g., `tca_user`, `password_hash`).

## 3. Frontend Standards (Next.js & React)
The frontend uses the **Next.js App Router** with modern styling and accessibility practices.

### Structure & Organization
- **Pages**: Located under `src/app/`.
- **UI Components**: The project **does not use a third-party component library** (like MUI, Chakra, or NextUI). Instead, it follows a "build-your-own" approach inspired by shadcn/ui. Reusable UI components (buttons, badges) should be built manually in `src/components/ui/` and leverage `clsx` and `tailwind-merge` utility functions (e.g., `cn()`) to keep dependencies strictly minimal.
- **Feature Components**: Domain-specific components belong in `src/components/<domain>/` (e.g., `customers/`, `orders/`).

### UI/UX Rules & Accessibility
- **Touch-First Design**: UI must be heavily optimized for touchscreen interactions (large touch targets, responsive layouts) and screens ≤ 1024x768px.
- **Wizards over Long Forms**: Complex actions like Order Creation must be split into logical wizard steps (e.g., 1. Customer, 2. Garment/Service, 3. Payment).
- **Navigation**: Use a modal "Menu" accessible from the top bar instead of a permanent sidebar.
- **Styling**: Use **Tailwind CSS v4**. Avoid arbitrary values when theme values exist.

## 4. Workflows & General Rules
- Always verify changes via local build/spin-up before committing.
- Respect the existing module boundaries.
- For new features, always consult `docs/implementation_plan.md` to align with the roadmap.
