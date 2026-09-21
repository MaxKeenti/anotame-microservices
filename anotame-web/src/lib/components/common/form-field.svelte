<script lang="ts">
  import * as Field from '$lib/components/ui/field';
  import { cn } from '$lib/utils';
  import type { Snippet } from 'svelte';
  import RequiredMark from './required-mark.svelte';

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

<Field.Field class={cn('gap-2', className)} data-invalid={errorText ? true : undefined}>
  <Field.Label for={htmlFor}>
    {label}{#if required}<RequiredMark />{/if}
  </Field.Label>
  {@render children()}
  {#if errorText}
    <Field.Error>{errorText}</Field.Error>
  {/if}
  {#if hint}
    <Field.Description>{hint}</Field.Description>
  {/if}
</Field.Field>
