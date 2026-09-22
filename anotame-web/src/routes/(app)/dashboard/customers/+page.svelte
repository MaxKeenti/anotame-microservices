<script lang="ts">
  import PlusIcon from '@lucide/svelte/icons/plus';
  import { onMount } from 'svelte';
  import * as Card from '$lib/components/ui/card';
  import { apiService, API_SALES } from '$lib/services/api.svelte';
  import { Button } from '$lib/components/ui/button';
  import { adaptiveConfirm } from '$lib/components/ui/responsive/confirm-state.svelte';
  import { toast } from 'svelte-sonner';
  import type { ColumnDef, Row } from '@tanstack/table-core';
  import type { CustomerDto } from '$lib/types/dtos';
  import { PageHeader, ResponsiveDataView, PageContainer, RowActions } from '$lib/components/common';
  import * as m from '$lib/paraglide/messages';

  import CustomerDialog from '$lib/components/customers/customer-dialog.svelte';


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

<PageContainer>
  <PageHeader
    title={m["customers.page.title"]()}
    description={m["customers.page.subtitle"]()}
  >
    {#snippet actions()}
      <Button size="touch-lg" onclick={handleCreateClick} class="w-full sm:w-auto"><PlusIcon data-icon="inline-start" />{m["customers.button.new"]()}</Button>
    {/snippet}
  </PageHeader>


  <Card.Root class="p-4">
    

    <ResponsiveDataView
      {columns}
      data={customers}
      loading={loading}
      emptyMessage={m["customers.empty"]()}
      filterPlaceholder={m["customers.filter.placeholder"]()}
      showFilter={true}
      actionCell={customerActions}
    />
  </Card.Root>

  <CustomerDialog item={editingCustomer} onClose={() => editingCustomer = null} onSuccess={handleFormSuccess} />
</PageContainer>

<!-- Row actions shared by the table and card views. -->
{#snippet customerActions(row: Row<CustomerDto>)}
  <RowActions onEdit={() => handleEditClick(row.original)} onDelete={() => row.original.id && handleDeleteClick(row.original.id)} />
{/snippet}
