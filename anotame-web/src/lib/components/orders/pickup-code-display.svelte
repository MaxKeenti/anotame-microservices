<script lang="ts">
  import { Text } from '$lib/components/ui/typography';
  import * as m from '$lib/paraglide/messages';

  /** The code staff ask for when a customer collects their order. */
  interface Props {
    code: string;
  }

  let { code }: Props = $props();
</script>

<Text variant="label" class="mb-2">
  {m['orders.detail.pickupCode']()}
</Text>
<Text variant="metric" class="tracking-widest">{code}</Text>
