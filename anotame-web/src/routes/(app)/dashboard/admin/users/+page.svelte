<script lang="ts">
  import { onMount } from 'svelte';
  import { apiService, API_IDENTITY } from '$lib/services/api.svelte';
  import { Button } from '$lib/components/ui/button';
  import { Edit, Trash2 } from 'lucide-svelte';
  import { adaptiveConfirm } from '$lib/components/ui/responsive/confirm-state.svelte';
  import { toast } from 'svelte-sonner';
  import DataTableWrapper from '$lib/components/ui/DataTableWrapper.svelte';
  import CardGridWrapper from '$lib/components/ui/CardGridWrapper.svelte';
  import { useIsMobile } from '$lib/hooks/use-mobile.svelte';
  import type { ColumnDef, Row } from '@tanstack/table-core';
  import type { UserResponse } from '$lib/types/dtos';
  import * as m from '$lib/paraglide/messages';

  const mobile = useIsMobile();

  import UserDialog from '$lib/components/users/user-dialog.svelte';

  let users = $state<UserResponse[]>([]);
  let loading = $state(true);

  // Single dialog state
  let editingUser = $state<(Partial<UserResponse> & { isNew?: boolean }) | null>(null);

  const columns: ColumnDef<UserResponse>[] = [
    { id: 'nombre', accessorFn: (row) => `${row.firstName} ${row.lastName}`, header: m["users.colName"](), enableSorting: true, meta: { cardGroup: 'header' } },
    { id: 'role', accessorFn: (row) => row.role, header: m["users.colRole"](), enableSorting: true, meta: { cardGroup: 'header' } },
    { accessorKey: 'username', header: m["users.colUsername"](), enableSorting: true, meta: { cardGroup: 'body' } },
    { accessorKey: 'email', header: m["users.colEmail"](), enableSorting: false, meta: { cardGroup: 'body' } },
    { id: 'actions', header: m["common.actions"](), enableSorting: false, meta: { cardGroup: 'hidden' } },
  ];

  async function fetchUsers() {
    loading = true;
    try {
      const data = await apiService.request<UserResponse[]>(`${API_IDENTITY}/users`);
      users = data || [];
    } catch (e: any) {
      console.error('Failed to fetch users', e);
      toast.error(m['users.load.error']());
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

  function handleEditClick(user: UserResponse) {
    editingUser = user;
  }

  async function handleDeleteClick(user: UserResponse) {
    const ok = await adaptiveConfirm({
      title: m['users.delete.title'](),
      description: m['users.delete.desc']({ username: user.username })
    });
    if (ok) {
      try {
        await apiService.request(`${API_IDENTITY}/users/${user.id}`, { method: 'DELETE' });
        toast.success(m['users.delete.success']());
        users = users.filter(u => u.id !== user.id);
      } catch (e: any) {
        toast.error(e.message || m['users.delete.error']());
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
        <h1 class="text-3xl font-heading font-bold text-foreground">{m['nav.users.name']()}</h1>
        <p class="text-muted-foreground">{m['users.page.desc']()}</p>
      </div>
      <Button onclick={handleCreateClick} class="w-full sm:w-auto h-12 shadow-sm touch-manipulation">
        {m['users.button.new']()}
      </Button>
    </div>

  <div class="bg-card border border-border rounded-xl overflow-hidden shadow-sm p-4">
    {#snippet userActions(row: Row<UserResponse>)}
      <div class="flex justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          class="h-10 px-4 touch-manipulation font-medium"
          onclick={() => handleEditClick(row.original)}
        >
          <Edit class="w-4 h-4 mr-2" />
          {m['common.edit']()}
        </Button>
        <Button
          variant="outline"
          size="sm"
          class="h-10 px-4 text-destructive hover:text-destructive/90 touch-manipulation font-medium"
          onclick={() => handleDeleteClick(row.original)}
        >
          <Trash2 class="w-4 h-4 mr-2" />
          {m['common.delete']()}
        </Button>
      </div>
    {/snippet}

    {#if mobile.current}
      <CardGridWrapper
        {columns}
        data={users}
        {loading}
        emptyMessage={m['common.noData']()}
        filterPlaceholder={m['common.searchEllipsis']()}
        actionCell={userActions}
      />
    {:else}
      <DataTableWrapper
        {columns}
        data={users}
        {loading}
        emptyMessage={m['common.noData']()}
        filterPlaceholder={m['common.searchEllipsis']()}
        actionCell={userActions}
      />
    {/if}
  </div>

  <UserDialog
    item={editingUser}
    id="user-admin"
    onClose={() => editingUser = null}
    onSuccess={handleFormSuccess}
  />
</div>
