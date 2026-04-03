<script lang="ts">
    import { onMount } from 'svelte';
    import { page } from '$app/state';
    import { goto } from '$app/navigation';
    import { orderWizardState } from '$lib/services/orders/OrderWizardState.svelte';
    import CustomerStep from '$lib/components/orders/wizard/customer-step.svelte';
    import ItemsStep from '$lib/components/orders/wizard/items-step.svelte';
    import PaymentStep from '$lib/components/orders/wizard/payment-step.svelte';
    import { Button } from '$lib/components/ui/button';

    let isLoading = $state(true);

    onMount(() => {
        try {
            // We use window.location.search because page.url might not be fully reactive on initial fast mount in SPA mode sometimes
            const urlParams = new URLSearchParams(window.location.search);
            const draftId = urlParams.get('draftId');
            
            if (draftId) {
                orderWizardState.loadDraft(draftId);
                if (!orderWizardState.activeDraft) {
                    // Invalid draft ID, fallback to new
                    orderWizardState.createEmptyDraft();
                }
            } else {
                orderWizardState.createEmptyDraft();
            }
        } catch (e) {
            console.error('Error initializing order wizard:', e);
            orderWizardState.createEmptyDraft();
        } finally {
            isLoading = false;
        }
    });

    const steps = [
        { title: "Cliente", component: CustomerStep },
        { title: "Prendas", component: ItemsStep },
        { title: "Pago", component: PaymentStep },
    ];

    function handleNext() {
        if (!orderWizardState.activeDraft) return;
        if (orderWizardState.activeDraft.currentStep < steps.length - 1) {
            orderWizardState.updateActiveDraft({ currentStep: orderWizardState.activeDraft.currentStep + 1 });
        }
    }

    function handleBack() {
        if (!orderWizardState.activeDraft) return;
        if (orderWizardState.activeDraft.currentStep > 0) {
            orderWizardState.updateActiveDraft({ currentStep: orderWizardState.activeDraft.currentStep - 1 });
        } else {
            orderWizardState.clearActiveDraft();
            goto('/dashboard/orders');
        }
    }
</script>

{#if isLoading || !orderWizardState.activeDraft}
    <div class="flex h-full items-center justify-center text-muted-foreground">Cargando...</div>
{:else}
    {@const currentStepIndex = orderWizardState.activeDraft.currentStep}
    {@const draft = orderWizardState.activeDraft}

    <div class="flex flex-col h-[calc(100vh-8rem)]">
        <!-- Stepper Header -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
            <div class="flex items-center gap-2">
                <h1 class="text-2xl font-bold font-heading">
                    {draft.isEditing ? "Editar Orden" : "Nueva Orden"}
                </h1>
                {#if draft.id && !draft.isEditing}
                    <span class="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded">Draft: {draft.id.slice(0, 8)}...</span>
                {/if}
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

            <Button variant="outline" class="h-10 sm:h-12 px-6 touch-manipulation" onclick={() => { orderWizardState.clearActiveDraft(); goto("/dashboard/orders"); }}>
                {draft.isEditing ? "Cancelar" : "Salir"}
            </Button>
        </div>

        <!-- Step Content -->
        <div class="flex-1 overflow-y-auto flex flex-col pt-4">
            {#if steps[currentStepIndex]}
                {@const ActiveComponent = steps[currentStepIndex].component}
                <ActiveComponent onNext={handleNext} onBack={handleBack} />
            {/if}
        </div>
    </div>
{/if}
