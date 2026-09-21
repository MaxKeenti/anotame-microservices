<script lang="ts">
  /**
   * The first few garment names on an order, with a "+N" chip for the rest.
   * The full list stays available as a tooltip.
   */
  interface Props {
    names: string[] | undefined;
    /** How many names to show before collapsing the rest into the chip. */
    max: number;
  }

  let { names, max }: Props = $props();

  const clean = $derived(names?.map((name) => name.trim()).filter(Boolean) ?? []);
  const visible = $derived(clean.slice(0, max));
  const hidden = $derived(Math.max(0, clean.length - max));
</script>

<div class="max-w-sm min-w-0 leading-6 whitespace-normal wrap-break-word" title={clean.join(', ') || '-'}>
  {#if clean.length > 0}
    {visible.join(', ')}
    {#if hidden > 0}
      <span
        class="ml-1 inline-flex rounded-sm bg-muted px-1.5 py-0.5 text-xs font-semibold whitespace-nowrap text-muted-foreground"
      >
        +{hidden}
      </span>
    {/if}
  {:else}
    -
  {/if}
</div>
