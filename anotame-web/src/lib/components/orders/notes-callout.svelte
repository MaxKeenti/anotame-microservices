<script lang="ts">
  import * as Card from '$lib/components/ui/card';

  /** Highlighted free-text note attached to an order. */
  interface Props {
    /** Localized section title. */
    title: string;
    /** The note as the employee wrote it. */
    notes: string;
  }

  let { title, notes }: Props = $props();
</script>

<Card.Root class="min-w-0 gap-0 border-2 border-warning/30 bg-warning/10 p-4 text-warning-text sm:p-5">
  <Card.Title class="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wider opacity-80">
    {title}
  </Card.Title>
  <p class="wrap-break-word text-base font-medium">{notes}</p>
</Card.Root>
