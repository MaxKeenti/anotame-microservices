<script lang="ts">
    import { onMount } from 'svelte';
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import { orderWizardState } from '$lib/services/orders/OrderWizardState.svelte';
    import { authService } from '$lib/services/auth.svelte';
    import { apiService, API_SALES } from '$lib/services/api.svelte';
    import { ApiError } from '$lib/services/ApiError';
    import type { OrderResponse } from '$lib/types/dtos';
    import CustomerStep from '$lib/components/orders/wizard/customer-step.svelte';
    import PriceListStep from '$lib/components/orders/wizard/price-list-step.svelte';
    import ItemsStep from '$lib/components/orders/wizard/items-step.svelte';
    import PaymentStep from '$lib/components/orders/wizard/payment-step.svelte';
    import { Button } from '$lib/components/ui/button';
    import { toast } from 'svelte-sonner';

    let id = $derived($page.params.id);
    let isLoading = $state(true);
    let notFound = $state(false);
    let existingOrder = $state<OrderResponse | null>(null);

    const isAdmin = $derived(authService.user?.role === 'ADMIN');
    const isLocked = $derived(
        existingOrder?.status === 'DELIVERED' || existingOrder?.status === 'CANCELLED'
    );

    onMount(async () => {
        try {
            const res = await apiService.request<OrderResponse>(`${API_SALES}/orders/${id}`);
            existingOrder = res;

            orderWizardState.activeDraft = {
                id: res.id,
                isEditing: true,
                currentStep: 0,
                lastModified: Date.now(),
                customer: res.customer,
                priceListId: res.priceListId || null,
                priceListName: res.priceListName || null,
                items: res.items.map((item) => ({
                    garmentTypeId: null, // garmentTypeId is not returned by the API
                    garmentId: undefined,
                    garmentName: item.garmentName,
                    quantity: item.quantity,
                    notes: item.notes || '',
                    services: item.services.map((s) => ({
                        serviceId: s.serviceId,
                        serviceName: s.serviceName,
                        unitPrice: s.unitPrice,
                        durationMin: 0, // not returned by OrderItemResponse
                        adjustmentAmount: s.adjustmentAmount,
                        adjustmentReason: s.adjustmentReason
                    }))
                })),
                amountPaid: res.amountPaid,
                paymentMethod: res.paymentMethod,
                committedDeadline: res.committedDeadline,
                notes: res.notes ?? ''
            };
        } catch (e) {
            if (e instanceof ApiError && e.status === 404) {
                notFound = true;
            } else if (e instanceof ApiError && e.status === 401) {
                await goto('/login');
            } else {
                toast.error('Error al cargar el pedido', { description: (e as any)?.message });
                await goto('/dashboard/orders');
            }
        } finally {
            isLoading = false;
        }
    });

    const steps = [
        { title: "Cliente", component: CustomerStep },
        { title: "Lista de Precios", component: PriceListStep },
        { title: "Prendas", component: ItemsStep },
        { title: "Pago", component: PaymentStep },
    ];

    function handleNext() {
        if (!orderWizardState.activeDraft) return;
        if (orderWizardState.activeDraft.currentStep < steps.length - 1) {
            const next = orderWizardState.activeDraft.currentStep + 1;
            orderWizardState.activeDraft = { ...orderWizardState.activeDraft, currentStep: next };
        }
    }

    function handleBack() {
        if (!orderWizardState.activeDraft) return;
        if (orderWizardState.activeDraft.currentStep > 0) {
            const prev = orderWizardState.activeDraft.currentStep - 1;
            orderWizardState.activeDraft = { ...orderWizardState.activeDraft, currentStep: prev };
        } else {
            orderWizardState.clearActiveDraft();
            goto(`/dashboard/orders/${id}`);
        }
    }

    let draft = $derived(orderWizardState.activeDraft);
</script>

