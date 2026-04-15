# Phase 17: Print Server Integration — Context

**Gathered:** 2026-04-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Complete the print integration for Anotame so staff can print both a **customer ticket** (comprobante) and an **internal work order tag** (hoja de trabajo) for every order — at creation, from the order detail page, and via bulk print from the orders list.

### What already exists (do NOT rebuild)
- `anotame-web/src/lib/utils/receipt-generator.ts` — `generateReceiptHtml` function produces a 40mm-wide thermal receipt HTML for the **customer ticket**
- `handlePrint()` in `orders/[id]/+page.svelte` — opens the receipt in a new window and calls `window.print()` on it
- "Imprimir Ticket" button on the order detail actions bar
- Auto-print trigger via `?action=print` URL param on the order detail page (redirects from wizard after creation → triggers confirm dialog → calls `handlePrint()`)
- `FloatingActionBar.svelte` — bulk action bar with status change + delete (no print action yet)
- `bulkMode` + `selectedOrders` state on the orders list page

### What Phase 17 adds
1. **Work order tag document** — a separate HTML template for the internal garment workshop tag
2. **Print both documents** — update the order detail print flow to offer printing both the customer ticket and the work order tag (either combined or sequentially)
3. **Bulk print from orders list** — add a "Imprimir" action to `FloatingActionBar`; fetch full order details for each selected order and print sequentially

### Out of scope
- Silent/automatic CUPS submission without browser dialog (browser native dialog is fine)
- PDF archival/storage (no server-side PDF generation; browser handles rendering)
- Headless browser PDF export endpoint
- Email delivery of tickets
- QR code generation (deferred to a future phase)
- Printer management UI (no CUPS admin in-app)

</domain>

<decisions>
## Implementation Decisions

### Work Order Tag
- **D-01:** A new `generateWorkOrderHtml` function is added to `receipt-generator.ts` (or a sibling file `work-order-generator.ts`). Claude decides the file structure.
- **D-02:** Work order tag content: large ticket number (folio), customer name + phone, list of garments with their services and per-service notes, overall order notes, committed deadline (due date). No pricing information — this is internal.
- **D-03:** Work order tag width: 80mm (larger than customer ticket's 40mm) to be readable by workshop staff. Use A5 or auto page size for print.
- **D-04:** The work order tag should be clearly distinct from the customer ticket — different header, clearly labeled "HOJA DE TRABAJO" or "ORDEN DE TRABAJO", no pricing/totals.

### Print Flow on Order Detail Page
- **D-05:** The existing "Imprimir Ticket" button on the order detail page is updated to print **both** documents: first the customer ticket, then the work order tag. Two sequential `window.open()` calls with a small delay between them.
- **D-06:** Alternatively, a split button or two separate buttons ("Imprimir Ticket" + "Imprimir Hoja de Trabajo") — Claude decides based on the existing button layout and UX fit. The simpler, less cluttered approach wins.
- **D-07:** The auto-print flow triggered by `?action=print` (after order creation) prints **both** documents automatically (or with a single confirm dialog for both).

### Bulk Print from Orders List
- **D-08:** A new `onPrint` prop is added to `FloatingActionBar.svelte`. A "Imprimir" button appears in the bulk action bar alongside status change and delete.
- **D-09:** Bulk print fetches the full `OrderResponse` for each selected order (if needed — the list may not have all fields required for the work order tag). Check what `orders` state already contains; fetch individually only if fields are missing.
- **D-10:** Bulk print opens print windows sequentially with a delay (e.g., 400ms between each) to avoid browser popup blockers killing them. Print both documents (ticket + work order tag) per order.
- **D-11:** Bulk print is limited to a reasonable number of orders at once (e.g., max 10). If the user selects more, show a toast warning and proceed with the first 10.

### Claude's Discretion
- Exact file/function organization for the work order generator
- Single "Imprimir Todo" button vs. two separate buttons on the order detail page
- Whether to delay auto-print of work order tag or open both windows simultaneously
- 80mm vs. A5 page size for the work order tag based on what prints cleanly

</decisions>

<specifics>
## Specific Ideas

- Work order tag should have a prominent folio/ticket number at the top (large font, easy to scan when sorting garments in the workshop)
- Customer name on the work order tag is important — staff need to match garments to customers
- Workshop staff don't need pricing; leave out totals/amountPaid from the work order tag
- Pickup code should appear on the customer ticket (already implemented) — not needed on work order tag
- For bulk print, a toast showing "Imprimiendo 3 pedidos..." while windows open sequentially is good UX

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing print infrastructure
- `anotame-web/src/lib/utils/receipt-generator.ts` — `generateReceiptHtml(data)` function; shape of data arg; 40mm layout with @media print
- `anotame-web/src/routes/(app)/dashboard/orders/[id]/+page.svelte` — Full `handlePrint()` implementation at line 98; "Imprimir Ticket" button at line 382; auto-print `$effect` at line 58
- `anotame-web/src/lib/components/ui/FloatingActionBar.svelte` — Current Props interface (count, isAdmin, allDraft, onChangeStatus, onDelete, onCancel); button layout

### Orders list bulk state
- `anotame-web/src/routes/(app)/dashboard/orders/+page.svelte` — `bulkMode`, `selectedOrders`, `handleBulkStatusChange`, `handleBulkDelete`, `handleBulkCancel`; `FloatingActionBar` usage at line 291

### Data shape
- `anotame-api/backend/sales-service/src/main/java/com/anotame/sales/application/dto/OrderResponse.java` — Fields: id, ticketNumber, customer (firstName, lastName, phoneNumber, email), committedDeadline, status, totalAmount, amountPaid, paymentMethod, notes, items (List<OrderItemResponse>), createdAt, totalDurationMin, pickupCode, deliveredAt, priceListId, priceListName
- Check `OrderItemResponse` for garment and service field names used by the existing `handlePrint()` in the detail page

### Frontend conventions
- `.planning/codebase/CONVENTIONS.md` — General patterns, no backend changes in this phase
- `.planning/codebase/STRUCTURE.md` — Frontend structure, lib/utils placement

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Patterns
- `generateReceiptHtml` pattern: pure function, data-in → HTML-string-out, no side effects — work order generator must follow the same pattern
- `window.open('', '_blank', 'width=...,height=...')` + `document.write` + `setTimeout(() => { focus(); print(); close(); }, 250)` — existing working print pattern, reuse exactly
- `FloatingActionBar` Props type is a simple object; extend by adding `onPrint?: (orders: any[]) => void`

### Integration Points
- `handlePrint()` on detail page calls `generateReceiptHtml` + opens window — extend to also call `generateWorkOrderHtml` + opens a second window
- Bulk print in `+page.svelte` (orders list) needs access to the same print utilities — import from `receipt-generator.ts`
- The `selectedOrders` array on the orders list already contains the full order objects fetched from `GET /orders` — check if it includes `items` array with garment/service detail; if yes, no extra API call needed for bulk print

</code_context>

<deferred>
## Deferred Ideas

- **QR code on work order tag** — useful but requires a QR library; deferred to avoid adding a new dependency
- **PDF download** — save ticket as PDF file; useful for records; deferred (browser "Save as PDF" via print dialog suffices for now)
- **Email ticket to customer** — separate feature with backend email integration; out of scope
- **Silent CUPS submission** — would require QZ Tray or a local relay agent; not worth the infrastructure overhead given browser dialog is acceptable
- **Printer configuration in app** — no in-app CUPS management; operators configure their printer in the OS

</deferred>

---

*Phase: 17-print-server-integration*
*Context gathered: 2026-04-13*
