<script lang="ts">
  import * as Dialog from '$lib/components/ui/dialog';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { apiService, API_SALES } from '$lib/services/api.svelte';
  import { ApiError } from '$lib/services/ApiError';
  import { toast } from 'svelte-sonner';
  import { CreditCard, DollarSign, Wallet, Loader2 } from 'lucide-svelte';
  import * as m from '$lib/paraglide/messages';
  import { formatCurrency } from '$lib/utils/formatUtils';

  type Props = {
    open: boolean;
    orderId: string;
    orderTotal: number;
    amountPaid: number;
    onSuccess: () => void;
    onClose: () => void;
  };

  let { open = $bindable(false), orderId, orderTotal, amountPaid, onSuccess, onClose }: Props = $props();

  let amount = $state<number | null>(null);
  let method = $state<'CASH' | 'CARD' | 'TRANSFER'>('CASH');
  let note = $state('');
  let submitting = $state(false);
  let errorMessage = $state('');

  let isRefund = $derived((amount ?? 0) < 0);
  let remaining = $derived(Math.max(0, orderTotal - amountPaid));

  function reset() {
    amount = null;
    method = 'CASH';
    note = '';
    errorMessage = '';
    submitting = false;
  }

  function handleClose() {
    reset();
    open = false;
    onClose();
  }

  async function handleSubmit() {
    errorMessage = '';
    const amt = amount ?? 0;

    if (amt === 0) {
      errorMessage = m['orders.payment.amountLabel']() + ': required';
      return;
    }
    if (amt < 0 && !note.trim()) {
      errorMessage = m['orders.payment.errorRefundNote']();
      return;
    }

    submitting = true;
    try {
      await apiService.request(`${API_SALES}/orders/${orderId}/payments`, {
        method: 'POST',
        body: JSON.stringify({
          amount: amt,
          method,
          note: note.trim() || null
        })
      });
      toast.success(m['orders.payment.success']());
      reset();
      open = false;
      onSuccess();
    } catch (e: any) {
      if (e instanceof ApiError) {
        if (e.status === 400) {
          const body = e.message ?? '';
          if (body.includes('OVERPAYMENT') || body.includes('overpayment')) {
            errorMessage = m['orders.payment.errorOverpayment']();
          } else if (body.includes('REFUND_NOTE') || body.includes('note')) {
            errorMessage = m['orders.payment.errorRefundNote']();
          } else {
            errorMessage = m['orders.payment.errorGeneric']();
          }
        } else {
          errorMessage = m['orders.payment.errorGeneric']();
        }
      } else {
        errorMessage = m['orders.payment.errorGeneric']();
      }
    } finally {
      submitting = false;
    }
  }
</script>

<Dialog.Root bind:open onOpenChange={(v) => { if (!v) handleClose(); }}>
  <Dialog.Content class="sm:max-w-sm">
    <Dialog.Header>
      <Dialog.Title>{m['orders.payment.modalTitle']()}</Dialog.Title>
    </Dialog.Header>

    <div class="space-y-5 py-2">
      <!-- Balance info -->
      <div class="bg-muted/30 rounded-xl p-3 flex justify-between items-center text-sm">
        <span class="text-muted-foreground font-medium">{m['orders.payment.currentBalance']()}</span>
        <span class={`font-bold text-lg ${remaining > 0.001 ? 'text-destructive' : 'text-primary'}`}>
          {formatCurrency(remaining)}
        </span>
      </div>

      <!-- Amount -->
      <div class="space-y-1">
        <label class="text-sm font-medium" for="payment-amount">{m['orders.payment.amountLabel']()}</label>
        <div class="relative">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
          <Input
            id="payment-amount"
            type="number"
            step="0.01"
            placeholder={m['orders.payment.amountPlaceholder']()}
            class="pl-7 h-12 text-lg font-mono"
            bind:value={amount}
            disabled={submitting}
          />
        </div>
        <p class="text-xs text-muted-foreground">{m['orders.payment.refundHint']()}</p>
      </div>

      <!-- Method -->
      <div class="space-y-2">
        <label class="text-sm font-medium">{m['orders.detail.paymentMethod']()}</label>
        <div class="grid grid-cols-3 gap-2">
          <Button
            type="button"
            variant="outline"
            onclick={() => method = 'CASH'}
            class={`h-auto flex flex-col items-center py-3 rounded-xl border-2 transition-all ${method === 'CASH' ? 'border-primary bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary' : 'border-border'}`}
          >
            <DollarSign class="w-5 h-5 mb-1" />
            <span class="text-xs font-semibold">{m['orders.detail.paymentCash']()}</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            onclick={() => method = 'CARD'}
            class={`h-auto flex flex-col items-center py-3 rounded-xl border-2 transition-all ${method === 'CARD' ? 'border-primary bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary' : 'border-border'}`}
          >
            <CreditCard class="w-5 h-5 mb-1" />
            <span class="text-xs font-semibold">{m['orders.detail.paymentCard']()}</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            onclick={() => method = 'TRANSFER'}
            class={`h-auto flex flex-col items-center py-3 rounded-xl border-2 transition-all ${method === 'TRANSFER' ? 'border-primary bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary' : 'border-border'}`}
          >
            <Wallet class="w-5 h-5 mb-1" />
            <span class="text-xs font-semibold">{m['orders.detail.paymentTransfer']()}</span>
          </Button>
        </div>
      </div>

      <!-- Note -->
      <div class="space-y-1">
        <label class="text-sm font-medium" for="payment-note">
          {m['orders.payment.noteLabel']()}
          {#if isRefund}<span class="text-destructive ml-1">*</span>{/if}
        </label>
        <Input
          id="payment-note"
          type="text"
          placeholder={m['orders.payment.notePlaceholder']()}
          class="h-11"
          bind:value={note}
          disabled={submitting}
        />
      </div>

      {#if errorMessage}
        <p class="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg border border-destructive/20" role="alert">
          {errorMessage}
        </p>
      {/if}
    </div>

    <Dialog.Footer class="gap-2">
      <Button variant="outline" onclick={handleClose} disabled={submitting} class="h-11 touch-manipulation">
        {m['common.cancel']()}
      </Button>
      <Button onclick={handleSubmit} disabled={submitting || (amount ?? 0) === 0} class="h-11 touch-manipulation">
        {#if submitting}
          <Loader2 class="w-4 h-4 mr-2 animate-spin" />
        {/if}
        {isRefund ? m['orders.payment.submitRefund']() : m['orders.payment.submit']()}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
