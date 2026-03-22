<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
    import { Toaster } from "$lib/components/ui/sonner";
    import GlobalConfirmDialog from "$lib/components/ui/responsive/global-confirm-dialog.svelte";

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
<Toaster />
<GlobalConfirmDialog />
{@render children()}
