# Feature: Customer Management

## Overview
This feature introduces the ability to manage customer profiles (`tco_customer`), enabling efficient order creation by retrieving existing customer data.

## Phased Implementation

### Phase 1: Core Functionality & Order Integration
**Goal**: Enable the "New Order" flow to use saved customers.

#### Backend (`sales-service`)
- **Domain**: `Customer` model, `CustomerService` port.
- **Repository**: `CustomerJpaRepository` (Find by ID, Name Search).
- **API**:
    - `POST /customers`: Create a new customer.
    - `GET /customers/search?q=...`: Search by name or phone.
    - `GET /customers/{id}`: Retrieve details.

#### Frontend (`anotame-web`)
- **New Order Page**:
    - Add "Search Customer" autocomplete field.
    - If found, auto-fill `clientName`, `clientLastName`, `phoneNumber`.
    - If not found, allow "Quick Create" (optional) or just manual entry (as is, maybe saving implicitly).

### Phase 2: Full CRUD Management
**Goal**: Dedicated management section for customers.

#### Frontend
- **Navbar**: Add "Customers" link.
- **Customer List**: Page `GET /customers` with pagination.
- **Edit/Delete**: Interfaces to update profiles.

## Data Schema (`tco_customer`)
Already exists in `init.sql`:
- `first_name`, `last_name`
- `phone_number`
- `email`
- `preferences` (JSONB)
