---
quick_task: 260404-giv
description: Investigate and fix formsnap Label control.labelId undefined error
date: 2026-04-04
target_time: 15min
type: quick
autonomous: true
---

<objective>
Fix the persistent runtime error "this.control.labelId undefined" that occurs in formsnap's Label component when Form.Control context is unavailable during component initialization.

**Root cause:** FormSnap v2.0.1's LabelState constructor immediately attempts `this.control.labelId = this.#id` without null-checking the control context. In Svelte 5 with nested snippets (Dialog > Form.Control > Form.Label), context timing can cause the Control context to be undefined when the Label mounts.

**Solution:** Implement a defensive context guard pattern that conditionally renders FormPrimitive.Label only when the Control context is available, with a fallback to a plain label component.
</objective>

<research>
See: 260404-giv-RESEARCH.md

Key findings:
- Two prior quick tasks (260404-g9x, 260404-ge3) attempted and reverted an `asChild` prop fix — not part of FormSnap's API
- FormSnap uses `child` snippet pattern (not `asChild` boolean)
- Guard + fallback recommended over try-catch as cleanest, most robust approach
- Standard Svelte pattern, suitable for dialog + snippet nesting
</research>

<context>
@../../../STATE.md — Phase 12 executing, forms-dialogs-standardization-audit
@260404-giv-RESEARCH.md — Detailed FormSnap architecture analysis
@/anotame-web/src/lib/components/ui/form/form-label.svelte — Current wrapper (no asChild prop)
@/anotame-web/src/lib/components/ui/label/index.js — Fallback label component
</context>

<tasks>

<task type="auto">
  <name>Task 1: Implement context guard in form-label.svelte</name>
  <files>anotame-web/src/lib/components/ui/form/form-label.svelte</files>
  <action>
Update form-label.svelte to use defensive context guard + fallback pattern:

1. Import `getContext` from "svelte"
2. In script initialization, check if FORM_CONTROL_CTX is available:
   ```svelte
   let hasControl = false;
   try {
     const FORM_CONTROL_CTX = Symbol.for("form:control");
     hasControl = !!getContext(FORM_CONTROL_CTX);
   } catch {
     hasControl = false;
   }
   ```

3. Conditionally render two branches:
   - `{#if hasControl}` → render FormPrimitive.Label with child snippet (current implementation)
   - `{:else}` → render plain Label without FormSnap wrapper (fallback)

4. Both branches use same styling: `cn("data-[fs-error]:text-destructive", className)`

5. Do NOT use try-catch wrapper around FormPrimitive.Label itself — use the declarative guard pattern

6. Add comment explaining why guard is needed: "FormSnap v2.0.1 LabelState throws if Control context is unavailable during mount. Guard ensures we only call FormPrimitive.Label when context exists (typical in dialogs with nested snippets)."

Verification: Form.Label must:
- Render with proper styling in form dialogs (customer, service, garment, user, price list overrides, users)
- Appear in browser DevTools as both wrapped (inside Control) and plain (outside Control) variants
- Not throw "this.control.labelId" errors in console
  </action>
  <verify>
After implementation:
1. `bun run build` — must exit with code 0
2. Open browser DevTools Console (Cmd+Opt+J on Mac)
3. Open each of these form dialogs and observe console:
   - Customers page > Add Customer
   - Services page > Add Service
   - Garments page > Add Garment
   - Users page > Add User
   - Price Lists page > Add Price List
   - Price Lists page > Overrides tab > Edit override row
4. Verify: No "this.control.labelId undefined" errors appear
5. Verify: Labels render with correct styling (text color, error state styling)
6. Verify: Form submission works (fill form, submit, confirm success/validation message)
  </verify>
  <done>
- form-label.svelte updated with context guard + fallback pattern
- No "this.control.labelId" errors in console when opening form dialogs
- Labels render correctly in both contexts (wrapped in Control, standalone)
- Form dialogs submit successfully
- Build passes cleanly
  </done>
</task>

</tasks>

<verification>
**Automated verification:** `bun run build` must pass (exit 0)

**Manual verification (required after build):**
1. Open DevTools Console
2. Open 6 form dialogs (customer, service, garment, user, price list, override)
3. Confirm no "this.control.labelId undefined" errors appear
4. Verify form submission works in at least 2 dialogs (e.g., add customer, add service)

**Success indicator:** Zero console errors mentioning "this.control.labelId" or "Cannot set property 'labelId' of undefined"
</verification>

<success_criteria>
- FormSnap Label error resolved across all form dialogs
- No TypeScript compilation errors
- No runtime errors in browser console
- Forms submit successfully with validation
- Labels render with proper styling (text color, error states)
</success_criteria>

<output>
After completion, commit as:
```
git commit -m "fix(form-label): add context guard to prevent FormSnap LabelState undefined error"
```

Update .planning/STATE.md: Add entry to Quick Tasks Completed table with status "VERIFIED" if all checks pass.
</output>
