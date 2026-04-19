# Feature Research — v1.5 Bilingual Launch + KPI Intelligence

**Domain:** Garment-repair / alteration shop SaaS (Anotame, serving *El hilvan* — one live tenant)
**Researched:** 2026-04-19
**Confidence:** HIGH on bilingual patterns and key-naming conventions; MEDIUM on KPI specifics and calendar threshold conventions (no single industry standard); HIGH on partial-payment UX patterns (strong signal from tailor/dry-clean POS vendors).

**Scope boundaries (from milestone context):**
- Already built, NOT researched here: order wizard, order lifecycle (edit/bulk/audit/deliver-code), customer management, catalog, schedule, existing dashboard, JWT+RBAC, DataTable row count, per-user palette.
- In scope: full bilingual UX + per-user locale, partial-payment ledger, financial KPIs (revenue trend, service profitability, top customers + retention), workload calendar (color-coded + daily popover + 7-day widget), message-key naming convention.
- Hard constraints from PROJECT.md: **strings-only** localization (no `Intl.*` refactor — dates/numbers/currency stay es-MX); **EN translations AI-generated, unreviewed**; **per-user profile locale** (URL-routing explicitly out of scope); schema changes must be additive (live client).

---

## Feature Landscape

### Table Stakes (Users Expect These — Missing = Broken Feel)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Native-name language option** ("Español" / "English", not "Spanish") | Universal UX norm in multilingual products; non-native label means user can't find their language when UI is already in the wrong one. | **S** | Render options in their own language. Use native labels in the `<select>` regardless of active locale. |
| **Per-user locale persisted on profile** | B2B norm — the owner and the operator may share a workstation but want different languages; device-wide toggle would clobber. Already the chosen approach in PROJECT.md. | **M** | `user.locale` column in identity-service (`es-MX` default for existing users); returned in login payload; written on profile-save. Depends on existing JWT/user flow. |
| **Locale switch on profile page (not a globe-in-nav)** | Because this is a B2B shop-ops app with a known roster of users — not an anonymous public site — the switcher belongs in "my profile" settings, not the global header. Smashing/Usersnap guidance explicitly separates "public marketing" locale switchers (header) from "authenticated preferences" (profile). | **S** | Simple `<select>` with ES/EN in the existing profile page — no new UI surface. |
| **Soft locale swap (no hard reload)** | Users abandon flows when a full reload wipes context — particularly costly mid-order-wizard on a tablet. Paraglide supports runtime locale change + Svelte reactivity. | **S–M** | Set `setLocale()` then invalidate relevant `load` data; no `window.location.reload()`. If any SSR page caches a locale-specific blob, `invalidateAll()` is sufficient. |
| **Default to user's saved locale, not browser** | For logged-in users the saved preference MUST win over `Accept-Language`. Browser-detect is only appropriate pre-login. | **S** | `hooks.server.ts` reads user locale from session → sets Paraglide locale for SSR. Anonymous users fall back to browser detection → `es-MX`. |
| **Add payment (partial) without re-opening the wizard** | Every tailor/dry-clean POS (Geelus, RepairDesk, RepairShopr, Orderry) ships this. Customer drops off → pays deposit → picks up days later → pays balance. If operator has to "edit the order" to record a payment, they won't — they'll just overwrite `amountPaid`, which destroys the history we're building. | **M** | New "Add Payment" affordance on order detail. Each entry is an immutable ledger row with method+amount+timestamp+user. See UI pattern detail below. |
| **Payment history visible on order detail** | Once you have multiple payments, the operator needs to see "what's been paid and when" without running a report. | **S** | Simple reverse-chronological list under order totals: `dd/mm/yyyy hh:mm — $500 — Efectivo — Juan`. |
| **Computed balance shown on order** | "Cuánto debe el cliente" is the single most-asked question at pickup. Balance = `totalAmount − sum(payments)`. | **S** | `amountPaid` becomes derived from the ledger, not a stored field (or stays stored and is recomputed on write — DECISION: recompute on each payment insert for auditability; store for read-performance. See ARCHITECTURE). |
| **Revenue-by-day/week/month line chart** | Table stakes in any shop-ops dashboard for 15+ years. Owner wants "am I having a bad week?" in one glance. | **M** | Line or bar chart; toggle granularity. Derive from payment ledger timestamps (not order creation timestamps — because a deposit in April and a balance in May should count in their respective months). Depends on payment ledger. |
| **Month view calendar with load per day** | Every shop-ops / field-service app (Jobber, Housecall Pro, SuperSaaS) has one. Users assume it exists the moment they hear "workload calendar." | **L** | Month grid with per-day color cell. Click → daily popover. See calendar section for thresholds. |
| **Mobile-readable calendar** | El hilvan uses tablets and phones at counter; unreadable on <500px = useless. | **M** | Fall back to list/agenda view on narrow screens; month grid on tablet+. FullCalendar supports this via `initialView` + media queries; custom Svelte grid is also viable (see STACK.md). |

