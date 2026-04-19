# Pitfalls Research — v1.5 Bilingual Launch + KPI Intelligence

**Domain:** Garment-repair / alteration shop SaaS (Anotame — adding bilingual UX, payment ledger, KPIs, workload calendar to existing live system)
**Researched:** 2026-04-19
**Confidence:** HIGH on i18n pitfalls (well-documented domain); HIGH on ledger integrity pitfalls (accounting fundamentals); MEDIUM on calendar-specific pitfalls (less documented for small shops)

**Focus:** Common mistakes when ADDING these features to an existing, live, single-tenant system — not greenfield pitfalls.

---

## Critical Pitfalls

### Pitfall 1: Extracting Strings Before Naming Convention

**What goes wrong:**
Developer starts extracting hardcoded Spanish strings into Paraglide messages using ad-hoc keys (`save_button`, `orderPageTitle`, `page.orders.saveBtn`). Then SEED-002 naming convention lands and all 500+ keys need renaming. Double work, high risk of broken references.

**Why it happens:**
Extraction feels like "the real work" and naming feels like "a formality." Developers want visible progress (strings extracted) before invisible infrastructure (convention doc + lint).

**How to avoid:**
Land SEED-002 naming convention + regex lint as THE FIRST v1.5 deliverable. No extraction begins until the convention document is committed and the lint rule can validate keys. Convention must be agreed before any `.json` message file gets its first key.

**Warning signs:**
- Any `.json` message file with keys that don't match `/^[a-z][a-zA-Z]*(\.[a-z][a-zA-Z]*){1,2}$/`
- Keys using different conventions in the same file (`camelCase` mixed with `snake_case` or `PascalCase`)
- Keys with more than 3 dot-separated segments

**Phase to address:** First phase — naming convention + linter rule

---

### Pitfall 2: Reusing "Common" i18n Keys Across Contexts

**What goes wrong:**
Developer creates `common.save` and uses it on the order edit page, customer edit page, AND the profile page. Then a translator needs "Guardar cambios" on profile but "Guardar pedido" on orders. You can't change `common.save` without affecting all 3 pages. You either force a single generic translation or break the "reuse" pattern.

**Why it happens:**
DRY instinct. The source text is literally the same string ("Guardar"), so it "should" be one key. But translation is context-dependent, not text-dependent.

**How to avoid:**
Convention rule: each unique UI location gets its own key, even if the source text is identical. `order.editWizard.saveButton` and `customer.editDialog.saveButton` are separate keys with separate translations. Source text duplication is expected and correct.

**Warning signs:**
- Any key starting with `common.` that isn't truly context-free (app name, brand strings)
- Searching for a key and finding it used in 5+ unrelated components
- Translator confusion reports ("Which 'Save' am I translating?")

**Phase to address:** Naming convention phase (convention doc must explicitly ban common-key reuse)

---

### Pitfall 3: Payment Ledger Without Transaction Boundary

**What goes wrong:**
`addPayment()` inserts into `tco_order_payment`, then updates `tco_order.amount_paid` in two separate transactions. If the app crashes between INSERT and UPDATE, the ledger and the order's `amountPaid` disagree. KPI reports then show phantom revenue.

**Why it happens:**
Developer writes the INSERT, gets it working, then adds the UPDATE as a "follow-up step." The two-transaction pattern is invisible in happy-path testing.

**How to avoid:**
Both operations MUST execute in a single `@Transactional` method. The hexagonal architecture means the service layer method (`addPayment`) does both the INSERT and the recompute-UPDATE within one transaction boundary.

**Warning signs:**
- `amount_paid` on any order doesn't equal `SUM(tco_order_payment.amount)` for that order
- KPI revenue totals don't match order-level sums
- Payment modal succeeds but balance doesn't update (or vice versa)

**Phase to address:** Payment ledger implementation phase

---

### Pitfall 4: Over-Payment Creates Silent Inconsistency

**What goes wrong:**
Operator enters 5000 when balance is 3000. Without validation, `amountPaid` exceeds `totalAmount`, creating a negative "owed" balance. There's no credit/refund system, so the negative balance is meaningless and confusing. Revenue KPIs now overcount.

