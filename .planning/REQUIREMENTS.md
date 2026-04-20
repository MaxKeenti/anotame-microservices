# Requirements: Anotame

**Defined:** 2026-04-19
**Core Value:** A El hilvan staff member can take a complete order — from walk-in to ticket — without confusion, on any device, in under two minutes.

## v1.5 Requirements

Requirements for milestone v1.5 — Bilingual Launch + KPI Intelligence. Each maps to roadmap phases.

### Internationalization

- [ ] **I18N-01**: User can see their saved locale preference ("Español (México)" / "English") on their profile page and change it via a select dropdown
- [ ] **I18N-02**: Locale change takes effect immediately without a full page reload (soft swap — no lost form state)
- [ ] **I18N-03**: All hardcoded Spanish strings in SvelteKit UI are extracted to Paraglide message files using the `domain.component.purpose` naming convention
- [ ] **I18N-04**: An AI-generated English translation file ships alongside the Spanish source; both languages are live end-to-end
- [ ] **I18N-05**: Backend error responses return machine-readable error codes; the frontend resolves them to localized user-facing text via Paraglide
- [ ] **I18N-06**: SSR renders in the user's saved locale (no text flash on page load); anonymous users fall back to es-MX
- [ ] **I18N-07**: A lint rule enforces the 3-segment camelCase i18n key naming convention (`/^[a-z][a-zA-Z]*(\.[a-z][a-zA-Z]*){1,2}$/`)

### Payments

- [ ] **PAY-01**: User can add a payment to an existing order via a modal on the order detail page (amount + method + optional note)
- [ ] **PAY-02**: Payment entries are immutable — each entry is append-only with timestamp and recording user ID
- [ ] **PAY-03**: User can view a reverse-chronological payment history panel on the order detail page
- [ ] **PAY-04**: Order balance (amount owed) is computed from the payment ledger and displayed prominently on the order detail
- [ ] **PAY-05**: Over-payment is blocked — server validates that amount + paid ≤ totalAmount
- [ ] **PAY-06**: User can record a refund as a negative payment entry (requires a note)
- [ ] **PAY-07**: The `amountPaid` field is removed from the order edit wizard — only the payment modal can change it

### KPI Intelligence

- [ ] **KPI-01**: Admin user can view a revenue trend line chart on the dashboard (toggleable day/week/month, 12 buckets, anchored to payment date)
- [ ] **KPI-02**: Revenue trend shows a delta badge comparing current period vs. previous period (▲ / ▼ percentage)
- [ ] **KPI-03**: Admin user can view a service-type profitability table (service name, order count, gross revenue, total minutes, revenue-per-minute) — sortable, with period toggle (30/90 days)
- [ ] **KPI-04**: Admin user can view a "Top 5 Customers" widget (name, orders, lifetime revenue) on the dashboard
- [ ] **KPI-05**: Admin user can view an "At-Risk Customers" widget (customers with no order in 60+ days, ordered by lifetime revenue)
- [ ] **KPI-06**: Admin user can view a repeat rate metric (percentage of customers with 2+ orders in the last 90 days)

### Workload Calendar

- [ ] **CAL-01**: Admin user can view a full month-view calendar page with color-coded day cells representing workload capacity (<50% green, 50-85% amber, >85% red)
- [ ] **CAL-02**: Clicking a day on the calendar opens a popover showing that day's earnings, capacity bar, and order list
- [ ] **CAL-03**: Past days display actual (completed) data with desaturated styling; future days display scheduled/forecast data with saturated styling
- [ ] **CAL-04**: A compact 7-day horizontal strip widget on the main dashboard shows today + next 6 days with the same color logic as the full calendar
- [ ] **CAL-05**: On screens narrower than 640px, the calendar falls back to an agenda/list view instead of the month grid
- [ ] **CAL-06**: Days with no schedule (holidays/weekends) display as "closed" (gray) — not as overloaded

## Future Requirements

Deferred to future release. Tracked but not in current roadmap.

### Configuration

- **CFG-01**: Owner can configure workload calendar capacity thresholds (what % constitutes green/amber/red) per establishment
- **CFG-02**: Owner can configure the payment method list (beyond hardcoded Efectivo/Tarjeta/Transferencia)