{#if isLoading}
    <div class="flex flex-col h-[60vh] items-center justify-center text-muted-foreground gap-4 animate-pulse">
        <div class="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
        <div class="text-lg font-medium">Cargando pedido...</div>
    </div>
{:else if notFound}
    <div class="flex flex-col h-[60vh] items-center justify-center p-8 text-center gap-6 animate-in fade-in zoom-in-95">
        <div class="bg-destructive/10 p-6 rounded-full">
            <svg class="w-16 h-16 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
        </div>
        <div>
            <h2 class="text-2xl font-bold text-destructive">Pedido no encontrado</h2>
            <p class="text-muted-foreground mt-2 max-w-md">Este pedido no existe o no tienes acceso para editarlo.</p>
        </div>
        <Button href="/dashboard/orders" variant="outline" class="h-12 px-8 rounded-xl touch-manipulation">
            Volver a la lista
        </Button>
    </div>
{:else}
    {@const currentStepIndex = draft?.currentStep ?? 0}

    <div class="flex flex-col h-[calc(100vh-8rem)]">
        <!-- Status lock banner for DELIVERED / CANCELLED orders -->
        {#if isLocked}
            <div
                role="alert"
                class="mb-4 p-4 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive text-sm font-medium flex items-start gap-2"
            >
                <svg class="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>Este pedido no puede modificarse. Los pedidos entregados o cancelados son de solo lectura.</span>
            </div>
        {/if}

        <!-- Stepper Header -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
            <div class="flex items-center gap-2">
                <h1 class="text-2xl font-bold font-heading">
                    Editar pedido {existingOrder?.ticketNumber ? `#${existingOrder.ticketNumber}` : ''}
                </h1>
            </div>

            <!-- Stepper Progress UI -->
            <div class="flex justify-center flex-1">
                <div class="flex items-center gap-2 overflow-x-auto w-full max-w-sm sm:w-auto pb-2 sm:pb-0">
                    {#each steps as s, i}
                        <div class="flex items-center {i < steps.length - 1 ? 'mr-2 sm:mr-4' : ''}">
                            <div
                                class="w-8 h-8 shrink-0 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-colors {currentStepIndex === i ? 'border-primary bg-primary text-primary-foreground' : currentStepIndex > i ? 'border-primary bg-primary/20 text-primary' : 'border-muted text-muted-foreground'}"
                            >
                                {i + 1}
                            </div>
                            <span class="ml-2 text-sm hidden md:inline font-medium {currentStepIndex === i ? 'text-foreground' : 'text-muted-foreground'}">
                                {s.title}
                            </span>
                            {#if i < steps.length - 1}
                                <div class="w-8 h-0.5 bg-border ml-2 sm:ml-4 hidden sm:block"></div>
                            {/if}
                        </div>
                    {/each}
                </div>
            </div>

            <Button variant="outline" class="h-10 sm:h-12 px-6 touch-manipulation" onclick={() => { orderWizardState.clearActiveDraft(); goto(`/dashboard/orders/${id}`); }}>
                Cancelar
            </Button>
        </div>

        <!-- Step Content (read-only if locked) -->
        {#if isLocked}
            <div class="flex-1 overflow-y-auto flex flex-col pt-4 pointer-events-none opacity-60 select-none">
                {#if steps[currentStepIndex]}
                    {@const ActiveComponent = steps[currentStepIndex].component}
                    {#if currentStepIndex === 1}
                        <ActiveComponent onNext={handleNext} onBack={handleBack} isEditMode={true} />
                    {:else}
                        <ActiveComponent onNext={handleNext} onBack={handleBack} />
                    {/if}
                {/if}
            </div>
        {:else}
            <div class="flex-1 overflow-y-auto flex flex-col pt-4">
                {#if steps[currentStepIndex]}
                    {@const ActiveComponent = steps[currentStepIndex].component}
                    {#if currentStepIndex === 1}
                        <ActiveComponent onNext={handleNext} onBack={handleBack} isEditMode={true} />
                    {:else}
                        <ActiveComponent onNext={handleNext} onBack={handleBack} />
                    {/if}
                {/if}
            </div>
        {/if}
    </div>
{/if}
