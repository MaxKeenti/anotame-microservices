<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
    import { Toaster } from "$lib/components/ui/sonner";
    import { AdaptiveConfirm } from "$lib/components/ui/responsive";
    import { ModeWatcher } from "mode-watcher";
	import { onMount } from 'svelte';
	import { pwaInfo } from 'virtual:pwa-info';

	let { children } = $props();

	const webManifestLink = $derived(pwaInfo ? pwaInfo.webManifest.linkTag : '');

	onMount(async () => {
		// Register the service worker. Online-only PWA: this makes the app
		// installable and auto-updates in the background on new deploys.
		const { registerSW } = await import('virtual:pwa-register');
		registerSW({ immediate: true });
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html webManifestLink}
</svelte:head>
<Toaster position="top-center" />
<AdaptiveConfirm />
<ModeWatcher />
{@render children()}
