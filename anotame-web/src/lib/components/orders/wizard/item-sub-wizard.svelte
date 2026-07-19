<script lang="ts">
	import { onMount } from 'svelte';
	import { orderWizardState } from '$lib/services/orders/OrderWizardState.svelte';
	import { apiService, API_CATALOG } from '$lib/services/api.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import { ArrowLeft, CheckCircle2, Pencil, Plus, X } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';
	import * as m from '$lib/paraglide/messages';
	import type { GarmentTypeResponse, OrderContentSource, ServiceResponse } from '$lib/types/dtos';
	import type { DraftOrderItem } from '$lib/services/orders/OrderWizardState.svelte';

	type DraftService = DraftOrderItem['services'][number];
	type GarmentSelection = {
		id: string | null;
		name: string;
		description: string;
		source: OrderContentSource;
	};
	type TempService = {
		id: string | null;
		name: string;
		description: string;
		source: OrderContentSource;
		defaultDurationMin?: number;
		basePrice?: number;
		effectivePrice?: number;
	};

	let props = $props<{
		initialItem?: DraftOrderItem,
		onSave: (item: DraftOrderItem) => void,
		onCancel: () => void
	}>();

	function getInitialStep() {
		return props.initialItem ? 1 : 0;
	}
	let step = $state(getInitialStep());
	let garmentTypes = $state<GarmentTypeResponse[]>([]);
	let services = $state<ServiceResponse[]>([]);
	let loading = $state(true);

	let selectedGarment = $state<GarmentSelection | null>(null);
	let addedServices = $state<DraftService[]>([]);
	let showCustomGarmentForm = $state(false);
	let customGarmentName = $state('');

	let tempService = $state<TempService | null>(null);
	let price = $state<string>("");
	let adj = $state<string>("");
	let adjReason = $state("");
	let duration = $state<number>(30);
	let instructions = $state("");

	let editingServiceIndex = $state(-1);

	let notes = $state("");
	let showAllServices = $state(false);
	let serviceFilter = $state("");
	let peekedServiceId = $state<string | null>(null);
	let servicePeekTimer: ReturnType<typeof setTimeout> | null = null;
	let serviceClickSuppressTimer: ReturnType<typeof setTimeout> | null = null;
	let servicePeekPointerId: number | null = null;
	let servicePeekStart = { x: 0, y: 0 };
	let suppressNextServiceClick = false;

	// Get the currently selected price list
	let priceList = $derived(orderWizardState.getPriceList());

	// O(1) lookup map: serviceId → price list price
	let priceListMap = $derived(
		priceList?.items
			? new Map(priceList.items.map((item: { serviceId: string; price: number }) => [item.serviceId, item.price]))
			: new Map<string, number>()
	);

	onMount(async () => {
		try {
			const [gRes, sRes] = await Promise.all([
				apiService.request<GarmentTypeResponse[]>(`${API_CATALOG}/catalog/garments`),
				apiService.request<ServiceResponse[]>(`${API_CATALOG}/catalog/services`)
			]);
			garmentTypes = (gRes || []).sort((a: GarmentTypeResponse, b: GarmentTypeResponse) => a.name.localeCompare(b.name, 'es'));
			services = sRes || [];

			const init = props.initialItem;
			if (init) {
				const source = init.source ?? (init.garmentTypeId || init.garmentId ? 'CATALOG' : 'CUSTOM');
				if (source === 'CUSTOM') {
					selectedGarment = {
						id: null,
						name: init.garmentName || '',
						description: '',
						source: 'CUSTOM'
					};
				} else {
					let g = garmentTypes.find(x => x.id === init.garmentId || x.id === init.garmentTypeId);
					if (!g && init.garmentName) {
						const targetName = init.garmentName.toLowerCase();
						g = garmentTypes.find(x => x.name.toLowerCase() === targetName);
					}
					if (g) selectedGarment = { ...g, source: 'CATALOG' };
				}

				if (init.services) {
					addedServices = init.services.map((service: DraftService) => ({
						...service,
						source: service.source ?? (service.serviceId ? 'CATALOG' : 'CUSTOM')
					}));
				}
				notes = init.notes || "";
			}
		} catch (e) {
			console.error(e);
		} finally {
			loading = false;
		}
	});

	let filteredServices = $derived.by(() => {
		if (!selectedGarment) return [];
		let candidates = services;

		if (!showAllServices && selectedGarment.source === 'CATALOG') {
			const byId = services.filter(s => s.garmentTypeId === selectedGarment!.id);
			if (byId.length > 0) candidates = byId;
			else {
				const normalize = (str: string) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
				const garmentName = normalize(selectedGarment!.name);
				const searchTerms = [garmentName];
				if (garmentName.endsWith('es')) searchTerms.push(garmentName.slice(0, -2));
				else if (garmentName.endsWith('s')) searchTerms.push(garmentName.slice(0, -1));

				candidates = services.filter(s => {
					const sName = normalize(s.name);
					return searchTerms.some(term => sName.includes(term));
				});
			}
		}

		return [...candidates].sort((a, b) => a.name.localeCompare(b.name, 'es'));
	});

	let visibleServices = $derived.by(() => {
		if (!serviceFilter.trim()) return filteredServices;
		const q = serviceFilter.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
		return filteredServices.filter(s => {
			const sName = s.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
			return sName.includes(q);
		});
	});

	function handleGarmentSelect(g: GarmentTypeResponse) {
		selectedGarment = { ...g, source: 'CATALOG' };
		addedServices = [];
		step = 1;
		showAllServices = false;
		serviceFilter = "";
	}

	function handleCustomGarmentSelect() {
		const name = customGarmentName.trim();
		if (!name) {
			toast.error(m['itemSubWizard.validation.customGarmentName']());
			return;
		}
		selectedGarment = { id: null, name, description: '', source: 'CUSTOM' };
		addedServices = [];
		showCustomGarmentForm = false;
		showAllServices = true;
		serviceFilter = '';
		step = 1;
	}

	function handleServiceSelect(s: ServiceResponse) {
		tempService = { ...s, source: 'CATALOG' };
		
		// Auto-fill from price list if selected, otherwise use service default price
		if (priceList?.items && priceList.items.length > 0) {
			const priceListItem = priceList.items.find(item => item.serviceId === s.id);
			if (priceListItem) {
				price = String(priceListItem.price);
				// Show that price came from price list
				toast.info(m['itemSubWizard.toast.priceFromList'](), { description: `${priceListItem.price}` });
			} else {
				// Service not in price list - leave price blank per D-06
				price = "";
				toast.info(m['itemSubWizard.toast.serviceNotInList'](), { description: m['itemSubWizard.toast.serviceNotInListDesc']() });
			}
		} else {
			// No price list selected - use service default
			price = String(s.effectivePrice ?? s.basePrice);
		}
		
		adj = "";
		adjReason = "";
		duration = s.defaultDurationMin || 30;
		instructions = "";
		step = 2;
	}

	function handleCustomServiceSelect() {
		tempService = { id: null, name: '', description: '', source: 'CUSTOM' };
		price = '';
		adj = '';
		adjReason = '';
		duration = 30;
		instructions = '';
		editingServiceIndex = -1;
		step = 2;
	}

	function clearServicePeekTimer() {
		if (!servicePeekTimer) return;
		clearTimeout(servicePeekTimer);
		servicePeekTimer = null;
	}

	function clearServiceClickSuppression() {
		if (serviceClickSuppressTimer) {
			clearTimeout(serviceClickSuppressTimer);
			serviceClickSuppressTimer = null;
		}
		suppressNextServiceClick = false;
	}

	function armServiceClickSuppression() {
		if (serviceClickSuppressTimer) {
			clearTimeout(serviceClickSuppressTimer);
			serviceClickSuppressTimer = null;
		}
		suppressNextServiceClick = true;
	}

	function expireServiceClickSuppressionSoon() {
		if (!suppressNextServiceClick || serviceClickSuppressTimer) return;

		serviceClickSuppressTimer = setTimeout(() => {
			suppressNextServiceClick = false;
			serviceClickSuppressTimer = null;
		}, 700);
	}

	function resetServicePeek() {
		const wasPeeking = peekedServiceId !== null;

		clearServicePeekTimer();
		servicePeekPointerId = null;
		peekedServiceId = null;
		if (wasPeeking) expireServiceClickSuppressionSoon();
	}

	function startServicePeek(event: PointerEvent, serviceId: string) {
		if (event.pointerType === 'mouse') return;

		clearServicePeekTimer();
		servicePeekPointerId = event.pointerId;
		servicePeekStart = { x: event.clientX, y: event.clientY };

		servicePeekTimer = setTimeout(() => {
			if (servicePeekPointerId !== event.pointerId) return;

			peekedServiceId = serviceId;
			armServiceClickSuppression();
			servicePeekTimer = null;
		}, 450);
	}

	function moveServicePeek(event: PointerEvent) {
		if (event.pointerId !== servicePeekPointerId) return;

		const deltaX = Math.abs(event.clientX - servicePeekStart.x);
		const deltaY = Math.abs(event.clientY - servicePeekStart.y);
		if (deltaX > 10 || deltaY > 10) resetServicePeek();
	}

	function endServicePeek(event: PointerEvent) {
		if (event.pointerId !== servicePeekPointerId) return;
		resetServicePeek();
	}

	function handleServiceCardClick(s: ServiceResponse) {
		if (suppressNextServiceClick) {
			clearServiceClickSuppression();
			return;
		}

		handleServiceSelect(s);
	}

	function handleEditService(idx: number) {
		const s = addedServices[idx];
		const catalogEntry = services.find(x => x.id === s.serviceId);
		const source = s.source ?? (s.serviceId ? 'CATALOG' : 'CUSTOM');
		tempService = catalogEntry
			? { ...catalogEntry, source: 'CATALOG' }
			: { id: source === 'CATALOG' ? s.serviceId : null, name: s.serviceName, description: '', source };
		price = String(s.unitPrice);
		adj = String(s.adjustmentAmount || '');
		adjReason = s.adjustmentReason || '';
		duration = s.durationMin;
		instructions = s.instructions || '';
		editingServiceIndex = idx;
		step = 2;
	}

	function handleAddService() {
		if (!tempService) return;
		const serviceName = tempService.name.trim();
		// Numeric inputs are coerced to numbers by Svelte at runtime even when the
		// state starts as a string, so normalize before applying string validation.
		const normalizedPrice = price == null ? '' : String(price).trim();
		const parsedPrice = Number(normalizedPrice);
		if (!serviceName) {
			toast.error(m['itemSubWizard.validation.customServiceName']());
			return;
		}
		if (normalizedPrice === '' || !Number.isFinite(parsedPrice) || parsedPrice < 0) {
			toast.error(m['itemSubWizard.validation.servicePrice']());
			return;
		}
		if (!Number.isFinite(duration) || duration <= 0) {
			toast.error(m['itemSubWizard.validation.serviceDuration']());
			return;
		}
		const entry: DraftService = {
			serviceId: tempService.source === 'CATALOG' ? tempService.id : null,
			source: tempService.source,
			serviceName,
			unitPrice: parsedPrice,
			adjustmentAmount: parseFloat(adj) || 0,
			adjustmentReason: adjReason,
			durationMin: duration,
			instructions: instructions.trim()
		};
		if (editingServiceIndex >= 0) {
			addedServices[editingServiceIndex] = entry;
			addedServices = [...addedServices];
			toast.success(m['itemSubWizard.toast.serviceUpdated'](), { description: serviceName });
			editingServiceIndex = -1;
		} else {
			addedServices = [...addedServices, entry];
			toast.success(m['itemSubWizard.toast.serviceAdded'](), { description: serviceName });
		}
		tempService = null;
		step = 3;
	}

	function handleRemoveService(index: number) {
		const removed = addedServices[index].serviceName;
		addedServices.splice(index, 1);
		addedServices = [...addedServices];
		toast.info(m['itemSubWizard.toast.serviceRemoved'](), { description: removed });
	}

	function handleConfirmItem() {
		if (!selectedGarment) return;
		props.onSave({
			garmentId: selectedGarment.id ?? undefined,
			garmentTypeId: selectedGarment.source === 'CATALOG' ? selectedGarment.id : null,
			source: selectedGarment.source,
			garmentName: selectedGarment.name,
			services: addedServices,
			quantity: 1, // Legacy wizard hardcoded quantity mapping usually happens here or outside
			notes: notes
		});
	}
