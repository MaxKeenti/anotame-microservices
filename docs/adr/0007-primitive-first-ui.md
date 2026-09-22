# Primitive-First UI: Variants Over Call-Site Styling

A UI audit of `anotame-web` found eleven installed shadcn primitives with no call sites (ToggleGroup,
ButtonGroup, InputGroup, Field, Item, Pagination, InputOTP, Spinner, Alert, and more) while their
behaviour was rebuilt by hand across pages: three copies of a payment-method picker, nine alert
boxes, three pagers, six "icon in a circle" medallions, a native range input, and button heights set
with `h-11`/`h-12`/`h-14` in over 200 places. Each copy drifted: touch targets fell below 44px, dialogs
lost their mobile gutter, cards used three radii, and pages set their own widths and bottom padding.

The decision is a fixed order of reach when building UI:

1. **An installed primitive** from `$lib/components/ui/`, used through its variants.
2. **A composition** in `$lib/components/common/` (or a feature folder) built from primitives, when
   the same arrangement appears twice.
3. **A new variant** on the primitive when a style repeats — the primitive may be edited for this,
   since a variant is a documented, additive change. A long `class` string at the call site is the
   signal that a variant is missing.
4. Hand-written markup only for what no primitive covers (the dock's magnification, the capacity
   calendar), and then styled with semantic tokens.

Variants added by the audit, and what they replace:

- `Button` sizes `touch` (44px), `touch-lg` (48px), `xl` (56px), `icon-touch`, and `step` (wizard
  navigation: 44px on phones, 56px from `sm`); variant `destructive-outline`. `touch-manipulation` is
  in the base, so call sites never add it.
- Fields (`Input`, `InputGroup`, `Select`) default to 48px; `inputSize="lg"` (56px) for prominent
  wizard fields.
- `Toggle`/`ToggleGroup` variants `segmented` (selected fills with primary) and `tile` (bordered
  choice card), sizes `touch`, `tile`, `tile-lg` — for every "pick one of N" row.
- `Alert` tones `warning`, `info`, `success`; `Badge` variant `brand`, size `lg`, flag `emphasis`.
- `Card` prop `tone`: `highlight` (confirmed selection) and `muted` (supporting information).
- `Tabs.List` variant `bordered`; `Text variant="metric"` sizes up to `2xl`.
- `StatePanel` prop `size`: `screen`, `page`, `section`, `inset`, `inline`.

Compositions added: `NavLink` (navigation link shapes `tab`, `sidebar`, `chip`, `tile`, `card`, `skip`,
styled from `data-current` so the highlight and `aria-current` never disagree), `CheckboxField`
(checkbox and label as one touch target), `PageContainer`
(page width `full`/`wide`/`form`/`narrow`, section rhythm, entry animation), `RowActions`, `SimplePager`, `PaymentMethodPicker`, `IconMedallion`, and the shared
`DOCK_SURFACE` style for the dock and the bulk-action bar that replaces it.

**Enforcement:** `scripts/lint-ui-composition.mjs` runs as `bun run lint:ui` in `prebuild` and fails
the build on raw form controls in components (the dock tile excepted), class-sized or re-rounded
buttons, fields and cards, icon-only buttons without a label, styled `<label>`s and `<a>`s, bare `max-w-*` on
dialogs, hand-rolled spinners, hand-formatted money, hard-coded locales, the `$props<{…}>()` form, and
page width or animation set on dashboard routes.

**Considered Options:** Keep per-page styling and document conventions; wrap every primitive in a
project component; or edit primitives with variants and compose them. Wrapping everything hides the
shadcn API and doubles the surface; conventions alone are what produced the drift.

**Consequences:** Primitives in `ui/` are no longer byte-for-byte regenerable — re-running
`shadcn-svelte add` over `button`, `badge`, `alert`, `card`, `input`, `input-group`, `select`,
`toggle`, `tabs`, or `typography` would
drop the project variants, so regenerate those by diffing, not overwriting. Shared shells own layout:
`AppShell` owns gutters and dock clearance, `PageContainer` owns width and vertical rhythm, and pages
must not add their own `pb-*`, `max-w-*`, or entry animation. Money is formatted only by
`formatCurrency` and dates only through `getIntlLocale()` from `$lib/utils/formatUtils`, so a locale
change reaches every screen, receipt, and tag.
