# Handoff: App-wide hardcoded-Spanish sweep

> **Transient work doc.** Delete this file once the residuals below are closed.
> Scope: `anotame-web` frontend. Aligns with
> [`docs/adr/0003-strings-only-localization.md`](../docs/adr/0003-strings-only-localization.md):
> Spanish (`es`) is authoritative, English (`en`) may be rough, localize **strings only**
> via Paraglide (dates/numbers/currency stay in MX format).

## TL;DR

The sweep is **effectively complete**. A full scan found **zero accented Spanish** in any
`.svelte` file and only **4 residual hardcoded strings** total — all edge cases (generic
UI-primitive prop defaults + one data fallback). They were left out of the earlier passes
because they are not plain markup. Knock these four out and the app is fully extracted.

## Verification methodology (re-run before and after)

From `anotame-web/`:

```bash
# 1. Accented Spanish in markup — should print nothing
grep -rlP '[\x{00e1}\x{00e9}\x{00ed}\x{00f3}\x{00fa}\x{00f1}\x{00bf}\x{00a1}]' \
  src --include='*.svelte' | grep -v paraglide

# 2. Accent-free Spanish UI keywords in .svelte (excludes m['…'] AND m["…"], comments, identifiers)
grep -rnE '\b(Cliente|Prenda|Pedido|Guardar|Cancelar|Eliminar|Buscar|Selecciona|Seleccionar|Cargando|Nuevo|Nueva|Agregar|Configura|Usuario|Aceptar|Cerrar|Volver|Filtrar|Servicio|Empleado|Reporte|Resumen|Detalle|Estado|Entrega|Pago|Saldo|Monto|Borrador)\b' \
  src --include='*.svelte' \
  | grep -vE "paraglide|m\['|m\[\"|//|<!--|/\*|\*/" \
  | grep -vE '\b(class|id|name|key|value|bind|let |const |function |import |type |interface )'

# 3. Same keyword sweep over .ts / .svelte.ts (toasts, fallbacks, services)
grep -rnE "\b(Cliente|Prenda|Pedido|Guardar|Cancelar|Eliminar|Buscar|Seleccionar|Cargando|Nuevo|Nueva|Agregar|Usuario|nombre|lista|exitosamente|obligatori|requerid)\b" \
  src --include='*.ts' | grep -vE "paraglide|m\[|//|import |console\."

# 4. Spanish connective phrases in JSX text (catches full sentences the keyword list misses)
grep -rnE ">[^<>{}]*\b(de la|de los|para el|sin |este |esta |por favor|selecciona|ingresa|días|aquí)\b" \
  src --include='*.svelte' | grep -v paraglide
```

> Gotchas that caused false positives/negatives during the audit:
> - `m["…"]` (double quotes) is used in some files, not just `m['…']` — exclude **both**.
> - Short tokens like `Mes`/`Ver` match inside identifiers (`errorMessage`, `Version`) — avoid them or use `\b`.
> - ugrep's `[áéíóú]` literal class is unreliable here; use the PCRE `\x{…}` form (`grep -P`).

## Residual inventory (4 items)

| # | File:line | Current string | Recommended key | Notes |
|---|-----------|----------------|-----------------|-------|
| 1 | `src/lib/components/ui/responsive/adaptive-select.svelte:8` | `placeholder = 'Seleccionar...'` | **new** `common.select` = `Seleccionar...` / `Select...` | No exact key yet (`customerStep.select` is `Seleccionar` w/o ellipsis). |
| 2 | `src/lib/components/ui/responsive/adaptive-date-picker.svelte:18` | `placeholder = 'Seleccionar fecha...'` | reuse `orders.filter.selectDate` **or** promote to `common.selectDate` | Value already exists under `orders.filter.*`; a `common.*` home is cleaner for a generic primitive. |
| 3 | `src/lib/components/ui/responsive/adaptive-datetime-picker.svelte:18` | `placeholder = 'Seleccionar fecha y hora...'` | reuse `orders.wizard.selectDateTimePlaceholder` **or** promote to `common.selectDateTime` | Same trade-off as #2. |
| 4 | `src/lib/services/orders/OrderWizardState.svelte.ts:162` | `name: … \|\| 'Sin nombre'` | reuse `orders.noName` (= `Sin nombre`) | Data fallback in `getPriceList()`. `.svelte.ts` can import `* as m from '$lib/paraglide/messages'`. |

### Design decision for #1–#3 (flag before implementing)

These are **default values of props on generic UI primitives**, not domain markup. Two viable patterns:

- **A (recommended):** import `* as m` in each adaptive component and set the default to a
  `common.*` key, e.g. `placeholder = m['common.select']()`. Svelte 5 re-evaluates `$props()`
  destructuring defaults reactively, so this stays locale-aware. Lowest-friction.
- **B:** make `placeholder` required and force every call site to pass a localized value.
  More invasive (every consumer changes); only worth it if we want to ban silent defaults.

Pick A unless there's appetite for the broader refactor. If promoting the date strings to
`common.*` (rather than reusing the `orders.*` keys), add the new keys and leave the existing
`orders.*` keys in place (they're still referenced elsewhere).

## Conventions for any new keys

- Add to **both** `messages/es.json` and `messages/en.json` (keep es/en at full key parity).
- Key shape enforced by lint: `domain.component.purpose`, 2–4 camelCase segments
  (`/^[a-z][a-zA-Z]*(\.[a-z][a-zA-Z]*){1,3}$/`).
- Reuse `common.*` for shared words; component-specific strings get their own namespace.
- Files are **insertion-ordered, not sorted** — append new keys at the end.

## Done / verify

```bash
bun run lint:i18n   # naming gate — now also runs automatically via the `prebuild` hook
bun run check       # svelte-check: must stay 0 errors
bun run build       # regenerates compiled Paraglide messages (required for new m['…'] keys to type-check)
```

After the build regenerates `src/lib/paraglide/` (gitignored), re-run the four scans above —
all four should print nothing — then delete this file.

## Known gaps in the tooling (out of scope, optional follow-ups)

- `lint:i18n` checks **key naming only**. It does **not** verify es/en parity or detect
  unused/missing keys. A parity + usage check would make the gate meaningfully stronger.
- There is no CI (`.github/`) in the repo; the lint gate currently only fires through
  `bun run build` (local + deploy build step) via the `prebuild` hook added in this effort.
