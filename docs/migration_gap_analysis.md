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

## 3. Deprecated / Excluded Modules
The following modules existed in the legacy system but have been **intentionally excluded** from the migration roadmap.

*   **Appointment Management (Citas)**: The functionality for scheduling customer drop-offs/pickups (`tci05_cita`) is considered deprecated and will not be implemented in the modern architecture.
