<script lang="ts">
  import { Spinner } from '$lib/components/ui/spinner';
  import * as Empty from '$lib/components/ui/empty';
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
    /**
     * `screen` fills the viewport (session checks), `page` stands in for a whole
     * page, `section` for a card-sized block, `inset` is a framed block sized to
     * its content, and `inline` is an unframed row inside a panel or list.
     */
    size?: 'screen' | 'page' | 'section' | 'inset' | 'inline';
    /** Layout classes at the call site. */
    class?: string;
  }

  let {
    message,
    detail,
    loading = false,
    spinner = false,
    size = 'section',
    class: className,
  }: Props = $props();

  const SIZE = {
    screen: 'h-dvh border-0',
    page: 'h-[60vh] border-0',
    section: 'h-64 border',
    inset: 'h-auto border py-12',
    inline: 'h-auto border-0 p-0 py-8',
  } as const;
</script>

<Empty.Root class={cn(SIZE[size], className)}>
  {#if spinner}
    <Spinner class="size-10 text-primary" aria-hidden="true" />
  {/if}
  <Empty.Description class={loading ? 'animate-pulse' : undefined}>
    {message}
  </Empty.Description>
  {#if detail}
    <Empty.Description class="font-mono text-xs opacity-60">{detail}</Empty.Description>
  {/if}
</Empty.Root>
