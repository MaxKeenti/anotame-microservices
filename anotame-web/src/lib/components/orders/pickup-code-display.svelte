<script lang="ts">
  import * as m from '$lib/paraglide/messages';

  /** The code staff ask for when a customer collects their order. */
  interface Props {
    code: string;
  }

  let { code }: Props = $props();
</script>

<p class="mb-2 text-sm font-medium tracking-wider text-muted-foreground uppercase">
  {m['orders.detail.pickupCode']()}
</p>
<p class="font-mono text-2xl font-semibold tracking-widest">{code}</p>
