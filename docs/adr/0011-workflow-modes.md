# Workflow Modes: Simple and Full

An order moves through `RECEIVED → IN_PROGRESS → READY → DELIVERED`, with `CANCELLED` as the way
out. Moving it takes three steps on two pages: "send to operations" on the order, then "mark ready"
and "deliver" on the Operations page. A shop where the same person takes the order, does the work
and hands it over gets nothing from the two middle steps; it only needs to know what is in the
shop and what has left.

The decision is to keep one status model and let the establishment choose how much of it the app
shows. `workflow_mode` on `tce_establishment` (operations-service) is `FULL` or `SIMPLE`, set in
Ajustes › Negocio and defaulting to `FULL`.

| | Full | Simple |
|---|---|---|
| Statuses in use | received, in progress, ready, delivered, cancelled | received, delivered, cancelled |
| Where orders move | order page, then Operations | Orders list and order page |
| Operations page | shown | hidden; its URL redirects to Orders |
| Orders list | every order, unfiltered | one status at a time: received / delivered / cancelled |
| Bulk status change | available | hidden |

How it is built:

- **The mode is a view, not a data model.** Orders carry the same statuses in both modes and
  switching never rewrites them. An order left on `IN_PROGRESS` or `READY` when a shop goes simple
  is listed and labelled as received (`workflowStatus` in `$lib/utils/status-labels`) and can be
  delivered or cancelled like any other; going back to full shows it on its real step again.
- **sales-service does not know the mode.** Delivery is accepted from any open status
  (`RECEIVED`, `IN_PROGRESS`, `READY`) and still requires the pickup code. Asking operations-service
  for the mode on every delivery would couple two services for a rule the full workflow's own
  screens already follow. The cost: in full mode, "ready before delivered" is enforced by the UI
  and not by the API.
- **The web app reads the mode once per load.** `(app)/+layout.server.ts` returns it with the
  theme; `workflowStore` keeps it (persisted, so a load during an outage keeps the last known
  mode). `isSectionVisible` in `config/apps.ts` hides Operations, which covers the dock, Launchpad,
  menu bar, command palette and windows. Saving the business settings invalidates
  `establishment:settings`, so the shell follows the new mode without a reload; other devices pick
  it up on their next load.
- **Saving settings must not reset the mode.** `PUT /establishment` replaces every column, so
  `EstablishmentService` keeps the stored mode when the request omits it.

Decided alongside, for both modes:

- **Cancelling keeps the order.** `PATCH /orders/{id}/cancel` sets `CANCELLED` and writes an audit
  entry; the order stays in lists, reports and its shared ticket. Deleting (`DELETE /orders/{id}`,
  the bulk action) remains for orders created by mistake.
- **A cancelled order can be refunded, and nothing else.** Its payments stay on the ledger and
  count as money received until a refund is recorded, so the order page asks for one when a
  cancelled order has money paid. No refund may exceed what was paid.
- **The pickup code is still required** to deliver in simple mode. It is the only check that the
  garments go to the right person.

**Consequences:** A shop can start simple and turn the full workflow on later, or the reverse,
with no migration. The help manual, the KPI "Operación" tab and the public ticket read the mode,
so none of them mentions a step the shop does not use. Anything new that depends on the middle
statuses (a report, a notification on "ready") has to say what it does in simple mode, where
orders never reach them.
