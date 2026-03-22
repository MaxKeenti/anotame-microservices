<script lang="ts">
  import { onMount } from 'svelte';
  import { apiService, API_SALES } from '$lib/services/api.svelte';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import * as Table from '$lib/components/ui/table';
  import { Edit, Trash2 } from 'lucide-svelte';
  import { confirmDialog } from '$lib/services/dialog.svelte';

  // We will scaffold CustomerDialog incorporating superForms
  import CustomerDialog from '$lib/components/customers/customer-dialog.svelte';

  let customers = $state<any[]>([]);
  let loading = $state(true);
  let searchQuery = $state('');

  // Single Dialog Pattern state
  let editingCustomer = $state<any | null>(null);

  async function fetchCustomers(query: string = '') {
    loading = true;
    try {
      const q = query ? `?query=${query}` : '';
      const response = await apiService.request<any[]>(`${API_SALES}/api/customers/search${q}`);
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

  function handleSearch(e: Event) {
    e.preventDefault();
    fetchCustomers(searchQuery);
  }

  function handleCreateClick() {
    editingCustomer = { id: null, firstName: '', lastName: '', email: '', phoneNumber: '' };
  }

  function handleEditClick(customer: any) {
    editingCustomer = customer;
  }

  async function handleDeleteClick(id: string) {
    if (await confirmDialog.prompt("Eliminar Cliente", "¿Seguro que deseas eliminar este cliente?")) {
      try {
        await apiService.request(`${API_SALES}/api/customers/${id}`, { method: 'DELETE' });
        fetchCustomers(searchQuery);
      } catch (e) {
        alert("Error al eliminar cliente");
      }
    }
  }

  function handleFormSuccess() {
    editingCustomer = null;
    fetchCustomers(searchQuery);
  }
</script>

<div class="space-y-6">
  <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
    <div>
      <h1 class="text-3xl font-heading font-bold text-foreground">Clientes</h1>
      <p class="text-muted-foreground">Gestionar base de datos de clientes.</p>
    </div>
    <Button onclick={handleCreateClick} class="w-full sm:w-auto h-12 touch-manipulation">+ Nuevo Cliente</Button>
  </div>

  <div class="flex gap-2">
    <form onsubmit={handleSearch} class="flex-1 flex gap-2">
      <Input
        placeholder="Buscar clientes..."
        bind:value={searchQuery}
        class="max-w-md h-12"
      />
      <Button type="submit" variant="secondary" class="h-12 px-6">Buscar</Button>
    </form>
  </div>

  <div class="bg-card border border-border rounded-xl overflow-x-auto shadow-sm">
    <Table.Root class="w-full min-w-[600px]">
      <Table.Header>
        <Table.Row>
          <Table.Head class="px-6 py-4">Nombre</Table.Head>
          <Table.Head class="px-6 py-4">Teléfono</Table.Head>
          <Table.Head class="px-6 py-4">Correo</Table.Head>
          <Table.Head class="px-6 py-4 text-right">Acciones</Table.Head>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {#if loading}
          <Table.Row>
            <Table.Cell colspan={4} class="h-24 text-center">
              Cargando...
            </Table.Cell>
          </Table.Row>
        {:else if customers.length === 0}
          <Table.Row>
            <Table.Cell colspan={4} class="h-24 text-center text-muted-foreground">
              No se encontraron clientes.
            </Table.Cell>
          </Table.Row>
        {:else}
          {#each customers as c (c.id)}
            <Table.Row>
              <Table.Cell class="px-6 py-4 font-medium">
                {c.firstName} {c.lastName}
              </Table.Cell>
              <Table.Cell class="px-6 py-4">{c.phoneNumber}</Table.Cell>
              <Table.Cell class="px-6 py-4 text-muted-foreground">{c.email || "-"}</Table.Cell>
              <Table.Cell class="px-6 py-4 text-right space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  class="h-10 px-4 touch-manipulation font-medium"
                  onclick={() => handleEditClick(c)}
                >
                  <Edit class="w-4 h-4 mr-2" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  class="h-10 px-4 text-destructive hover:text-destructive/90 touch-manipulation font-medium"
                  onclick={() => c.id && handleDeleteClick(c.id)}
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

  <!-- Single Dialog Page-level Instance -->
  <CustomerDialog item={editingCustomer} onClose={() => editingCustomer = null} onSuccess={handleFormSuccess} />
</div>
