<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { CalloutKind } from '$lib/config/help';
  import AlertTriangleIcon from '@lucide/svelte/icons/triangle-alert';
  import ShieldCheckIcon from '@lucide/svelte/icons/shield-check';
  import InfoIcon from '@lucide/svelte/icons/info';
  import * as Alert from '$lib/components/ui/alert';
  import type { AlertVariant } from '$lib/components/ui/alert';
  import * as m from '$lib/paraglide/messages';

  /** A tinted aside in a help topic: a tip, a warning, or an admin-only note. */
  interface Props {
    kind: CalloutKind;
    /** Localized body text. Omit when passing richer content as children. */
    text?: string;
    /** Body content, for callouts that carry a list rather than a paragraph. */
    children?: Snippet;
  }

  let { kind, text, children }: Props = $props();

  const TONE: Record<CalloutKind, AlertVariant> = {
    important: 'warning',
    admin: 'info',
    tip: 'success',
  };
  const ICON = { important: AlertTriangleIcon, admin: ShieldCheckIcon, tip: InfoIcon };

  const label = $derived(
    kind === 'important'
      ? m['help.callout.important']()
      : kind === 'admin'
        ? m['help.callout.admin']()
        : m['help.callout.tip']()
  );
  const Icon = $derived(ICON[kind] ?? InfoIcon);
</script>

<Alert.Root variant={TONE[kind] ?? 'success'} class="leading-6">
  <Icon aria-hidden="true" />
  <Alert.Title class="font-bold">{label}</Alert.Title>
  <Alert.Description class="text-current">
    {#if children}
      {@render children()}
    {:else}
      <p>{text}</p>
    {/if}
  </Alert.Description>
</Alert.Root>
