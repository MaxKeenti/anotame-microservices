# Migration Gap Analysis & Future Roadmap

**Status**: To Do (Future Dev Cycle)
**Source**: Gap Analysis of `anotame-legacy` vs Modern Microservices

## Overview
This document outlines the functional modules present in the legacy system that have not yet been ported to the modern architecture. These modules are prioritized for future development cycles to achieve feature parity where relevant.

## 1. Advanced Pricing Strategy (Priority: High)
The legacy system supported dynamic "Price Lists" (`Lista de Precios`), allowing tailored pricing (e.g., Seasonal, VIP). The current system only supports a static `base_price`.

### Missing Functionality
-   **Multiple Price Lists**: Ability to define named lists (e.g., "Winter 2025", "VIP").
-   **Temporal Validity**: Start and End dates for price lists.
-   **Service-Specific Overrides**: assigning a specific price for a service within a list.

### Legacy Tables Reference
-   `tci03_lista_precio`
-   `tci02_servicio_lista_precio`
-   `tci01_estado_lista_precio`

---

## 2. Work Scheduling & Establishment Rules (Priority: Medium)
The legacy system modeled establishment constraints like working days, holidays, and detailed employee shifts. The current system only tracks assignment periods.

### Missing Functionality
-   **Work Days definition**: Defining which days (Mon-Sun) are operational.
-   **Holidays (Non-working days)**: Specific dates where the branch is closed.
-   **Shifts**: Granular start/end times (e.g., 9:00 AM - 5:00 PM) assigned to employees.

### Legacy Tables Reference
-   `tce04_dia_laboral`
-   `tce05_dia_descanso`
-   `tce06_empleado_horario`
-   `tce08_horario`

---

## 3. Operations & Cashier (Priority: High)
The legacy system (and specifically the React legacy app) contains the blueprint for the physical receipt and payment logic.

### Missing Functionality
-   **Ticket/Receipt Printing**: Need to implement the plain-text receipt format found in `anotame-legacy-react/.../NotaTable.jsx`.
    -   *Format*: Columns for Qty, Item, Repairs, Price. Sections for Customer, Dates, and Totals.
-   **Payments**: The React app tracks `amountLeft` and `paidInFull`. This logic needs to be ported to `tco_order` in the Sales service.
-   **Establishment Configuration**: UI to update Branch/Establishment details for the receipt header.

---

## 4. Deprecated / Excluded Modules
The following modules existed in the legacy system but have been **intentionally excluded** from the migration roadmap.

*   **Appointment Management (Citas)**: The functionality for scheduling customer drop-offs/pickups (`tci05_cita`) is considered deprecated and will not be implemented in the modern architecture.

---

## 5. Data Constraints & Requirements (From React Legacy)
Analysis of `ClientDataForm.jsx` and `GarmentDataForm.jsx` reveals the following constraints that must be enforced for receipt generation.

### Client Data (`ClientDataForm.jsx`)
| Field | Type | Required | Notes |
| :--- | :--- | :--- | :--- |
| `clientName` | String | **Yes** | "Nombre" |
| `clientFirstLastName`| String | No* | "Apellido Paterno" (Validation implies required but prop is optional) |
| `clientSecondLastName`| String | No* | "Apellido Materno" |
| `telefonNumber` | Number | No | "Número de teléfono" |
| `folio` | String | **Yes** | Unique identifier for the order |
| `receivedDate` | Date | **Yes** | Defaults to Today (YYYY-MM-DD) |
| `deliveryDate` | DateTime | **Yes** | Defaults to Today + 18:00 |

### Garment Data (`GarmentDataForm.jsx`)
| Field | Type | Required | Notes |
| :--- | :--- | :--- | :--- |
| `garmentQuantity` | Number | **Yes** | |
| `garmentType` | String | **Yes** | e.g. "Pants", "Shirt" |
| `garmentRepair` | Array | No | List of repair names (e.g. "Hemming") |
| `garmentDescription`| String | No | Additional details |
| `garmentRepairCost` | Decimal| **Yes** | Cost per unit |
| `garmentRepairAmount`| Decimal| **Yes** | Calculated: `Quantity * Cost` |

**Business Logic**:
-   `garmentRepairAmount` is auto-calculated when quantity or cost changes.
-   `garmentCosts` (Total) is the sum of all item amounts.

---

## 6. Modern App Gap Verification
Comparison with `sales-service` and `anotame-web` reveals the following concrete implementation gaps to be addressed in the next cycle.

### Backend (`sales-service`)
-   **Payment Tracking**: `Order` entity has `totalAmount` but lacks `amountPaid`, `balance`, or `paymentStatus`.
    -   *Action*: Add `amount_paid` (Decimal) and `payment_method` (Enum/String) to `tco_order`.
-   **Ticket Number**: `ticketNumber` exists but generation strategy needs to match legacy "Folio" if manual override is required (Legacy allowed manual, Modern is auto).
-   **Client Fields**: Modern `Customer` uses single `lastName`. Legacy splits `First` and `Second` last name. (Low criticality, can map both to `lastName`).

### Frontend (`NewOrderPage`)
-   **Payment Inputs**: No UI to capture "Advance Payment" or "Paid in Full".
-   **Receipt Generation**: No "Print" button or logic to format the `plain-text` receipt.
-   **Item Structure**: Modern forces 1 Service per Item. Legacy allowed multiple repairs per Garment. **[DEFERRED]** This will be addressed after core payment and printing features are stable.

## 7. Deferred / Future Enhancements
-   **Multiple Repairs per Item**: Allowing a single garment to have multiple service types attached (e.g. "Pants" -> "Hem" + "Patch"). Currently leveraging 1:1 mapping.
