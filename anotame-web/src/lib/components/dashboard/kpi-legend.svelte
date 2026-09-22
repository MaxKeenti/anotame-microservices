<script lang="ts">
  /** One swatch and its meaning in a capacity legend. */
  export type LegendEntry = {
    /** Tailwind surface classes for the swatch, matching what it explains. */
    swatch: string;
    /** Localized explanation of what the colour means. */
    label: string;
  };

  interface Props {
    entries: LegendEntry[];
  }

  let { entries }: Props = $props();
</script>

<div class="grid grid-cols-1 gap-3 md:grid-cols-3">
  {#each entries as entry (entry.label)}
    <div class="flex items-center gap-3">
      <div class="h-4 w-4 rounded border {entry.swatch}" aria-hidden="true"></div>
      <span class="text-sm text-muted-foreground">{entry.label}</span>
    </div>
  {/each}
</div>
