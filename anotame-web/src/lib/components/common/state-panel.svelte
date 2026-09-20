<script lang="ts">
  import * as Empty from '$lib/components/ui/empty';
  import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
  import { cn } from '$lib/utils';

  /** A full-width panel carrying a single status message: loading, empty, or blocked. */
  interface Props {
    /** Localized message shown in the panel. */
    message: string;
    /** Secondary line under the message, such as an identifier being loaded. */
    detail?: string;
    /** Pulses the message while work is in flight. */
    loading?: boolean;
    /** Shows a spinning indicator above the message. */
    spinner?: boolean;
    /** Layout classes for the panel at the call site, such as a different height. */
    class?: string;
  }

  let { message, detail, loading = false, spinner = false, class: className }: Props = $props();
</script>

<Empty.Root class={cn('h-64 border', className)}>
  {#if spinner}
    <LoaderCircleIcon class="size-10 animate-spin text-primary" aria-hidden="true" />
  {/if}
  <Empty.Description class={loading ? 'animate-pulse' : undefined}>
    {message}
  </Empty.Description>
  {#if detail}
    <Empty.Description class="font-mono text-xs opacity-60">{detail}</Empty.Description>
  {/if}
</Empty.Root>
