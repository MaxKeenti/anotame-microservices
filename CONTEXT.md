# Anotame Domain Language

This glossary defines the shared business language for Anotame. It avoids implementation details and preserves the terms staff, developers, and agents should use consistently.

## Language

### People and Places

**Establishment**:
The business using Anotame. One **Establishment** can have one or more **Branches**.
_Avoid_: Tenant, store when referring to the whole business

**Branch**:
A physical location where staff receive orders and fulfill work.
_Avoid_: Establishment, store when the location is only one branch

**Staff Member**:
A person who uses Anotame to run the shop.
_Avoid_: User when referring to the person instead of the login account, operator

**User**:
The login account for a staff member, including credentials and profile preferences.
_Avoid_: Staff Member when discussing authentication or persisted account data

**Role**:
The permission level assigned to a **User**, currently `ADMIN` or `EMPLOYEE`.
_Avoid_: Staff Member, job title

**Customer**:
A person who brings garments to the shop and receives finished work. A **Customer** can have many **Orders**.
_Avoid_: Client, account, buyer

### Catalog and Pricing

**Garment Type**:
A category of item the shop works on, such as pants, shirt, or dress.
_Avoid_: Product, article type

**Service**:
A repair, alteration, or garment-care action that can be sold for a **Garment Type**.
_Avoid_: Product, task, repair when the catalog item is broader than repair

**Price List**:
A named set of prices used to price services for an order. A **Price List** can override service prices.
_Avoid_: Rate card, tariff

### Orders and Fulfillment

**Order**:
A customer request received by the shop. An **Order** contains one or more **Order Items** and can receive one or more **Payments**.
_Avoid_: Nota, ticket, transaction

**Ticket**:
The customer-facing proof or identifier produced from an **Order**. A **Ticket** is not the full order record.
_Avoid_: Order

**Order Item**:
One garment inside an **Order**, together with the selected services and pricing for that garment.
_Avoid_: Line item when the garment context matters

**Work Order**:
The operational view of work that must be completed after an **Order** is received.
_Avoid_: Order, task

**Payment**:
Money recorded against an **Order**. An order can be partially paid through multiple payments.
_Avoid_: Sale, transaction

### Operations and KPIs

**Capacity**:
The amount of work a branch can reasonably complete in a day, usually expressed as work minutes.
_Avoid_: Availability when referring to workload limits

**At-Risk Customer**:
A **Customer** whose last order is older than the configured inactivity threshold.
_Avoid_: Churned customer unless the customer is confirmed lost

**Repeat Customer**:
A **Customer** with two or more orders in the measured period.
_Avoid_: Loyal customer unless loyalty is explicitly measured

**Revenue per Minute**:
Revenue divided by estimated work duration. It is a profitability signal, not a complete margin calculation.
_Avoid_: Profit, margin

## Flagged Ambiguities

**Order vs Ticket**:
Use **Order** for the business record and lifecycle. Use **Ticket** only for the customer-facing proof or identifier.

**Customer vs Staff Member**:
Use **Customer** for the person receiving service. Use **Staff Member** for the person operating Anotame.

**Staff Member vs User**:
Use **Staff Member** for the human role in the shop. Use **User** for login accounts, credentials, and permissions.

**Establishment vs Branch**:
Use **Establishment** for the business entity. Use **Branch** for a physical location.

## Example Dialogue

Dev: "When a customer brings two garments, do we create two orders?"

Domain expert: "No. Create one order with two order items. Each order item has its garment type and selected services."

Dev: "And the ticket number belongs to the order?"

Domain expert: "Yes. The ticket is what the customer sees, but the order is the record staff edit and track."

Dev: "If the customer pays half now and half at pickup, is that two orders?"

Domain expert: "No. It is one order with two payments."
