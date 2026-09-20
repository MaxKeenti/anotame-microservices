<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { CalloutKind } from '$lib/config/help';
  import AlertTriangleIcon from '@lucide/svelte/icons/triangle-alert';
  import ShieldCheckIcon from '@lucide/svelte/icons/shield-check';
  import InfoIcon from '@lucide/svelte/icons/info';
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

  const TONE: Record<CalloutKind, string> = {
    important: 'border-warning-border bg-warning-background text-warning-background-foreground',
    admin: 'border-info-border bg-info-background text-info-background-foreground',
    tip: 'border-success-border bg-success-background text-success-background-foreground',
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

<div class="rounded-lg border p-4 text-sm leading-6 {TONE[kind] ?? TONE.tip}">
  <div class="mb-1 flex items-center gap-2 font-bold">
    <Icon class="h-4 w-4" />
    {label}
  </div>
  {#if children}
    {@render children()}
  {:else}
    <p>{text}</p>
  {/if}
</div>
