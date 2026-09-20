<script lang="ts">
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
  <p class="text-xs text-muted-foreground">{notice}</p>
  {@render children?.()}
</footer>
