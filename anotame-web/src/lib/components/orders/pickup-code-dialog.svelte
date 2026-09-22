<script lang="ts">
  import CheckboxField from '$lib/components/common/checkbox-field.svelte';
  import * as Card from '$lib/components/ui/card';
  import { Text } from '$lib/components/ui/typography';
  import * as Dialog from '$lib/components/ui/dialog';
  import { Button } from '$lib/components/ui/button';
  import * as InputOTP from '$lib/components/ui/input-otp';
  import { REGEXP_ONLY_DIGITS } from 'bits-ui';
  import { apiService, API_SALES } from '$lib/services/api.svelte';
  import { ApiError } from '$lib/services/ApiError';
  import { toast } from 'svelte-sonner';
  import PaymentMethodPicker, { type PaymentMethod } from '$lib/components/common/payment-method-picker.svelte';
  import * as m from '$lib/paraglide/messages';
  import { formatCurrency } from '$lib/utils/formatUtils';


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
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>{m["orders.pickup.title"]()}</Dialog.Title>
      <Dialog.Description>
        {m["orders.pickup.description"]({ ticket: ticketNumber })}
      </Dialog.Description>
    </Dialog.Header>

    <div class="space-y-4 py-2">
      <InputOTP.Root
        id="pickup-code-input"
        maxlength={6}
        pattern={REGEXP_ONLY_DIGITS}
        inputmode="numeric"
        autocomplete="one-time-code"
        aria-label={m["orders.pickup.ariaLabel"]()}
        aria-describedby={errorMessage ? 'pickup-code-error' : undefined}
        aria-invalid={errorMessage ? true : undefined}
        bind:value={pickupCode}
        onValueChange={() => (errorMessage = '')}
        class="justify-center"
      >
        {#snippet children({ cells })}
          <InputOTP.Group>
            {#each cells as cell, i (i)}
              <InputOTP.Slot {cell} class="size-12 font-mono text-2xl" />
            {/each}
          </InputOTP.Group>
        {/snippet}
      </InputOTP.Root>
      {#if errorMessage}
        <p id="pickup-code-error" class="text-sm text-destructive" role="alert">{errorMessage}</p>
      {/if}

      {#if hasRemainingBalance}
        <Card.Root tone="muted" size="sm" class="gap-3">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p class="text-sm font-medium text-muted-foreground">
                {m["orders.pickup.remainingBalance"]()}
              </p>
              <Text variant="metric" size="sm" class="text-destructive">
                {formatCurrency(remainingBalance)}
              </Text>
            </div>

            <CheckboxField
              id="pickup-mark-fully-paid"
              label={m["orders.pickup.markFullyPaid"]()}
              bind:checked={markFullyPaid}
              disabled={submitting}
            />
          </div>

          {#if markFullyPaid}
            <div class="space-y-2">
              <p class="text-sm font-medium">{m["orders.pickup.paymentMethod"]()}</p>
              <PaymentMethodPicker bind:value={paymentMethod} label={m["orders.pickup.paymentMethod"]()} disabled={submitting} />
            </div>
          {/if}
        </Card.Root>
      {/if}
    </div>

    <Dialog.Footer class="gap-2">
      <Button size="touch-lg" variant="outline" onclick={handleClose}>
        {m["common.cancel"]()}
      </Button>
      <Button size="touch-lg"
        onclick={handleSubmit}
        disabled={!isValid || submitting}
      >
        {submitting ? m["orders.pickup.confirming"]() : m["orders.pickup.confirmDelivery"]()}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
