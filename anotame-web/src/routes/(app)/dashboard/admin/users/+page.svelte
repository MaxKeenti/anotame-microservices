<script lang="ts">
  import PlusIcon from '@lucide/svelte/icons/plus';
  import { onMount } from 'svelte';
  import * as Card from '$lib/components/ui/card';
  import { apiService, API_IDENTITY } from '$lib/services/api.svelte';
  import { Button } from '$lib/components/ui/button';
  import { adaptiveConfirm } from '$lib/components/ui/responsive/confirm-state.svelte';
  import { toast } from 'svelte-sonner';
  import { PageHeader, ResponsiveDataView, PageContainer, RowActions } from '$lib/components/common';
  import type { ColumnDef, Row } from '@tanstack/table-core';
  import type { UserResponse } from '$lib/types/dtos';
  import * as m from '$lib/paraglide/messages';


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

<PageContainer>
    <PageHeader
      title={m['nav.users.name']()}
      description={m['users.page.desc']()}
    >
      {#snippet actions()}
        <Button size="touch-lg" onclick={handleCreateClick} class="w-full sm:w-auto">
        <PlusIcon data-icon="inline-start" />
        {m['users.button.new']()}
        </Button>
      {/snippet}
    </PageHeader>


  <Card.Root class="p-4">
    

    <ResponsiveDataView
      {columns}
      data={users}
      {loading}
      emptyMessage={m['common.noData']()}
      filterPlaceholder={m['common.searchEllipsis']()}
      actionCell={userActions}
    />
  </Card.Root>

  <UserDialog
    item={editingUser}
    id="user-admin"
    onClose={() => editingUser = null}
    onSuccess={handleFormSuccess}
  />
</PageContainer>

<!-- Row actions shared by the table and card views. -->
{#snippet userActions(row: Row<UserResponse>)}
  <RowActions onEdit={() => handleEditClick(row.original)} onDelete={() => handleDeleteClick(row.original)} />
{/snippet}