**Why it happens:**
Backend doesn't validate `amount + currentPaid <= totalAmount`. The happy-path test always uses valid amounts.

**How to avoid:**
Server-side validation in `addPayment()`: `if (currentPaid + amount > totalAmount) throw new PaymentExceedsBalanceException()`. Frontend also validates (disable submit when amount > balance), but backend is the single source of truth. Error code: `ERR.PAYMENT.EXCEEDS_BALANCE`.

**Warning signs:**
- Any order where `amount_paid > total_amount`
- Negative balance shown in UI
- Revenue-by-day totals exceed order totals for the same period

**Phase to address:** Payment ledger phase — validation MUST be in success criteria

---

### Pitfall 5: KPI Revenue Anchored to Order Creation Date Instead of Payment Date

**What goes wrong:**
Revenue trend chart counts all revenue for an order under the order's creation date, not the payment date. A customer creates an order in March, pays a deposit in March and the balance in April. Revenue chart shows all revenue in March, nothing in April. The owner sees a "bad April" that's actually a great April.

**Why it happens:**
The existing `tco_order` table has `created_at` but no payment timestamps. It's "easier" to aggregate by `tco_order.created_at`. Once the payment ledger exists, developers must consciously switch to `tco_order_payment.recorded_at`.

**How to avoid:**
Revenue KPI queries MUST use `tco_order_payment.recorded_at` as the time dimension, NOT `tco_order.created_at`. The payment ledger is a prerequisite for accurate revenue-by-date KPIs. This must be an explicit success criterion for the KPI phase.

**Warning signs:**
- Revenue chart query joins `tco_order` without touching `tco_order_payment`
- Revenue by month doesn't change when a new payment is recorded for an old order
- Owner reports: "Pero sí me pagaron esa semana"

**Phase to address:** KPI implementation phase — must depend on payment ledger phase

---

### Pitfall 6: Calendar Capacity = 0 for Days Without Schedule

**What goes wrong:**
The capacity endpoint returns 0 for days that aren't in the schedule module (holidays, weekends). The calendar shows those days as "100% loaded" (any scheduled minutes / 0 capacity = infinity → red). Days off show as the busiest days.

**Why it happens:**
Division by zero isn't handled. The developer tests with weekdays that have valid schedule entries.

**How to avoid:**
When capacity is 0 (no schedule for that day), render the cell as "closed" (gray/hatched), not as "overloaded" (red). The color logic must handle `capacityMinutes === 0` as a separate branch. Also exclude closed days from workload-percentage calculations (they're not "100% full"; they're "not working").

**Warning signs:**
- Sundays showing red on the calendar
- Calendar showing "120% capacity" on holidays
- Owner asks "Why is Sunday the busiest day?"

**Phase to address:** Calendar implementation phase

---

### Pitfall 7: Paraglide SSR Locale Flash (Text FOUC)

**What goes wrong:**
Page renders in Spanish on the server, but the hydration script runs with English (or vice versa). For a split second, all text visibly flips. This is the text equivalent of FOUC (Flash of Unstyled Content) — call it FOWC (Flash of Wrong Content).

**Why it happens:**
`hooks.server.ts` doesn't set the Paraglide locale before `load()` runs, or the locale is set based on `Accept-Language` instead of the user's saved preference. SSR renders in one locale, client hydration picks up a different one.

**How to avoid:**
In `hooks.server.ts`, read the user's saved locale from session/JWT FIRST, call `setLocale()` BEFORE any `load()` function executes. For anonymous users (login page), use `Accept-Language` with `es-MX` fallback. The client must hydrate with the same locale the server used — Paraglide handles this natively if the server hook is correct.

**Warning signs:**
- Text flickers between languages on page load
- `getLocale()` returns different values on server vs. client
- Login page always shows English regardless of browser language

**Phase to address:** Per-user locale implementation phase

---

### Pitfall 8: Direct amountPaid Edits Bypass Ledger

**What goes wrong:**
The existing order edit wizard (from v1.3) has an `amountPaid` field that directly writes to the order entity. After the payment ledger ships, this field creates a backdoor: editing `amountPaid` in the wizard bypasses the ledger, creating a desync between `tco_order.amount_paid` and `SUM(tco_order_payment.amount)`.