</script>

{#if loading}
    <div class="p-8 text-center animate-pulse">{m['itemSubWizard.loadingCatalog']()}</div>
{:else}
    <div class="flex flex-col flex-1 min-h-0 bg-background relative animate-in fade-in slide-in-from-right duration-300">
        <!-- Header -->
        <div class="flex items-center gap-4 border-b border-border pb-4 mb-4">
            {#if step > 0}
                <Button variant="ghost" size="sm" class="px-2 h-12 w-12 touch-manipulation" onclick={() => {
                    if (step === 2) { editingServiceIndex = -1; step = 1; }
                    else if (step === 3) step = 1;
                    else if (step === 1) step = 0;
                }}>
                    <ArrowLeft class="w-6 h-6" />
                </Button>
            {/if}
            <h3 class="text-xl font-bold truncate">
                {#if step === 0} {m['orders.wizard.stepSelectGarment']()}
                {:else if step === 1} {m['orders.wizard.stepAddServices']()}
                {:else if step === 2} {m['orders.wizard.stepConfigureService']()}
                {:else} {m['orders.wizard.stepGarmentNotes']()} {/if}
            </h3>
            <Button variant="ghost" size="sm" class="ml-auto text-destructive hover:bg-destructive/10 h-10 px-4 touch-manipulation" onclick={props.onCancel}>{m['common.cancel']()}</Button>
        </div>

        <div class="flex-1 overflow-y-auto px-1 custom-scrollbar">
            <!-- STEP 0 -->
            {#if step === 0}
                <div class="space-y-4">
                    {#if showCustomGarmentForm}
                        <div class="bg-primary/5 border border-primary/20 rounded-xl p-5 space-y-4">
                            <div class="space-y-2">
                                <label class="font-medium" for="custom-garment-name">{m['itemSubWizard.customGarment.nameLabel']()}</label>
                                <Input
                                    id="custom-garment-name"
                                    class="h-14 text-lg rounded-xl"
                                    placeholder={m['itemSubWizard.customGarment.namePlaceholder']()}
                                    bind:value={customGarmentName}
                                />
                            </div>
                            <Button class="w-full h-14 rounded-xl touch-manipulation" onclick={handleCustomGarmentSelect} disabled={!customGarmentName.trim()}>
                                {m['itemSubWizard.customGarment.continue']()}
                            </Button>
                        </div>
                    {/if}

                    <div class="grid grid-cols-2 lg:grid-cols-3 gap-4">
                        <Button
                            variant="outline"
                            class="min-h-28 h-auto flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/60 bg-primary/5 hover:border-primary hover:bg-primary/10 whitespace-normal touch-manipulation py-3"
                            onclick={() => showCustomGarmentForm = !showCustomGarmentForm}
                        >
                            <Plus class="w-7 h-7" />
                            <span class="font-bold text-lg lg:text-xl text-center px-2 leading-tight">{m['itemSubWizard.customGarment.action']()}</span>
                        </Button>
                        {#each garmentTypes as g}
                            <Button
                                variant="outline"
                                class="min-h-28 h-auto flex flex-col items-center justify-center gap-1 rounded-xl border-2 hover:border-primary hover:bg-primary/5 transition-all shadow-sm whitespace-normal touch-manipulation py-3"
                                onclick={() => handleGarmentSelect(g)}
                            >
                                <span class="font-bold text-lg lg:text-xl text-center px-2 leading-tight w-full wrap-break-word">{g.name}</span>
                                {#if g.description}
                                    <span class="text-xs text-muted-foreground text-center px-2 leading-snug w-full line-clamp-2">{g.description}</span>
                                {/if}
                            </Button>
                        {/each}
                    </div>
                </div>
            {/if}

            <!-- STEP 1 -->
            {#if step === 1 && selectedGarment}
                <div class="space-y-6">
                    <div class="bg-secondary/20 p-4 rounded-xl flex items-center gap-4 border border-border">
                        <div class="w-14 h-14 bg-background rounded-full flex items-center justify-center text-3xl shadow-sm">👕</div>
                        <div>
                            <div class="flex flex-wrap items-center gap-2">
                                <div class="font-bold text-2xl">{selectedGarment.name}</div>
                                {#if selectedGarment.source === 'CUSTOM'}
                                    <span class="text-xs font-medium uppercase tracking-wide bg-primary/10 text-primary px-2 py-1 rounded-full">{m['orders.custom.badge']()}</span>
                                {/if}
                            </div>
                            {#if selectedGarment.description}
                                <div class="text-sm text-muted-foreground mt-0.5">{selectedGarment.description}</div>
                            {/if}
                        </div>
                    </div>

                    {#if addedServices.length > 0}
                        <div class="space-y-3">
                            <h4 class="font-semibold text-sm text-muted-foreground uppercase tracking-wider">{m['orders.wizard.servicesAdded']()}</h4>
                            {#each addedServices as s, idx}
                                <div class="bg-card border border-border p-4 rounded-lg flex items-center justify-between shadow-sm animate-in slide-in-from-top-2">
                                    <div>
                                        <div class="flex flex-wrap items-center gap-2">
                                            <div class="font-medium text-lg">{s.serviceName}</div>
                                            {#if s.source === 'CUSTOM'}
                                                <span class="text-xs font-medium uppercase tracking-wide bg-primary/10 text-primary px-2 py-1 rounded-full">{m['orders.custom.badge']()}</span>
                                            {/if}
                                        </div>
                                        <div class="flex gap-2 text-xs font-medium uppercase tracking-tight text-muted-foreground">
                                            {#if s.adjustmentReason}
                                                <span>{m['orders.wizard.adjustmentShort']()} {s.adjustmentReason}</span>
                                            {/if}
                                            <span>⏱️ {s.durationMin} min</span>
                                        </div>
                                        {#if s.instructions}
                                            <div class="text-sm text-muted-foreground mt-1">{s.instructions}</div>
                                        {/if}
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <div class="text-right">
                                            <div class="font-mono font-bold text-lg">${(s.unitPrice + (s.adjustmentAmount ?? 0)).toFixed(2)}</div>
                                        </div>
                                        <Button variant="ghost" size="icon" class="h-12 w-12 text-muted-foreground hover:bg-secondary touch-manipulation" onclick={() => handleEditService(idx)}>
                                            <Pencil class="w-5 h-5" />
                                        </Button>
                                        <Button variant="ghost" size="icon" class="h-12 w-12 text-destructive hover:bg-destructive/10 touch-manipulation" onclick={() => handleRemoveService(idx)}>
                                            <X class="w-6 h-6" />
                                        </Button>
                                    </div>
                                </div>
                            {/each}
                            <div class="text-right font-bold pt-3 border-t text-xl">
                                {m['orders.wizard.total']()}: ${addedServices.reduce((acc, s) => acc + s.unitPrice + (s.adjustmentAmount ?? 0), 0).toFixed(2)}
                            </div>
                        </div>
                    {/if}

                    <div class="space-y-4 pt-4">
                        <div class="flex justify-between items-center">
                            <h4 class="font-semibold text-sm text-muted-foreground uppercase tracking-wider">{m['orders.wizard.addService']()}</h4>
                            {#if selectedGarment.source === 'CATALOG'}
                                <Button
                                    variant="ghost"
                                    class="text-sm text-primary underline h-auto p-0 hover:bg-transparent touch-manipulation py-2 px-2"
                                    onclick={() => { showAllServices = !showAllServices; serviceFilter = ""; }}
                                >
                                    {showAllServices ? m['orders.wizard.viewRecommended']() : m['orders.wizard.viewAll']()}
                                </Button>
                            {/if}
                        </div>

                        <Button
                            variant="outline"
                            class="w-full min-h-14 border-dashed border-primary/60 bg-primary/5 hover:bg-primary/10 touch-manipulation"
                            onclick={handleCustomServiceSelect}
                        >
                            <Plus class="w-5 h-5 mr-2" />
                            {m['itemSubWizard.customService.action']()}
                        </Button>

                        <Input
                            type="search"
                            placeholder={m['orders.wizard.searchServicePlaceholder']()}
                            class="h-11 rounded-xl"
                            bind:value={serviceFilter}
                        />

                        <div class="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {#each visibleServices as s}
                                {@const isPeeking = peekedServiceId === s.id}
                                <Button
                                    variant="outline"
                                    title={s.name}
                                    class={`group relative h-auto min-h-20 md:min-h-28 ${isPeeking ? 'max-h-56 z-20 border-primary bg-primary/5 shadow-lg' : 'max-h-20 md:max-h-28 bg-card shadow-sm'} p-3 md:p-5 rounded-xl border-2 md:hover:max-h-56 md:hover:border-primary md:hover:bg-primary/5 md:hover:shadow-lg focus-visible:max-h-56 focus-visible:border-primary focus-visible:bg-primary/5 flex items-center justify-between gap-2 overflow-hidden transition-[max-height,box-shadow,background-color,border-color,transform] duration-200 ease-out text-left w-full whitespace-normal touch-manipulation`}
                                    onpointerdown={(event) => startServicePeek(event, s.id)}
                                    onpointermove={moveServicePeek}
                                    onpointerup={endServicePeek}
                                    onpointercancel={endServicePeek}
                                    onpointerleave={endServicePeek}
                                    oncontextmenu={(event) => event.preventDefault()}
                                    onclick={() => handleServiceCardClick(s)}
                                >
                                    <span class={`font-bold text-sm md:text-base lg:text-lg leading-tight w-full ${isPeeking ? 'line-clamp-none' : 'line-clamp-2 md:group-hover:line-clamp-none group-focus-visible:line-clamp-none'}`}>{s.name}</span>
                                    <div class="flex flex-col items-end shrink-0">
                                        {#if priceListMap.size > 0}
                                            {@const plPrice = priceListMap.get(s.id)}
                                            {#if plPrice !== undefined}
                                                <span class="text-xs text-muted-foreground line-through">${s.basePrice}</span>
                                                <span class="font-mono bg-secondary px-2 py-0.5 rounded-md text-sm md:text-base font-bold text-primary">${plPrice}</span>
                                            {:else}
                                                <span class="font-mono bg-secondary px-2 py-0.5 rounded-md text-sm md:text-base font-bold text-muted-foreground">${s.basePrice}</span>
                                            {/if}
                                        {:else}
                                            {#if s.effectivePrice && s.effectivePrice !== s.basePrice}
                                                <span class="text-xs text-muted-foreground line-through">${s.basePrice}</span>
                                            {/if}
                                            <span class="font-mono bg-secondary px-2 py-0.5 rounded-md text-sm md:text-base font-bold text-primary">
                                                ${s.effectivePrice ?? s.basePrice}
                                            </span>
                                        {/if}
                                    </div>
                                </Button>
                            {/each}
                            {#if visibleServices.length === 0}
                                <div class="col-span-full text-center py-8 text-muted-foreground text-lg">
                                    {serviceFilter ? m['orders.wizard.noSearchResults']() : m['orders.wizard.noRecommendedServices']()}
                                </div>
                            {/if}
                        </div>
                    </div>
                </div>
            {/if}

            <!-- STEP 2 -->
            {#if step === 2 && tempService}
                <div class="max-w-md mx-auto space-y-8 py-6">
                    <div class="text-center space-y-2">
                        {#if tempService.source === 'CUSTOM'}
                            <div class="space-y-3 text-left">
                                <label class="text-base font-medium" for="custom-service-name">{m['itemSubWizard.customService.nameLabel']()}</label>
                                <Input
                                    id="custom-service-name"
                                    class="h-14 text-lg rounded-xl"
                                    placeholder={m['itemSubWizard.customService.namePlaceholder']()}
                                    bind:value={tempService.name}
                                />
                            </div>
                        {:else}
                            <h4 class="text-2xl font-bold">{tempService.name}</h4>
                            <p class="text-base text-muted-foreground">{tempService.description}</p>
                        {/if}
                    </div>

                    <div class="space-y-3">
                        <label class="text-base font-medium" for="precio-base">{m['itemSubWizard.label.basePrice']()}</label>
                        <div class="relative">
                            <span class="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground text-2xl">$</span>
                            <Input
                                id="precio-base"
                                type="number"
                                class="pl-14 h-20 text-4xl font-bold text-center rounded-xl"
                                bind:value={price}
                            />
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-6">
                        <div class="space-y-3">
                            <label class="text-base font-medium" for="ajuste">{m['itemSubWizard.label.adjustment']()}</label>
                            <Input
                                id="ajuste"
                                type="number"
                                class="h-16 text-xl text-center rounded-xl"
                                placeholder={m['itemSubWizard.placeholder.adjustment']()}
                                bind:value={adj}
                            />
                        </div>
                        <div class="space-y-3">
                            <label class="text-base font-medium" for="razon-ajuste">{m['orders.wizard.adjustmentReason']()}</label>
                            <Input
                                id="razon-ajuste"
                                class="h-16 text-lg rounded-xl"
                                placeholder={m['orders.wizard.reasonPlaceholder']()}
                                bind:value={adjReason}
                            />
                        </div>
                    </div>

                    <div class="space-y-3 bg-primary/5 p-4 rounded-xl border border-primary/20">
                        <div class="flex justify-between items-center">
                            <label class="text-base font-bold text-primary" for="duracion">{m['itemSubWizard.label.effort']()}</label>
                            <span class="font-mono text-2xl font-bold text-primary">{duration}m</span>
                        </div>
                        <Input
                            id="duracion"
                            type="range"
                            min="5"
                            max="300"
                            step="5"
                            class="h-10 cursor-pointer accent-primary"
                            bind:value={duration}
                        />
                        <p class="text-xs text-muted-foreground italic text-center">{m['itemSubWizard.effortHint']()}</p>
                    </div>

                    <div class="space-y-3">
                        <label class="text-base font-medium" for="service-instructions">{m['itemSubWizard.customService.instructionsLabel']()}</label>
                        <Textarea
                            id="service-instructions"
                            class="min-h-28 resize-none text-base p-4 rounded-xl"
                            placeholder={m['itemSubWizard.customService.instructionsPlaceholder']()}
                            bind:value={instructions}
                        />
                    </div>

                    <Button size="lg" class="w-full h-16 text-xl rounded-xl mt-12 touch-manipulation" onclick={handleAddService}>
                        {editingServiceIndex >= 0 ? m['itemSubWizard.button.updateService']() : m['itemSubWizard.button.confirmService']()}
                    </Button>
                </div>
            {/if}

            <!-- STEP 3 -->
            {#if step === 3}
                <div class="space-y-8 pt-6">
                    <div class="bg-secondary/20 p-6 rounded-xl border border-border">
                        <div class="flex flex-wrap items-center gap-2 mb-4">
                            <h4 class="font-bold text-2xl">{selectedGarment?.name}</h4>
                            {#if selectedGarment?.source === 'CUSTOM'}
                                <span class="text-xs font-medium uppercase tracking-wide bg-primary/10 text-primary px-2 py-1 rounded-full">{m['orders.custom.badge']()}</span>
                            {/if}
                        </div>
                        <ul class="space-y-2 text-base text-muted-foreground">
                            {#each addedServices as s}
                                <li>
                                    • {s.serviceName} (${(s.unitPrice + (s.adjustmentAmount ?? 0)).toFixed(2)})
                                    {#if s.source === 'CUSTOM'}<span class="ml-1 text-primary">· {m['orders.custom.badge']()}</span>{/if}
                                </li>
                            {/each}
                        </ul>
                        <div class="mt-4 pt-4 border-t border-dashed border-foreground/20 flex flex-col items-end gap-3">
                            <div class="font-bold text-xl">
                                {m['orders.wizard.total']()}: ${addedServices.reduce((acc, s) => acc + s.unitPrice + (s.adjustmentAmount ?? 0), 0).toFixed(2)}
                            </div>
                            <Button
                                variant="outline"
                                class="h-12 px-4 touch-manipulation"
                                onclick={() => step = 1}
                            >
                                <Plus class="w-4 h-4 mr-2" />
                                {m['orders.wizard.addAnotherService']()}
                            </Button>
                        </div>
                    </div>

                    <div class="space-y-3">
                        <label class="text-base font-medium" for="notas-prenda">{m['orders.wizard.garmentNotes']()}</label>
                        <Textarea
                            id="notas-prenda"
                            class="min-h-[160px] resize-none text-lg p-4 rounded-xl"
                            placeholder={m['orders.wizard.notesPlaceholder']()}
                            bind:value={notes}
                        />
                    </div>
                </div>
            {/if}
        </div>

        <!-- Footer Actions -->
        {#if step === 1}
            <div class="pt-6 border-t border-border mt-auto pb-4">
                <Button
                    size="lg"
                    class="w-full h-16 text-xl rounded-xl shadow-md touch-manipulation"
                    onclick={() => step = 3}
                    disabled={addedServices.length === 0}
                >
                    {m['common.continue']()}
                </Button>
            </div>
        {/if}

        {#if step === 3}
            <div class="pt-6 border-t border-border mt-auto pb-4">
                <Button size="lg" class="w-full h-16 text-xl rounded-xl shadow-lg touch-manipulation" onclick={handleConfirmItem}>
                    <CheckCircle2 class="mr-2 w-6 h-6" />
                    {m['itemSubWizard.button.confirmGarment']()}
                </Button>
            </div>
        {/if}
    </div>
{/if}
