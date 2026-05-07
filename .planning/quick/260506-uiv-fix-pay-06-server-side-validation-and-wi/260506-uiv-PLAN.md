---
phase: quick-260506-uiv
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - anotame-api/backend/sales-service/src/main/java/com/anotame/sales/application/service/PaymentService.java
  - anotame-api/backend/sales-service/src/main/java/com/anotame/sales/application/dto/AddPaymentRequest.java
  - anotame-web/src/lib/components/dashboard/WeekCalendarWidget.svelte
  - anotame-web/src/routes/(app)/dashboard/+page.svelte
autonomous: true
requirements:
  - PAY-06
  - CAL-01

must_haves:
  truths:
    - "POST /orders/{id}/payments with a negative amount and no note returns HTTP 422 with error code REFUND_NOTE_REQUIRED"
    - "POST /orders/{id}/payments with a negative amount and a non-blank note succeeds"
    - "Main admin dashboard shows a compact 7-day workload strip without navigating to /kpi"
  artifacts:
    - path: "anotame-api/backend/sales-service/src/main/java/com/anotame/sales/application/service/PaymentService.java"
      provides: "Server-side refund note guard"
      contains: "REFUND_NOTE_REQUIRED"
    - path: "anotame-web/src/lib/components/dashboard/WeekCalendarWidget.svelte"
      provides: "Compact 7-day capacity strip component"
    - path: "anotame-web/src/routes/(app)/dashboard/+page.svelte"
      provides: "Main dashboard wiring WeekCalendarWidget for admin role"
  key_links:
    - from: "OrderPaymentResource.java POST handler"
      to: "PaymentService.addPayment()"
      via: "Jakarta Bean Validation + service guard"
      pattern: "REFUND_NOTE_REQUIRED"
    - from: "anotame-web/src/routes/(app)/dashboard/+page.svelte"
      to: "WeekCalendarWidget.svelte"
      via: "conditional render for isAdmin"
      pattern: "WeekCalendarWidget"
---

<objective>
Close two M002 milestone caveats in a single atomic pass:

1. PAY-06 server-side enforcement — PaymentService currently allows negative-amount payments without a note. Add a guard that throws 422 REFUND_NOTE_REQUIRED when amount < 0 and note is absent or blank. Also relax the AddPaymentRequest @DecimalMin constraint so negative amounts are not blocked at bean-validation level (the service guard handles the note requirement instead).

2. 7-day calendar widget on main dashboard — Wire a compact WeekCalendarWidget component into the main admin dashboard (+page.svelte) so admins see the next 7 days' capacity at a glance. The component reuses the existing WorkloadCalendar data shape and design tokens; it renders only 7 cells instead of 30, trimmed for the dashboard right-rail slot.

Purpose: Meets PAY-06 requirement (server enforces refund note) and CAL-01 requirement (7-day workload strip visible on main dashboard).
Output: Modified PaymentService.java, relaxed AddPaymentRequest.java, new WeekCalendarWidget.svelte, updated dashboard +page.svelte.
</objective>

<execution_context>
@/Users/moonstone/Source/Personal/anotame-microservices/.claude/get-shit-done/workflows/execute-plan.md
@/Users/moonstone/Source/Personal/anotame-microservices/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@/Users/moonstone/Source/Personal/anotame-microservices/.planning/PROJECT.md
@/Users/moonstone/Source/Personal/anotame-microservices/.planning/STATE.md

<interfaces>
<!-- Existing PaymentService.addPayment() guard pattern (from PaymentService.java) -->
```java
// Pattern already in use for other guards:
throw new WebApplicationException(
    Response.status(Response.Status.fromStatusCode(422))
            .entity("...")
            .build());
```

<!-- AddPaymentRequest current shape (from AddPaymentRequest.java) -->
```java
public record AddPaymentRequest(
    @NotNull(message = "amount is required")
    @DecimalMin(value = "0.01", message = "amount must be greater than zero")
    BigDecimal amount,
    String paymentMethod,
    String notes   // NOT 'note' — field is called 'notes'
) {}
```