**Why it happens:**
The edit wizard was built before the ledger existed. The `amountPaid` field is still wired to the order update endpoint. Nobody remembers to remove it when the ledger ships.

**How to avoid:**
When the payment ledger ships, REMOVE `amountPaid` from the order edit form entirely. The only way to change `amountPaid` is through the payment ledger (AddPaymentModal). This must be an explicit step in the ledger implementation plan.

**Warning signs:**
- Order edit wizard still shows an editable `amountPaid` field after ledger ships
- `amountPaid` on an order doesn't match `SUM(payments)` for orders where both the wizard and the modal were used
- Audit log shows `amountPaid` changes from the wizard AND from the payment endpoint

**Phase to address:** Payment ledger phase — explicit removal of `amountPaid` from edit wizard

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Hardcoded payment methods (Efectivo/Tarjeta/Transferencia) | Fast to ship; no catalog-service change | Adding methods requires code change + deploy | v1.5 — only 3 methods today, configurable list is v1.6+ |
| Hardcoded calendar thresholds (50/85%) | No settings UI needed | Threshold changes require code change | v1.5 — one tenant; configurable thresholds deferred |
| AI-translated EN with no review pipeline | Ships bilingual fast | Some translations are wrong | v1.5 — EN audience is tiny (tourists); review when EN share exceeds 20% |
| `amountPaid` denormalized on order | Fast reads on order list (no JOIN to payments) | Must stay in sync with ledger; risk of drift | Acceptable with recompute-on-write in same transaction |
| No materialized views for KPIs | No extra infrastructure | Slow queries when order count > 10k | Acceptable for 1 tenant; revisit at 5+ tenants |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Paraglide + `hooks.server.ts` | Setting locale AFTER `load()` runs (SSR uses wrong locale) | Set locale in `handle()` hook BEFORE load functions execute |
| Paraglide + existing error handling | Frontend catches error response, shows raw error string instead of resolving code | Update error handler to check for `error` field → resolve via Paraglide → show localized toast |
| Payment ledger + existing order detail | Showing `amountPaid` from order entity instead of `SUM(payments)` | Compute balance from ledger; use order's `amountPaid` only as a performance cache |
| Calendar + schedule module | Assuming every day has a schedule entry | Handle "no schedule" days as "closed" (gray); don't divide by zero |
| Chart.js + Svelte 5 `$effect` | Creating new Chart instance on every state change (memory leak) | Create chart once in `onMount`, update data in `$effect`, destroy in cleanup |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Revenue KPI query scans full order table | `/kpi/revenue` takes >1s | Index on `tco_order_payment.recorded_at`; limit to 12 buckets | >5k orders with payments |
| Calendar endpoint returns all orders for the month | `/calendar?from=&to=` takes >2s | Aggregate in SQL (GROUP BY date), return only daily summaries | >1k orders/month |
| Chart.js re-instantiation on every page visit | Canvas flickers; memory grows | Store chart instance, call `.update()` not `new Chart()` | Immediately visible |
| Paraglide tree-shaking disabled by importing all messages | Bundle grows by 50KB+ | Use `m.specific.key()` imports, not `import * as messages` | >500 message keys |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Payment endpoint doesn't verify user role | Any logged-in user can add payments to any order | Require ADMIN or OPERATOR role; verify user has access to the order's branch |
| Error codes leak internal state | `ERR.DB.CONNECTION_FAILED` exposes infrastructure | Error codes must be domain-level (`ERR.ORDER.LOCKED`), not infrastructure-level; generic `ERR.INTERNAL` for unexpected errors |
| Locale preference changeable by other users | User A can change User B's locale via PATCH | PATCH /users/{id}/locale requires id === authenticated user id (OR admin role) |
| KPI endpoints accessible to EMPLOYEE role | Employees see revenue and customer financial data | KPI endpoints require ADMIN role only |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Locale switcher in header nav | Operator bumps it accidentally; suddenly everything is English; confusion | Profile-only switcher — intentional change only |
| Full page reload on locale change | Order wizard state lost mid-entry | Soft swap: `setLocale()` + `invalidateAll()` — no state loss |
| Calendar red = "overloaded" on holidays | Owner panics about Sunday workload | Gray/hatched = "closed"; red only for working days >85% |
| Revenue chart without delta comparison | Owner sees $45,000 — is that good? No context | Always show ▲/▼ vs. previous period badge |
| Payment modal without balance preview | Operator enters amount blindly; over-payment validation fires unexpectedly | Show current balance prominently at top of modal; real-time remaining balance as amount changes |

