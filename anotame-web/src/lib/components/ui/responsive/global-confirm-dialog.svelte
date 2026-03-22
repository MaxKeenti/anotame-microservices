<script lang="ts">
  import * as AlertDialog from "$lib/components/ui/alert-dialog";
  import { confirmDialog } from "$lib/services/dialog.svelte";

  // When 'open' changes, if the dialog was closed externally (by user hitting Esc or clicking outside),
  // we need to resolve the promise as 'false'
  function handleOpenChange(isOpen: boolean) {
      if (!isOpen && confirmDialog.open) {
          confirmDialog.cancel();
      }
  }
</script>

<AlertDialog.Root open={confirmDialog.open} onOpenChange={handleOpenChange}>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>{confirmDialog.title}</AlertDialog.Title>
      <AlertDialog.Description>{confirmDialog.description}</AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Cancel onclick={() => confirmDialog.cancel()}>Cancelar</AlertDialog.Cancel>
      <AlertDialog.Action onclick={() => confirmDialog.confirm()}>Continuar</AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
