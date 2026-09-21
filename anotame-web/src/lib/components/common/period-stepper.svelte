<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
  import { cn } from '$lib/utils';
  import * as m from '$lib/paraglide/messages';

  /** Previous / current / next control for stepping through months or years. */
  interface Props {
    /** Localized name of the period being shown. */
    label: string;
    onPrevious: () => void;
    onNext: () => void;
    previousDisabled?: boolean;
    nextDisabled?: boolean;
    /** Draws a frame around the control, for use on a page rather than in a popover. */
    framed?: boolean;
    /** Minimum-width classes for the label, so the arrows do not shift between values. */
    labelWidth?: string;
  }

  let {
    label,
    onPrevious,
    onNext,
    previousDisabled = false,
    nextDisabled = false,
    framed = false,
    labelWidth = 'min-w-24',
  }: Props = $props();
</script>

<div
  class={cn(
    'flex items-center justify-between gap-2',
    framed && 'rounded-lg border border-border bg-muted/30 p-1'
  )}
>
  <Button
    variant="ghost"
    size="icon"
    class="h-10 w-10"
    onclick={onPrevious}
    disabled={previousDisabled}
    aria-label={m['common.previous']()}
  >
    <ChevronLeftIcon class="h-5 w-5" />
  </Button>
  <span class={cn('text-center text-sm font-bold capitalize', labelWidth)}>{label}</span>
  <Button
    variant="ghost"
    size="icon"
    class="h-10 w-10"
    onclick={onNext}
    disabled={nextDisabled}
    aria-label={m['common.next']()}
  >
    <ChevronRightIcon class="h-5 w-5" />
  </Button>
</div>
