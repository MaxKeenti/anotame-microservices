<script lang="ts">
  import * as Field from '$lib/components/ui/field';
  import { Checkbox } from '$lib/components/ui/checkbox';
  import { cn } from '$lib/utils';

  /**
   * A checkbox with its label as one 44px touch target: tapping the label
   * toggles the box. Optional guidance renders under the label.
   */
  interface Props {
    /** `id` of the checkbox, linking the label to it. */
    id: string;
    /** Localized label. */
    label: string;
    checked?: boolean;
    indeterminate?: boolean;
    disabled?: boolean;
    /** Guidance shown under the label. */
    description?: string;
    /** Called with the new state; use instead of `bind:checked` for derived state. */
    onCheckedChange?: (checked: boolean) => void;
    /** Layout classes at the call site. */
    class?: string;
  }

  let {
    id,
    label,
    checked = $bindable(false),
    indeterminate = false,
    disabled = false,
    description,
    onCheckedChange,
    class: className,
  }: Props = $props();
</script>

<Field.Field orientation="horizontal" class={cn('min-h-11 w-auto', className)}>
  <Checkbox
    {id}
    class="size-5"
    bind:checked
    {indeterminate}
    {disabled}
    onCheckedChange={(v) => onCheckedChange?.(v === true)}
  />
  {#if description}
    <Field.Content>
      <Field.Label for={id} class="cursor-pointer">{label}</Field.Label>
      <Field.Description>{description}</Field.Description>
    </Field.Content>
  {:else}
    <Field.Label for={id} class="min-h-11 cursor-pointer">{label}</Field.Label>
  {/if}
</Field.Field>
