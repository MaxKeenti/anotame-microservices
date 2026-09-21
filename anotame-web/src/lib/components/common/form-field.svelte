<script lang="ts">
  import { Text } from '$lib/components/ui/typography';
  import type { Snippet } from 'svelte';
  import RequiredMark from './required-mark.svelte';
  import { cn } from '$lib/utils';

  /** A labelled form control with its validation error and guidance text. */
  interface Props {
    /** Localized field label. */
    label: string;
    /** `id` of the control this labels. */
    for: string;
    /** Marks the field with an asterisk. */
    required?: boolean;
    /** Validation message for this field, when it has one. */
    error?: string | string[];
    /** Guidance shown under the control. */
    hint?: string;
    /** Layout classes at the call site, such as a column span. */
    class?: string;
    /** The input, select, or picker being labelled. */
    children: Snippet;
  }

  let { label, for: htmlFor, required = false, error, hint, class: className, children }: Props =
    $props();

  const errorText = $derived(Array.isArray(error) ? error.join(' ') : error);
</script>

<div class={cn('space-y-2', className)}>
  <label for={htmlFor} class="text-sm font-medium">
    {label}{#if required}<RequiredMark />{/if}
  </label>
  {@render children()}
  {#if errorText}
    <span class="text-xs text-destructive">{errorText}</span>
  {/if}
  {#if hint}
    <Text variant="small">{hint}</Text>
  {/if}
</div>
