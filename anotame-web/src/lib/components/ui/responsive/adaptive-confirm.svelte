<script lang="ts">
  import * as AlertDialog from '$lib/components/ui/alert-dialog';
  import { confirmState, resolveConfirm } from './confirm-state.svelte';
  import * as m from '$lib/paraglide/messages';
</script>

<AlertDialog.Root bind:open={confirmState.open} onOpenChange={(v) => { if (!v) resolveConfirm(false); }}>
  <AlertDialog.Content class="max-w-md">
    <AlertDialog.Header>
      <AlertDialog.Title>{confirmState.title}</AlertDialog.Title>
      <AlertDialog.Description>{confirmState.description}</AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Cancel onclick={() => resolveConfirm(false)}>{m.common_cancel()}</AlertDialog.Cancel>
      <AlertDialog.Action onclick={() => resolveConfirm(true)}>{m.common_confirm()}</AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
