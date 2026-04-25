<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
    import { Toaster } from "$lib/components/ui/sonner";
    import { AdaptiveConfirm } from "$lib/components/ui/responsive";
    import { ModeWatcher } from "mode-watcher";

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
<Toaster position="top-center" />
<AdaptiveConfirm />
<ModeWatcher />
{@render children()}
