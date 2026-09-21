<script lang="ts">
  import { Text } from '$lib/components/ui/typography';
  import * as m from '$lib/paraglide/messages';

  /** The code a customer quotes when collecting their garments. */
  interface Props {
    code: string;
  }

  let { code }: Props = $props();
</script>

<section class="rounded-xl border border-primary/25 bg-primary/5 p-5 text-center">
  <Text variant="label">{m['receipt.pickupCode']()}</Text>
  <Text variant="metric" size="lg" class="mt-2 tracking-[0.28em]">{code}</Text>
</section>
