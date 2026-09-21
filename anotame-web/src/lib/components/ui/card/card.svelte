<script lang="ts">
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	let {
		ref = $bindable(null),
		class: className,
		children,
		size = "default",
		tone = "default",
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		size?: "default" | "sm";
		/**
		 * `highlight` tints the card in the brand colour (a confirmed selection);
		 * `muted` recesses it (supporting information). Both pad horizontally,
		 * since toned cards hold content directly rather than header/content slots.
		 */
		tone?: "default" | "highlight" | "muted";
	} = $props();

	const TONE = {
		default: "",
		highlight: "bg-primary/5 ring-primary/20 shadow-none px-(--card-spacing)",
		muted: "bg-muted/30 ring-border shadow-none px-(--card-spacing)",
	} as const;
</script>

<div
	bind:this={ref}
	data-slot="card"
	data-size={size}
	data-tone={tone}
	class={cn("ring-foreground/10 bg-card text-card-foreground gap-(--card-spacing) overflow-hidden rounded-xl py-(--card-spacing) text-sm shadow-xs ring-1 [--card-spacing:--spacing(6)] has-[>img:first-child]:pt-0 data-[size=sm]:[--card-spacing:--spacing(4)] *:[img:first-child]:rounded-t-xl *:[img:last-child]:rounded-b-xl group/card flex flex-col", TONE[tone], className)}
	{...restProps}
>
	{@render children?.()}
</div>