## "Looks Done But Isn't" Checklist

- [ ] **i18n extraction:** Often missing — interpolated strings (template literals with `${}`) not extracted; hardcoded strings in Svelte `{@html}` blocks missed
- [ ] **i18n backend errors:** Often missing — error toast shows English error code instead of localized message (error resolver not wired)
- [ ] **Payment ledger:** Often missing — existing `amountPaid` edit field in order wizard not removed; creates backdoor around ledger
- [ ] **KPI revenue accuracy:** Often missing — revenue aggregated by order creation date instead of payment date; numbers look right in testing but wrong for real orders with split payments
- [ ] **Calendar closed days:** Often missing — holidays/weekends show as red (100% capacity); division by zero in loadPercent calculation
- [ ] **Calendar mobile fallback:** Often missing — month grid renders on phone but cells are unreadable (too small); agenda/list view fallback not implemented for <640px
- [ ] **Soft locale swap:** Often missing — locale changes but SSR still renders old locale on next navigation; `hooks.server.ts` not reading updated session
- [ ] **Chart cleanup:** Often missing — Chart.js instance not destroyed on component unmount; memory leaks on repeated page visits

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Naming convention applied after extraction | HIGH | Regex rename across all message files + all `.svelte` import sites; re-run lint; risk of breakage |
| Payment ledger/order amountPaid desync | MEDIUM | Run SQL: `UPDATE tco_order SET amount_paid = (SELECT COALESCE(SUM(amount),0) FROM tco_order_payment WHERE order_id = tco_order.id)` — one-time reconciliation |
| Revenue KPI using wrong date dimension | LOW | Change SQL query from `tco_order.created_at` to `tco_order_payment.recorded_at`; re-test |
| Calendar division by zero | LOW | Add `capacityMinutes === 0 ? 'closed' : ...` guard in color logic |
| Over-payment not validated | LOW | Add server-side check + frontend disable; verify no existing over-paid orders in prod |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|-
| Naming convention before extraction | Phase: Naming convention | Lint rule passes on all message keys |
| Common key reuse | Phase: Naming convention | No key in `common.*` used in >1 context |
| Transaction boundary on payment | Phase: Payment ledger | Integration test: crash mid-payment → ledger and order agree |
| Over-payment validation | Phase: Payment ledger | Test: POST payment with amount > balance → 400 error |
| Revenue date dimension | Phase: KPI implementation | Revenue query uses `recorded_at`; manual check with split-payment order |
| Calendar capacity=0 | Phase: Calendar implementation | Visual test: Sunday/holiday shows gray, not red |
| SSR locale flash | Phase: Per-user locale | Navigate with locale=en; no text flash on page load |
| amountPaid wizard backdoor | Phase: Payment ledger | Order edit wizard has no `amountPaid` field; only AddPaymentModal can change it |

---

## Sources

- [Locize — i18n key naming guide](https://www.locize.com/blog/guide-to-i18n-key-naming/) — common key reuse anti-pattern
- [Paraglide JS — SvelteKit SSR](https://inlang.com/m/gerre34r/library-inlang-paraglideJs) — locale hook pattern
- [Martin Fowler — Accounting patterns](https://martinfowler.com/eaaDev/AccountingNarrative.html) — append-only ledger, transaction boundary
- [RepairDesk — payment integration](https://www.repairdesk.co/tailor-shop-management-software/) — over-payment handling UX
- [Chart.js — Svelte lifecycle management](https://www.chartjs.org/docs/latest/getting-started/integration.html) — destroy/update patterns

---
*Pitfalls research for: garment-repair shop SaaS (Anotame / El hilvan) — v1.5 additions*
*Researched: 2026-04-19*
