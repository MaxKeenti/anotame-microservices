<script lang="ts">
  import * as m from '$lib/paraglide/messages';

  /** Label inside a page-size choice tile. */
  interface Props {
    size: number;
  }

  let { size }: Props = $props();
</script>

<span class="text-2xl font-bold">{size}</span>
<span class="text-sm">{m['settings.table.rows']()}</span>
