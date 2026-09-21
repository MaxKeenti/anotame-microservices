# Route Pages Compose, They Do Not Style

Files under `src/routes/` compose primitives from `$lib/components/ui/` (shadcn-generated) and
compositions from `$lib/components/common/` or a feature folder. They do not style raw HTML.

- Forbidden in a route page: a bare `<div>`, `<p>`, `<span>`, `<h1>`, `<li>` (etc.) whose `class`
  carries visual utilities — `text-*`, `bg-*`, `border*`, `rounded*`, `shadow*`, `font-*`, `ring-*`,
  `leading-*`, `tracking-*`.
- Allowed in a route page: pure layout utilities on a wrapper — `flex`, `grid`, `gap-*`, `space-*`,
  spacing, and responsive variants of those.
- Allowed: a short `class` on a primitive (`<Card.Root class="gap-2">`) to adapt spacing at the call
  site. A long class string on a primitive means the variant belongs in the primitive.
- A route needing a visual treatment extracts it: cross-feature markup to
  `src/lib/components/common/`, feature-specific markup to the matching folder under
  `src/lib/components/`.

Styling is Tailwind-only. No `<style>` blocks, and no new custom CSS in `src/routes/layout.css` —
that file is the theme boundary and holds design tokens, shadcn-generated `@layer base` /
`@custom-variant` blocks, and Tailwind v4 `@utility` definitions. Reach for a Tailwind variant
(`motion-reduce:`, `dark:`, `data-*:`) before writing a selector; a rule that targets Tailwind's own
generated class names from CSS is always wrong, because it silently covers only the utilities spelled
out in it.

**Consequences:** Styling that lives in route markup cannot be reused, cannot be tested in isolation,
and drifts between pages — the failure mode that produced the `.status-badge` and `.checkbox-custom`
`@apply` blobs this decision removes. Every route was migrated, and the rule is enforced:
`scripts/lint-route-composition.mjs` runs as `bun run lint:routes` in the `prebuild` hook and fails
the build on visual classes on bare elements or links, raw `<button>`/`<input>`/`<select>`/`<textarea>`,
inline `style` attributes in routes, or any `<style>` block under `src/`. A route that needs a new visual
treatment extracts a component rather than relaxing the gate.
