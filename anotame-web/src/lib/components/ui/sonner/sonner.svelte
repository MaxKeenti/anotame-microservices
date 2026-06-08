<script lang="ts">
	import { Toaster as Sonner, type ToasterProps as SonnerProps } from "svelte-sonner";
	import { mode } from "mode-watcher";
	import Loader2Icon from '@lucide/svelte/icons/loader-2';
	import CircleCheckIcon from '@lucide/svelte/icons/circle-check';
	import OctagonXIcon from '@lucide/svelte/icons/octagon-x';
	import InfoIcon from '@lucide/svelte/icons/info';
	import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';

	let { ...restProps }: SonnerProps = $props();

	const sonnerThemeStyle = [
		'--normal-bg: var(--color-popover);',
		'--normal-bg-hover: var(--color-muted);',
		'--normal-border: var(--color-border);',
		'--normal-border-hover: var(--color-border);',
		'--normal-text: var(--color-popover-foreground);',
		'--success-bg: var(--color-success-background);',
		'--success-border: var(--color-success-border);',
		'--success-text: var(--color-success-background-foreground);',
		'--info-bg: var(--color-info-background);',
		'--info-border: var(--color-info-border);',
		'--info-text: var(--color-info-background-foreground);',
		'--warning-bg: var(--color-warning-background);',
		'--warning-border: var(--color-warning-border);',
		'--warning-text: var(--color-warning-background-foreground);',
		'--error-bg: var(--color-destructive-background);',
		'--error-border: var(--color-destructive-border);',
		'--error-text: var(--color-destructive-foreground);'
	].join(' ');
</script>

<Sonner
	theme={mode.current}
	richColors
	class="toaster group"
	style={sonnerThemeStyle}
	{...restProps}
>
	{#snippet loadingIcon()}
		<Loader2Icon class="size-4 animate-spin" />
	{/snippet}
	{#snippet successIcon()}
		<CircleCheckIcon class="size-4" />
	{/snippet}
	{#snippet errorIcon()}
		<OctagonXIcon class="size-4" />
	{/snippet}
	{#snippet infoIcon()}
		<InfoIcon class="size-4" />
	{/snippet}
	{#snippet warningIcon()}
		<TriangleAlertIcon class="size-4" />
	{/snippet}
</Sonner>
