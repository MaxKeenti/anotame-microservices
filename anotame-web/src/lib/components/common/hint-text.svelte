<script lang="ts">
  import { cn } from '$lib/utils';

  /** Small muted guidance text under a control or section. */
  interface Props {
    /** Localized guidance. */
    text: string;
    /** Layout classes at the call site, such as top spacing. */
    class?: string;
  }

  let { text, class: className }: Props = $props();
</script>

<p class={cn('text-xs text-muted-foreground', className)}>{text}</p>
