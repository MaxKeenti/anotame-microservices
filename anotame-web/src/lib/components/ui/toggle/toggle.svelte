<script lang="ts" module>
	import { type VariantProps, tv } from "tailwind-variants";

	export const toggleVariants = tv({
		base: "hover:text-foreground aria-pressed:bg-muted focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive gap-1 rounded-md text-sm font-medium transition-[color,box-shadow] [&_svg:not([class*='size-'])]:size-4 group/toggle inline-flex items-center justify-center whitespace-nowrap outline-none hover:bg-muted focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
		variants: {
			variant: {
				default: "bg-transparent",
				outline: "border-input hover:bg-muted border bg-transparent shadow-xs",
				/** Option row whose selected item takes the primary fill, like a segmented control. */
				segmented: "border-input border bg-background shadow-xs aria-pressed:bg-primary aria-pressed:text-primary-foreground aria-pressed:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:border-primary data-[state=on]:hover:bg-primary/85",
				/** Large bordered choice card; the selected card is outlined and tinted in the brand colour. */
				tile: "border-2 border-border bg-card rounded-xl hover:border-primary/50 hover:bg-primary/5 aria-pressed:border-primary aria-pressed:bg-primary/10 aria-pressed:text-primary data-[state=on]:border-primary data-[state=on]:bg-primary/10 data-[state=on]:text-primary",
			},
			size: {
				default: "h-9 min-w-9 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
				sm: "h-8 min-w-8 px-2.5 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5",
				lg: "h-10 min-w-10 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
				touch: "h-11 min-w-11 px-4 touch-manipulation",
				/** Stacked icon + label choice, compact enough for a dialog. */
				tile: "h-auto min-h-16 flex-col gap-1 px-2 py-3 whitespace-normal text-center touch-manipulation [&_svg:not([class*='size-'])]:size-5",
				/** Stacked icon + label choice for a page-level setting. */
				"tile-lg": "h-24 flex-col gap-2 p-4 whitespace-normal text-center touch-manipulation [&_svg:not([class*='size-'])]:size-6",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	});

	export type ToggleVariant = VariantProps<typeof toggleVariants>["variant"];
	export type ToggleSize = VariantProps<typeof toggleVariants>["size"];
	export type ToggleVariants = VariantProps<typeof toggleVariants>;
</script>

<script lang="ts">
	import { Toggle as TogglePrimitive } from "bits-ui";
	import { cn } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		pressed = $bindable(false),
		class: className,
		size = "default",
		variant = "default",
		...restProps
	}: TogglePrimitive.RootProps & {
		variant?: ToggleVariant;
		size?: ToggleSize;
	} = $props();
</script>

<TogglePrimitive.Root
	bind:ref
	bind:pressed
	data-slot="toggle"
	class={cn(toggleVariants({ variant, size }), className)}
	{...restProps}
/>
