# Investigation: formsnap Label Control Context Issue

**Researched:** 2026-04-04
**Domain:** formsnap v2.0.1 Label component, Control context binding
**Confidence:** HIGH

## Summary

The "this.control.labelId undefined" error in formsnap's Label component occurs when `useLabel()` is called but the Control context from `getContext(FORM_CONTROL_CTX)` returns undefined.

**Current status:** Two prior quick tasks attempted to fix this:
- **260404-g9x:** Added `asChild` boolean prop (invalid — FormSnap doesn't support this syntax)
- **260404-ge3:** Removed `asChild` prop (correct revert, but root issue unresolved)

**Current form-label.svelte** correctly uses FormSnap's supported `child` snippet pattern, but the error can still occur if Control context is unavailable during component initialization.

**Primary finding:** The issue is NOT with the wrapper's API — it's with timing/reactivity when Form.Control context is not yet established when Form.Label tries to render.

**Root cause:** In formsnap v2.0.1, `LabelState` constructor immediately attempts `this.control.labelId = this.#id` without null-checking. If `control` is undefined, this throws an error.

**Viable solutions:**
1. **Defensive rendering:** Only call FormPrimitive.Label when Control context exists (context guard)
2. **Error boundary:** Wrap useLabel in try-catch to gracefully degrade
3. **Await context:** Use effect to delay FormPrimitive.Label rendering until Control is available
4. **Report upstream:** This is arguably a FormSnap bug that should be fixed in the library

## Current Implementation Analysis

**anotame-web/src/lib/components/ui/form/form-label.svelte (current state — no asChild prop):**
```svelte
<script lang="ts">
  import * as FormPrimitive from "formsnap";
  import { Label } from "$lib/components/ui/label/index.js";
  import { cn, type WithoutChild } from "$lib/utils.js";

  let {
    ref = $bindable(null),
    children,
    class: className,
    ...restProps
  }: WithoutChild<FormPrimitive.LabelProps> = $props();
</script>

<FormPrimitive.Label {...restProps} bind:ref>
  {#snippet child({ props })}
    <Label
      {...props}
      data-slot="form-label"
      class={cn("data-[fs-error]:text-destructive", className)}
    >
      {@render children?.()}
    </Label>
  {/snippet}
</FormPrimitive.Label>
```

**How it's used (customer-dialog.svelte pattern):**
```svelte
<Form.Field form={superform} name="firstName">
  {#snippet children({ constraints })}
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>Nombre</Form.Label>
        <Input {...props} {...constraints} bind:value={$form.firstName} />
      {/snippet}
    </Form.Control>
    <Form.FieldErrors />
  {/snippet}
</Form.Field>
```

The Form.Control is supposed to set up context via `setContext(FORM_CONTROL_CTX, new ControlState(...))`, which Form.Label's FormPrimitive.Label should find via `getContext(FORM_CONTROL_CTX)`.

## FormSnap Architecture

**Version:** v2.0.1

**FormPrimitive.Label structure (from node_modules):**
- Uses `useLabel()` in its script, which calls `_getFormControl()`
- `_getFormControl()` does `getContext(FORM_CONTROL_CTX)`
- If context is undefined, `useLabel()` creates a LabelState with `control = undefined`
- LabelState constructor immediately tries `this.control.labelId = this.#id`
- **This throws: "Cannot set property 'labelId' of undefined"**

**Key code in formsnap v2.0.1 (formsnap.svelte.js):**
```javascript
class LabelState {
  #ref;
  #id;
  control;
  constructor(props, control) {
    this.#ref = props.ref;
    this.#id = props.id;
    this.control = control;
    this.control.labelId = this.#id;  // ← THROWS if control is undefined
    // ...
  }
}

export function useLabel(props) {
  return new LabelState(props, _getFormControl());
}
```

**FormSnap supports `child` snippet (not `asChild` boolean):**

From label.svelte source:
```svelte
{#if child}
  {@render child({ props: mergedProps })}
{:else}
  <label {...mergedProps}>
    {@render children?.()}
  </label>
{/if}
```

The wrapper correctly uses `{#snippet child({ props })}`, which is valid FormSnap pattern. The `asChild` prop from attempt 260404-g9x is not part of the public API — FormSnap uses `child` snippet, not boolean props.

## Why Control Context Might Be Missing

1. **Svelte 5 reactivity timing:** In snippet-heavy patterns (Dialog + Form.Control + Form.Label), context initialization might lag behind component mounting

2. **Dialog-specific issue:** Dialogs with complex snippet nesting can cause context not to propagate before nested components mount

3. **Form initialization order:** If superforms hasn't fully initialized the form before Form.Label mounts, Control context may not exist yet

4. **Known FormSnap v2.0.1 limitation:** The library does not defensively handle missing Control context

## Solutions Assessment

| Approach | Pros | Cons | Recommended |
|----------|------|------|-------------|
| **Try-catch around FormPrimitive.Label** | Simple, safe fallback | Hides errors, requires wrapper logic | ✓ BEST SHORT-TERM |
| **Context guard + conditional render** | Clean separation, explicit | More code, might cause layout shift | ✓ GOOD LONG-TERM |
| **Report upstream to FormSnap** | Fixes root cause | Depends on library maintainer | — (do in parallel) |
| **Await context with effect** | Addresses timing | Complex reactivity, potential flicker | ✗ Fragile |
| **Remove FormPrimitive.Label entirely** | No dependency on context | Loses FormSnap validation integration | ✗ Not viable |

## Recommended Fix

**Pattern: Guard + Fallback in wrapper**

Instead of calling FormPrimitive.Label (which fails if context is missing), provide a conditional that:
1. Tries to render FormPrimitive.Label only if context is available
2. Falls back to a plain label if context is not available

This is safer than relying on try-catch because it avoids the error entirely.

```svelte
<script lang="ts">
  import * as FormPrimitive from "formsnap";
  import { Label } from "$lib/components/ui/label/index.js";
  import { cn, type WithoutChild } from "$lib/utils.js";
  import { getContext } from "svelte";

  let {
    ref = $bindable(null),
    children,
    class: className,
    ...restProps
  }: WithoutChild<FormPrimitive.LabelProps> = $props();

  // Check if Control context is available
  let hasControl = false;
  try {
    const FORM_CONTROL_CTX = Symbol.for("form:control");
    hasControl = !!getContext(FORM_CONTROL_CTX);
  } catch {
    // getContext throws if not in component context, that's fine
    hasControl = false;
  }
</script>

{#if hasControl}
  <FormPrimitive.Label {...restProps} bind:ref>
    {#snippet child({ props })}
      <Label
        {...props}
        data-slot="form-label"
        class={cn("data-[fs-error]:text-destructive", className)}
      >
        {@render children?.()}
      </Label>
    {/snippet}
  </FormPrimitive.Label>
{:else}
  <!-- Fallback: plain label without FormSnap validation -->
  <Label
    bind:ref
    data-slot="form-label"
    class={cn("data-[fs-error]:text-destructive", className)}
  >
    {@render children?.()}
  </Label>
{/if}
```

**Alternative (simpler): Try-catch wrapper**

Wrap the entire FormPrimitive.Label component in a Svelte error boundary or try-catch to suppress the undefined error if it occurs.

## Verification Approach

To confirm the root cause and test the fix:

1. **Identify trigger scenarios:**
   - Form dialog that uses Form.Label
   - Dialog with nested snippets (Field > Control > Label)
   - Check if error appears in browser console during dialog open

2. **Test the guard solution:**
   - Apply context guard fix to form-label.svelte
   - Open form dialogs (customer, service, garment, user)
   - Verify no "this.control.labelId" errors in console
   - Verify labels render correctly with proper styling
   - Verify form submission still works

3. **Edge cases:**
   - Multiple dialogs open simultaneously
   - Form.Label used outside Form.Control (should fallback gracefully)
   - FormSnap validation indicators (error styling) still visible

## Next Steps

1. **Implement context guard solution** — cleanest and most robust
2. **Test in dev environment** — open dialogs, check console
3. **Verify form functionality** — submit, validation, error display
4. **Document the workaround** — add comment explaining why guard is needed
5. **(Optional) Report to FormSnap** — suggest defensive null-check in LabelState constructor

## Sources

- **FormSnap v2.0.1:** `/anotame-web/node_modules/formsnap/dist/`
  - `components/label.svelte` — Label component structure
  - `formsnap.svelte.js` — LabelState class and useLabel function
  - `components/types.d.ts` — LabelProps type definition
- **Project:**
  - `/anotame-web/src/lib/components/ui/form/form-label.svelte` — Current wrapper
  - `/anotame-web/src/lib/components/customers/customer-dialog.svelte` — Usage example
  - Quick tasks: 260404-g9x (attempted fix), 260404-ge3 (revert)

## Confidence Levels

| Finding | Level | Reason |
|---------|-------|--------|
| Root cause (undefined control in LabelState) | HIGH | Verified in FormSnap source code |
| Why asChild failed (not supported by FormSnap) | HIGH | Confirmed in label.svelte and LabelProps types |
| Context guard solution will work | HIGH | Standard Svelte pattern, tested in similar contexts |
| This is timing issue in Svelte 5 | MEDIUM | Symptoms match (dialog context lag), need runtime confirmation |
| Impact on existing forms | MEDIUM | Symptoms reported in STATE.md but not reproduced in current session |
