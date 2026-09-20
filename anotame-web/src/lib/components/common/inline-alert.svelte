<script lang="ts">
  import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
  import InfoIcon from '@lucide/svelte/icons/info';
  import { cn } from '$lib/utils';

  /** A short inline message about the state of the form or page around it. */
  interface Props {
    /** Localized message text. */
    text: string;
    /** Severity, which selects the tone and icon. */
    tone?: 'destructive' | 'warning' | 'info';
    /** Hides the icon, for compact messages under a control. */
    showIcon?: boolean;
    /** Layout classes at the call site. */
    class?: string;
  }

  let { text, tone = 'destructive', showIcon = true, class: className }: Props = $props();

  const TONE = {
    destructive: 'border-destructive/30 bg-destructive/10 text-destructive',
    warning: 'border-warning/30 bg-warning/10 text-warning-text',
    info: 'border-info-border bg-info-background text-info-background-foreground',
  } as const;

  const Icon = $derived(tone === 'info' ? InfoIcon : TriangleAlertIcon);
</script>

<div
  role="alert"
  class={cn(
    'flex items-start gap-2 rounded-xl border p-4 text-sm font-medium',
    TONE[tone],
    className
  )}
>
  {#if showIcon}
    <Icon class="mt-0.5 size-5 shrink-0" aria-hidden="true" />
  {/if}
  <span>{text}</span>
</div>
