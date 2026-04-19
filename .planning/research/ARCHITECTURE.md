# Architecture Research — v1.5 Bilingual Launch + KPI Intelligence

**Domain:** Garment-repair / alteration shop SaaS (Anotame — adding bilingual UX, payment ledger, KPIs, workload calendar to existing 4-service architecture)
**Researched:** 2026-04-19
**Confidence:** HIGH on Paraglide integration and ledger patterns; MEDIUM on calendar aggregation endpoint ownership

**Scope boundaries:**
- Existing architecture (NOT re-designed): Hexagonal/DDD per service, SvelteKit BFF proxy, JWT+RBAC, 4 isolated PostgreSQL databases.
- NEW integration points: Paraglide i18n layer, error-code resolution, `tco_order_payment` ledger, KPI aggregation endpoints, calendar aggregation endpoint, chart components.

---

## System Overview — v1.5 Additions

```
┌──────────────────────────────────────────────────────────────────┐
│                      SvelteKit Frontend                          │
├──────────────────────────────────────────────────────────────────┤
│  ┌───────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐    │
│  │ Paraglide │  │ Chart.js │  │ Calendar │  │ Payment     │    │
│  │ Messages  │  │ Widgets  │  │ Grid     │  │ Modal       │    │
│  │ (compile) │  │ (canvas) │  │ (custom) │  │ (dialog)    │    │
│  └─────┬─────┘  └────┬─────┘  └────┬─────┘  └──────┬──────┘    │
│        │              │             │               │            │
│  ┌─────┴─────────────┴─────────────┴───────────────┴──────┐    │
│  │               SvelteKit BFF Proxy Layer                 │    │
│  │  (hooks.server.ts → locale from session → SSR)          │    │
│  └─────────────────────────────────────────────────────────┘    │
├──────────────────────────────────────────────────────────────────┤
│                  Backend REST APIs (Quarkus)                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐    │
│  │ identity │  │ catalog  │  │ sales    │  │ operations   │    │
│  │ service  │  │ service  │  │ service  │  │ service      │    │
│  │          │  │          │  │          │  │              │    │
│  │ +locale  │  │ (no chg) │  │ +payment │  │ +capacity    │    │
│  │  column  │  │          │  │  ledger  │  │  endpoint    │    │
│  │ +error   │  │ +error   │  │ +KPI     │  │ +error       │    │
│  │  codes   │  │  codes   │  │  endpts  │  │  codes       │    │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────┬───────┘    │
│       │              │             │               │            │
│  ┌────┴────┐  ┌─────┴────┐  ┌────┴─────┐  ┌─────┴──────┐     │
│  │identity │  │catalog   │  │sales     │  │operations  │     │
│  │   db    │  │   db     │  │   db     │  │   db       │     │
│  └─────────┘  └──────────┘  └──────────┘  └────────────┘     │
└──────────────────────────────────────────────────────────────────┘
```

## New Component Responsibilities

| Component | Responsibility | Service Owner | Notes |
|-----------|----------------|---------------|-------|
| Paraglide message catalog | All UI strings (ES + EN) compiled to JS functions | Frontend (SvelteKit) | Single source of truth for all user-facing text, including error messages resolved from backend codes |
| `user.locale` column | Persisted language preference per user | identity-service | `es-MX` default for existing users; returned in JWT or login payload |
| Error code constants | Machine-readable error identifiers (`ERR.ORDER.LOCKED`) | All 4 backend services | Frontend Paraglide resolves code → localized text; backend returns JSON `{ "error": "ERR.ORDER.LOCKED" }` |
| `tco_order_payment` table | Append-only payment ledger per order | sales-service (sales-db) | `id`, `order_id`, `amount`, `method`, `note`, `recorded_at`, `recorded_by_user_id` |
| KPI aggregation endpoints | Revenue trend, service profitability, customer retention | sales-service | All financial KPIs derived from `tco_order` + `tco_order_payment` + `tco_order_item` in sales-db |
| Capacity aggregation endpoint | Daily work-minutes capacity from schedule | operations-service | Derives from existing schedule tables; returns `{ date, capacityMinutes, scheduledMinutes }` |
| Calendar data aggregation | Combines workload + revenue per day range | Frontend joins | SvelteKit `+page.server.ts` calls both sales-service (revenue/workload) and operations-service (capacity), merges server-side before passing to component |
| Chart.js KPI widgets | Line/bar charts for revenue, profitability table | Frontend (SvelteKit) | 4-5 KPI widgets on admin dashboard; canvas-based |
| Custom calendar grid | Month-view with color-coded cells + popover | Frontend (SvelteKit) | ~200 lines custom Svelte; uses shadcn Popover; 7-day strip variant for dashboard |

