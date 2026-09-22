<script lang="ts">
  import * as Alert from '$lib/components/ui/alert';

  /** Highlighted free-text note attached to an order. */
  interface Props {
    /** Localized section title. */
    title: string;
    /** The note as the employee wrote it. */
    notes: string;
  }

  let { title, notes }: Props = $props();
</script>

<Alert.Root variant="warning" role="note" class="min-w-0 border-2 p-4 sm:p-5">
  <Alert.Title class="text-sm font-bold uppercase tracking-wider opacity-80">{title}</Alert.Title>
  <Alert.Description class="wrap-break-word text-base font-medium text-current">{notes}</Alert.Description>
</Alert.Root>
