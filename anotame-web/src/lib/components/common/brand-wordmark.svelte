<script lang="ts">
  import { cn } from '$lib/utils';

  /** The product name with its accented suffix, as used on public pages. */
  interface Props {
    /** Localized product name. */
    text: string;
    /** Suffix rendered in the brand colour, such as "." or ".com". */
    accent: string;
    /** Type scale at the call site. */
    class?: string;
    /** Localized line under the wordmark. */
    tagline?: string;
  }

  let { text, accent, class: className, tagline }: Props = $props();
</script>

<div class="flex flex-col items-center gap-8">
  <h1 class={cn('font-heading font-bold text-foreground', className)}>
    {text}<span class="text-primary">{accent}</span>
  </h1>
  {#if tagline}
    <p class="max-w-md text-xl text-muted-foreground">{tagline}</p>
  {/if}
</div>
