<script lang="ts">
    import { onMount } from 'svelte';
    import { page } from '$app/state';
    import { goto } from '$app/navigation';
    import { orderWizardState } from '$lib/services/orders/OrderWizardState.svelte';
    import CustomerStep from '$lib/components/orders/wizard/customer-step.svelte';
    import PriceListStep from '$lib/components/orders/wizard/price-list-step.svelte';
    import ItemsStep from '$lib/components/orders/wizard/items-step.svelte';
    import PaymentStep from '$lib/components/orders/wizard/payment-step.svelte';
    import { Button } from '$lib/components/ui/button';
    import * as m from '$lib/paraglide/messages';
    import { ChevronDown } from '@lucide/svelte';

    let isLoading = $state(true);
    let stepsExpanded = $state(false);

    onMount(() => {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const draftId = urlParams.get('draftId');

            if (draftId) {
                orderWizardState.loadDraft(draftId);
                if (!orderWizardState.activeDraft) {
                    orderWizardState.createEmptyDraft();
                }
            } else {
                orderWizardState.createEmptyDraft();
            }
        } catch (e) {
            console.error('Order Wizard: Initialization failed:', e);
            orderWizardState.createEmptyDraft();
        } finally {
            isLoading = false;
        }
    });

    const steps = [
        { title: m["orders.wizard.customer"](), component: CustomerStep },
        { title: m["orders.wizard.priceList"](), component: PriceListStep },
        { title: m["orders.wizard.garments"](), component: ItemsStep },
        { title: m["orders.wizard.payment"](), component: PaymentStep },
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
    let draft = $derived(orderWizardState.activeDraft);
</script>

{#if isLoading}
    <div class="flex flex-col h-full items-center justify-center text-muted-foreground gap-2">
        <div>{m["common.loading"]()}</div>
    </div>
{:else}
    {@const currentStepIndex = draft?.currentStep ?? 0}
    
    <div class="flex flex-col h-full">
        <!-- Stepper Header: compact single row on all screen sizes -->
        <div class="mb-4 sm:mb-6">
            <div class="flex items-center gap-2">
                <!-- Title -->
                <div class="flex items-center gap-2 min-w-0 flex-1">
                    <h1 class="text-lg sm:text-2xl font-bold font-heading truncate">
                        {draft?.isEditing ? m["orders.edit.editOrder"]() : m["orders.new.title"]()}
                    </h1>
                    {#if draft?.id && !draft?.isEditing}
                        <span class="hidden sm:inline text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded shrink-0">Draft: {draft.id.slice(0, 4)}...</span>
                    {/if}
                </div>

                <!-- Compact step circles + expand toggle -->
                <div class="flex items-center shrink-0">
                    <div class="flex items-center">
                        {#each steps as s, i}
                            <div class="flex items-center">
                                <div
                                    class="w-6 h-6 sm:w-8 sm:h-8 shrink-0 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm border-2 transition-colors {currentStepIndex === i ? 'border-primary bg-primary text-primary-foreground' : currentStepIndex > i ? 'border-primary bg-primary/20 text-primary' : 'border-muted text-muted-foreground'}"
                                >
                                    {i + 1}
                                </div>
                                <span class="hidden md:inline ml-2 text-sm font-medium {currentStepIndex === i ? 'text-foreground' : 'text-muted-foreground'}">{s.title}</span>
                                {#if i < steps.length - 1}
                                    <div class="w-3 sm:w-6 h-0.5 bg-border mx-0.5 sm:mx-1 hidden sm:block md:hidden lg:block"></div>
                                {/if}
                            </div>
                        {/each}
                    </div>
                    <!-- Expand/collapse tray button (mobile only) -->
                    <button
                        class="sm:hidden ml-1 p-1 rounded-md hover:bg-muted/50 transition-colors text-muted-foreground touch-manipulation"
                        onclick={() => { stepsExpanded = !stepsExpanded; }}
                        aria-label={stepsExpanded ? "Ocultar pasos" : "Ver pasos"}
                        aria-expanded={stepsExpanded}
                    >
                        <ChevronDown class="w-4 h-4 transition-transform {stepsExpanded ? 'rotate-180' : ''}" />
                    </button>
                </div>

                <!-- Exit button: compact on mobile -->
                <Button
                    variant="outline"
                    class="h-8 sm:h-12 px-3 sm:px-6 text-xs sm:text-base touch-manipulation shrink-0"
                    onclick={() => { orderWizardState.clearActiveDraft(); goto("/dashboard/orders"); }}
                >
                    {draft?.isEditing ? m["common.cancel"]() : m["orders.new.exit"]()}
                </Button>
            </div>

            <!-- Expandable step names tray (mobile only) -->
            {#if stepsExpanded}
                <div class="sm:hidden mt-2 p-3 bg-muted/30 rounded-lg border border-border">
                    <ol class="flex flex-col gap-2">
                        {#each steps as s, i}
                            <li class="flex items-center gap-3 text-sm {currentStepIndex === i ? 'text-foreground font-medium' : currentStepIndex > i ? 'text-primary' : 'text-muted-foreground'}">
                                <div
                                    class="w-5 h-5 shrink-0 rounded-full flex items-center justify-center text-xs font-bold border-2 {currentStepIndex === i ? 'border-primary bg-primary text-primary-foreground' : currentStepIndex > i ? 'border-primary bg-primary/20 text-primary' : 'border-muted text-muted-foreground'}"
                                >
                                    {i + 1}
                                </div>
                                <span>{s.title}</span>
                                {#if currentStepIndex === i}
                                    <span class="ml-auto text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">Actual</span>
                                {:else if currentStepIndex > i}
                                    <span class="ml-auto text-xs text-primary">✓</span>
                                {/if}
                            </li>
                        {/each}
                    </ol>
                </div>
            {/if}
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
