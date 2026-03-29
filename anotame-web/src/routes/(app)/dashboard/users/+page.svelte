<script lang="ts">
  import { onMount } from 'svelte';
  import { apiService, API_IDENTITY } from '$lib/services/api.svelte';
  import { Button } from '$lib/components/ui/button';
  import * as Table from '$lib/components/ui/table';
  import { Edit, Trash2 } from 'lucide-svelte';
  import { adaptiveConfirm } from '$lib/components/ui/responsive/confirm-state.svelte';
  import { toast } from 'svelte-sonner';

  import UserDialog from '$lib/components/users/user-dialog.svelte';

  let users = $state<any[]>([]);
  let loading = $state(true);

  // Single dialog state
  let editingUser = $state<any | null>(null);

  async function fetchUsers() {
    loading = true;
    try {
      const data = await apiService.request<any[]>(`${API_IDENTITY}/users`);
      users = data || [];
    } catch (e: any) {
      console.error('Failed to fetch users', e);
      toast.error("Error al cargar los usuarios");
      users = [];
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    fetchUsers();
  });

  function handleEditClick(user: any) {
    editingUser = user;
  }

  async function handleDeleteClick(user: any) {
    const ok = await adaptiveConfirm({
      title: 'Eliminar Usuario',
      description: `¿Estás seguro de que deseas eliminar a "${user.username}"? Esta acción no se puede deshacer.`
    });
    if (ok) {
      try {
        await apiService.request(`${API_IDENTITY}/users/${user.id}`, { method: 'DELETE' });
        toast.success("Usuario eliminado exitosamente");
        users = users.filter(u => u.id !== user.id);
      } catch (e: any) {
        toast.error(e.message || "Error al eliminar el usuario");
      }
    }
  }

  function handleFormSuccess() {
    editingUser = null;
    fetchUsers();
  }

  function getRoleBadge(role: string): string {
    switch (role) {
      case 'ADMIN': return 'bg-primary/10 text-primary';
      case 'MANAGER': return 'bg-amber-500/10 text-amber-600';
      default: return 'bg-muted text-muted-foreground';
    }
  }
</script>

<div class="space-y-6 animate-in fade-in duration-300">
  <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
    <div>
      <h1 class="text-3xl font-heading font-bold text-foreground">Usuarios</h1>
      <p class="text-muted-foreground">Administrar usuarios y acceso al sistema.</p>
    </div>
  </div>

  <div class="bg-card border border-border rounded-xl overflow-x-auto shadow-sm">
    <Table.Root class="w-full min-w-[600px]">
      <Table.Header>
        <Table.Row>
          <Table.Head class="px-6 py-4">Nombre</Table.Head>
          <Table.Head class="px-6 py-4">Usuario</Table.Head>
          <Table.Head class="px-6 py-4">Email</Table.Head>
          <Table.Head class="px-6 py-4">Rol</Table.Head>
          <Table.Head class="px-6 py-4 text-right">Acciones</Table.Head>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {#if loading}
          <Table.Row>
            <Table.Cell colspan={5} class="h-24 text-center">
              Cargando...
            </Table.Cell>
          </Table.Row>
        {:else if users.length === 0}
          <Table.Row>
            <Table.Cell colspan={5} class="h-24 text-center text-muted-foreground">
              No se encontraron usuarios.
            </Table.Cell>
          </Table.Row>
        {:else}
          {#each users as user (user.id)}
            <Table.Row class="hover:bg-muted/30 transition-colors">
              <Table.Cell class="px-6 py-4 font-medium">{user.firstName} {user.lastName}</Table.Cell>
              <Table.Cell class="px-6 py-4 font-mono text-sm">{user.username}</Table.Cell>
              <Table.Cell class="px-6 py-4 text-muted-foreground">{user.email}</Table.Cell>
              <Table.Cell class="px-6 py-4">
                <span class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadge(user.role)}`}>
                  {user.role}
                </span>
              </Table.Cell>
              <Table.Cell class="px-6 py-4 text-right space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  class="h-10 px-4 touch-manipulation font-medium"
                  onclick={() => handleEditClick(user)}
                >
                  <Edit class="w-4 h-4 mr-2" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  class="h-10 px-4 text-destructive hover:text-destructive/90 touch-manipulation font-medium"
                  onclick={() => handleDeleteClick(user)}
                >
                  <Trash2 class="w-4 h-4 mr-2" />
                  Eliminar
                </Button>
              </Table.Cell>
            </Table.Row>
          {/each}
        {/if}
      </Table.Body>
    </Table.Root>
  </div>

  <UserDialog
    item={editingUser}
    onClose={() => editingUser = null}
    onSuccess={handleFormSuccess}
  />
</div>
