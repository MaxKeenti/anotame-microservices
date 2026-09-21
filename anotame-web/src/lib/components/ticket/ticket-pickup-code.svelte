<script lang="ts">
  import * as Card from '$lib/components/ui/card';
  import { Text } from '$lib/components/ui/typography';
  import * as m from '$lib/paraglide/messages';

  /** The code a customer quotes when collecting their garments. */
  interface Props {
    code: string;
  }

  let { code }: Props = $props();
</script>

<Card.Root tone="highlight" size="sm" class="gap-2 text-center">
  <Text variant="label">{m['receipt.pickupCode']()}</Text>
  <Text variant="metric" size="lg" class="mt-2 tracking-[0.28em]">{code}</Text>
</Card.Root>
