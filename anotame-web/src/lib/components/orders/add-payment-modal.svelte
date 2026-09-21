<script lang="ts">
  import { Spinner } from '$lib/components/ui/spinner';
  import * as InputGroup from '$lib/components/ui/input-group';
  import { FormField, InlineAlert } from '$lib/components/common';
  import * as Dialog from '$lib/components/ui/dialog';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { apiService, API_SALES } from '$lib/services/api.svelte';
  import { ApiError } from '$lib/services/ApiError';
  import { toast } from 'svelte-sonner';
  import PaymentMethodPicker, { type PaymentMethod } from '$lib/components/common/payment-method-picker.svelte';
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
  let method = $state<PaymentMethod>('CASH');
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
          paymentMethod: method,
          notes: note.trim() || null
        })
      });
      toast.success(m['orders.payment.success']());
      reset();
      open = false;
      onSuccess();
    } catch (e: any) {
      if (e instanceof ApiError) {
        if (e.status === 400 || e.status === 422) {
          const body = e.message ?? '';
          if (body.includes('OVERPAYMENT') || body.includes('overpayment') || body.includes('exceed')) {
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
  <Dialog.Content>
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
      <FormField label={m['orders.payment.amountLabel']()} for="payment-amount" hint={m['orders.payment.refundHint']()}>
        <InputGroup.Root class="h-12">
          <InputGroup.Input
            id="payment-amount"
            type="number"
            step="0.01"
            placeholder={m['orders.payment.amountPlaceholder']()}
            class="text-lg font-mono"
            bind:value={amount}
            disabled={submitting}
          />
          <InputGroup.Addon>$</InputGroup.Addon>
        </InputGroup.Root>
      </FormField>

      <!-- Method -->
      <div class="space-y-2">
        <div class="text-sm font-medium">{m['orders.detail.paymentMethod']()}</div>
        <PaymentMethodPicker bind:value={method} label={m['orders.detail.paymentMethod']()} disabled={submitting} />
      </div>

      <!-- Note -->
      <FormField label={m['orders.payment.noteLabel']()} for="payment-note" required={isRefund}>
        <Input
          id="payment-note"
          type="text"
          placeholder={m['orders.payment.notePlaceholder']()}
          class="h-11"
          bind:value={note}
          disabled={submitting}
        />
      </FormField>

      {#if errorMessage}
        <InlineAlert text={errorMessage} showIcon={false} />
      {/if}
    </div>

    <Dialog.Footer class="gap-2">
      <Button size="touch" variant="outline" onclick={handleClose} disabled={submitting}>
        {m['common.cancel']()}
      </Button>
      <Button size="touch" onclick={handleSubmit} disabled={submitting || (amount ?? 0) === 0}>
        {#if submitting}
          <Spinner data-icon="inline-start" aria-hidden="true" />
        {/if}
        {isRefund ? m['orders.payment.submitRefund']() : m['orders.payment.submit']()}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
