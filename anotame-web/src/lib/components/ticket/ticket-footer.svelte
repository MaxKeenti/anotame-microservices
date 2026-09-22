<script lang="ts">
  import { Text } from '$lib/components/ui/typography';
  import type { Snippet } from 'svelte';

  /** Closing block of a public ticket: a small notice and any actions. */
  interface Props {
    /** Localized fine print shown above the actions. */
    notice: string;
    /** Optional actions, such as share and print. */
    children?: Snippet;
  }

  let { notice, children }: Props = $props();
</script>

<footer class="space-y-3 border-t border-border pt-5 text-center">
  <Text variant="small">{notice}</Text>
  {@render children?.()}
</footer>
