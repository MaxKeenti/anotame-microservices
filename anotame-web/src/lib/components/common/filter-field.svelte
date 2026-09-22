<script lang="ts">
  import { textVariants } from '$lib/components/ui/typography';
  import type { Snippet } from 'svelte';
  import * as Field from '$lib/components/ui/field';
  import { cn } from '$lib/utils';

  /** A labelled filter or search control in a page's filter bar. */
  interface Props {
    /** Localized field label. */
    label: string;
    /** `id` of the control this labels, so the label stays clickable. */
    for: string;
    /** Layout classes at the call site, such as a column span. */
    class?: string;
    /** The input, select, or picker being labelled. */
    children: Snippet;
  }

  let { label, for: htmlFor, class: className, children }: Props = $props();
</script>

<Field.Field class={cn('gap-1.5', className)}>
  <Field.Label class={textVariants({ variant: 'label' })} for={htmlFor}>
    {label}
  </Field.Label>
  {@render children()}
</Field.Field>
