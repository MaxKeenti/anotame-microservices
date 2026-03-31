<script lang="ts">
    import { goto } from '$app/navigation';
    import { orderWizardState } from '$lib/services/orders/OrderWizardState.svelte';
    import { authService } from '$lib/services/auth.svelte';
    import { apiService, API_SALES } from '$lib/services/api.svelte';
    import { Button } from '$lib/components/ui/button';
    import { Input } from '$lib/components/ui/input';
    import { CreditCard, DollarSign, Wallet } from 'lucide-svelte';
    import { toast } from 'svelte-sonner';
    import { AdaptiveDateTimePicker } from '$lib/components/ui/responsive';

    let props = $props<{ onNext: () => void, onBack: () => void }>();

    let isSubmitting = $state(false);
    let error = $state<string | null>(null);

    let draft = $derived(orderWizardState.activeDraft || {} as any);

    let total = $derived((draft.items || []).reduce((acc, item) => {
        const itemTotal = (item.services || []).reduce((sAcc, s) => sAcc + (s.unitPrice || 0) + (s.adjustmentAmount || 0), 0);
        return acc + itemTotal;
    }, 0));

    let balance = $derived(Math.max(0, total - (draft.amountPaid || 0)));

    function handlePaymentMethod(method: 'CASH' | 'CARD' | 'TRANSFER') {
        orderWizardState.updateActiveDraft({ paymentMethod: method });
    }

    function handleAmountPaid(amount: string) {
        const val = parseFloat(amount);
        orderWizardState.updateActiveDraft({ amountPaid: isNaN(val) ? 0 : val });
    }

    function handleDeadline(date: string) {
        orderWizardState.updateActiveDraft({ committedDeadline: date });
    }

    function handleNotes(notes: string) {
        orderWizardState.updateActiveDraft({ notes });
    }

    let minDeadline = $derived.by(() => {
        const now = new Date();
        const offset = now.getTimezoneOffset() * 60000;
        return new Date(now.getTime() - offset).toISOString().slice(0, 16);
    });

    async function handleSubmit() {
        if (!draft.customer || !draft.items || draft.items.length === 0) {
            error = "Faltan datos requeridos (Cliente o Prendas)";
            return;
        }
        error = null;
        isSubmitting = true;

        try {
            const orderItems = draft.items.map(item => ({
                garmentTypeId: item.garmentTypeId || item.garmentId || "",
                garmentName: item.garmentName || "",
                quantity: 1,
                notes: item.notes || "",
                services: item.services?.map(s => ({
                    serviceId: s.serviceId,
                    serviceName: s.serviceName,
                    unitPrice: s.unitPrice,
                    adjustmentAmount: s.adjustmentAmount,
                    adjustmentReason: s.adjustmentReason
                })) || []
            }));

            let deadlineStr = draft.committedDeadline;
            if (!deadlineStr) {
                deadlineStr = new Date().toISOString().slice(0, 19);
            } else if (deadlineStr.length === 10) {
                deadlineStr = `${deadlineStr}T18:00:00`;
            } else {
                deadlineStr = deadlineStr.slice(0, 19);
            }

            const payload: any = {
                customer: draft.customer,
                items: orderItems,
                committedDeadline: deadlineStr,
                notes: draft.notes || "",
                amountPaid: draft.amountPaid || 0,
                paymentMethod: draft.paymentMethod || "CASH"
            };

            if (draft.isEditing && draft.id) {
                await apiService.updateOrder(draft.id, payload);
                toast.success("Orden actualizada exitosamente");
                orderWizardState.clearActiveDraft();
                goto(`/dashboard/orders/${draft.id}?action=print`);
            } else {
                const res = await apiService.request<any>(`${API_SALES}/orders`, {
                    method: 'POST',
                    headers: {
                        "X-User-Name": authService.user?.username || "Anonymous",
                        "X-User-Id": authService.user?.id || "unknown",
                        "X-User-Role": authService.user?.role || "USER"
                    },
                    body: JSON.stringify(payload)
                });
                
                toast.success("Orden confirmada exitosamente");
                orderWizardState.clearActiveDraft();
                goto(`/dashboard/orders/${res.id}?action=print`);
            }
        } catch (e: any) {
            console.error(e);
            error = `Error de conexión: ${e.message}`;
            toast.error("Error al procesar la orden", { description: e.message });
        } finally {
            isSubmitting = false;
        }
    }
</script>