---

## Architectural Patterns

### Pattern 1: Error Codes Over Localized Backend Strings

**What:** Backend returns machine-readable error codes; frontend resolves them to localized user-facing text via Paraglide.

**When to use:** Any REST API + SPA architecture where the translation catalog should live in one place.

**Trade-offs:**
- ✓ Single translation catalog (frontend Paraglide)
- ✓ Backend deploys decoupled from translation updates
- ✓ Error messages automatically follow user's locale preference
- ✗ Backend cannot return human-readable messages without the frontend
- ✗ API consumers (future mobile, third-party) would need their own resolution layer

**Implementation:**

```java
// Backend — ExceptionMapper returns error code
@Provider
public class OrderExceptionMapper implements ExceptionMapper<OrderLockedException> {
    @Override
    public Response toResponse(OrderLockedException e) {
        return Response.status(409)
            .entity(Map.of("error", "ERR.ORDER.LOCKED", "orderId", e.getOrderId()))
            .build();
    }
}
```

```svelte
<!-- Frontend — Paraglide resolves error code to localized text -->
<script>
  import * as m from '$lib/paraglide/messages';

  const errorMap = {
    'ERR.ORDER.LOCKED': m.error.order.locked,
    'ERR.PAYMENT.EXCEEDS_BALANCE': m.error.orderPayment.exceedsBalance,
    // ... all error codes mapped to Paraglide message functions
  };

  function resolveError(code: string): string {
    return errorMap[code]?.() ?? m.error.generic.unknown();
  }
</script>
```

**Decision:** Use error codes. The decoupling benefit (one catalog, one deploy) far outweighs the minor inconvenience for future API consumers (who can request raw codes and resolve locally).

---

### Pattern 2: Append-Only Payment Ledger with Derived Balance

**What:** `amountPaid` on the order becomes a derived value (recomputed from the ledger on every write), not a directly-editable field. The ledger is append-only — no UPDATE or DELETE on payment rows.

**When to use:** When you need payment audit history AND accurate financial aggregation.

**Trade-offs:**
- ✓ Full audit trail — every payment event is immutable
- ✓ Revenue-by-date KPIs are date-accurate (anchored to `recorded_at`)
- ✓ Refunds are honest negative entries, not silent edits
- ✗ Extra table + extra query on payment write (recompute sum)
- ✗ `amountPaid` is now denormalized (stored on order for read-performance but truth lives in ledger)

**Data flow:**

```
[Operator clicks "Agregar pago"]
    ↓
[Modal: amount + method + note]
    ↓
[POST /orders/{id}/payments]
    ↓
[SalesService in single transaction:]
    1. Validate: amount + currentPaid <= totalAmount
    2. INSERT into tco_order_payment
    3. UPDATE tco_order SET amount_paid = (SELECT SUM(amount) FROM tco_order_payment WHERE order_id = ?)
    4. Return updated order with new balance
    ↓
[Frontend: update order detail view + payment history panel]
```

**Decision:** Recompute-on-write within a single database transaction. The `amountPaid` column stays on `tco_order` for read-performance (every order list query uses it), but truth lives in the ledger. A consistency check (scheduled or manual) can verify `SUM(payments) = amountPaid` for any order.

---

### Pattern 3: Frontend-Joined Calendar Data