<!-- WorkloadCalendar props contract (from WorkloadCalendar.svelte) -->
```typescript
let { dailyWorkload = [], capacity = 480 } = $props<{
    dailyWorkload: { date: string; totalMinutesUsed: number }[],
    capacity: number
}>();
```

<!-- KPI dashboard API call (from admin/kpi/+page.svelte) -->
// GET ${API_SALES}/orders/kpi/dashboard
// Returns: { dailyWorkload: { date: string; totalMinutesUsed: number }[] }
// Establishment capacity: GET ${API_OPERATIONS}/establishment -> { dailyCapacityMinutes: number }

<!-- Main dashboard page role detection (from +page.svelte) -->
```svelte
const isAdmin = $derived(userRole === 'ADMIN');
```

<!-- apiService import pattern -->
import { apiService, API_SALES, API_OPERATIONS } from '$lib/services/api.svelte';
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add server-side refund note guard in PaymentService + relax DTO constraint</name>
  <files>
    anotame-api/backend/sales-service/src/main/java/com/anotame/sales/application/service/PaymentService.java
    anotame-api/backend/sales-service/src/main/java/com/anotame/sales/application/dto/AddPaymentRequest.java
  </files>
  <action>
**AddPaymentRequest.java** — Remove the `@DecimalMin(value = "0.01")` annotation from the `amount` field. Negative amounts are valid refunds; the service will enforce the note requirement. Keep `@NotNull`. The `notes` field already exists (String, nullable) — no change needed.

**PaymentService.java** — Inside `addPayment()`, immediately after the CANCELLED order guard and before the overpayment check, add:

```java
if (request.amount().compareTo(BigDecimal.ZERO) < 0
        && (request.notes() == null || request.notes().isBlank())) {
    throw new WebApplicationException(
            Response.status(Response.Status.fromStatusCode(422))
                    .entity("REFUND_NOTE_REQUIRED")
                    .build());
}
```

No new imports needed — `BigDecimal` is already imported.
  </action>
  <verify>
    <automated>cd /Users/moonstone/Source/Personal/anotame-microservices/anotame-api/backend/sales-service && mvn compile -q 2>&1 | tail -5</automated>
  </verify>
  <done>
    `mvn compile` exits 0. PaymentService contains the string "REFUND_NOTE_REQUIRED". AddPaymentRequest no longer has @DecimalMin on amount.
  </done>
</task>

<task type="auto">
  <name>Task 2: Create WeekCalendarWidget and wire into main dashboard</name>
  <files>
    anotame-web/src/lib/components/dashboard/WeekCalendarWidget.svelte
    anotame-web/src/routes/(app)/dashboard/+page.svelte
  </files>
  <action>
**WeekCalendarWidget.svelte** — Create a compact 7-day capacity strip component. It fetches its own data on mount (mirrors the pattern from kpi/+page.svelte) so it is self-contained. Design: a horizontal row of 7 mini-cards (one per day), each showing the day abbreviation, occupancy percentage, and a coloured mini-bar. Use the same `getOccupancyColor()` logic and design tokens as WorkloadCalendar.svelte. Show a muted skeleton state while loading; swallow fetch errors silently (non-critical widget).

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { apiService, API_SALES, API_OPERATIONS } from '$lib/services/api.svelte';
  import { Calendar } from 'lucide-svelte';

  interface DayLoad { date: string; totalMinutesUsed: number; }

  let days = $state<DayLoad[]>([]);
  let capacity = $state(480);
  let loading = $state(true);

  function getOccupancyColor(pct: number): string {
    if (pct >= 100) return 'bg-destructive';
    if (pct >= 80)  return 'bg-warning';
    if (pct >= 50)  return 'bg-warning/60';
    if (pct > 0)    return 'bg-success';
    return 'bg-secondary/40';
  }

  function fmtDay(dateStr: string): string {
    return new Intl.DateTimeFormat('es-MX', { weekday: 'short', day: 'numeric' })
      .format(new Date(dateStr + 'T12:00:00'));
  }

  onMount(async () => {
    try {
      const [kpiData, estData] = await Promise.all([
        apiService.request<{ dailyWorkload: DayLoad[] }>(`${API_SALES}/orders/kpi/dashboard`),
        apiService.request<{ dailyCapacityMinutes?: number }>(`${API_OPERATIONS}/establishment`)
      ]);
      if (estData?.dailyCapacityMinutes) capacity = estData.dailyCapacityMinutes;
      // Take first 7 future days
      days = (kpiData?.dailyWorkload ?? []).slice(0, 7);
    } catch {
      // non-critical — widget stays hidden
    } finally {
      loading = false;
    }
  });