<div class="flex flex-col h-full gap-6">
    <div class="flex items-center justify-between">
        <h2 class="text-xl font-semibold">Paso 3: Pago y Confirmación</h2>
    </div>

    <div class="flex-1 overflow-y-auto space-y-8 pr-2 custom-scrollbar">
        <!-- Total Section -->
        <div class="text-center py-6 bg-muted/20 rounded-xl">
            <div class="text-muted-foreground uppercase text-sm font-semibold tracking-wider">Total a Pagar</div>
            <div class="text-5xl font-bold font-mono mt-2">${total.toFixed(2)}</div>
        </div>

        <!-- Payment Method -->
        <div class="space-y-4">
            <label class="text-sm font-medium" for="payment-method">Método de Pago</label>
            <div class="grid grid-cols-3 gap-4" id="payment-method">
                <Button
                    variant="outline"
                    onclick={() => handlePaymentMethod("CASH")}
                    class={`h-auto flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${draft.paymentMethod === 'CASH' || !draft.paymentMethod ? 'border-primary bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary' : 'border-border'}`}
                >
                    <DollarSign class="w-8 h-8 mb-2" />
                    <span class="font-semibold">Efectivo</span>
                </Button>
                <Button
                    variant="outline"
                    onclick={() => handlePaymentMethod("CARD")}
                    class={`h-auto flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${draft.paymentMethod === 'CARD' ? 'border-primary bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary' : 'border-border'}`}
                >
                    <CreditCard class="w-8 h-8 mb-2" />
                    <span class="font-semibold">Tarjeta</span>
                </Button>
                <Button
                    variant="outline"
                    onclick={() => handlePaymentMethod("TRANSFER")}
                    class={`h-auto flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${draft.paymentMethod === 'TRANSFER' ? 'border-primary bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary' : 'border-border'}`}
                >
                    <Wallet class="w-8 h-8 mb-2" />
                    <span class="font-semibold">Transf.</span>
                </Button>
            </div>
        </div>

        <!-- Payment Amounts -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-2">
                <label class="text-sm font-medium" for="amount-paid">Monto Recibido</label>
                <div class="relative">
                    <span class="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-xl">$</span>
                    <Input
                        id="amount-paid"
                        type="number"
                        min="0"
                        step="0.01"
                        class="pl-8 text-2xl font-bold h-14 rounded-xl"
                        value={draft.amountPaid || ""}
                        oninput={(e) => handleAmountPaid(e.currentTarget.value)}
                        placeholder="0.00"
                    />
                </div>
                <!-- Quick Buttons -->
                <div class="flex gap-2 mt-2">
                    <Button variant="outline" size="sm" onclick={() => orderWizardState.updateActiveDraft({ amountPaid: total })}>Total</Button>
                    <Button variant="outline" size="sm" onclick={() => orderWizardState.updateActiveDraft({ amountPaid: total / 2 })}>50%</Button>
                    <Button variant="outline" size="sm" onclick={() => orderWizardState.updateActiveDraft({ amountPaid: 0 })}>0</Button>
                </div>
            </div>

            <div class="bg-card border border-border p-4 rounded-xl flex flex-col justify-center items-center shadow-sm">
                <div class="text-sm text-muted-foreground">Saldo Pendiente</div>
                <div class={`text-4xl font-bold mt-1 ${balance > 0 ? 'text-destructive' : 'text-primary'}`}>
                    ${balance.toFixed(2)}
                </div>
            </div>
        </div>

        <!-- Deadline & Notes -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border">
            <div class="space-y-2">
                <label class="text-sm font-medium" for="delivery-date">Fecha de Entrega</label>
                <!-- Adaptive: Calendar + Time popover on desktop, native datetime-local on mobile -->
                <AdaptiveDateTimePicker
                    id="delivery-date"
                    value={draft.committedDeadline ? draft.committedDeadline.slice(0, 16) : ''}
                    min={minDeadline}
                    onValueChange={(v) => handleDeadline(v)}
                    placeholder="Seleccionar fecha y hora..."
                    class="rounded-xl text-lg"
                />
            </div>
            <div class="space-y-2">
                <label class="text-sm font-medium" for="order-notes">Notas Generales de Orden</label>
                <Input
                    id="order-notes"
                    placeholder="Detalles sobre entrega, atención, etc."
                    class="h-12 rounded-xl text-lg"
                    value={draft.notes || ""}
                    oninput={(e) => handleNotes(e.currentTarget.value)}
                />
            </div>
        </div>
    </div>

    {#if error}
        <div class="p-3 bg-destructive/10 text-destructive rounded-xl text-center text-sm font-medium shadow-sm transition-all border border-destructive/20">
            {error}
        </div>
    {/if}

    <div class="border-t border-border pt-4 mt-auto flex justify-between gap-4">
        <Button variant="outline" size="lg" onclick={props.onBack} class="flex-1 rounded-xl h-14 text-lg touch-manipulation" disabled={isSubmitting}>
            Atrás
        </Button>
        <Button size="lg" onclick={handleSubmit} disabled={isSubmitting} class="flex-1 rounded-xl h-14 text-lg font-bold shadow-md touch-manipulation uppercase tracking-wide">
            {isSubmitting ? "Procesando..." : (draft.isEditing ? "Actualizar Orden" : "Confirmar Orden")}
        </Button>
    </div>
</div>
