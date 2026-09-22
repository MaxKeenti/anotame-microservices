<script lang="ts" module>
	import { type VariantProps, tv } from "tailwind-variants";

	/** Visual heading scale. `level` is importance, not the rendered tag (see `as`). */
	export const headingVariants = tv({
		base: "font-heading text-foreground tracking-tight",
		variants: {
			level: {
				1: "text-2xl font-bold sm:text-3xl",
				2: "text-xl font-semibold",
				3: "text-lg font-semibold",
				4: "text-base font-semibold",
			},
		},
		defaultVariants: {
			level: 2,
		},
	});

	export type HeadingLevel = NonNullable<VariantProps<typeof headingVariants>["level"]>;
</script>

<script lang="ts">
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	let {
		ref = $bindable(null),
		level = 2,
		as,
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLHeadingElement>> & {
		level?: HeadingLevel;
		/** Rendered tag; defaults to `h{level}`. */
		as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span";
	} = $props();
</script>

<svelte:element
	this={as ?? `h${level}`}
	bind:this={ref}
	data-slot="heading"
	class={cn(headingVariants({ level }), className)}
	{...restProps}
>
	{@render children?.()}
</svelte:element>
