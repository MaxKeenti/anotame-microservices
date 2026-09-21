<script lang="ts">
	import IconMedallion from '$lib/components/common/icon-medallion.svelte';
	import * as Alert from '$lib/components/ui/alert';
	import StatePanel from '$lib/components/common/state-panel.svelte';
	import { Heading, Text } from '$lib/components/ui/typography';
	import { onMount } from 'svelte';
	import { orderWizardState } from '$lib/services/orders/OrderWizardState.svelte';
	import { apiService, API_CATALOG } from '$lib/services/api.svelte';
	import { AdaptiveSelect } from '$lib/components/ui/responsive';
	import { Button } from '$lib/components/ui/button';
	import { Tag, AlertTriangle } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';
	import type { PriceListResponse, PriceListItemDto } from '$lib/types/dtos';
	import * as m from '$lib/paraglide/messages';

	let priceListOptions = $state<PriceListResponse[]>([]);
	let isLoading = $state(true);
	let hasError = $state(false);
	let selectedPriceListId = $state<string>('');
	let selectedPriceListName = $state<string>('');

	interface Props {
		onNext: () => void;
		onBack: () => void;
		isEditMode?: boolean;
	}

	let { onNext, onBack, isEditMode = false }: Props = $props();

	let draft = $derived(orderWizardState.activeDraft);
	let currentPriceList = $derived(orderWizardState.getPriceList());

	// Load price lists on mount
	onMount(async () => {
		try {
			isLoading = true;
			hasError = false;
			const res = await apiService.request<PriceListResponse[]>(`${API_CATALOG}/pricelists`);
			priceListOptions = (res || []).filter((pl) => pl.active);
		} catch (e) {
			console.error('Failed to load price lists:', e);
			hasError = true;
			toast.error(m['priceListStep.toast.loadListsError'](), {
				description: m['priceListStep.toast.loadListsErrorDesc']()
			});
		} finally {
			isLoading = false;
		}
	});

	// Pre-populate from existing state (edit mode or draft)
	$effect(() => {
		if (draft && draft.priceListId) {
			selectedPriceListId = draft.priceListId;
			selectedPriceListName = draft.priceListName || '';
		}
	});

	async function selectPriceList(priceListId: string | null) {
		if (!priceListId) {
			selectedPriceListId = '';
			selectedPriceListName = '';
			orderWizardState.clearPriceList();
			return;
		}

		try {
			// Fetch the price list details to get items for auto-fill
			const priceList = await apiService.request<PriceListResponse>(
				`${API_CATALOG}/pricelists/${priceListId}`
			);

			if (priceList) {
				selectedPriceListId = priceList.id;
				selectedPriceListName = priceList.name;

				// Prepare items for auto-fill (serviceId + price)
				const items: Array<{ serviceId: string; price: number }> = (priceList.items || []).map(
					(item: PriceListItemDto) => ({
						serviceId: item.serviceId,
						price: item.price
					})
				);

				orderWizardState.setPriceList(priceList.id, priceList.name, items);
				toast.success(m['priceListStep.toast.selected'](), { description: priceList.name });
			}
		} catch (e) {
			console.error('Failed to load price list details:', e);
			toast.error(m['priceListStep.toast.loadListError']());
		}
	}

	function handleContinue() {
		onNext();
	}
</script>

<div class="flex flex-col flex-1 min-h-0 gap-6">
	<div class="text-center md:text-left">
		{#if isEditMode}
			<Heading level={2}>{m['priceListStep.label']()}</Heading>
			<Text variant="muted">
				{m['orders.priceList.cannotChange']()}
			</Text>
		{:else}
			<Heading level={2}>{m['priceListStep.title']()}</Heading>
			<p class="text-base text-muted-foreground">
				{m['orders.priceList.chooseHint']()}
			</p>
		{/if}
	</div>

	<div class="flex-1 flex flex-col items-center justify-start max-w-2xl mx-auto w-full gap-8 pt-4">
		{#if isEditMode}
			<!-- Read-only mode: show current price list -->
			<div class="w-full space-y-4">
				<p class="block text-sm font-medium">{m['priceListStep.label']()}</p>
				{#if currentPriceList}
					<div class="w-full bg-muted rounded-lg p-4 border border-border">
						<p class="text-base font-medium">{currentPriceList.name}</p>
					</div>
				{:else}
					<div class="w-full bg-muted rounded-lg p-4 border border-border">
						<p class="text-base text-muted-foreground">{m['priceListStep.none']()}</p>
					</div>
				{/if}
			</div>
		{:else}
			<!-- Selection mode -->
			<div class="w-full space-y-6">
				{#if isLoading}
					<StatePanel message={m['priceListStep.loading']()} spinner size="inline" />
				{:else if hasError}
					<Alert.Root variant="destructive">
						<AlertTriangle aria-hidden="true" />
						<Alert.Title>{m['priceListStep.toast.loadListsError']()}</Alert.Title>
						<Alert.Description>{m['priceListStep.toast.loadListsErrorDesc']()}</Alert.Description>
					</Alert.Root>
				{:else}
					<AdaptiveSelect
						placeholder={m['priceListStep.none']()}
						bind:value={selectedPriceListId}
						onValueChange={(value) => selectPriceList(value || null)}
						items={[
							{ value: '', label: m['priceListStep.none']() },
							...priceListOptions.map((pl) => ({
								value: pl.id,
								label: pl.name
							}))
						]}
					/>
				{/if}

				<!-- Confirmation card (shown when price list selected) -->
				{#if selectedPriceListId && selectedPriceListName && !isLoading}
					<div
						class="w-full bg-primary/5 border border-primary/20 rounded-xl p-6 text-center animate-in fade-in zoom-in-95"
					>
						<IconMedallion size="xl" class="mx-auto mb-4"><Tag /></IconMedallion>
						<Heading level={2} as="h3">{selectedPriceListName}</Heading>
						<p class="text-muted-foreground mt-2">{m['priceListStep.activeForOrder']()}</p>
					</div>
				{:else if !selectedPriceListId && !isLoading}
					<!-- Message when "Sin lista de precios" selected -->
					<div class="text-center py-8 text-muted-foreground">
						<p>{m['orders.priceList.continueWithout']()}</p>
					</div>
				{/if}
			</div>
		{/if}
	</div>

	<!-- Footer with navigation buttons -->
	<div class="border-t border-border pt-4 mt-auto flex justify-between gap-4">
		<Button
			variant="outline"
			onclick={onBack}
			class="flex-1 rounded-xl h-11 sm:h-14 text-sm sm:text-lg"
		>
			{m['orders.detail.back']()}
		</Button>
		<Button
			type="submit"
			class="flex-1 rounded-xl h-11 sm:h-14 text-sm sm:text-lg font-bold shadow-md"
			onclick={handleContinue}
		>
			{m['common.continue']()}
		</Button>
	</div>
</div>
