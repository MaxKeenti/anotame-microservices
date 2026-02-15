# Refactor UI

## Dashboard

- **!important** UI must be optimized for screens of a resolution of 1024 x 768px or less.
- **!important** UI must be touchscreen first, mouse second.
- Buttons must be big enough to be pressed with a finger.
- Order creation must be fast and easy.
- Order creation must be handled through a wizard.
- Order creation must be divided in 3 steps:
    1. Customer information.
    2. Garment and service selection.
    3. Payment and confirmation.
- Each step must have a clear and concise title.
- Each step must present only the necessary information to complete the step, e.g. in step 2, only the garment and service information must be presented at a time in multiple steps as subwizards. First the garment type, then the services for that garment type, then the price and any adjustments, then the notes, and finally the confirmation of the item.
- Our dashboard shouldn't display a sidebar, instead it should display a button that calls a modal that displays the same information as the sidebar. 
    - This modal should be accessible from the top bar of the dashboard. 
    - This modal should be called "Menu" and should display the same information as the sidebar. 
    - This modal should display the links in big icons with text below them.
- The dashboard/orders page should display the orders in a list view, with the most recent orders at the top. Each order should display the following information:
    - Ticket number.
    - Customer name.
    - Garment summary.
    - Deadline.
    - Total.
    - Amount paid.
    - Balance.
    - Status.
    - Actions (Details).
- The order details page should display the same information as the order when it was created, the rest elements of the page should be kept as is.

## Garment and Service filtering

- The garment and service filters currently rely on codes for filtering, this is not user friendly.
- Filtering should be done by database relationship, e.g. garment type should be filtered by garment type name, not by code.

## Draft orders

- Orders that couldn't be completed should be stored in a draft table.
- Draft orders should be accessible from the dashboard/orders page.
- Draft orders should be editable.
- Draft orders should be converted to regular orders when the user decides to complete them.
- Draft orders should be deleted when the user decides to cancel them.

## Pending, but important: UI should be responsive for mobile devices.

- The UI should be responsive for mobile devices.
