# Legacy System Analysis: Anotame.NET

## Overview
The legacy application is a monolithic **ASP.NET MVC 5** application targeting **.NET Framework 4.7.2**. It uses **Entity Framework 6** with a Database-First approach (`.edmx`).

## Key Components

### Data Access Layer (DAL)
*   **Technology**: Entity Framework 6.
*   **Pattern**: Database First (EDMX).
*   **Issues**:
    *   **Stored Procedure Dependency**: Critical logic like "Search" (`BusquedaAr`, `BusquedaClient`) and "Pricing" (`PrecioNotaPrenda`) is implemented in T-SQL Stored Procedures, making the app strictly coupled to MSSQL.
    *   **Inefficient Queries**: Custom helpers like `QueryNota` perform operations in memory (e.g., loading all records to count them via `.ToList().Count()`), which poses a severe scalability risk.

### Authentication
*   **Mechanism**: Custom Session-based authentication.
*   **Implementation**: `LoginController` validates credentials against the `Empleados` table and sets `Session["UserID"]`.
*   **Risk**: Stateful authentication is not suitable for modern, distributed microservices (which require stateless Auth like JWT).

### Domain Model
*   **Entities**: `Nota` (Order), `Prenda` (Item), `Arreglo` (Service), `Clientes` (Customer).
*   **Coupling**: All entities are tightly coupled in a single schema. The `NotaPrenda` table (Order Items) has a flawed lifecycle where items are sometimes created with `null` Order IDs and "collected" later by the helper `QueryNotaP.Update`.
