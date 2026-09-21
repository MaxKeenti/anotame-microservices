<script lang="ts">
  import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
  import InfoIcon from '@lucide/svelte/icons/info';
  import * as Alert from '$lib/components/ui/alert';

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

  const Icon = $derived(tone === 'info' ? InfoIcon : TriangleAlertIcon);
</script>

<Alert.Root variant={tone} class={className}>
  {#if showIcon}
    <Icon aria-hidden="true" />
  {/if}
  <Alert.Description class="font-medium text-current">{text}</Alert.Description>
</Alert.Root>
