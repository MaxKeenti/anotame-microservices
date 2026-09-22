<script lang="ts">
  import CheckboxField from '$lib/components/common/checkbox-field.svelte';
  import { Input } from '$lib/components/ui/input';
  import type { WorkDay } from '$lib/types/dtos';
  import * as m from '$lib/paraglide/messages';

  /** One weekday in the weekly schedule: open toggle and opening hours. */
  interface Props {
    /** Edited in place; bound so the parent's list stays the source of truth. */
    day: WorkDay;
    /** Localized weekday name. */
    dayName: string;
  }

  let { day = $bindable(), dayName }: Props = $props();

  const TIME_INPUT =
    'h-11 w-32 border-0 bg-transparent px-0 text-center font-mono text-base shadow-none focus-visible:ring-0';
</script>

<div class="flex flex-col gap-4 p-4 transition-colors hover:bg-muted/10 sm:flex-row sm:items-center">
  <div class="flex w-40 items-center font-medium capitalize text-foreground">
    <CheckboxField id={`workday-open-${day.dayOfWeek}`} label={dayName} bind:checked={day.open} />
  </div>

  <div class="flex flex-1 flex-wrap items-center gap-3">
    {#if day.open}
      <div class="flex items-center gap-3 rounded-lg border bg-card p-2">
        <Input
          type="time"
          bind:value={day.openTime}
          aria-label={m['schedule.label.openTime']({ day: dayName })}
          class={TIME_INPUT}
        />
        <span class="text-sm font-medium text-muted-foreground">{m['schedule.label.to']()}</span>
        <Input
          type="time"
          bind:value={day.closeTime}
          aria-label={m['schedule.label.closeTime']({ day: dayName })}
          class={TIME_INPUT}
        />
      </div>
    {:else}
      <span class="rounded-lg bg-muted/50 px-4 py-2 text-sm text-muted-foreground">
        {m['schedule.label.closed']()}
      </span>
    {/if}
  </div>
</div>
