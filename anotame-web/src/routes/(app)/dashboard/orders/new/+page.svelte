<script lang="ts">
    import { onMount } from 'svelte';
    import { StatePanel } from '$lib/components/common';
    import WizardHeader from '$lib/components/orders/wizard/wizard-header.svelte';
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
    <StatePanel message={m["common.loading"]()} class="h-auto min-h-0 flex-1 border-0" />
{:else}
    {@const currentStepIndex = draft?.currentStep ?? 0}
    
    <div class="flex flex-col flex-1 min-h-0">
        <WizardHeader
            title={draft?.isEditing ? m["orders.edit.editOrder"]() : m["orders.new.title"]()}
            {steps}
            currentStep={currentStepIndex}
            isDraft={Boolean(draft?.id) && !draft?.isEditing}
        >
            {#snippet actions()}
                <Button
                    variant="outline"
                    class="h-11 sm:h-12 px-3 sm:px-6 text-sm sm:text-base shrink-0"
                    onclick={() => { orderWizardState.clearActiveDraft(); goto("/dashboard/orders"); }}
                >
                    {draft?.isEditing ? m["common.cancel"]() : m["orders.new.exit"]()}
                </Button>
            {/snippet}
        </WizardHeader>

        <!-- Step Content -->
        <div class="flex flex-1 flex-col pt-4">
            {#if steps[currentStepIndex]}
                {@const ActiveComponent = steps[currentStepIndex].component}
                <ActiveComponent onNext={handleNext} onBack={handleBack} />
            {/if}
        </div>
    </div>
{/if}
