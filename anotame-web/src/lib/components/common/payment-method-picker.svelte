<script lang="ts" module>
  export type PaymentMethod = 'CASH' | 'CARD' | 'TRANSFER';
</script>

<script lang="ts">
  import * as ToggleGroup from '$lib/components/ui/toggle-group';
  import DollarSignIcon from '@lucide/svelte/icons/dollar-sign';
  import CreditCardIcon from '@lucide/svelte/icons/credit-card';
  import WalletIcon from '@lucide/svelte/icons/wallet';
  import { cn } from '$lib/utils';
  import * as m from '$lib/paraglide/messages';

  /** Cash / card / transfer choice, shown as three tiles. Always holds a value. */
  interface Props {
    value: PaymentMethod;
    /** `lg` for a page step, `md` for a dialog. */
    size?: 'md' | 'lg';
    disabled?: boolean;
    /** Accessible name for the group. */
    label: string;
    /** Layout classes at the call site. */
    class?: string;
  }

  let { value = $bindable(), size = 'md', disabled = false, label, class: className }: Props =
    $props();

  const OPTIONS = [
    { value: 'CASH', label: m['orders.detail.paymentCash'], icon: DollarSignIcon },
    { value: 'CARD', label: m['orders.detail.paymentCard'], icon: CreditCardIcon },
    { value: 'TRANSFER', label: m['orders.detail.paymentTransfer'], icon: WalletIcon },
  ] as const;
</script>

<ToggleGroup.Root
  type="single"
  variant="tile"
  size={size === 'lg' ? 'tile-lg' : 'tile'}
  spacing={2}
  aria-label={label}
  {disabled}
  {value}
  onValueChange={(v) => {
    // A single-choice group lets the user clear it; a payment always needs a method.
    if (v) value = v as PaymentMethod;
  }}
  class={cn('grid w-full grid-cols-3', size === 'lg' && 'gap-4', className)}
>
  {#each OPTIONS as option (option.value)}
    {@const Icon = option.icon}
    <ToggleGroup.Item value={option.value} class="w-full">
      <Icon aria-hidden="true" />
      <span class={cn('font-semibold leading-tight wrap-break-word', size === 'md' && 'text-xs')}>
        {option.label()}
      </span>
    </ToggleGroup.Item>
  {/each}
</ToggleGroup.Root>
