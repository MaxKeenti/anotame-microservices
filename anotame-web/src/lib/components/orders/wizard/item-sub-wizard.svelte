<script lang="ts">
	import { onMount } from 'svelte';
	import { orderWizardState } from '$lib/services/orders/OrderWizardState.svelte';
	import { apiService, API_CATALOG } from '$lib/services/api.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import { ArrowLeft, CheckCircle2, Plus, Trash2, X } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';

	let props = $props<{
		initialItem?: any,
		onSave: (item: any) => void,
		onCancel: () => void
	}>();

	function getInitialStep() {
		return props.initialItem ? 1 : 0;
	}
	let step = $state(getInitialStep());
	let garmentTypes = $state<any[]>([]);
	let services = $state<any[]>([]);
	let loading = $state(true);

	let selectedGarment = $state<any | null>(null);
	let addedServices = $state<any[]>([]);

	let tempService = $state<any | null>(null);
	let price = $state<string>("");
	let adj = $state<string>("");
	let adjReason = $state("");
	let duration = $state<number>(30);

	let notes = $state("");
	let showAllServices = $state(false);
	let serviceFilter = $state("");

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
				apiService.request<any[]>(`${API_CATALOG}/catalog/garments`),
				apiService.request<any[]>(`${API_CATALOG}/catalog/services`)
			]);
			garmentTypes = gRes || [];
			services = sRes || [];

			if (props.initialItem) {
				let g = garmentTypes.find(x => x.id === props.initialItem.garmentId || x.id === props.initialItem.garmentTypeId);
				if (!g && props.initialItem.garmentName) {
					g = garmentTypes.find(x => x.name.toLowerCase() === props.initialItem.garmentName.toLowerCase());
				}
				if (g) selectedGarment = g;

				if (props.initialItem.services) addedServices = [...props.initialItem.services];
				notes = props.initialItem.notes || "";
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

		if (!showAllServices) {
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

	function handleGarmentSelect(g: any) {
		selectedGarment = g;
		addedServices = [];
		step = 1;
		showAllServices = false;
		serviceFilter = "";
	}

	function handleServiceSelect(s: any) {
		tempService = s;
		
		// Auto-fill from price list if selected, otherwise use service default price
		if (priceList?.items && priceList.items.length > 0) {
			const priceListItem = priceList.items.find(item => item.serviceId === s.id);
			if (priceListItem) {
				price = String(priceListItem.price);
				// Show that price came from price list
				toast.info("Precio desde lista", { description: `${priceListItem.price}` });
			} else {
				// Service not in price list - leave price blank per D-06
				price = "";
				toast.info("Servicio no en lista de precios", { description: `Ingresa el precio manualmente` });
			}
		} else {
			// No price list selected - use service default
			price = String(s.effectivePrice ?? s.basePrice);
		}
		
		adj = "";
		adjReason = "";
		duration = s.defaultDurationMin || 30;
		step = 2;
	}

	function handleAddService() {
		if (!tempService) return;
		addedServices = [...addedServices, {
			serviceId: tempService.id,
			serviceName: tempService.name,
			unitPrice: parseFloat(price) || 0,
			adjustmentAmount: parseFloat(adj) || 0,
			adjustmentReason: adjReason,
			durationMin: duration
		}];
		toast.success("Servicio agregado", { description: tempService.name });
		tempService = null;
		step = 3;
	}

	function handleRemoveService(index: number) {
		const removed = addedServices[index].serviceName;
		addedServices.splice(index, 1);
		addedServices = [...addedServices];
		toast.info("Servicio removido", { description: removed });
	}

	function handleConfirmItem() {
		if (!selectedGarment) return;
		props.onSave({
			garmentId: selectedGarment.id,
			garmentTypeId: selectedGarment.id,
			garmentName: selectedGarment.name,
			services: addedServices,
			quantity: 1, // Legacy wizard hardcoded quantity mapping usually happens here or outside
			notes: notes
		});
	}
</script>

{#if loading}
    <div class="p-8 text-center animate-pulse">Cargando catálogo...</div>
{:else}
    <div class="flex flex-col h-full bg-background relative animate-in fade-in slide-in-from-right duration-300">
        <!-- Header -->
        <div class="flex items-center gap-4 border-b border-border pb-4 mb-4">
            {#if step > 0}
                <Button variant="ghost" size="sm" class="px-2 h-12 w-12 touch-manipulation" onclick={() => {
                    if (step === 2 || step === 3) step = 1;
                    else if (step === 1) step = 0;
                }}>
                    <ArrowLeft class="w-6 h-6" />
                </Button>
            {/if}
            <h3 class="text-xl font-bold truncate">
                {#if step === 0} Selecciona Prenda
                {:else if step === 1} Agregar Servicios
                {:else if step === 2} Configurar Servicio
                {:else} Notas de la Prenda {/if}
            </h3>
            <Button variant="ghost" size="sm" class="ml-auto text-destructive hover:bg-destructive/10 h-10 px-4 touch-manipulation" onclick={props.onCancel}>Cancelar</Button>
        </div>

        <div class="flex-1 overflow-y-auto px-1 custom-scrollbar">
            <!-- STEP 0 -->
            {#if step === 0}
                <div class="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    {#each garmentTypes as g}
                        <Button
                            variant="outline"
                            class="h-28 flex flex-col items-center justify-center gap-1 rounded-xl border-2 hover:border-primary hover:bg-primary/5 transition-all shadow-sm whitespace-normal touch-manipulation"
                            onclick={() => handleGarmentSelect(g)}
                        >
                            <span class="font-bold text-lg lg:text-xl text-center px-2 leading-tight w-full wrap-break-word">{g.name}</span>
                        </Button>
                    {/each}
                </div>
            {/if}

            <!-- STEP 1 -->
            {#if step === 1 && selectedGarment}
                <div class="space-y-6">
                    <div class="bg-secondary/20 p-4 rounded-xl flex items-center gap-4 border border-border">
                        <div class="w-14 h-14 bg-background rounded-full flex items-center justify-center text-3xl shadow-sm">👕</div>
                        <div class="font-bold text-2xl">{selectedGarment.name}</div>
                    </div>

                    {#if addedServices.length > 0}
                        <div class="space-y-3">
                            <h4 class="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Servicios Agregados</h4>
                            {#each addedServices as s, idx}
                                <div class="bg-card border border-border p-4 rounded-lg flex items-center justify-between shadow-sm animate-in slide-in-from-top-2">
                                    <div>
                                        <div class="font-medium text-lg">{s.serviceName}</div>
                                        <div class="flex gap-2 text-xs font-medium uppercase tracking-tight text-muted-foreground">
                                            {#if s.adjustmentReason}
                                                <span>Adj: {s.adjustmentReason}</span>
                                            {/if}
                                            <span>⏱️ {s.durationMin} min</span>
                                        </div>
                                    </div>
                                    <div class="flex items-center gap-4">
                                        <div class="text-right">
                                            <div class="font-mono font-bold text-lg">${(s.unitPrice + s.adjustmentAmount).toFixed(2)}</div>
                                        </div>
                                        <Button variant="ghost" size="icon" class="h-12 w-12 text-destructive hover:bg-destructive/10 touch-manipulation" onclick={() => handleRemoveService(idx)}>
                                            <X class="w-6 h-6" />
                                        </Button>
                                    </div>
                                </div>
                            {/each}
                            <div class="text-right font-bold pt-3 border-t text-xl">
                                Total: ${addedServices.reduce((acc, s) => acc + s.unitPrice + s.adjustmentAmount, 0).toFixed(2)}
                            </div>
                        </div>
                    {/if}

                    <div class="space-y-4 pt-4">
                        <div class="flex justify-between items-center">
                            <h4 class="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Agregar Servicio</h4>
                            <Button
                                variant="ghost"
                                class="text-sm text-primary underline h-auto p-0 hover:bg-transparent touch-manipulation py-2 px-2"
                                onclick={() => { showAllServices = !showAllServices; serviceFilter = ""; }}
                            >
                                {showAllServices ? "Ver recomendados" : "Ver todos"}
                            </Button>
                        </div>

                        <Input
                            type="search"
                            placeholder="Buscar servicio..."
                            class="h-11 rounded-xl"
                            bind:value={serviceFilter}
                        />

                        <div class="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {#each visibleServices as s}
                                <Button
                                    variant="outline"
                                    class="h-20 md:h-28 p-3 md:p-5 rounded-xl border-2 hover:border-primary hover:bg-primary/5 flex items-center justify-between gap-2 transition-all text-left bg-card shadow-sm w-full whitespace-normal touch-manipulation"
                                    onclick={() => handleServiceSelect(s)}
                                >
                                    <span class="font-bold text-sm md:text-base lg:text-lg leading-tight w-full line-clamp-2">{s.name}</span>
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
                                    {serviceFilter ? "Sin resultados para tu búsqueda." : "No hay servicios recomendados."}
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
                        <h4 class="text-2xl font-bold">{tempService.name}</h4>
                        <p class="text-base text-muted-foreground">{tempService.description}</p>
                    </div>

                    <div class="space-y-3">
                        <label class="text-base font-medium" for="precio-base">Precio Base ($)</label>
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
                            <label class="text-base font-medium" for="ajuste">Ajuste ($)</label>
                            <Input
                                id="ajuste"
                                type="number"
                                class="h-16 text-xl text-center rounded-xl"
                                placeholder="+/- 0.00"
                                bind:value={adj}
                            />
                        </div>
                        <div class="space-y-3">
                            <label class="text-base font-medium" for="razon-ajuste">Razón Ajuste</label>
                            <Input
                                id="razon-ajuste"
                                class="h-16 text-lg rounded-xl"
                                placeholder="Motivo..."
                                bind:value={adjReason}
                            />
                        </div>
                    </div>

                    <div class="space-y-3 bg-primary/5 p-4 rounded-xl border border-primary/20">
                        <div class="flex justify-between items-center">
                            <label class="text-base font-bold text-primary" for="duracion">Esfuerzo Estimado (Minutos)</label>
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
                        <p class="text-xs text-muted-foreground italic text-center">Desliza para ajustar si crees que esta prenda tomará más tiempo de lo normal.</p>
                    </div>

                    <Button size="lg" class="w-full h-16 text-xl rounded-xl mt-12 touch-manipulation" onclick={handleAddService}>
                        Confirmar Servicio
                    </Button>
                </div>
            {/if}

            <!-- STEP 3 -->
            {#if step === 3}
                <div class="space-y-8 pt-6">
                    <div class="bg-secondary/20 p-6 rounded-xl border border-border">
                        <h4 class="font-bold text-2xl mb-4">{selectedGarment?.name}</h4>
                        <ul class="space-y-2 text-base text-muted-foreground">
                            {#each addedServices as s}
                                <li>• {s.serviceName} (${(s.unitPrice + s.adjustmentAmount).toFixed(2)})</li>
                            {/each}
                        </ul>
                        <div class="mt-4 pt-4 border-t border-dashed border-foreground/20 flex flex-col items-end gap-3">
                            <div class="font-bold text-xl">
                                Total: ${addedServices.reduce((acc, s) => acc + s.unitPrice + s.adjustmentAmount, 0).toFixed(2)}
                            </div>
                            <Button
                                variant="outline"
                                class="h-12 px-4 touch-manipulation"
                                onclick={() => step = 1}
                            >
                                <Plus class="w-4 h-4 mr-2" />
                                Agregar otro servicio
                            </Button>
                        </div>
                    </div>

                    <div class="space-y-3">
                        <label class="text-base font-medium" for="notas-prenda">Notas Generales de la Prenda</label>
                        <Textarea
                            id="notas-prenda"
                            class="min-h-[160px] resize-none text-lg p-4 rounded-xl"
                            placeholder="Detalles específicos para el sastre sobre esta prenda..."
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
                    Continuar
                </Button>
            </div>
        {/if}

        {#if step === 3}
            <div class="pt-6 border-t border-border mt-auto pb-4">
                <Button size="lg" class="w-full h-16 text-xl rounded-xl shadow-lg touch-manipulation" onclick={handleConfirmItem}>
                    <CheckCircle2 class="mr-2 w-6 h-6" />
                    Confirmar Prenda
                </Button>
            </div>
        {/if}
    </div>
{/if}
