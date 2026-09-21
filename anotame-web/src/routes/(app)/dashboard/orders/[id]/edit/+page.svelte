<script lang="ts">
    import { onMount } from 'svelte';
    import WizardHeader from '$lib/components/orders/wizard/wizard-header.svelte';
    import * as Card from '$lib/components/ui/card';
    import { ErrorState, FormField, InlineAlert, LockedRegion, PageHeader, StatePanel, PageContainer } from '$lib/components/common';
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
    import { Textarea } from '$lib/components/ui/textarea';
    import { AdaptiveDateTimePicker } from '$lib/components/ui/responsive';
    import { toast } from 'svelte-sonner';
    import * as m from '$lib/paraglide/messages';

    let id = $derived($page.params.id);
    let isLoading = $state(true);
    let notFound = $state(false);
    let existingOrder = $state<OrderResponse | null>(null);
    let employeeDeadline = $state('');
    let employeeNotes = $state('');
    let employeeEditError = $state('');
    let employeeSaving = $state(false);

    const isAdmin = $derived(authService.user?.role === 'ADMIN');
    const isLocked = $derived(
        existingOrder?.status === 'DELIVERED' || existingOrder?.status === 'CANCELLED'
    );

    onMount(async () => {
        try {
            const res = await apiService.request<OrderResponse>(`${API_SALES}/orders/${id}`);
            existingOrder = res;
            employeeDeadline = res.committedDeadline ? res.committedDeadline.slice(0, 16) : '';
            employeeNotes = res.notes ?? '';

            if (authService.user?.role === 'ADMIN') {
                orderWizardState.activeDraft = {
                    id: res.id,
                    isEditing: true,
                    currentStep: 0,
                    lastModified: Date.now(),
                    customer: res.customer,
                    priceListId: res.priceListId || null,
                    priceListName: res.priceListName || null,
                    items: res.items.map((item) => ({
                        garmentTypeId: item.garmentTypeId,
                        garmentId: undefined,
                        source: item.source ?? 'CATALOG',
                        garmentName: item.garmentName,
                        quantity: item.quantity,
                        notes: item.notes || '',
                        services: item.services.map((s) => ({
                            serviceId: s.serviceId,
                            source: s.source ?? 'CATALOG',
                            serviceName: s.serviceName,
                            unitPrice: s.unitPrice,
                            durationMin: s.durationMin,
                            adjustmentAmount: s.adjustmentAmount,
                            adjustmentReason: s.adjustmentReason,
                            instructions: s.instructions
                        }))
                    })),
                    amountPaid: res.amountPaid,
                    paymentMethod: res.paymentMethod,
                    committedDeadline: res.committedDeadline,
                    notes: res.notes ?? ''
                };
            } else {
                orderWizardState.clearActiveDraft();
            }
        } catch (e) {
            if (e instanceof ApiError && e.status === 404) {
                notFound = true;
            } else if (e instanceof ApiError && e.status === 401) {
                await goto('/login');
            } else {
                toast.error(m["orders.edit.loadError"](), { description: (e as any)?.message });
                await goto('/dashboard/orders');
            }
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

    function defaultMinDeadline(): string {
        const now = new Date();
        const graceTime = now.getTime() - 5 * 60000;
        const local = new Date(graceTime);
        const offset = local.getTimezoneOffset() * 60000;
        return new Date(local.getTime() - offset).toISOString().slice(0, 16);
    }

    function toOffsetDateTime(value: string): string {
        let deadlineStr = value.length === 10 ? `${value}T18:00:00` : `${value.slice(0, 16)}:00`;
        const date = new Date();
        const offsetMinutes = -date.getTimezoneOffset();
        const sign = offsetMinutes >= 0 ? '+' : '-';
        const hh = String(Math.floor(Math.abs(offsetMinutes) / 60)).padStart(2, '0');
        const mm = String(Math.abs(offsetMinutes) % 60).padStart(2, '0');
        return `${deadlineStr}${sign}${hh}:${mm}`;
    }

    async function handleEmployeeEditSubmit() {
        if (!id || isLocked) return;
        employeeEditError = '';
        if (!employeeDeadline) {
            employeeEditError = m['orders.wizard.zod.deadlineRequired']();
            return;
        }
        if (new Date(employeeDeadline) < new Date(Date.now() - 5 * 60000)) {
            employeeEditError = m['orders.wizard.zod.deadlineFuture']();
            return;
        }

        employeeSaving = true;
        try {
            await apiService.request<OrderResponse>(`${API_SALES}/orders/${id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    committedDeadline: toOffsetDateTime(employeeDeadline),
                    notes: employeeNotes || '',
                }),
            });
            toast.success(m['orders.wizard.saveSuccess']());
            await goto(`/dashboard/orders/${id}`);
        } catch (e: any) {
            toast.error(e.message || m['orders.wizard.processOrderError']());
        } finally {
            employeeSaving = false;
        }
    }
</script>

{#if isLoading}
    <StatePanel message={m["orders.detail.loading"]()} spinner size="page" />
{:else if notFound}
    <ErrorState
        title={m["orders.detail.notFound"]()}
        description={m["orders.edit.notFoundDescription"]()}
    >
        <Button size="touch-lg" href="/dashboard/orders" variant="outline" class="px-8 rounded-xl">
            {m["orders.detail.backToList"]()}
        </Button>
    </ErrorState>
{:else if !isAdmin}
    <PageContainer width="narrow">
        <PageHeader
            title={m["orders.edit.title"]({ ticket: existingOrder?.ticketNumber ? `#${existingOrder.ticketNumber}` : '' })}
            description={m['orders.edit.employeeDescription']()}
        >
            {#snippet actions()}
                <Button size="touch-lg" variant="outline" class="px-6" onclick={() => goto(`/dashboard/orders/${id}`)}>
                    {m["common.cancel"]()}
                </Button>
            {/snippet}
        </PageHeader>

        {#if isLocked}
            <InlineAlert text={m["orders.edit.lockedBanner"]()} />
        {/if}

        <Card.Root class="p-5 sm:p-6">
        <form class="space-y-6" onsubmit={(e) => { e.preventDefault(); handleEmployeeEditSubmit(); }}>
            <FormField
                label={m['orders.wizard.deliveryDate']()}
                for="employee-delivery-date"
                class={isLocked || employeeSaving ? 'pointer-events-none opacity-70' : ''}
            >
                <AdaptiveDateTimePicker
                    id="employee-delivery-date"
                    value={employeeDeadline}
                    min={defaultMinDeadline()}
                    onValueChange={(v) => { employeeDeadline = v; employeeEditError = ''; }}
                    placeholder={m['orders.wizard.selectDateTimePlaceholder']()}
                    class="rounded-xl text-lg"
                />
            </FormField>

            <FormField label={m['orders.wizard.orderNotes']()} for="employee-order-notes">
                <Textarea
                    id="employee-order-notes"
                    bind:value={employeeNotes}
                    placeholder={m['orders.wizard.orderNotesPlaceholder']()}
                    class="min-h-32 resize-none text-base"
                    disabled={isLocked || employeeSaving}
                />
            </FormField>

            {#if employeeEditError}
                <InlineAlert text={employeeEditError} showIcon={false} class="rounded-lg px-3 py-2" />
            {/if}

            <div class="flex flex-col sm:flex-row justify-end gap-3 pt-2">
                <Button size="touch-lg" type="button" variant="outline"  onclick={() => goto(`/dashboard/orders/${id}`)} disabled={employeeSaving}>
                    {m['common.cancel']()}
                </Button>
                <Button size="touch-lg" type="submit"  disabled={isLocked || employeeSaving}>
                    {employeeSaving ? m['common.saving']() : m['common.saveChanges']()}
                </Button>
            </div>
        </form>
        </Card.Root>
    </PageContainer>
{:else}
    {@const currentStepIndex = draft?.currentStep ?? 0}

    <div class="flex flex-col flex-1 min-h-0">
        <!-- Status lock banner for DELIVERED / CANCELLED orders -->
        {#if isLocked}
            <InlineAlert text={m["orders.edit.lockedBanner"]()} class="mb-4" />
        {/if}

        <WizardHeader
            title={m["orders.edit.title"]({ ticket: existingOrder?.ticketNumber ? `#${existingOrder.ticketNumber}` : '' })}
            {steps}
            currentStep={currentStepIndex}
            showTray={false}
        >
            {#snippet actions()}
                <Button variant="outline" class="h-11 sm:h-12 px-6" onclick={() => { orderWizardState.clearActiveDraft(); goto(`/dashboard/orders/${id}`); }}>
                    {m["common.cancel"]()}
                </Button>
            {/snippet}
        </WizardHeader>

        <!-- Step Content (read-only if locked) -->
        <LockedRegion locked={isLocked} class="flex flex-1 flex-col pt-4">
            {#if steps[currentStepIndex]}
                {@const ActiveComponent = steps[currentStepIndex].component}
                {#if currentStepIndex === 1}
                    <ActiveComponent onNext={handleNext} onBack={handleBack} isEditMode={true} />
                {:else}
                    <ActiveComponent onNext={handleNext} onBack={handleBack} />
                {/if}
            {/if}
        </LockedRegion>
    </div>
{/if}