### Financial

- **FIN-01**: System supports customer credit / over-payment handling with credit balance tracking
- **FIN-02**: Admin can set budget/revenue targets and track goal attainment on the dashboard

### Intelligence

- **INT-01**: System sends automated weekly KPI email digest to the owner
- **INT-02**: Dashboard supports a week-detail view (list of days with order counts) as a calendar alternative

### i18n Extensions

- **I18X-01**: In-app translation error reporting — user can flag bad EN translations
- **I18X-02**: Professional translation review pass when EN user share exceeds 20%
- **I18X-03**: Additional Spanish dialect variants (es-ES, es-AR) if expanding beyond MX
- **I18X-04**: Locale-aware `Intl.*` number/date/currency formatting (requires strings-only i18n to be revisited)

### Testing

- **TST-01**: Automated test suite — @QuarkusTest for SalesService and AuthService; Vitest + @testing-library/svelte for frontend (deferred from v1.0)
- **TST-02**: Server-side auth validation in SvelteKit hooks.server.ts before SSR render (deferred from v1.0)
- **TST-03**: +error.svelte pages at (app) layout level with retry/graceful degradation (deferred from v1.0)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| URL-based locale routing (`/en/…`, `/es/…`) | B2B app with no SEO benefit; breaks shared links; per-user profile locale chosen instead |
| Professional translation review | AI translations ship unreviewed — EN audience is tiny (tourists/expats); review when EN share exceeds 20% |
| `Intl.*` number/date/currency formatting | Strings-only i18n — dates/numbers/currency stay es-MX regardless of UI language |
| Additional Spanish dialects (es-ES, es-AR) | Only expanding to MX at this time |
| Browser `Accept-Language` override for logged-in users | Saved user locale wins; browser detect only for anonymous/login page |
| Real-time WebSocket dashboard | Nobody at a garment shop stares at live dashboards; reload-on-visit is sufficient |
| Month-view calendar with hourly event blocks | Month grid uses color-coded cells + popovers, not time-slot events; shop plans by day, not hour |
| Drag-and-drop customizable dashboard | One tenant, one dashboard — fixed layout is sufficient |
| KPI gross margin / cost-of-goods tracking | El hilvan doesn't track input costs; revenue-per-minute is the profitability proxy |
| Customer credit / over-payment handling | No credit system — over-payment is blocked; add if owner requests "advance payment for future orders" |
| Inline-editable payment rows | Destroys audit trail; ledger entries are append-only; corrections via adjustment rows |
| Quarkus `@MessageBundle` for backend i18n | Error codes approach keeps translation catalog in one place (frontend Paraglide) |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| I18N-01 | Phase 22 | Pending |
| I18N-02 | Phase 23 | Pending |
| I18N-03 | Phase 23 | Pending |
| I18N-04 | Phase 23 | Pending |
| I18N-05 | Phase 23 | Pending |
| I18N-06 | Phase 22 | Pending |
| I18N-07 | Phase 22 | Pending |
| PAY-01 | Phase 24 | Pending |
| PAY-02 | Phase 24 | Pending |
| PAY-03 | Phase 24 | Pending |
| PAY-04 | Phase 24 | Pending |
| PAY-05 | Phase 24 | Pending |
| PAY-06 | Phase 24 | Pending |
| PAY-07 | Phase 24 | Pending |
| KPI-01 | Phase 25 | Pending |
| KPI-02 | Phase 25 | Pending |
| KPI-03 | Phase 25 | Pending |
| KPI-04 | Phase 25 | Pending |
| KPI-05 | Phase 25 | Pending |
| KPI-06 | Phase 25 | Pending |
| CAL-01 | Phase 26 | Pending |
| CAL-02 | Phase 26 | Pending |
| CAL-03 | Phase 26 | Pending |
| CAL-04 | Phase 26 | Pending |
| CAL-05 | Phase 26 | Pending |
| CAL-06 | Phase 26 | Pending |

**Coverage:**
- v1.5 requirements: 26 total
- Mapped to phases: 26
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-19*
*Last updated: 2026-04-19 after milestone v1.5 definition*
