<script lang="ts">
  import { onMount } from 'svelte';
  import { apiService, API_SALES } from '$lib/services/api.svelte';
  import { Button } from '$lib/components/ui/button';
  import { Edit, Trash2 } from '@lucide/svelte';
  import { adaptiveConfirm } from '$lib/components/ui/responsive/confirm-state.svelte';
  import { toast } from 'svelte-sonner';
  import type { ColumnDef, Row } from '@tanstack/table-core';
  import type { CustomerDto } from '$lib/types/dtos';
  import DataTableWrapper from '$lib/components/ui/DataTableWrapper.svelte';
  import CardGridWrapper from '$lib/components/ui/CardGridWrapper.svelte';
  import { useIsMobile } from '$lib/hooks/use-mobile.svelte';
  import * as m from '$lib/paraglide/messages';

  import CustomerDialog from '$lib/components/customers/customer-dialog.svelte';

  const mobile = useIsMobile();

  type CustomerEditorItem = Omit<Partial<CustomerDto>, 'id'> & { id?: string | null };

  let customers = $state<CustomerDto[]>([]);
  let loading = $state(true);

  let editingCustomer = $state<CustomerEditorItem | null>(null);

  const columns: ColumnDef<CustomerDto>[] = [
    { id: 'nombre', accessorFn: (row) => `${row.firstName} ${row.lastName}`, header: m["customers.column.name"](), enableSorting: true, meta: { cardGroup: 'header' } },
    { accessorKey: 'phoneNumber', header: m["customers.column.phone"](), enableSorting: false, meta: { cardGroup: 'body' } },
    { accessorKey: 'email', header: m["customers.column.email"](), enableSorting: false, meta: { cardGroup: 'body' } },
    { id: 'actions', header: m["customers.column.actions"](), enableSorting: false, meta: { cardGroup: 'hidden' } },
  ];

  async function fetchCustomers() {
    loading = true;
    try {
      const response = await apiService.request<CustomerDto[]>(`${API_SALES}/api/customers/search`);
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

  function handleEditClick(customer: CustomerDto) {
    editingCustomer = customer;
  }

  async function handleDeleteClick(id: string) {
    const ok = await adaptiveConfirm({
      title: m["customers.delete.title"](),
      description: m["customers.delete.desc"]()
    });
    if (ok) {
      try {
        await apiService.request(`${API_SALES}/api/customers/${id}`, { method: 'DELETE' });
        toast.success(m["customers.delete.success"]());
        fetchCustomers();
      } catch (e) {
        toast.error(m["customers.delete.error"]());
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
      <h1 class="text-3xl font-heading font-bold text-foreground">{m["customers.page.title"]()}</h1>
      <p class="text-muted-foreground">{m["customers.page.subtitle"]()}</p>
    </div>
    <Button onclick={handleCreateClick} class="w-full sm:w-auto h-12 touch-manipulation">{m["customers.button.new"]()}</Button>
  </div>

  <div class="bg-card border border-border rounded-xl overflow-hidden shadow-sm p-4">
    {#snippet customerActions(row: Row<CustomerDto>)}
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
          onclick={() => row.original.id && handleDeleteClick(row.original.id)}
        >
          <Trash2 class="w-4 h-4 mr-2" />
          {m["common.delete"]()}
        </Button>
      </div>
    {/snippet}

    {#if mobile.current}
      <CardGridWrapper
        {columns}
        data={customers}
        loading={loading}
        emptyMessage={m["customers.empty"]()}
        filterPlaceholder={m["customers.filter.placeholder"]()}
        showFilter={true}
        actionCell={customerActions}
      />
    {:else}
      <DataTableWrapper
        {columns}
        data={customers}
        loading={loading}
        emptyMessage={m["customers.empty"]()}
        filterPlaceholder={m["customers.filter.placeholder"]()}
        showFilter={true}
        actionCell={customerActions}
      />
    {/if}
  </div>

  <CustomerDialog item={editingCustomer} onClose={() => editingCustomer = null} onSuccess={handleFormSuccess} />
</div>