### Differentiators (Above-Baseline — El hilvan's Edge)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Backend error messages in user locale** | Most small-shop SaaS localizes the UI but returns English/Spanish server errors regardless. Localizing Quarkus exceptions (validation, 404, 409 FK) means the user never sees a jarring language-switch on failure. | **M** | Quarkus has `@MessageBundle` / `quarkus-qute` i18n or simple `ResourceBundle`. Alternative: return error codes only (`ERR.ORDER.LOCKED`) and let the frontend resolve via Paraglide — **recommended**, see ARCHITECTURE. Avoids duplicating message catalogs in backend. |
| **Color-coded past vs. future days** | SEED-007 explicitly calls this out: past days show *actual* (completed work + collected payments); future days show *scheduled* (estimated work + promised pickups). Most small-shop calendars only show future load. | **M** | Two visual languages on the same grid: saturated cells for past (committed reality), lighter/outlined cells for future (forecast). |
| **Daily popover = earnings + workload + order list in one view** | Competitors (Geelus, Orderry) require jumping between "sales" and "operations" tabs. Single popover is the SEED-007 thesis. | **M** | Click a day → popover shows: revenue (MXN), total minutes scheduled vs. capacity, list of orders with customer+status. |
| **Compact 7-day strip on the main dashboard** | The owner opens the dashboard 20x a day; going to a separate calendar page for "what's this week look like" is friction. A horizontal 7-day strip (today + next 6) on the dashboard = always-available glance. | **S–M** | Reuses the same color logic as the full calendar. Click a day → drills into the calendar page. |
| **Top customers + retention = "who's coming back"** | A garment-care shop lives on repeat customers. A table showing "top 10 by lifetime revenue" + "customers who haven't returned in 90 days" is directly actionable — owner calls them. Most small-shop KPIs stop at "top by revenue" without the retention half. | **M** | Two widgets: (1) Top N by `sum(payments)` YTD; (2) "At-risk" list = customers whose last order is 60–90 days ago. Depends on customer + order + payment data (already present). |
| **Service-type profitability ranking** | Not "what services do we sell most" but "what services make us the most money per minute of work" — `revenue / durationMin` per service type. Surfaces underpriced services directly. | **M** | Simple table: service name, orders count, gross revenue, total minutes, revenue-per-minute. Sortable. No margin (we don't track cost-of-goods). |
| **AI-translated EN shipped as-is, with a "report translation" affordance** | The EN audience at El hilvan is tiny (tourist / expat walk-in); shipping rough translations is fine IF there's a way for a user to flag bad ones so the glossary can be corrected. Out of scope for v1.5 implementation, but worth a 1-line note in the message file ("reported_errors.md"). | **S** (trivial placeholder) | Just a GitHub issue template / email link. No in-app flagging yet. Record decision. |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **URL-based locale routing (`/es/…`, `/en/…`)** | Feels "proper" because public SaaS sites do it. | B2B authenticated app: no SEO benefit, breaks existing shared links, doubles the routing surface (every page × 2 locales), every redirect hop flashes the wrong locale. Explicitly out of scope per PROJECT.md. | Per-user profile locale only (the milestone choice). |
| **Browser `Accept-Language` auto-override at every request** | "Smart auto-detection feels magical." | For logged-in users it OVERRIDES their explicit profile choice if implemented naively. Every login from a new device would flip Spanish to English. | `Accept-Language` only consulted for anonymous users / login page. Saved user locale wins once authenticated. |
| **`Intl.NumberFormat`/`Intl.DateTimeFormat` per-locale** | "If the UI is English, shouldn't dates be MM/DD and currency be USD?" | Shop runs in MX, prices are in MXN, staff reads dates as DD/MM. An English-speaking walk-in customer still pays in pesos on a ticket dated DD/MM. Forcing US formats confuses the shop owner more than it helps. Explicitly out of scope per PROJECT.md. | Strings-only i18n — keep `es-MX` formatting regardless of UI language. |
| **"Smart" suggested language based on typed characters / customer name** | Nice-demo, zero shop value. | Adds complexity; ambiguous rules; violates the "user chose their locale" principle. | None. |
| **Over-payment handling ("customer paid more than total")** | Feels like defensive coding. | In a tailor shop, overpayment is a human error — the right UX is to prevent it, not to silently create a credit balance. Letting the ledger go positive creates confusion about "do I owe the customer change?" | Validate on payment entry: reject if `amount + paid > total`. Operator must either refund cash or correct the total. No credit-balance ledger. |
| **Partial refund line-item** | "Customer returned one garment of three — refund that line." | Requires complex negative entries, refund method reconciliation, audit gymnastics. For one live tenant this is premature. | Negative payment entry (`-$500`, method: Efectivo, note: "reembolso") — a single ledger row handles it without introducing a refund domain. Log it honestly; don't model it as a separate concept. |
| **Inline-editable payment rows** | "Let me fix yesterday's mistaken amount." | Destroys the audit story the ledger exists to provide. | Ledger entries are append-only. Correction = a new entry (adjustment row with a note). Matches accounting practice. |
| **Payment method fixed-dropdown only** | "Just add Efectivo/Tarjeta/Transferencia." | Three methods today, four tomorrow (MercadoPago, CoDi, etc.). | Configurable list in catalog — but v1.5 can hardcode the enum and defer this. Document as backlog. |
| **KPI "gross margin" / cost-of-goods tracking** | Standard metric in retail dashboards. | El hilvan doesn't track input costs (thread, fabric). Forcing a margin field creates garbage data and noise KPIs. | Track revenue-per-service and revenue-per-minute only. Call it "profitability" in the UI with a tooltip explaining it's revenue-based. |
| **Real-time dashboard with WebSocket push** | "Live numbers feel premium." | Nobody at a garment shop is staring at the dashboard — they reload it 3x a day. WebSocket infra cost is wasted. | Server-rendered values on each page load + maybe a "Last updated HH:mm — refresh" button. |
| **Month-view calendar with hourly event blocks** | "Looks like Google Calendar, so useful!" | Month grid with event blocks on each day is unreadable on any screen under 1400px and provides no operator value for a shop that doesn't book by the hour. SEED-007 explicitly proposes day *cells* with color + click-for-popover. | Month = color-coded cells + summary on click. Week = list of days with order counts. No hour-grid view. |
| **Deep 5-level nested message keys** (`pages.admin.orders.detail.actions.bulk.delete.confirm.title`) | Felt "organized" at first. | Breaks Paraglide's compile-time type inference for free-floating keys with more than 2–3 segments; becomes unsearchable in IDE; refactor cost balloons. Locize guide: max 2–3 levels. | Flat-ish keys with 3 segments max: `orders.bulkDelete.confirmTitle`. See message-key section. |
| **Reusing "common" keys across contexts** (`common.save` everywhere) | DRY instinct. | `common.save` might need to be "Save", "Guardar", "Guardar cambios", "Crear", depending on screen — translators have no context. Every professional i18n guide (Locize, Lokalise, Smartling) rejects this. | One unique key per string instance. Duplicate source text is fine; shared keys are not. |
| **Owner "customize KPI widgets" (drag-and-drop dashboard)** | Enterprise feature envy. | One live tenant, one dashboard. Massive complexity for no validated demand. | Fixed layout. If owner requests it post-launch, revisit. |

---

## Detailed Answers to the Question's Specific Asks

### 1) Bilingual / Locale Switching UX

**What the ecosystem does:**
- **B2B shop-ops apps** (Jobber, Housecall Pro, CleanCloud, Geelus) universally use **per-user profile preference** — not URL-based. URL-based is overwhelmingly a public-marketing-site pattern (Stripe, Notion landing pages).
- **Profile switcher UI**: `<select>` with native-language labels ("Español", "English") on the profile/settings page — not a globe icon in the header. Consistent across Smashing Magazine and Usersnap guidance.
- **Reload vs. soft swap**: Soft swap is the 2025 norm. Hard reload is treated as a legacy anti-pattern because it wipes unsaved form state and scroll position.
- **Default for new users**: Use `Accept-Language` once at signup to pick the default, then persist. For Anotame specifically (ES-first audience, MX market), defaulting existing users to `es-MX` is the explicit choice; new users can default to `es-MX` too until first save.

**Recommendation for Anotame:**
- `user.locale` column, `es-MX` default.
- Profile page `<select>` with `Español (México)` and `English` — native labels.
- On change: call Paraglide's `setLocale()` → `invalidate()` (or `invalidateAll()` if SSR load depends on it) → toast "Idioma actualizado". No `window.location.reload()`.
- `hooks.server.ts` reads `locale` from the session and sets it before `load()` runs, so SSR output is already in the right language (no FOUC-equivalent for text).
- Anonymous routes (login page) → `Accept-Language` with `es-MX` fallback.

### 2) Partial-Payment UX in Trade Shops

**What the ecosystem does (Geelus, RepairDesk, RepairShopr, Orderry):**
- **"Add Payment" button on order detail**, not inline on the order list.
- **Modal** (not inline-row) is the dominant pattern. Rationale: payment entry wants focus, validation, and a method-selector; inline-row entry is fragile on touch devices and makes the method-dropdown UX awkward.
- **Fields per entry**: amount, method (Efectivo / Tarjeta / Transferencia / [extensible]), timestamp (auto-now, editable only by ADMIN), optional note. RepairShopr additionally has a "reference" field for card confirmations.
- **Ledger appearance**: reverse-chronological table under the order total: date — amount — method — user — note. Each row is read-only; no inline edit.
- **Partial refunds**: handled as negative-amount entries in most small-shop systems (RepairShopr explicitly does this); dedicated refund flows appear only in systems integrated with card processors.
- **Over-payment**: systems vary. Geelus allows it and creates a customer credit; RepairDesk blocks it. For Anotame (no loyalty/credit system), block is simpler and safer.
- **Operator-at-a-glance**: a color-coded "balance pill" on the order row (`$0 due` green / `$500 due` amber / `full due` red) is the common pattern. Pickup flow typically refuses to complete while balance > 0, unless an ADMIN overrides.

**Recommendation for Anotame:**
- **Modal `<Dialog>` "Agregar pago"** launched from order detail.
- Fields: `amount` (positive number, max = balance), `method` (enum), `note` (optional, 255ch).
- Timestamp auto-set server-side; `recorded_by_user_id` auto-set from session. Neither editable by operator.
- `tco_order_payment` table: `id`, `order_id`, `amount` (numeric), `method` (enum), `note`, `recorded_at`, `recorded_by_user_id`. **Append-only** — no UPDATE endpoint.
- Refund = negative `amount` entry; UI affordance is a secondary "Registrar reembolso" button inside the same modal that pre-fills a negative sign and requires a note. Validation: negative entries cannot exceed `sum(positive entries)`.
- Over-payment: blocked. Error message: "El pago excede el saldo pendiente."
- Ledger UI: simple table on order detail, reverse-chron. Running balance recomputed server-side and displayed prominently at the top of the order.
- `amountPaid` field stays on `Order` for read-performance but is **recomputed** from the ledger on every payment write (single transaction). Truth lives in the ledger.

### 3) Financial KPIs — What's Actually Useful

**What the ecosystem says (Locize, SMB KPI guides, GrowthForce, NetSuite):**
- 5–7 KPIs max per dashboard view. More = nobody reads any.
- **Balance leading and lagging indicators** — revenue trend is lagging; workload-next-7-days is leading.
- **Service profitability**: gross revenue per service is entry-level; revenue-per-minute (or revenue-per-hour) is where real signal is. Most small-shop owners don't track cost-of-goods, so "margin" is often unmeasurable — stick with revenue-based.
- **Top-customers-only is a trap** — owners see it and feel good but can't act. Pairing it with "customers at risk of churn" (no order in 60–90 days) makes it actionable: call them.
- **Repeat rate / return rate** — percentage of customers with 2+ orders is the single best one-number retention metric for a small shop. It's easy to compute and easy to understand.
- **Pitfalls when owners can't interpret dashboards**:
  - Raw numbers without comparison ("$45,000 this month" — is that good?). Always show a delta vs. previous period.
  - Vanity metrics with no action attached ("1,234 total customers ever!").
  - Mixing count-based and revenue-based metrics on the same axis.
  - Granularity mismatch — showing minute-level when the owner thinks in days.

**Recommendation for Anotame (4–5 KPI widgets max):**

1. **Revenue trend** — line chart, toggleable day/week/month, last 12 buckets. X-axis dates, Y-axis MXN. Derive from payment ledger (`recorded_at`, not order creation).
2. **Service-type profitability table** — rows: service name | orders | gross revenue (MXN) | total minutes | revenue/min (MXN/min). Sort by revenue/min desc by default. Scope: last 30/90 days (toggle).
3. **Top 5 customers YTD** — name | orders | lifetime revenue. Click → customer detail.
4. **At-risk customers** — customers with no order in 60+ days, ordered by lifetime revenue desc. Top 10. Actionable: call them.
5. **Repeat rate** — single number + period ("42% de clientes han vuelto — últimos 90 días"). Formula: `customers_with_2+_orders_in_window / total_customers_in_window`.

All KPIs show a **delta vs. previous period** badge (▲ 12% / ▼ 3%). No WebSocket — reload on page visit.

### 4) Workload Calendar — Color-Code Thresholds & View Strategy

**What the ecosystem does (FullCalendar, SuperSaaS, JetAppointment, Booking.com Pulse, Housecall Pro):**
- **Absolute-minutes threshold** is rarely used because shops vary in capacity. **Percentage-of-capacity** is universal (e.g., <50% green, 50–85% yellow, >85% red).
- **Capacity calculation** typically = `sum(work_day_minutes_for_assigned_shifts) − holidays`. For Anotame, capacity is derivable from the existing schedule module.
- **Past vs. future**: distinguished visually by desaturation/opacity. Past shows actual completed minutes + collected payments; future shows estimated minutes + expected revenue.
- **Month-at-a-glance vs. week view**: both common. Month is better for planning conversations ("can we take a rush job next Thursday?"); week is better for daily operations. Jobber and Housecall Pro ship both; most users live in the week view day-to-day and hit month view weekly.
- **Daily popover content, ranked by operator usefulness** (from vendor UX docs and Jobber/Geelus defaults):
  1. Capacity bar (X / Y minutes, color) — first glance
  2. Revenue (scheduled for future days; actual for past)
  3. Order list (customer, garment count, status, promised pickup time)
  4. Quick-link to create a new order for that day
  5. Holiday / closure indicator if applicable

**Recommendation for Anotame:**
- **Thresholds**: <50% green, 50–85% amber, >85% red. Configurable per establishment later; hardcode for v1.5.
- **Capacity source**: derive from the schedule module (`work_days` × shift minutes) minus holidays. Workload = sum of service `durationMin` across orders whose promised-pickup-date falls on that day (or, for past days, whose actual completion date falls on that day).
- **Past vs. future rendering**: use `--tw-opacity-60` on past-day cells and a subtle border on future cells; saturated fill for current day. Month header legend explains the convention.
- **Views shipped**:
  - **Full month grid** on the dedicated calendar page (desktop/tablet).
  - **7-day horizontal strip** on the dashboard.
  - **Agenda/list fallback** on narrow mobile (<640px).
  - NO week-hour-grid view. Not worth the complexity for a shop that plans by day, not by hour.
- **Daily popover content (in order)**:
  1. Date + holiday indicator
  2. Capacity bar: `X min / Y min (Z%)` with color
  3. Revenue: `MX$ N` (actual if past, scheduled if future)
  4. Order list: customer — garment count — status — pickup time
  5. "Crear pedido para este día" button
- Library choice: see STACK.md. Short version: custom Svelte grid probably beats FullCalendar here (FullCalendar is overkill for color-coded cells with popovers; Svelte component is ~200 lines).

### 5) Message-Key Naming Convention (SEED-002)

**What the ecosystem does:**
- **Flat keys with dot-notation namespacing** is the dominant 2025 pattern in mature i18next/Paraglide codebases (Locize, Lokalise, Smartling, Paraglide docs all concur).
- **Namespace by feature/domain**, not by page-tree. Reason: pages get reorganized, domains don't. `orders.create.submit` survives a routing refactor; `pages.admin.orders.new.form.submit` does not.
- **Max 2–3 dot segments**. Deeper nesting kills IDE autocomplete and breaks Paraglide's type inference for dynamic keys.
- **camelCase** for the segment body (matches Paraglide output), **dot** between segments. Not snake_case — Paraglide compiles to JavaScript identifiers and camelCase is more ergonomic.
- **Don't reuse keys across contexts** — `save` in one place ≠ `save` in another. Each unique string → unique key. Source-text duplication is acceptable; semantic-identity collision is not.
- **No abbreviations** — `language` not `lang`, `component` not `comp`.
- **Keys survive at 1000+ when**: (a) the domain segment is a real boundary (not just the folder it happens to live in), (b) nesting never exceeds 3, (c) every string has its own key, (d) the casing is enforced by linter/convention test.

**Pattern options compared:**

| Pattern | Example | Pros | Cons |
|---------|---------|------|------|
| `page.section.action` | `orders.list.createButton` | Easy to find by navigating — "I'm on the orders page" | Breaks when pages get renamed/restructured; tied to URL tree |
| `domain.component.verb` | `order.bulkActions.delete` | Survives routing refactors; matches backend domain vocabulary | Requires discipline to identify the "domain" — bikeshed-prone |
| `feature.element.purpose` | `orderPayment.modal.title` | Reads naturally; aligns with component names | Overlaps with component-based (blurry line) |
| Flat `snake_case_everything` | `orders_list_create_button` | Dead simple; no nesting debate | No grouping → harder to find related keys; IDE autocomplete less helpful |

**Recommendation for Anotame:**
- **Adopt `domain.component.purpose`** (3 segments, camelCase, dot-separated) with these domain buckets matching the backend services and frontend feature folders:
  - `common.*` — only for truly context-free words (app name, brand strings). Use sparingly; NOT for "save"/"cancel" — those get per-context keys.
  - `auth.*` — login, logout, session, profile
  - `customer.*` — customer CRUD, search, merge
  - `order.*` — creation wizard, detail, edit, lifecycle, audit
  - `orderPayment.*` — the new ledger
  - `catalog.*` — garments, services, price lists
  - `operations.*` — delivery, pickup code, "listas para entrega"
  - `schedule.*` — work days, shifts, holidays
  - `dashboard.*` — KPIs, widgets
  - `calendar.*` — workload calendar, 7-day strip
  - `settings.*` — profile, palette, locale, establishment/branch
  - `error.*` — user-facing error messages (backend emits codes → frontend resolves)
  - `validation.*` — form-field validation messages

- **Middle segment** = component or sub-surface name in camelCase (`loginForm`, `createWizard`, `bulkActionsBar`, `paymentModal`).
- **Last segment** = purpose in camelCase (`title`, `submitButton`, `placeholderName`, `errorRequired`, `successCreated`).
- **Examples**:
  - `order.createWizard.stepCustomerTitle`
  - `orderPayment.modal.amountLabel`
  - `orderPayment.modal.errorExceedsBalance`
  - `dashboard.revenueWidget.deltaIncrease`
  - `calendar.dayPopover.capacityLabel`
  - `error.order.locked`
  - `validation.amount.mustBePositive`
- **Constraints enforced**:
  - Exactly 3 segments (rare 2-segment for global brand strings; no 4+).
  - camelCase inside segments, lowercase first letter.
  - No abbreviations (`language` not `lang`; `button` not `btn`).
  - No key reuse across contexts — even if the displayed text is identical.
- **Linting**: add a test that asserts every key matches `/^[a-z][a-zA-Z]*(\.[a-z][a-zA-Z]*){1,2}$/` and there are no keys with deeper nesting. This is the single concrete guard that saves the convention from decay.

---

## Feature Dependencies

```
Per-user locale column ──requires──> auth/user module change (identity-service)
        │
        └──requires──> profile UI (existing) extended with <select>
        │
        └──enables──> Locale-aware SSR (hooks.server.ts)

Paraglide full extraction ──enables──> EN translation pipeline
        │
        └──requires──> message-key naming convention (SEED-002) — must be
                        agreed BEFORE extraction begins, or extraction
                        produces keys that get renamed during cleanup
                        (double work)

Partial-payment ledger (tco_order_payment)
        │
        ├──requires──> additive Flyway migration in sales-service
        │
        ├──enables──> accurate revenue-trend KPI (date = payment date,
        │             not order creation)
        │
        ├──enables──> balance-due badge on order list + pickup flow guard
        │
        └──refactors──> Order.amountPaid becomes derived (recomputed on
                        ledger write); read-path unchanged

Revenue trend KPI ──requires──> payment ledger (for date-accurate buckets)
Service profitability ──requires──> existing order_item + service duration
                                    (no new schema)
Top customers + retention ──requires──> existing customer + order data
                                        (payment ledger makes "lifetime
                                        revenue" more accurate but isn't
                                        strictly required)

Workload calendar
        │
        ├──requires──> schedule module (capacity) — exists
        ├──requires──> order data (workload numerator) — exists
        ├──requires──> payment ledger (revenue for past days) —
        │             desirable for accuracy, not blocking
        ├──requires──> calendar aggregation endpoint (new) in operations or
        │             sales service — recommend sales-service owns the
        │             /calendar/days aggregate (it has order totals);
        │             operations-service contributes capacity only
        └──enables──> 7-day dashboard widget (same data, narrower window)

Backend error localization (differentiator)
        │
        ├──recommended approach: error CODES from backend, text from
        │                        frontend Paraglide catalog
        │
        └──decouples──> backend deploy cycle from translation updates
```

### Dependency Notes

- **SEED-002 naming convention must land before Paraglide extraction** — otherwise the extraction produces ad-hoc keys that all get renamed later, doubling the work. This is the single most important sequencing constraint in v1.5.
- **Payment ledger must land before revenue-trend KPI** — revenue-by-day is only honest when anchored to payment dates, not order-creation dates.
- **Calendar does not block KPIs and vice versa** — these can ship in parallel phases.
- **Per-user locale column is independent** from extraction — can land first (unblocks profile UI) or after (doesn't matter). Extraction is the long pole.
- **Locale switching soft-swap depends on** Paraglide SvelteKit adapter configuration; Paraglide handles this natively, no custom infra.

---

## MVP Definition

### Launch With (v1.5 Core)

Minimum to call v1.5 shipped:

- [ ] `user.locale` column + profile `<select>` + soft-swap locale change — **essential**: the whole milestone is named "Bilingual Launch"
- [ ] SEED-002 naming convention doc + linter — **essential**: must precede extraction
- [ ] Paraglide extraction of every hardcoded ES string in `anotame-web/src/` — **essential**
- [ ] EN AI-translated catalog generated + shipping unreviewed — **essential**
- [ ] Backend error codes → frontend Paraglide resolution — **essential** for the "bilingual" quality bar; half-localized UX is worse than unlocalized
- [ ] `tco_order_payment` table + append-only ledger + "Agregar pago" modal + order-detail history panel — **essential** (SEED-001 remainder, enables KPI accuracy)
- [ ] Over-payment validation (block) + negative refund entries with note requirement — **essential** (prevent ledger-integrity bugs)
- [ ] Revenue trend widget (day/week/month toggle, 12-bucket window, delta vs. prev period) — **essential**
- [ ] Service-type profitability table (revenue-per-minute, sortable) — **essential**
- [ ] Top 5 customers + At-risk customers (60+ days idle) + Repeat-rate single-number KPI — **essential**
- [ ] Workload month calendar with color-coded days (<50/50–85/>85%), past-vs-future visual distinction, daily popover — **essential** (SEED-007 thesis)
- [ ] 7-day dashboard strip widget sharing the calendar's color logic — **essential**
- [ ] Mobile agenda fallback for calendar on <640px — **essential** (shop uses tablets/phones at counter)

### Add After Validation (v1.6+)

- [ ] Configurable color-code thresholds per establishment — trigger: owner asks "can we change when red kicks in"
- [ ] Configurable payment-method list — trigger: owner adds a 4th method (MercadoPago, CoDi)
- [ ] Customer credit / over-payment handling — trigger: owner requests "advance payment for future orders"
- [ ] Budget / revenue-target KPIs — deferred from v1.5 scoping per PROJECT.md
- [ ] Multi-branch dashboard aggregation — deferred
- [ ] Week-detail view (list of days with order counts) — trigger: owner says month view is too dense
- [ ] In-app translation-error reporting — trigger: EN users actually appear and report confusion
- [ ] Professional translation review pass — trigger: EN share of users exceeds ~20% OR complaint volume

### Future Consideration (v2+)

- [ ] Automated KPI email digest (weekly summary to owner) — requires email infrastructure
- [ ] Additional Spanish variants (es-ES, es-AR) — only if expanding beyond MX
- [ ] Locale-aware `Intl.*` number/date/currency — only if expanding beyond MX (changes the whole strings-only calculus)
- [ ] Customer-facing translation (order-pickup notification SMS/email in customer's language) — requires comms infra
- [ ] Cost-of-goods tracking for true margin KPI — requires inventory/supplier domain El hilvan doesn't have

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Message-key naming convention + linter (SEED-002) | MEDIUM (indirect — enables everything else cleanly) | LOW | **P1** |
| `user.locale` column + profile switcher + soft swap | HIGH | LOW–MEDIUM | **P1** |
| Paraglide full extraction (UI) | HIGH | HIGH (tedious, ~1000 strings) | **P1** |
| EN AI-translation pipeline | HIGH | LOW | **P1** |
| Backend error codes → frontend i18n | HIGH | MEDIUM | **P1** |
| `tco_order_payment` ledger + add-payment modal | HIGH | MEDIUM | **P1** |
| Ledger-computed balance + pickup-flow guard | HIGH | LOW | **P1** |
| Revenue trend KPI | HIGH | MEDIUM | **P1** |
| Service-type profitability | HIGH | MEDIUM | **P1** |
| Top customers + at-risk + repeat rate | HIGH | MEDIUM | **P1** |
| Workload month calendar (color-coded cells + popover) | HIGH | HIGH | **P1** |
| 7-day dashboard strip | HIGH | LOW (reuses calendar logic) | **P1** |
| Mobile agenda fallback | MEDIUM | LOW | **P1** |
| Delta-vs-previous-period badges on KPIs | MEDIUM | LOW | **P1** |
| Configurable color thresholds | LOW (one tenant) | LOW | P3 |
| Configurable payment methods | LOW (3 methods fine today) | LOW | P3 |
| Customer credit / overpayment handling | LOW | MEDIUM | P3 |
| In-app translation-error reporting | LOW | LOW | P3 |
| Real-time WebSocket dashboard | LOW | HIGH | **P3 (avoid)** |
| Week-hour-grid calendar view | LOW | HIGH | **P3 (avoid)** |
| URL-based locale routing | NONE | HIGH | **P3 (avoid — explicit anti-feature)** |

**Priority key:**
- **P1** — must ship in v1.5
- **P2** — should ship, add if phases have bandwidth
- **P3** — defer / explicit anti-feature

Note: because v1.5 has a focused scope and most items are P1, there is no P2 tier — either it ships or it's an anti-feature / deferred.

---

## Competitor Feature Analysis

| Feature | Geelus | RepairDesk | Orderry | Jobber / Housecall | Our Approach |
|---------|--------|------------|---------|---------------------|--------------|
| Locale switcher | Per-user profile | Per-user profile | Per-user profile | Per-user profile | **Per-user profile** (profile-page `<select>`, native labels, soft swap) |
| Partial payments | Modal "take payment" | Modal "add payment" | Modal "accept payment" | Modal | **Modal "Agregar pago"** — amount + method + note |
| Payment ledger | Reverse-chron table | Reverse-chron table | Reverse-chron table | Reverse-chron table | **Reverse-chron table**, append-only, negative entries for refunds |
| Over-payment | Creates credit | Blocks | Blocks | Blocks | **Blocks** (no credit system) |
| Revenue trend chart | Yes (daily/monthly) | Yes (multi-period) | Yes | Yes | **Yes** — day/week/month toggle, 12 buckets, anchored on payment date |
| Service profitability | Limited (sales-by-service) | Yes | Yes | Yes | **Revenue-per-minute** table — a sharper cut than gross-sales-by-service |
| Retention / at-risk customers | Weak | Basic ("last visit") | Basic | Stronger (Housecall Pro has "win-back" campaigns) | **Repeat rate + at-risk list (60-day idle)** — actionable, not vanity |
| Workload calendar | Day view, no color-coding | Basic calendar | Monthly planner | Full-featured (Jobber excels here) | **Month grid + color-coded cells + daily popover + 7-day strip** — above the category baseline for a small-shop tool |
| Color-coded capacity | No | No | Limited | Yes (Jobber) | **Yes — <50/50–85/>85% thresholds** |
| Past vs. future visual distinction | No | No | No | No | **Yes** (opacity on past; saturated on current/future) — differentiator |
| Backend error localization | Partial | UI only | UI only | UI only | **Full** — error codes resolved via frontend catalog — differentiator |
| AI-translated copy | No | No | No | No | **Yes (unreviewed, v1.5 quality bar)** — pragmatic for one-tenant scope |

**Anotame's edge comes from**: past-vs-future calendar distinction, full backend error localization, single-popover calendar (earnings + workload + order list together), and revenue-per-minute service profitability. None of these are individually revolutionary — the combination is what differentiates.

---

## Sources

**Paraglide / i18n key naming (HIGH confidence):**
- [Paraglide JS — Message Keys and Structure (inlang)](https://inlang.com/m/gerre34r/library-inlang-paraglideJs/message-keys) — authoritative; flat-key recommendation with bracket-notation for namespacing
- [The Art of the Key: A Definitive Guide to i18n Key Naming — Locize](https://www.locize.com/blog/guide-to-i18n-key-naming/) — structured/semantic keys, 2–3 level depth, no-reuse rule
- [Translation Key Naming Conventions — Lokalise](https://lokalise.com/blog/translation-keys-naming-and-organizing/) — namespace-by-feature, no abbreviations, consistency enforcement
- [Why I Replaced i18next with Paraglide.js — dropanote.de](https://dropanote.de/en/blog/20250726-why-i-replaced-i18next-with-paraglide-js/) — current Paraglide DX with SvelteKit

**Locale switcher UX (HIGH confidence):**
- [Designing a Language Switch — Usersnap](https://usersnap.com/blog/design-language-switch/) — B2B patterns, native-label rule
- [Designing A Perfect Language Selector UX — Smashing Magazine](https://www.smashingmagazine.com/2022/05/designing-better-language-selector/) — profile vs. header, soft transitions
- [Language Selector UX — Smart Interface Design Patterns](https://smart-interface-design-patterns.com/articles/language-selector/) — 2025 best practices

**Partial-payment UX in trade shops (HIGH confidence — multi-vendor agreement):**
- [RepairDesk Tailor Shop Software](https://www.repairdesk.co/tailor-shop-management-software/) — modal add-payment, refund flows
- [Geelus Alterations Software](https://geelus.com/alterations-software-for-small-businesses/) — deposit + balance pattern, credit handling
- [RepairShopr Payment System — Uservoice KB](https://repair.uservoice.com/knowledgebase/articles/356235-payment-system) — partial-payment ledger, invoice-not-marked-paid-until-balance-zero, negative refund entries
- [Orderry Tailor Shop Software](https://orderry.com/tailor-shop-software/) — order+payment workflow

**Financial KPIs for service businesses (MEDIUM confidence — varied advice, consensus on core metrics):**
- [8 Professional Services KPIs to Measure Profitability — Scopestack](https://scopestack.io/blog/professional-services-kpis-to-measure-profitability)
- [Helpful KPIs for Revenue & Profitability in Service Industry — Accounting Department](https://www.accountingdepartment.com/blog/helpful-kpis-for-revenue-profitability-in-a-service-industry)
- [Retail KPIs: Essential Metrics — Qoblex (2025)](https://qoblex.com/blog/essential-retail-kpis-complete-guide-to-measuring-store-performance-in-2025/)
- [Customer Retention Metrics — AgencyAnalytics (2025)](https://agencyanalytics.com/blog/customer-retention-metrics)

**Workload calendar / capacity color-coding (MEDIUM confidence — no single standard, multi-vendor patterns):**
- [FullCalendar Docs — Business Hours / Scheduler plugin](https://fullcalendar.io/docs/)
- [SuperSaaS Capacity Tutorial](https://www.supersaas.com/info/tutorials/capacity_example) — fractional capacity display
- [Booking.com Pulse Calendar — Partner Help](https://partner.booking.com/en-us/help/rates-availability/pulse-calendar/how-do-i-check-pulse-if-guests-can-book-my-property) — green/red availability
- [Capacity Planning 2025 — Hello Bonsai](https://www.hellobonsai.com/blog/capacity-planning) — % of capacity over absolute minutes

**Customer retention dashboards (MEDIUM confidence):**
- [Customer Retention Dashboard — Klipfolio](https://www.klipfolio.com/resources/dashboard-examples/saas/customer-retention-dashboard)
- [15 Customer Retention Metrics — AgencyAnalytics](https://agencyanalytics.com/blog/customer-retention-metrics)
- [Customer Retention Dashboard — Saras Analytics](https://www.sarasanalytics.com/blog/customer-retention-dashboard)

---
*Feature research for: garment-repair shop SaaS (Anotame / El hilvan) — v1.5 Bilingual Launch + KPI Intelligence*
*Researched: 2026-04-19*
