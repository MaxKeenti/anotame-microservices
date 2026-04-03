<script lang="ts">
  import { onMount } from 'svelte';
  import { apiService, API_CATALOG } from '$lib/services/api.svelte';
  import { authService } from '$lib/services/auth.svelte';
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import * as Table from '$lib/components/ui/table';
  import { adaptiveConfirm } from '$lib/components/ui/responsive/confirm-state.svelte';
  import { toast } from 'svelte-sonner';
  import { Eye, Trash2, Copy } from 'lucide-svelte';
  import { useAuthGuard } from '$lib/guards/index.svelte';
  import { goto } from '$app/navigation';

  // Guard: Protect this route, strictly checking 'ADMIN'
  const guard = useAuthGuard(true, '/dashboard');
  
  let lists = $state<any[]>([]);
  let isLoading = $state(true);

  // Computed state for derived logic (though guard.allowed handles fast redirects)
  const isAdmin = $derived(authService.user?.role === 'ADMIN');

  async function loadLists() {
    isLoading = true;
    try {
      if (!isAdmin) return;
      const data = await apiService.request<any[]>(`${API_CATALOG}/pricelists`);
      lists = data || [];
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error al cargar listas de precios");
      lists = [];
    } finally {
      isLoading = false;
    }
  }

  // Once guard resolves authentication state:
  $effect(() => {
    if (guard.allowed) {
      loadLists();
    }
  });

  async function handleDelete(id: string, name: string) {
    const ok = await adaptiveConfirm({ 
      title: 'Eliminar Lista', 
      description: `¿Estás seguro de que deseas eliminar la lista "${name}"?` 
    });
    
    if (ok) {
      try {
        await apiService.request(`${API_CATALOG}/pricelists/${id}`, { method: 'DELETE' });
        toast.success("Lista eliminada exitosamente");
        loadLists();
      } catch (err: any) {
        toast.error("No se pudo eliminar la lista");
      }
    }
  }

  function handleClone(id: string) {
    // Clone passes the source id via query parameter to the `new` route
    goto(`/dashboard/catalog/pricelists/new?cloneFrom=${id}`);
  }
</script>

{#if guard.checking}
  <div class="p-8 text-center text-muted-foreground animate-pulse">Verificando accesos...</div>
{:else if guard.allowed}
  <div class="space-y-6 animate-in fade-in duration-300">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 class="text-3xl font-heading font-bold text-foreground">Listas de Precios</h1>
        <p class="text-muted-foreground">Gestiona estrategias de precios y descuentos temporales.</p>
      </div>
      <Button href="/dashboard/catalog/pricelists/new" class="w-full sm:w-auto h-12 shadow-sm touch-manipulation">
        + Nueva Lista
      </Button>
    </div>

    <Card.Root>
      <Card.Header>
        <Card.Title>Estrategias Activas e Históricas</Card.Title>
        <Card.Description>Las listas con mayor prioridad sobrescriben el precio base del catálogo.</Card.Description>
      </Card.Header>
      <Card.Content>
        {#if isLoading}
          <div class="h-48 flex items-center justify-center text-muted-foreground">Cargando...</div>
        {:else if lists.length === 0}
          <div class="h-48 flex flex-col items-center justify-center border-2 border-dashed rounded-lg text-muted-foreground bg-muted/10">
            <p>No hay listas configuradas.</p>
            <p class="text-sm">El sistema usará los precios base de cada servicio.</p>
          </div>
        {:else}
          <div class="border rounded-md overflow-x-auto">
            <Table.Root class="min-w-[700px]">
              <Table.Header class="bg-secondary/30">
                <Table.Row>
                  <Table.Head class="p-4">Nombre</Table.Head>
                  <Table.Head class="p-4">Prioridad</Table.Head>
                  <Table.Head class="p-4">Válido Desde</Table.Head>
                  <Table.Head class="p-4">Válido Hasta</Table.Head>
                  <Table.Head class="p-4">Estado</Table.Head>
                  <Table.Head class="p-4 text-right">Acciones</Table.Head>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {#each lists as list (list.id)}
                  <Table.Row class="hover:bg-muted/30 transition-colors">
                    <Table.Cell class="p-4 font-medium">{list.name}</Table.Cell>
                    <Table.Cell class="p-4 font-mono font-medium">{list.priority}</Table.Cell>
                    <Table.Cell class="p-4 text-muted-foreground">
                      {new Date(list.validFrom).toLocaleDateString('es-ES')}
                    </Table.Cell>
                    <Table.Cell class="p-4 text-muted-foreground">
                      {list.validTo ? new Date(list.validTo).toLocaleDateString('es-ES') : "Permanente"}
                    </Table.Cell>
                    <Table.Cell class="p-4">
                      {#if list.active}
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold leading-none shrink-0 bg-success/20 text-success ring-1 ring-inset ring-success/30">
                          Activa
                        </span>
                      {:else}
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                          Inactiva
                        </span>
                      {/if}
                    </Table.Cell>
                    <Table.Cell class="p-4 text-right space-x-2 whitespace-nowrap">
                      <Button
                        variant="outline"
                        size="sm"
                        class="h-10 border-primary/20 hover:bg-primary/5 text-primary"
                        onclick={() => handleClone(list.id)}
                        title="Clonar Lista"
                      >
                        <Copy class="w-4 h-4 mr-2" />
                        Clonar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        class="h-10"
                        href={`/dashboard/catalog/pricelists/${list.id}`}
                      >
                        <Eye class="w-4 h-4 mr-2" />
                        Ver
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        class="h-10 text-destructive hover:bg-destructive/10 border-destructive/20"
                        onclick={() => handleDelete(list.id, list.name)}
                      >
                        <Trash2 class="w-4 h-4 mr-2" />
                        Eliminar
                      </Button>
                    </Table.Cell>
                  </Table.Row>
                {/each}
              </Table.Body>
            </Table.Root>
          </div>
        {/if}
      </Card.Content>
    </Card.Root>
  </div>
{/if}
