<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import * as ButtonGroup from '$lib/components/ui/button-group';
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
    /** Stretches the control to its container, with the label taking the free space. */
    fill?: boolean;
    /** Minimum-width classes for the label, so the arrows do not shift between values. */
    labelWidth?: string;
  }

  let {
    label,
    onPrevious,
    onNext,
    previousDisabled = false,
    nextDisabled = false,
    fill = false,
    labelWidth = 'min-w-24',
  }: Props = $props();
</script>

<ButtonGroup.Root class={cn(fill && 'w-full')}>
  <Button
    variant="outline"
    size="icon-touch"
    onclick={onPrevious}
    disabled={previousDisabled}
    aria-label={m['common.previous']()}
  >
    <ChevronLeftIcon class="size-5" />
  </Button>
  <ButtonGroup.Text
    class={cn('justify-center bg-background font-bold capitalize', fill && 'flex-1', labelWidth)}
    aria-live="polite"
  >
    {label}
  </ButtonGroup.Text>
  <Button
    variant="outline"
    size="icon-touch"
    onclick={onNext}
    disabled={nextDisabled}
    aria-label={m['common.next']()}
  >
    <ChevronRightIcon class="size-5" />
  </Button>
</ButtonGroup.Root>
