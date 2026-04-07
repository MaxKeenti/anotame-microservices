<script lang="ts">
  import { onMount } from 'svelte';
  import { apiService, API_SALES } from '$lib/services/api.svelte';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Edit, Trash2 } from 'lucide-svelte';
  import { adaptiveConfirm } from '$lib/components/ui/responsive/confirm-state.svelte';
  import { toast } from 'svelte-sonner';
  import type { ColumnDef } from '@tanstack/table-core';
  import DataTableWrapper from '$lib/components/ui/DataTableWrapper.svelte';

  // We will scaffold CustomerDialog incorporating superForms
  import CustomerDialog from '$lib/components/customers/customer-dialog.svelte';

  let customers = $state<any[]>([]);
  let loading = $state(true);

  // Single Dialog Pattern state
  let editingCustomer = $state<any | null>(null);

  const columns: ColumnDef<any>[] = [
    { id: 'nombre', accessorFn: (row) => `${row.firstName} ${row.lastName}`, header: 'Nombre', enableSorting: true },
    { accessorKey: 'phoneNumber', header: 'Teléfono', enableSorting: false },
    { accessorKey: 'email', header: 'Correo', enableSorting: false },
    { id: 'actions', header: 'Acciones', enableSorting: false },
  ];

  async function fetchCustomers() {
    loading = true;
    try {
      const response = await apiService.request<any[]>(`${API_SALES}/api/customers/search`);
      customers = response || [];
    } catch {
      customers = [];
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    fetchCustomers();
  });

  function handleCreateClick() {
    editingCustomer = { id: null, firstName: '', lastName: '', email: '', phoneNumber: '' };
  }

  function handleEditClick(customer: any) {
    editingCustomer = customer;
  }

  async function handleDeleteClick(id: string) {
    const ok = await adaptiveConfirm({
      title: 'Eliminar Cliente',
      description: '¿Seguro que deseas eliminar este cliente? Esta acción no se puede deshacer.'
    });
    if (ok) {
      try {
        await apiService.request(`${API_SALES}/api/customers/${id}`, { method: 'DELETE' });
        toast.success('Cliente eliminado exitosamente');
        fetchCustomers();
      } catch (e) {
        toast.error('Error al eliminar cliente');
      }
    }
  }

  function handleFormSuccess() {
    editingCustomer = null;
    fetchCustomers();
  }
</script>

<div class="space-y-3">
  <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
    <div>
      <h1 class="text-3xl font-heading font-bold text-foreground">Clientes</h1>
      <p class="text-muted-foreground">Gestionar base de datos de clientes.</p>
    </div>
    <Button onclick={handleCreateClick} class="w-full sm:w-auto h-12 touch-manipulation">+ Nuevo Cliente</Button>
  </div>

  <div class="bg-card border border-border rounded-xl overflow-hidden shadow-sm p-4">
    <DataTableWrapper
      columns={columns}
      data={customers}
      loading={loading}
      emptyMessage="No se encontraron clientes."
      filterPlaceholder="Filtrar clientes..."
      showFilter={true}
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
            Editar
          </Button>
          <Button
            variant="outline"
            size="sm"
            class="h-10 px-4 text-destructive hover:text-destructive/90 touch-manipulation font-medium"
            onclick={() => row.original.id && handleDeleteClick(row.original.id)}
          >
            <Trash2 class="w-4 h-4 mr-2" />
            Eliminar
          </Button>
        </div>
      {/snippet}
    </DataTableWrapper>
  </div>

  <!-- Single Dialog Page-level Instance -->
  <CustomerDialog item={editingCustomer} onClose={() => editingCustomer = null} onSuccess={handleFormSuccess} />
</div>
