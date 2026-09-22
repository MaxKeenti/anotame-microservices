<script lang="ts">
  import { formatDate } from '$lib/utils/formatUtils';
  import * as m from '$lib/paraglide/messages';

  /** Who the ticket belongs to and when it is due. */
  interface Props {
    customerName: string;
    phoneNumber?: string | null;
    /** ISO date the order is promised for. */
    committedDeadline?: string | null;
  }

  let { customerName, phoneNumber, committedDeadline }: Props = $props();
</script>

<section class="grid gap-3 text-sm sm:grid-cols-2">
  <div>
    <p class="text-muted-foreground">{m['receipt.customer']()}</p>
    <p class="font-semibold">{customerName}</p>
    {#if phoneNumber}<p class="text-muted-foreground">{phoneNumber}</p>{/if}
  </div>
  <div class="sm:text-right">
    <p class="text-muted-foreground">{m['receipt.delivery']()}</p>
    <p class="font-semibold">{formatDate(committedDeadline)}</p>
  </div>
</section>
