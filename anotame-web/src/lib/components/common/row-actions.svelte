<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import PencilIcon from '@lucide/svelte/icons/square-pen';
  import Trash2Icon from '@lucide/svelte/icons/trash-2';
  import * as m from '$lib/paraglide/messages';

  /** Edit / Delete buttons for a row of a data management list. */
  interface Props {
    onEdit: () => void;
    onDelete: () => void;
  }

  let { onEdit, onDelete }: Props = $props();
</script>

<div class="flex justify-end gap-2">
  <Button variant="outline" size="touch" onclick={onEdit}>
    <PencilIcon data-icon="inline-start" />
    {m['common.edit']()}
  </Button>
  <Button variant="destructive-outline" size="touch" onclick={onDelete}>
    <Trash2Icon data-icon="inline-start" />
    {m['common.delete']()}
  </Button>
</div>
