<script lang="ts">
	import { onMount } from 'svelte';
	import { orderWizardState } from '$lib/services/orders/OrderWizardState.svelte';
	import { apiService, API_CATALOG } from '$lib/services/api.svelte';
	import { AdaptiveSelect } from '$lib/components/ui/responsive';
	import { Button } from '$lib/components/ui/button';
	import { Tag, Loader2, AlertTriangle } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import type { PriceListResponse, PriceListItemDto } from '$lib/types/dtos';

	let priceListOptions = $state<PriceListResponse[]>([]);
	let isLoading = $state(true);
	let hasError = $state(false);
	let selectedPriceListId = $state<string>('');
	let selectedPriceListName = $state<string>('');

	let { onNext, onBack, isEditMode = false } = $props<{
		onNext: () => void;
		onBack: () => void;
		isEditMode?: boolean;
	}>();

	let draft = $derived(orderWizardState.activeDraft);
	let currentPriceList = $derived(orderWizardState.getPriceList());

	// Load price lists on mount
	onMount(async () => {
		try {
			isLoading = true;
			hasError = false;
			const res = await apiService.request<PriceListResponse[]>(`${API_CATALOG}/api/pricelists`);
			priceListOptions = (res || []).filter((pl) => pl.active);
		} catch (e) {
			console.error('Failed to load price lists:', e);
			hasError = true;
			toast.error('No se pudieron cargar las listas de precios', {
				description: 'Puedes continuar sin seleccionar una lista.'
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
				`${API_CATALOG}/api/pricelists/${priceListId}`
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
				toast.success('Lista de precios seleccionada', { description: priceList.name });
			}
		} catch (e) {
			console.error('Failed to load price list details:', e);
			toast.error('Error al cargar la lista de precios');
		}
	}

	function handleContinue() {
		onNext();
	}
</script>

<div class="flex flex-col h-full gap-6">
	<div class="text-center md:text-left">
		{#if isEditMode}
			<h2 class="text-xl font-semibold">Lista de precios</h2>
			<p class="text-sm text-muted-foreground">
				La lista de precios no puede cambiarse después de crear el pedido.
			</p>
		{:else}
			<h2 class="text-xl font-semibold">Paso 2: ¿Qué lista de precios aplica?</h2>
			<p class="text-base text-muted-foreground">
				Elige una lista para pre-llenar precios, o continúa sin una.
			</p>
		{/if}
	</div>

	<div class="flex-1 flex flex-col items-center justify-start max-w-2xl mx-auto w-full gap-8 pt-4">
		{#if isEditMode}
			<!-- Read-only mode: show current price list -->
			<div class="w-full space-y-4">
				<p class="block text-sm font-medium">Lista de precios</p>
				{#if currentPriceList}
					<div class="w-full bg-muted rounded-lg p-4 border border-border">
						<p class="text-base font-medium">{currentPriceList.name}</p>
					</div>
				{:else}
					<div class="w-full bg-muted rounded-lg p-4 border border-border">
						<p class="text-base text-muted-foreground">Sin lista de precios</p>
					</div>
				{/if}
			</div>
		{:else}
			<!-- Selection mode -->
			<div class="w-full space-y-6">
				{#if isLoading}
					<div class="flex items-center justify-center py-12 gap-3">
						<Loader2 class="w-5 h-5 animate-spin text-primary" />
						<span class="text-muted-foreground">Cargando listas de precios...</span>
					</div>
				{:else if hasError}
					<div class="flex flex-col items-center justify-center py-12 gap-3 text-destructive">
						<AlertTriangle class="w-8 h-8" />
						<span class="text-center">No se pudieron cargar las listas de precios</span>
						<p class="text-sm text-muted-foreground">Puedes continuar sin seleccionar una</p>
					</div>
				{:else}
					<AdaptiveSelect
						placeholder="Sin lista de precios"
						bind:value={selectedPriceListId}
						onValueChange={(value) => selectPriceList(value || null)}
						items={[
							{ value: '', label: 'Sin lista de precios' },
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
						<div
							class="w-20 h-20 bg-primary/20 text-primary rounded-full flex items-center justify-center mx-auto mb-4"
						>
							<Tag class="w-10 h-10" />
						</div>
						<h3 class="text-2xl font-semibold">{selectedPriceListName}</h3>
						<p class="text-muted-foreground mt-2">Lista activa para este pedido</p>
					</div>
				{:else if !selectedPriceListId && !isLoading}
					<!-- Message when "Sin lista de precios" selected -->
					<div class="text-center py-8 text-muted-foreground">
						<p>Continuarás sin lista de precios</p>
					</div>
				{/if}
			</div>
		{/if}
	</div>

	<!-- Footer with navigation buttons -->
	<div class="border-t border-border pt-6 flex justify-between gap-4">
		<Button variant="ghost" class="h-12 px-6 touch-manipulation" onclick={onBack}>
			Atrás
		</Button>
		<Button class="h-14 px-12 text-lg rounded-xl touch-manipulation" onclick={handleContinue}>
			Continuar
		</Button>
	</div>
</div>
