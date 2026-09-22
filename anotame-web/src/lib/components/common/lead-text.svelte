<script lang="ts">
  import { cn } from '$lib/utils';

  /** Muted introductory paragraph under a section heading. */
  interface Props {
    text: string;
    /** Measure classes at the call site, such as a narrower max width. */
    class?: string;
  }

  let { text, class: className }: Props = $props();
</script>

<p class={cn('max-w-3xl text-sm text-muted-foreground', className)}>{text}</p>
