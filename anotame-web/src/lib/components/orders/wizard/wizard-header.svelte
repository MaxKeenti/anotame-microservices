<script lang="ts">
  import type { Snippet } from 'svelte';
  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
  import * as m from '$lib/paraglide/messages';

  /** One stage of the order wizard. */
  export type WizardStep = { title: string };

  /** Title row and step indicator shown above the order wizard's content. */
  interface Props {
    title: string;
    steps: WizardStep[];
    /** Zero-based index of the stage being shown. */
    currentStep: number;
    /** Shows a "draft" marker beside the title. */
    isDraft?: boolean;
    /**
     * Offers the mobile tray listing step names. Off where the surrounding page
     * already scrolls the steps horizontally.
     */
    showTray?: boolean;
    /** Trailing control, normally the exit or cancel button. */
    actions?: Snippet;
  }

  let { title, steps, currentStep, isDraft = false, showTray = true, actions }: Props = $props();

  let stepsExpanded = $state(false);

  /** Circle styling for a step, by whether it is done, current, or upcoming. */
  function circleTone(index: number): string {
    if (currentStep === index) return 'border-primary bg-primary text-primary-foreground';
    if (currentStep > index) return 'border-primary bg-primary/20 text-primary';
    return 'border-muted text-muted-foreground';
  }
</script>

<div class="mb-4 sm:mb-6">
  <div class="flex items-center gap-2">
    <div class="flex min-w-0 flex-1 items-center gap-2">
      <h1 class="truncate font-heading text-lg font-bold sm:text-2xl">{title}</h1>
      {#if isDraft}
        <span class="hidden shrink-0 rounded bg-muted px-2 py-1 text-xs text-muted-foreground sm:inline">
          {m['orders.new.draftBadge']()}
        </span>
      {/if}
    </div>

    <div class="flex shrink-0 items-center">
      <div class="flex items-center">
        {#each steps as step, i}
          <div class="flex items-center">
            <div
              class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors sm:h-8 sm:w-8 sm:text-sm {circleTone(i)}"
            >
              {i + 1}
            </div>
            <span
              class="ml-2 hidden text-sm font-medium md:inline {currentStep === i
                ? 'text-foreground'
                : 'text-muted-foreground'}"
            >
              {step.title}
            </span>
            {#if i < steps.length - 1}
              <div class="mx-0.5 hidden h-0.5 w-3 bg-border sm:mx-1 sm:block sm:w-6 md:hidden lg:block"></div>
            {/if}
          </div>
        {/each}
      </div>

      <!-- The step names do not fit beside the circles on phones, so they move into a tray. -->
      {#if showTray}
      <button
        type="button"
        class="ml-1 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted/50 touch-manipulation sm:hidden"
        onclick={() => (stepsExpanded = !stepsExpanded)}
        aria-label={stepsExpanded ? m['orders.new.stepsHide']() : m['orders.new.stepsShow']()}
        aria-expanded={stepsExpanded}
      >
        <ChevronDownIcon class="h-4 w-4 transition-transform {stepsExpanded ? 'rotate-180' : ''}" />
      </button>
      {/if}
    </div>

    {@render actions?.()}
  </div>

  {#if showTray && stepsExpanded}
    <div class="mt-2 rounded-lg border border-border bg-muted/30 p-3 sm:hidden">
      <ol class="flex flex-col gap-2">
        {#each steps as step, i}
          <li
            class="flex items-center gap-3 text-sm {currentStep === i
              ? 'font-medium text-foreground'
              : currentStep > i
                ? 'text-primary'
                : 'text-muted-foreground'}"
          >
            <div
              class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold {circleTone(i)}"
            >
              {i + 1}
            </div>
            <span>{step.title}</span>
            {#if currentStep === i}
              <span class="ml-auto rounded bg-primary/10 px-1.5 py-0.5 text-xs text-primary">
                {m['orders.new.stepCurrent']()}
              </span>
            {:else if currentStep > i}
              <span class="ml-auto text-xs text-primary">✓</span>
            {/if}
          </li>
        {/each}
      </ol>
    </div>
  {/if}
</div>
