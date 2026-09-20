<script lang="ts">
  import * as m from '$lib/paraglide/messages';

  /** The code a customer quotes when collecting their garments. */
  interface Props {
    code: string;
  }

  let { code }: Props = $props();
</script>

<section class="rounded-xl border border-primary/25 bg-primary/5 p-5 text-center">
  <p class="text-sm font-medium text-muted-foreground">{m['receipt.pickupCode']()}</p>
  <p class="mt-2 font-mono text-3xl font-bold tracking-[0.28em]">{code}</p>
</section>
