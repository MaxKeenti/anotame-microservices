<script lang="ts">
  import { onMount } from 'svelte';
  import { apiService, API_IDENTITY } from '$lib/services/api.svelte';
  import { Button } from '$lib/components/ui/button';
  import { Edit, Trash2 } from 'lucide-svelte';
  import { adaptiveConfirm } from '$lib/components/ui/responsive/confirm-state.svelte';
  import { toast } from 'svelte-sonner';
  import DataTableWrapper from '$lib/components/ui/DataTableWrapper.svelte';
  import type { ColumnDef } from '@tanstack/table-core';
  import * as m from '$lib/paraglide/messages';

  import UserDialog from '$lib/components/users/user-dialog.svelte';

  let users = $state<any[]>([]);
  let loading = $state(true);

  // Single dialog state
  let editingUser = $state<any | null>(null);

  const columns: ColumnDef<any>[] = [
    { id: 'nombre', accessorFn: (row) => `${row.firstName} ${row.lastName}`, header: m["users.colName"](), enableSorting: true },
    { accessorKey: 'username', header: m["users.colUsername"](), enableSorting: true },
    { accessorKey: 'email', header: m["users.colEmail"](), enableSorting: false },
    { id: 'role', accessorFn: (row) => row.role, header: m["users.colRole"](), enableSorting: true },
    { id: 'actions', header: m["common.actions"](), enableSorting: false },
  ];

  async function fetchUsers() {
    loading = true;
    try {
      const data = await apiService.request<any[]>(`${API_IDENTITY}/users`);
      users = data || [];
    } catch (e: any) {
      console.error('Failed to fetch users', e);
      toast.error(m["users.loadError"]());
      users = [];
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    fetchUsers();
  });

  function handleCreateClick() {
    editingUser = { isNew: true };
  }

  function handleEditClick(user: any) {
    editingUser = user;
  }

  async function handleDeleteClick(user: any) {
    const ok = await adaptiveConfirm({
      title: m["users.deleteTitle"](),
      description: m["users.deleteDesc"]({ username: user.username })
    });
    if (ok) {
      try {
        await apiService.request(`${API_IDENTITY}/users/${user.id}`, { method: 'DELETE' });
        toast.success(m["users.deleteSuccess"]());
        users = users.filter(u => u.id !== user.id);
      } catch (e: any) {
        toast.error(e.message || m["users.deleteError"]());
      }
    }
  }

  function handleFormSuccess() {
    editingUser = null;
    fetchUsers();
  }
</script>

<div class="space-y-6 animate-in fade-in duration-300">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 class="text-3xl font-heading font-bold text-foreground">{m["users.title"]()}</h1>
        <p class="text-muted-foreground">{m["users.description"]()}</p>
      </div>
      <Button onclick={handleCreateClick} class="w-full sm:w-auto h-12 shadow-sm touch-manipulation">
        {m["users.addButton"]()}
      </Button>
    </div>

  <div class="bg-card border border-border rounded-xl overflow-hidden shadow-sm p-4">
    <DataTableWrapper
      {columns}
      data={users}
      {loading}
      emptyMessage={m["users.emptyMessage"]()}
      filterPlaceholder={m["users.searchPlaceholder"]()}
    >
      {#snippet actionCell(row)}
        <div class="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            class="h-10 px-4 touch-manipulation font-medium"
            onclick={() => handleEditClick(row.original)}
          >
            <Edit class="w-4 h-4 mr-2" />
            {m["common.edit"]()}
          </Button>
          <Button
            variant="outline"
            size="sm"
            class="h-10 px-4 text-destructive hover:text-destructive/90 touch-manipulation font-medium"
            onclick={() => handleDeleteClick(row.original)}
          >
            <Trash2 class="w-4 h-4 mr-2" />
            {m["common.delete"]()}
          </Button>
        </div>
      {/snippet}
    </DataTableWrapper>
  </div>

  <UserDialog
    item={editingUser}
    id="user-admin"
    onClose={() => editingUser = null}
    onSuccess={handleFormSuccess}
  />
</div>