**What:** The calendar page's `+page.server.ts` calls two services in parallel (sales for revenue/workload, operations for capacity), merges the responses, and passes a single unified dataset to the Svelte component.

**When to use:** When data lives across service boundaries but needs to be displayed together, and inter-service HTTP calls from the backend would create tight coupling.

**Trade-offs:**
- ✓ No new inter-service dependency (services don't call each other)
- ✓ SvelteKit's server-side `load` function is the natural BFF layer
- ✓ Each service endpoint is simple and focused
- ✗ Two HTTP calls per page load (parallel, but still two round-trips from SvelteKit server to backends)
- ✗ If either service is down, the calendar page degrades

**Data flow:**

```
[User navigates to /calendar]
    ↓
[+page.server.ts load()]
    ├── GET /sales/calendar?from=2026-04-01&to=2026-04-30
    │   → { days: [{ date, revenue, totalMinutes, orderCount }] }
    │
    └── GET /operations/capacity?from=2026-04-01&to=2026-04-30
        → { days: [{ date, capacityMinutes }] }
    ↓
[Merge by date → pass to component as unified array]
    { date, revenue, totalMinutes, orderCount, capacityMinutes, loadPercent }
    ↓
[CalendarGrid.svelte renders color-coded cells]
```

**Decision:** Frontend-joined. This preserves service independence and avoids creating cross-service HTTP calls. If latency becomes an issue, the SvelteKit server can cache the operations/capacity response (it changes only when schedule is edited) while fetching sales data fresh.

---

### Pattern 4: Soft Locale Swap (No Full Reload)

**What:** When the user changes language in their profile, the app calls Paraglide's `setLocale()` then `invalidateAll()` to re-run SvelteKit `load` functions, re-rendering all text without a full page reload.

**When to use:** Authenticated B2B apps where users switch language rarely but expect to stay in-context when they do.

**Trade-offs:**
- ✓ No lost form state or scroll position
- ✓ SSR output is already in the right language (hooks.server.ts reads session locale)
- ✗ First load after login must read locale from session, not browser `Accept-Language`
- ✗ `invalidateAll()` re-runs all active `load` functions (acceptable overhead for a rare action)

**Implementation flow:**

```
[hooks.server.ts]
    → Read user.locale from session/JWT
    → Call setLocale(locale) before any load() runs
    → Anonymous users: fall back to Accept-Language → es-MX

[Profile page — locale change]
    → PATCH /users/{id}/locale { locale: "en" }
    → On success: setLocale("en") → invalidateAll() → toast confirmation
    → Session/JWT updated to include new locale
```

---

## New Project Structure (additions only)

```
anotame-web/src/
├── lib/
│   ├── paraglide/              # Generated by paraglideVitePlugin
│   │   ├── messages.js         # Compiled message functions (m.order.createWizard.title())
│   │   ├── runtime.js          # setLocale(), getLocale()
│   │   └── server.js           # SSR middleware (if using URL-based — we're NOT)
│   ├── components/
│   │   ├── calendar/           # NEW — Calendar components
│   │   │   ├── CalendarGrid.svelte       # Month-view grid with color cells
│   │   │   ├── CalendarDayCell.svelte    # Individual day cell with color logic
│   │   │   ├── CalendarDayPopover.svelte # Click-day popover (revenue + workload + orders)
│   │   │   └── CalendarStrip.svelte      # 7-day horizontal widget for dashboard
│   │   ├── kpi/                # NEW — KPI widget components
│   │   │   ├── RevenueTrendChart.svelte
│   │   │   ├── ServiceProfitabilityTable.svelte
│   │   │   ├── TopCustomersWidget.svelte
│   │   │   ├── AtRiskCustomersWidget.svelte
│   │   │   └── RepeatRateWidget.svelte
│   │   └── payments/           # NEW — Payment ledger components
│   │       ├── AddPaymentModal.svelte
│   │       └── PaymentHistory.svelte
│   ├── i18n/                   # NEW — i18n utilities
│   │   ├── error-resolver.ts   # Maps backend error codes → Paraglide message functions
│   │   └── locale-utils.ts     # Locale detection, preference logic
│   └── services/
│       └── ...                 # Existing services unchanged
├── messages/                   # NEW — Paraglide message source files
│   ├── es-MX.json              # Spanish (Mexico) — source language
│   └── en.json                 # English — AI-translated
└── routes/
    └── (app)/
        └── dashboard/
            ├── calendar/       # NEW — Full calendar page
            │   └── +page.svelte
            │   └── +page.server.ts
            └── ...             # Existing routes unchanged

anotame-api/backend/sales-service/
├── src/main/java/com/anotame/sales/
│   ├── domain/model/
│   │   └── Payment.java        # NEW — Payment domain model
│   ├── application/
│   │   ├── port/out/
│   │   │   └── PaymentRepository.java  # NEW — Payment persistence port
│   │   └── service/
│   │       └── SalesService.java       # MODIFIED — addPayment(), getKpiData()
│   └── infrastructure/
│       ├── persistence/
│       │   ├── entity/
│       │   │   └── PaymentJpa.java     # NEW — JPA entity
│       │   └── adapter/
│       │       └── PaymentPersistenceAdapter.java  # NEW
│       └── web/
│           └── controller/
│               ├── PaymentResource.java   # NEW — POST /orders/{id}/payments
│               └── KpiResource.java       # NEW — GET /kpi/revenue, /kpi/profitability, etc.
├── src/main/resources/db/migration/
│   └── V2__payment_ledger.sql  # NEW — tco_order_payment table

anotame-api/backend/identity-service/
├── src/main/java/.../
│   └── ...                     # MODIFIED — user.locale column, PATCH /users/{id}/locale
├── src/main/resources/db/migration/
│   └── V2__user_locale.sql     # NEW — ALTER TABLE tca_user ADD COLUMN locale VARCHAR(10) DEFAULT 'es-MX'

anotame-api/backend/operations-service/
├── src/main/java/.../
│   └── web/controller/
│       └── CapacityResource.java  # NEW — GET /capacity?from=&to= (daily capacity)
```

---

## Data Flow — Key Flows

### 1. Locale Resolution on Page Load

```
Browser → SvelteKit server (hooks.server.ts)
    → Read locale from session cookie / JWT claims
    → setLocale(locale) for Paraglide SSR
    → load() functions execute → all m.xyz.abc() calls return locale-correct text
    → HTML sent to browser with correct language
    → Hydration picks up locale from server, no flash
```

### 2. Add Payment Flow

```
[Order Detail Page]
    → Click "Agregar pago"
    → AddPaymentModal opens (amount, method, note)
    → Submit → POST /api/sales/orders/{id}/payments
    → SalesService.addPayment():
        1. Validate amount + currentPaid <= totalAmount
        2. INSERT tco_order_payment (in transaction)
        3. UPDATE tco_order.amount_paid = SUM(payments) (in same transaction)
        4. Return { order, payment, balance }
    → Frontend updates:
        - Payment history panel (new row)
        - Balance badge on order header
        - Toast: "Pago registrado" / "Payment recorded"
```

### 3. KPI Dashboard Load

```
[Dashboard Page +page.server.ts]
    → Parallel:
        GET /api/sales/kpi/revenue?period=month&buckets=12
        GET /api/sales/kpi/profitability?days=30
        GET /api/sales/kpi/customers?type=top&limit=5
        GET /api/sales/kpi/customers?type=at-risk&days=60
        GET /api/sales/kpi/retention?days=90
    → All responses merged into single page data object
    → Rendered by KPI widget components (Chart.js canvases + tables)
```

### 4. Calendar Page Load

```
[Calendar Page +page.server.ts]
    → Parallel:
        GET /api/sales/calendar?from=YYYY-MM-01&to=YYYY-MM-30
            → { days: [{ date, revenue, totalMinutes, orderCount }] }
        GET /api/operations/capacity?from=YYYY-MM-01&to=YYYY-MM-30
            → { days: [{ date, capacityMinutes }] }
    → Merge by date:
        { date, revenue, totalMinutes, orderCount, capacityMinutes,
          loadPercent: totalMinutes / capacityMinutes * 100 }
    → Pass to CalendarGrid.svelte
    → Color logic: <50% green, 50-85% amber, >85% red
```

---

## Integration Points

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| identity ↔ frontend | REST (locale in JWT/session) | Locale preference stored in identity-db; included in login response; frontend reads from session |
| sales ↔ frontend | REST (payments, KPIs, calendar workload) | Sales-service owns all financial data; new endpoints for payment CRUD, KPI aggregation, calendar workload |
| operations ↔ frontend | REST (capacity) | Operations-service provides daily capacity from schedule; lightweight read-only endpoint |
| sales ↔ operations | **None** (no inter-service calls) | Frontend-joined: SvelteKit server merges data from both services |
| All services → frontend | Error codes | Backend returns `{ "error": "ERR.CODE" }`; frontend resolves via Paraglide |

### Schema Changes (Additive — Safe for Live Client)

| Service | Migration | Description |
|---------|-----------|-------------|
| identity-service | V2__user_locale.sql | `ALTER TABLE tca_user ADD COLUMN locale VARCHAR(10) DEFAULT 'es-MX' NOT NULL` |
| sales-service | V2__payment_ledger.sql | `CREATE TABLE tco_order_payment (id UUID PRIMARY KEY, order_id UUID NOT NULL REFERENCES tco_order(id), amount NUMERIC(12,2) NOT NULL, method VARCHAR(50) NOT NULL, note VARCHAR(255), recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), recorded_by_user_id UUID NOT NULL)` |

---

## Anti-Patterns

### Anti-Pattern 1: Duplicating Translation Catalogs

**What people do:** Backend `@MessageBundle` returns localized strings AND frontend has its own Paraglide messages.
**Why it's wrong:** Two catalogs diverge; every new error message requires changes in two places; deployment coupling.
**Do this instead:** Backend returns error codes only; frontend resolves all user-facing text via single Paraglide catalog.

### Anti-Pattern 2: Storing amountPaid Without Ledger Verification

**What people do:** Let operators directly edit `amountPaid` on the order entity.
**Why it's wrong:** Destroys audit trail; makes revenue-by-date KPIs inaccurate; can silently hide payment discrepancies.
**Do this instead:** `amountPaid` is recomputed from SUM(tco_order_payment.amount) on every payment write; direct edit of `amountPaid` is removed from the order edit wizard.

### Anti-Pattern 3: Inter-Service Calls for Calendar Data

**What people do:** Sales-service calls operations-service internally to get capacity, then returns a unified calendar response.
**Why it's wrong:** Creates runtime coupling between services; operations-service downtime breaks calendar AND order creation.
**Do this instead:** Frontend-joined: SvelteKit `+page.server.ts` calls both services in parallel, merges responses.

---

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 1 tenant (current) | Current architecture is fine. All KPI queries run against sales-db directly. Calendar data merged by frontend. |
| 5-10 tenants | KPI aggregation queries may need database indexes on `recorded_at` + `order_id` in tco_order_payment. Consider materialized views for revenue-by-period if queries exceed 500ms. |
| 50+ tenants | Dedicated analytics service (read replica) for KPI computation. Calendar capacity may need caching layer. |

---

## Sources

- [Paraglide JS docs — inlang](https://inlang.com/m/gerre34r/library-inlang-paraglideJs) — compile-time i18n, SvelteKit integration
- [Quarkus Qute i18n — @MessageBundle](https://quarkus.io/guides/qute-reference#type-safe-message-bundles) — considered and rejected for error-code approach
- [Hexagonal Architecture — Anotame AI_RULES.md](./../../AI_RULES.md) — existing patterns for ports/adapters
- [Append-only ledger patterns](https://martinfowler.com/eaaDev/AccountingNarrative.html) — Martin Fowler's accounting narrative

---
*Architecture research for: garment-repair shop SaaS (Anotame / El hilvan) — v1.5 integration*
*Researched: 2026-04-19*
