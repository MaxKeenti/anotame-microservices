<script lang="ts" module>
	import { type VariantProps, tv } from "tailwind-variants";

	export const textVariants = tv({
		base: "",
		variants: {
			variant: {
				default: "text-sm text-foreground",
				lead: "text-lg text-muted-foreground",
				muted: "text-sm text-muted-foreground",
				small: "text-xs text-muted-foreground",
				label: "text-xs font-semibold uppercase tracking-wider text-muted-foreground",
				metric: "font-mono font-bold tabular-nums",
			},
			/** Only applies to `metric`. */
			size: {
				sm: "",
				md: "",
				lg: "",
				xl: "",
				"2xl": "",
			},
		},
		compoundVariants: [
			{ variant: "metric", size: "sm", class: "text-lg" },
			{ variant: "metric", size: "md", class: "text-2xl" },
			{ variant: "metric", size: "lg", class: "text-3xl" },
			{ variant: "metric", size: "xl", class: "text-4xl" },
			{ variant: "metric", size: "2xl", class: "text-5xl" },
		],
		defaultVariants: {
			variant: "default",
			size: "md",
		},
	});

	export type TextVariant = VariantProps<typeof textVariants>["variant"];
	export type TextSize = VariantProps<typeof textVariants>["size"];
</script>

<script lang="ts">
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	let {
		ref = $bindable(null),
		variant = "default",
		size = "md",
		as = "p",
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLElement>> & {
		variant?: TextVariant;
		size?: TextSize;
		as?: "p" | "span" | "div" | "label" | "h3" | "h4" | "dt" | "dd";
	} = $props();
</script>

<svelte:element
	this={as}
	bind:this={ref}
	data-slot="text"
	class={cn(textVariants({ variant, size }), className)}
	{...restProps}
>
	{@render children?.()}
</svelte:element>
