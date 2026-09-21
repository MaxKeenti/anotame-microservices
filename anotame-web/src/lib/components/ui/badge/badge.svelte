<script lang="ts" module>
	import { type VariantProps, tv } from "tailwind-variants";

	export const badgeVariants = tv({
		base: "h-5 gap-1 rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium transition-all has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&>svg]:size-3! group/badge inline-flex w-fit shrink-0 items-center justify-center overflow-hidden whitespace-nowrap focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none",
		variants: {
			variant: {
				default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
				secondary: "bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",
				destructive: "bg-destructive/10 [a]:hover:bg-destructive/20 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 text-destructive dark:bg-destructive/20",
				outline: "border-border text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground",
				ghost: "hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
				link: "text-primary underline-offset-4 hover:underline",
				success: "bg-success-muted text-success-text border-success/20",
				warning: "bg-warning-muted text-warning-text border-warning/20",
				info: "bg-info-muted text-info-text border-info/20",
				danger: "bg-destructive-muted text-destructive-text border-destructive/20",
				muted: "bg-muted text-muted-foreground border-border",
				/** Brand-tinted tag, such as the "Custom" marker on garments and services. */
				brand: "bg-primary/10 text-primary border-primary/20 uppercase tracking-wide",
			},
			size: {
				default: "",
				lg: "h-auto px-4 py-2 text-sm",
			},
			/** Bold, uppercase treatment for workflow status. */
			emphasis: {
				true: "font-bold uppercase tracking-wide shadow-sm",
				false: "",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
			emphasis: false,
		},
	});

	export type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];
	export type BadgeSize = VariantProps<typeof badgeVariants>["size"];
</script>

<script lang="ts">
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAnchorAttributes } from "svelte/elements";

	let {
		ref = $bindable(null),
		href,
		class: className,
		variant = "default",
		size = "default",
		emphasis = false,
		children,
		...restProps
	}: WithElementRef<HTMLAnchorAttributes> & {
		variant?: BadgeVariant;
		size?: BadgeSize;
		emphasis?: boolean;
	} = $props();
</script>

<svelte:element
	this={href ? "a" : "span"}
	bind:this={ref}
	data-slot="badge"
	{href}
	class={cn(badgeVariants({ variant, size, emphasis }), className)}
	{...restProps}
>
	{@render children?.()}
</svelte:element>