</script>

{#if !loading && days.length > 0}
<div class="rounded-xl border border-border bg-card p-4">
  <div class="flex items-center gap-2 mb-3">
    <Calendar class="w-4 h-4 text-primary" />
    <span class="text-sm font-semibold font-heading">Carga próximos 7 días</span>
  </div>
  <div class="grid grid-cols-7 gap-1.5">
    {#each days as day}
      {@const pct = Math.min(100, Math.round((day.totalMinutesUsed / capacity) * 100))}
      <div class="flex flex-col items-center gap-1">
        <span class="text-[9px] font-bold text-muted-foreground uppercase leading-tight text-center">{fmtDay(day.date)}</span>
        <div class="w-full h-10 rounded-md bg-muted/40 flex items-end overflow-hidden">
          <div class="w-full transition-all duration-700 {getOccupancyColor(pct)}" style="height: {pct}%"></div>
        </div>
        <span class="text-[9px] font-mono font-bold {pct >= 100 ? 'text-destructive' : pct >= 80 ? 'text-warning-foreground' : 'text-muted-foreground'}">{pct}%</span>
      </div>
    {/each}
  </div>
</div>
{/if}
```

**+page.svelte (main dashboard)** — Add to the `<script>` block:

```svelte
import WeekCalendarWidget from '$lib/components/dashboard/WeekCalendarWidget.svelte';
```

Add the widget below the greeting block and above the menu grid, conditionally rendered for admins only:

```svelte
{#if isAdmin}
  <div class="mb-2">
    <WeekCalendarWidget />
  </div>
{/if}
```

Place this block between the `</div>` that closes the greeting section and the `<div class="grid ...">` that opens the menu grid. The `isAdmin` derived value already exists in scope.
  </action>
  <verify>
    <automated>cd /Users/moonstone/Source/Personal/anotame-microservices/anotame-web && bun run build 2>&1 | tail -15</automated>
  </verify>
  <done>
    `bun run build` exits 0. WeekCalendarWidget.svelte exists. Main dashboard +page.svelte imports WeekCalendarWidget and renders it inside `{#if isAdmin}`.
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| client -> POST /orders/{id}/payments | Untrusted amount + notes fields from authenticated frontend |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-uiv-01 | Tampering | PaymentService.addPayment() | mitigate | Server-side guard rejects negative amount without note (Task 1); cannot be bypassed via client |
| T-uiv-02 | Spoofing | WeekCalendarWidget fetch | accept | Widget calls same authenticated apiService; no new trust boundary introduced |
| T-uiv-03 | Information Disclosure | 422 error body | accept | Entity is the opaque code string "REFUND_NOTE_REQUIRED" — no stack trace or internal detail exposed |
</threat_model>

<verification>
1. Java compilation: `mvn compile` succeeds in sales-service.
2. Frontend build: `bun run build` exits 0 in anotame-web.
3. Manual smoke test: POST a payment with a negative amount and no `notes` field — expect HTTP 422 with body `REFUND_NOTE_REQUIRED`.
4. Manual smoke test: POST same request with `notes: "Devolución aprobada"` — expect HTTP 201.
5. Visual: Log in as ADMIN, open main dashboard — WeekCalendarWidget renders below the greeting when KPI data is available.
</verification>

<success_criteria>
- PaymentService throws 422 REFUND_NOTE_REQUIRED for negative-amount payments missing a note.
- Positive and zero-amount payments with no note continue to succeed (no regression).
- WeekCalendarWidget.svelte exists and is imported + conditionally rendered on the main admin dashboard.
- Frontend build is clean (exit 0).
- Backend compiles clean (exit 0).
</success_criteria>

<output>
After completion, create `.planning/quick/260506-uiv-fix-pay-06-server-side-validation-and-wi/260506-uiv-SUMMARY.md`
</output>
