<script lang="ts">
  import IconMedallion from './icon-medallion.svelte';
  import type { Snippet } from 'svelte';
  import * as Empty from '$lib/components/ui/empty';
  import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
  import { cn } from '$lib/utils';

  /** Full-height panel shown when a record could not be loaded. */
  interface Props {
    /** Localized headline, such as "Order not found". */
    title: string;
    /** Localized explanation of what went wrong. */
    description: string;
    /** Layout classes at the call site, such as a shorter height. */
    class?: string;
    /** Recovery actions, usually a link back to the list. */
    children?: Snippet;
  }

  let { title, description, class: className, children }: Props = $props();
</script>

<Empty.Root class={cn('h-[60vh] gap-6 border-0 p-8', className)}>
  <IconMedallion tone="destructive" size="2xl">
    <TriangleAlertIcon />
  </IconMedallion>
  <div>
    <Empty.Title class="text-2xl font-bold text-destructive">{title}</Empty.Title>
    <Empty.Description class="mt-2 max-w-md text-base">{description}</Empty.Description>
  </div>
  {@render children?.()}
</Empty.Root>
