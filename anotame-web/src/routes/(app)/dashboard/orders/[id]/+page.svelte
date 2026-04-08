<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { apiService, API_SALES, API_OPERATIONS } from "$lib/services/api.svelte";
  import { ApiError } from "$lib/services/ApiError";
  import { generateReceiptHtml } from "$lib/utils/receipt-generator";
  import StatusBadge from "$lib/components/ui/StatusBadge.svelte";
  import { formatCurrency, formatDateTime } from "$lib/utils/formatUtils";
  import { Button } from "$lib/components/ui/button";
  import * as Table from "$lib/components/ui/table";
  import { toast } from "svelte-sonner";
  import { adaptiveConfirm } from "$lib/components/ui/responsive/confirm-state.svelte";

  let id = $derived($page.params.id);
  let action = $derived($page.url.searchParams.get("action"));

  let order = $state<any | null>(null);
  let loading = $state(true);
  let establishment = $state<any | null>(null);

  onMount(async () => {
    // Non-blocking establishment fetch
    apiService.request<any>(`${API_OPERATIONS}/establishment`)
      .then(res => establishment = res)
      .catch(e => console.warn('Could not load establishment settings (non-blocking):', e));
  });

  // Watch for ID changes to fetch order
  $effect(() => {
    if (!id) return;
    
    let isCancelled = false;
    const fetchOrder = async () => {
      try {
        loading = true;
        const res = await apiService.request<any>(`${API_SALES}/orders/${id}`);
        if (!isCancelled) order = res;
      } catch (e) {
        console.error(e);
      } finally {
        if (!isCancelled) loading = false;
      }
    };
    fetchOrder();

    return () => { isCancelled = true; };
  });

  // Handle auto-print action
  $effect(() => {
    // We only need the order to be loaded; establishment can be null (we have fallbacks in handlePrint)
    if (action === 'print' && order && !loading) {
      const url = new URL(window.location.href);
      url.searchParams.delete('action');
      window.history.replaceState(null, '', url.toString());

      setTimeout(async () => {
        const ok = await adaptiveConfirm({
          title: '¡Pedido Creado!',
          description: 'Pedido creado con éxito. ¿Deseas imprimir el ticket ahora?'
        });
        if (ok) handlePrint();
      }, 500);
    }
  });

  async function handleCancel() {
    if (!order) return;
    const ok = await adaptiveConfirm({
      title: 'Cancelar Pedido',
      description: '¿Estás seguro que deseas cancelar este pedido? Esta acción no se puede deshacer.'
    });
    if (!ok) return;
    try {
      await apiService.request(`${API_SALES}/orders/${order.id}`, { method: "DELETE" });
      toast.success("Pedido cancelado exitosamente");
      goto("/dashboard/orders");
    } catch (e: any) {
      console.error(e);
      if (e instanceof ApiError && e.status === 409) {
        toast.error('No se puede eliminar', {
          description: 'El pedido tiene órdenes de trabajo asociadas. Elimina las órdenes de trabajo primero.'
        });
      } else {
        toast.error('Error al cancelar pedido', { description: e?.message });
      }
    }
  }

  function handlePrint() {
    if (!order) return;

    let taxInfoParsed: any = undefined;
    if (establishment?.taxInfo) {
      try { taxInfoParsed = JSON.parse(establishment.taxInfo); } catch(e){}
    }

    const receiptHtml = generateReceiptHtml({
      ticketNumber: order.ticketNumber,
      customerName: `${order.customer.firstName} ${order.customer.lastName}`,
      phone: order.customer.phoneNumber,
      deadline: order.committedDeadline || new Date().toISOString(),
      items: order.items.map((i: any) => ({
        garment: i.garmentName,
        services: i.services?.map((s: any) => ({
          name: s.serviceName,
          price: s.unitPrice,
          adjustment: s.adjustmentAmount,
          adjustmentReason: s.adjustmentReason
        })) || [],
        notes: i.notes,
      })),
      total: order.totalAmount,
      amountPaid: order.amountPaid || 0,
      balance: Math.max(0, (order.totalAmount || 0) - (order.amountPaid || 0)),
      establishment: {
        name: establishment?.name || "ANOTAME",
        address: taxInfoParsed?.address,
        rfc: taxInfoParsed?.rfc,
        taxRegime: taxInfoParsed?.regime,
        contactPhone: taxInfoParsed?.contactPhone,
      }
    });

    const newWindow = window.open('', '_blank', 'width=400,height=600');
    if (newWindow) {
      newWindow.document.write(receiptHtml);
      newWindow.document.close();
      newWindow.setTimeout(() => {
        newWindow.focus();
        newWindow.print();
        newWindow.close();
      }, 250);
    }
  }

  async function handleSendToOps() {
    if (!order) return;
    const ok = await adaptiveConfirm({
      title: 'Enviar a Operaciones',
      description: '¿Enviar pedido a Operaciones? El estado cambiará a EN PROGRESO.'
    });
    if (!ok) return;
    try {
      await apiService.request(`${API_SALES}/orders/${order.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: "IN_PROGRESS" })
      });
      
      toast.success("¡Pedido enviado a Operaciones!");
      loading = true;
      const res = await apiService.request<any>(`${API_SALES}/orders/${id}`);
      order = res;
    } catch (e: any) {
      console.error(e);
      toast.error("Error de conexión", { description: e.message });
    } finally {
      loading = false;
    }
  }
</script>

{#if loading}
  <div class="flex flex-col h-[60vh] items-center justify-center p-8 text-center text-muted-foreground animate-pulse gap-4">
    <div class="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
    <div class="text-lg font-medium">Cargando pedido...</div>
    <div class="text-sm opacity-50 font-mono">ID: {id}</div>
  </div>
{:else if !order}
  <div class="flex flex-col h-[60vh] items-center justify-center p-8 text-center gap-6 animate-in fade-in zoom-in-95">
    <div class="bg-destructive/10 p-6 rounded-full">
      <svg class="w-16 h-16 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    </div>
    <div>
      <h2 class="text-2xl font-bold text-destructive">Pedido no encontrado</h2>
      <p class="text-muted-foreground mt-2 max-w-md">No pudimos localizar la información del pedido. Esto puede ocurrir si el pedido fue eliminado o si el ID es inválido.</p>
    </div>
    <Button href="/dashboard/orders" variant="outline" class="h-12 px-8 rounded-xl touch-manipulation">
      Volver a la lista
    </Button>
  </div>
{:else}
  <div class="space-y-6 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300 pb-20">
    <div class="flex items-center gap-4">
      <a href="/dashboard/orders" class="text-muted-foreground hover:text-foreground touch-manipulation">
        &larr; Atrás
      </a>
      <h1 class="text-2xl font-bold">Pedido {order.ticketNumber}</h1>
      <StatusBadge status={order.status} />
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Customer Info -->
      <div class="bg-card p-6 rounded-2xl border border-border shadow-sm">
        <h3 class="font-bold mb-4 text-lg">Cliente</h3>
        <div class="space-y-3 text-sm">
          <p><span class="text-muted-foreground mr-2 font-medium">Nombre:</span> <span class="font-semibold">{order.customer.firstName} {order.customer.lastName}</span></p>
          <p><span class="text-muted-foreground mr-2 font-medium">Correo:</span> {order.customer.email}</p>
          <p><span class="text-muted-foreground mr-2 font-medium">Teléfono:</span> {order.customer.phoneNumber || "-"}</p>
        </div>
      </div>

      <!-- Order Info & Payment -->
      <div class="bg-card p-6 rounded-2xl border border-border shadow-sm">
        <h3 class="font-bold mb-4 text-lg">Detalles del Pedido</h3>
        <div class="space-y-3 text-sm">
          <div class="flex justify-between items-center">
            <span class="text-muted-foreground font-medium">Creado:</span>
            <span class="font-mono bg-secondary/30 px-2 py-1 rounded">{formatDateTime(order.createdAt)}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-muted-foreground font-medium">Entrega Estimada:</span>
            <span class="font-medium bg-primary/10 text-primary px-2 py-1 rounded border border-primary/20">{formatDateTime(order.committedDeadline)}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-muted-foreground font-medium">Carga de Trabajo:</span>
            <span class="font-bold text-foreground">{order.totalDurationMin || 0} min</span>
          </div>

          <div class="h-px bg-border my-4"></div>

          <div class="flex justify-between items-center">
            <span class="text-muted-foreground font-medium">Método de Pago:</span>
            <span class="font-bold text-foreground">
              {order.paymentMethod === 'CASH' ? 'Efectivo' : order.paymentMethod === 'CARD' ? 'Tarjeta' : order.paymentMethod === 'TRANSFER' ? 'Transferencia' : order.paymentMethod || '-'}
            </span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-muted-foreground font-medium">Total:</span>
            <span class="font-medium text-lg">{formatCurrency(order.totalAmount)}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-muted-foreground font-medium">A cuenta:</span>
            <span class="font-bold text-success text-lg">-{formatCurrency(order.amountPaid)}</span>
          </div>
          <div class="border-t border-border pt-3 mt-1 flex justify-between items-center">
            <span class="font-bold uppercase tracking-wider text-muted-foreground">Saldo Pendiente:</span>
            <span class={`text-2xl font-black ${((order.totalAmount || 0) - (order.amountPaid || 0)) > 0.01 ? 'text-destructive' : 'text-primary'}`}>
              {formatCurrency(Math.max(0, (order.totalAmount || 0) - (order.amountPaid || 0)))}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Order Notes -->
    {#if order.notes}
      <div class="bg-warning/10 p-5 rounded-2xl border-2 border-warning/30 text-warning-text shadow-sm">
        <h3 class="font-bold mb-2 text-sm uppercase tracking-wider opacity-80 flex items-center gap-2">Notas Generales</h3>
        <p class="text-base font-medium">{order.notes}</p>
      </div>
    {/if}

    <!-- Items -->
    <div class="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
      <div class="px-6 py-4 border-b border-border font-bold text-lg bg-secondary/20">Prendas y Servicios</div>
      <div class="overflow-x-auto">
        <Table.Root class="w-full text-sm text-left">
          <Table.Header class="bg-muted/30 text-muted-foreground uppercase text-xs font-bold">
            <Table.Row class="hover:bg-transparent">
              <Table.Head class="px-6 py-4 font-bold h-auto">Descripción</Table.Head>
              <Table.Head class="px-6 py-4 font-bold h-auto">Servicio</Table.Head>
              <Table.Head class="px-6 py-4 font-bold h-auto text-center">Cant</Table.Head>
              <Table.Head class="px-6 py-4 font-bold h-auto">Precio</Table.Head>
              <Table.Head class="px-6 py-4 font-bold h-auto text-right">Subtotal</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body class="divide-y divide-border">
            {#each order.items as item}
              <Table.Row class="hover:bg-muted/10 transition-colors">
                <Table.Cell class="px-6 py-4 align-top">
                  <div class="font-bold text-base">{item.garmentName}</div>
                  {#if item.notes}
                    <div class="text-sm mt-2 bg-warning/10 text-warning-text p-2 rounded-lg border border-warning/20 inline-block">
                      <span class="font-bold mr-1">Nota:</span>{item.notes}
                    </div>
                  {/if}
                </Table.Cell>
                <Table.Cell colspan={3} class="px-0 py-0 align-top">
                  <Table.Root class="w-full">
                    <Table.Body class="divide-y divide-border/20">
                      {#each item.services as service}
                        <Table.Row class="hover:bg-transparent border-0">
                          <Table.Cell class="px-6 py-3 w-1/3 text-muted-foreground font-medium">{service.serviceName}</Table.Cell>
                          <Table.Cell class="px-6 py-3 w-1/3 text-center font-mono bg-secondary/10">{item.quantity}</Table.Cell>
                          <Table.Cell class="px-6 py-3 w-1/3">
                            <div class="font-mono text-foreground">${service.unitPrice}</div>
                            {#if service.adjustmentAmount && service.adjustmentAmount !== 0}
                              <div class={`text-xs mt-1 font-mono font-bold ${service.adjustmentAmount > 0 ? 'text-destructive bg-destructive/10' : 'text-success bg-success/10'} px-2 py-0.5 rounded-md inline-block`}>
                                {service.adjustmentAmount > 0 ? '+' : ''}{service.adjustmentAmount}
                                {service.adjustmentReason && ` (${service.adjustmentReason})`}
                              </div>
                            {/if}
                          </Table.Cell>
                        </Table.Row>
                      {/each}
                    </Table.Body>
                  </Table.Root>
                </Table.Cell>
                <Table.Cell class="px-6 py-4 font-bold text-lg font-mono align-top text-right text-primary">${item.subtotal}</Table.Cell>
              </Table.Row>
            {/each}
          </Table.Body>
        </Table.Root>
      </div>
    </div>

    <!-- Pickup Code -->
    {#if order.pickupCode}
      <div class="bg-card p-6 rounded-2xl border border-border shadow-sm text-center">
        <p class="text-sm text-muted-foreground uppercase tracking-wider font-medium mb-2">Código de retiro</p>
        <p class="text-2xl font-semibold tracking-widest font-mono">{order.pickupCode}</p>
      </div>
    {/if}

    <!-- Actions -->
    <div class="flex flex-col sm:flex-row justify-between gap-4 pt-6 border-t border-border mt-8">
      <Button
        onclick={handleCancel}
        variant="ghost"
        class="text-destructive hover:bg-destructive-muted hover:text-destructive h-14 rounded-xl text-lg touch-manipulation w-full sm:w-auto"
      >
        Cancelar Pedido
      </Button>

      <div class="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
        {#if order.status === 'RECEIVED'}
          <Button
            onclick={handleSendToOps}
            class="h-14 rounded-xl text-lg touch-manipulation shadow-md w-full sm:w-auto"
          >
            Enviar a Operaciones
          </Button>
        {/if}
        {#if order.status !== 'DELIVERED' && order.status !== 'CANCELLED'}
          <Button
            href={`/dashboard/orders/${order.id}/edit`}
            variant="outline"
            class="h-14 rounded-xl text-lg touch-manipulation shadow-sm border-2 w-full sm:w-auto"
          >
            Editar Pedido
          </Button>
        {/if}
        <Button
          onclick={handlePrint}
          variant="outline"
          class="h-14 rounded-xl text-lg touch-manipulation shadow-sm border-2 w-full sm:w-auto"
        >
          Imprimir Ticket
        </Button>
      </div>
    </div>
  </div>
{/if}
