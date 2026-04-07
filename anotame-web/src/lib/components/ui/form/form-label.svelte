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

	// FormSnap v2.0.1 LabelState throws if Control context is unavailable during mount.
	// Guard ensures we only call FormPrimitive.Label when context exists (typical in dialogs
	// with nested snippets). Falls back to plain label component if context is not available.
	let hasControl = (() => {
		try {
			const FORM_CONTROL_CTX = Symbol.for("form:control");
			return !!getContext(FORM_CONTROL_CTX);
		} catch {
			// getContext throws if not in component context, that's fine
			return false;
		}
	})();
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
