<script lang="ts">
  import * as ToggleGroup from '$lib/components/ui/toggle-group';
  import ZapIcon from '@lucide/svelte/icons/zap';
  import WorkflowIcon from '@lucide/svelte/icons/workflow';
  import type { WorkflowMode } from '$lib/types/dtos';
  import { cn } from '$lib/utils';
  import * as m from '$lib/paraglide/messages';

  /** Simple / full workflow choice, shown as two tiles. Always holds a value. */
  interface Props {
    value: WorkflowMode;
    disabled?: boolean;
    /** Accessible name for the group. */
    label: string;
    /** Layout classes at the call site. */
    class?: string;
  }

  let { value = $bindable(), disabled = false, label, class: className }: Props = $props();

  const OPTIONS = [
    {
      value: 'SIMPLE',
      label: m['adminSettings.workflow.simple'],
      description: m['adminSettings.workflow.simpleDesc'],
      icon: ZapIcon,
    },
    {
      value: 'FULL',
      label: m['adminSettings.workflow.full'],
      description: m['adminSettings.workflow.fullDesc'],
      icon: WorkflowIcon,
    },
  ] as const;
</script>

<ToggleGroup.Root
  type="single"
  variant="tile"
  size="tile"
  spacing={3}
  aria-label={label}
  {disabled}
  {value}
  onValueChange={(v) => {
    // A single-choice group lets the user clear it; the shop always has a workflow.
    if (v) value = v as WorkflowMode;
  }}
  class={cn('grid w-full grid-cols-1 items-stretch sm:grid-cols-2', className)}
>
  {#each OPTIONS as option (option.value)}
    {@const Icon = option.icon}
    <ToggleGroup.Item value={option.value} class="w-full px-4">
      <Icon aria-hidden="true" />
      <span class="font-semibold leading-tight">{option.label()}</span>
      <span class="text-xs font-normal text-muted-foreground">{option.description()}</span>
    </ToggleGroup.Item>
  {/each}
</ToggleGroup.Root>
