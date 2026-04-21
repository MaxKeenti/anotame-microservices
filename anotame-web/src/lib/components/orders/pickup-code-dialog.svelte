<script lang="ts">
  import * as Dialog from '$lib/components/ui/dialog';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { apiService, API_SALES } from '$lib/services/api.svelte';
  import { ApiError } from '$lib/services/ApiError';
  import { toast } from 'svelte-sonner';
  import * as m from '$lib/paraglide/messages';

  type Props = {
    open: boolean;
    orderId: string;
    ticketNumber: string;
    onDelivered: () => void;
    onClose: () => void;
  };

  let { open = $bindable(false), orderId, ticketNumber, onDelivered, onClose }: Props = $props();

  let pickupCode = $state('');
  let errorMessage = $state('');
  let submitting = $state(false);

  const isValid = $derived(pickupCode.length === 6 && /^\d{6}$/.test(pickupCode));

  function handleInput(e: Event) {
    const target = e.target as HTMLInputElement;
    pickupCode = target.value.replace(/\D/g, '').slice(0, 6);
    errorMessage = '';
  }

  async function handleSubmit() {
    if (!isValid) return;
    submitting = true;
    errorMessage = '';

    try {
      await apiService.request(`${API_SALES}/orders/${orderId}/deliver`, {
        method: 'PATCH',
        body: JSON.stringify({ pickupCode })
      });
      toast.success(m["orders.pickup.deliveredSuccess"]());
      pickupCode = '';
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
    pickupCode = '';
    errorMessage = '';
    open = false;
    onClose();
  }
</script>

<Dialog.Root bind:open onOpenChange={(v) => { if (!v) handleClose(); }}>
  <Dialog.Content class="sm:max-w-sm">
    <Dialog.Header>
      <Dialog.Title>{m["orders.pickup.title"]()}</Dialog.Title>
      <Dialog.Description>
        {m["orders.pickup.description"]({ ticket: ticketNumber })}
      </Dialog.Description>
    </Dialog.Header>

    <div class="space-y-3 py-2">
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
