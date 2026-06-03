<script lang="ts">
  import * as Dialog from '$lib/components/ui/dialog';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { apiService, API_SALES } from '$lib/services/api.svelte';
  import { ApiError } from '$lib/services/ApiError';
  import { toast } from 'svelte-sonner';
  import { CreditCard, DollarSign, Wallet } from 'lucide-svelte';
  import * as m from '$lib/paraglide/messages';
  import { formatCurrency } from '$lib/utils/formatUtils';

  type PaymentMethod = 'CASH' | 'CARD' | 'TRANSFER';

  type Props = {
    open: boolean;
    orderId: string;
    ticketNumber: string;
    orderTotal?: number;
    amountPaid?: number;
    onDelivered: () => void;
    onClose: () => void;
  };

  let {
    open = $bindable(false),
    orderId,
    ticketNumber,
    orderTotal = 0,
    amountPaid = 0,
    onDelivered,
    onClose
  }: Props = $props();

  let pickupCode = $state('');
  let errorMessage = $state('');
  let submitting = $state(false);
  let markFullyPaid = $state(false);
  let paymentMethod = $state<PaymentMethod>('CASH');

  const isValid = $derived(pickupCode.length === 6 && /^\d{6}$/.test(pickupCode));
  const remainingBalance = $derived(Math.max(0, (orderTotal ?? 0) - (amountPaid ?? 0)));
  const hasRemainingBalance = $derived(remainingBalance > 0.009);

  $effect(() => {
    if (!hasRemainingBalance) {
      markFullyPaid = false;
    }
  });

  function handleInput(e: Event) {
    const target = e.target as HTMLInputElement;
    pickupCode = target.value.replace(/\D/g, '').slice(0, 6);
    errorMessage = '';
  }

  function reset() {
    pickupCode = '';
    errorMessage = '';
    markFullyPaid = false;
    paymentMethod = 'CASH';
  }

  async function handleSubmit() {
    if (!isValid) return;
    submitting = true;
    errorMessage = '';

    try {
      await apiService.request(`${API_SALES}/orders/${orderId}/deliver`, {
        method: 'PATCH',
        body: JSON.stringify({
          pickupCode,
          markFullyPaid: markFullyPaid && hasRemainingBalance,
          paymentMethod: markFullyPaid && hasRemainingBalance ? paymentMethod : null
        })
      });
      toast.success(m["orders.pickup.deliveredSuccess"]());
      reset();
      open = false;
      onDelivered();
    } catch (e: any) {
      if (e instanceof ApiError && e.status === 400) {
        errorMessage = m["orders.pickup.wrongCode"]();
        pickupCode = '';
      } else {
        toast.error(m["orders.pickup.genericError"]());
      }
    } finally {
      submitting = false;
    }
  }

  function handleClose() {
    reset();
    open = false;
    onClose();
  }
</script>

<Dialog.Root bind:open onOpenChange={(v) => { if (!v) handleClose(); }}>
  <Dialog.Content class="sm:max-w-md">
    <Dialog.Header>
      <Dialog.Title>{m["orders.pickup.title"]()}</Dialog.Title>
      <Dialog.Description>
        {m["orders.pickup.description"]({ ticket: ticketNumber })}
      </Dialog.Description>
    </Dialog.Header>

    <div class="space-y-4 py-2">
      <Input
        id="pickup-code-input"
        type="text"
        inputmode="numeric"
        maxlength={6}
        pattern="[0-9]{6}"
        placeholder="000000"
        aria-label={m["orders.pickup.ariaLabel"]()}
        aria-describedby={errorMessage ? 'pickup-code-error' : undefined}
        value={pickupCode}
        oninput={handleInput}
        class="text-center text-2xl tracking-widest font-mono h-14 touch-manipulation ring-primary focus-visible:ring-primary"
        autocomplete="off"
      />
      {#if errorMessage}
        <p id="pickup-code-error" class="text-sm text-destructive" role="alert">{errorMessage}</p>
      {/if}

      {#if hasRemainingBalance}
        <div class="rounded-lg border border-border bg-muted/30 p-3 space-y-3">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p class="text-sm font-medium text-muted-foreground">
                {m["orders.pickup.remainingBalance"]()}
              </p>
              <p class="text-xl font-bold text-destructive">
                {formatCurrency(remainingBalance)}
              </p>
            </div>

            <label for="pickup-mark-fully-paid" class="flex items-center gap-3 cursor-pointer touch-manipulation">
              <input
                id="pickup-mark-fully-paid"
                type="checkbox"
                class="checkbox-custom"
                bind:checked={markFullyPaid}
                disabled={submitting}
              />
              <span class="text-sm font-semibold">{m["orders.pickup.markFullyPaid"]()}</span>
            </label>
          </div>

          {#if markFullyPaid}
            <div class="space-y-2">
              <p class="text-sm font-medium">{m["orders.pickup.paymentMethod"]()}</p>
              <div class="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={submitting}
                  onclick={() => paymentMethod = 'CASH'}
                  class={`h-auto min-h-16 flex flex-col items-center justify-center px-2 py-3 rounded-lg border-2 transition-all ${paymentMethod === 'CASH' ? 'border-primary bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary' : 'border-border'}`}
                >
                  <DollarSign class="w-5 h-5 mb-1" />
                  <span class="text-xs font-semibold leading-tight text-center break-words">{m["orders.detail.paymentCash"]()}</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={submitting}
                  onclick={() => paymentMethod = 'CARD'}
                  class={`h-auto min-h-16 flex flex-col items-center justify-center px-2 py-3 rounded-lg border-2 transition-all ${paymentMethod === 'CARD' ? 'border-primary bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary' : 'border-border'}`}
                >
                  <CreditCard class="w-5 h-5 mb-1" />
                  <span class="text-xs font-semibold leading-tight text-center break-words">{m["orders.detail.paymentCard"]()}</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={submitting}
                  onclick={() => paymentMethod = 'TRANSFER'}
                  class={`h-auto min-h-16 flex flex-col items-center justify-center px-2 py-3 rounded-lg border-2 transition-all ${paymentMethod === 'TRANSFER' ? 'border-primary bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary' : 'border-border'}`}
                >
                  <Wallet class="w-5 h-5 mb-1" />
                  <span class="text-xs font-semibold leading-tight text-center break-words">{m["orders.detail.paymentTransfer"]()}</span>
                </Button>
              </div>
            </div>
          {/if}
        </div>
      {/if}
    </div>

    <Dialog.Footer class="gap-2">
      <Button variant="outline" onclick={handleClose} class="h-12 touch-manipulation">
        {m["common.cancel"]()}
      </Button>
      <Button
        onclick={handleSubmit}
        disabled={!isValid || submitting}
        class="h-12 touch-manipulation"
      >
        {submitting ? m["orders.pickup.confirming"]() : m["orders.pickup.confirmDelivery"]()}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
