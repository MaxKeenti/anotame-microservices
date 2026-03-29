<script lang="ts">
  import { onMount } from 'svelte';
  import { apiService, API_OPERATIONS } from '$lib/services/api.svelte';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import * as Card from '$lib/components/ui/card';
  import { toast } from 'svelte-sonner';
  import { Store, ReceiptText } from 'lucide-svelte';

  let isLoading = $state(true);
  let isSaving = $state(false);

  // Settings state
  let settings = $state({
    name: '',
    ownerName: '',
    taxInfo: '{}',
    active: true
  });

  // Parsed tax data for form binding
  let taxData = $state({
    rfc: '',
    regime: '',
    address: '',
    contactPhone: ''
  });

  onMount(async () => {
    try {
      const data = await apiService.request<any>(`${API_OPERATIONS}/establishment`);
      if (data) {
        settings = { ...settings, ...data };
        try {
          if (data.taxInfo) {
            taxData = { ...taxData, ...JSON.parse(data.taxInfo) };
          }
        } catch (e) {
          console.warn("Could not parse tax info", e);
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Error al cargar la configuración');
    } finally {
      isLoading = false;
    }
  });

  async function handleSave(e: Event) {
    e.preventDefault();
    isSaving = true;
    try {
      const payload = {
        ...settings,
        taxInfo: JSON.stringify(taxData)
      };
      
      const response = await apiService.request<any>(`${API_OPERATIONS}/establishment`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      
      if (response) {
        settings = { ...settings, ...response };
      }
      
      toast.success('Configuración guardada exitosamente');
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar la configuración');
    } finally {
      isSaving = false;
    }
  }
</script>

<div class="space-y-6 max-w-3xl mx-auto animate-in fade-in duration-300">
  <div>
    <h1 class="text-3xl font-heading font-bold text-foreground">Configuración del Establecimiento</h1>
    <p class="text-muted-foreground">Administra los detalles generales y fiscales de la sucursal.</p>
  </div>

  {#if isLoading}
    <div class="h-64 flex items-center justify-center text-muted-foreground border border-border rounded-xl bg-card">
      Cargando configuración...
    </div>
  {:else}
    <form onsubmit={handleSave} class="space-y-6">
      
      <!-- General Info -->
      <Card.Root>
        <Card.Header>
          <div class="flex items-center gap-2">
            <Store class="w-5 h-5 text-primary" />
            <Card.Title>Información General</Card.Title>
          </div>
          <Card.Description>
            Los datos públicos de tu establecimiento.
          </Card.Description>
        </Card.Header>
        <Card.Content class="space-y-4">
          <div class="space-y-2">
            <label for="est-name" class="text-sm font-medium">Nombre del Establecimiento <span class="text-destructive">*</span></label>
            <Input 
              id="est-name" 
              bind:value={settings.name} 
              required 
              class="h-12"
              placeholder="Ej. Lavandería CleanExpress"
            />
          </div>
          <div class="space-y-2">
            <label for="est-owner" class="text-sm font-medium">Nombre del Propietario o Encargado</label>
            <Input 
              id="est-owner" 
              bind:value={settings.ownerName} 
              class="h-12"
              placeholder="Opcional"
            />
          </div>
        </Card.Content>
      </Card.Root>

      <!-- Tax Info -->
      <Card.Root>
        <Card.Header>
          <div class="flex items-center gap-2">
            <ReceiptText class="w-5 h-5 text-primary" />
            <Card.Title>Información Fiscal y de Recibos</Card.Title>
          </div>
          <Card.Description>
            Estos datos aparecerán impresos en los tickets entregados a los clientes.
          </Card.Description>
        </Card.Header>
        <Card.Content class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-2">
              <label for="tax-rfc" class="text-sm font-medium">RFC / Identificación Fiscal</label>
              <Input 
                id="tax-rfc" 
                bind:value={taxData.rfc} 
                class="h-12 uppercase"
                placeholder="ABCD123456XYZ"
              />
            </div>
            <div class="space-y-2">
              <label for="tax-regime" class="text-sm font-medium">Régimen Fiscal</label>
              <Input 
                id="tax-regime" 
                bind:value={taxData.regime} 
                class="h-12"
                placeholder="Ej. PF con Actividad Empresarial"
              />
            </div>
          </div>
          <div class="space-y-2">
            <label for="tax-address" class="text-sm font-medium">Dirección Completa (Para Recibo)</label>
            <Input 
              id="tax-address" 
              bind:value={taxData.address} 
              class="h-12"
              placeholder="Calle, Número, Colonia, Ciudad, C.P."
            />
          </div>
          <div class="space-y-2">
            <label for="tax-phone" class="text-sm font-medium">Teléfono / Contacto (Para Recibo)</label>
            <Input 
              id="tax-phone" 
              bind:value={taxData.contactPhone} 
              class="h-12"
              placeholder="(123) 456-7890"
            />
          </div>
        </Card.Content>
      </Card.Root>

      <div class="flex justify-end gap-4 pt-4">
        <Button 
          variant="outline" 
          type="button" 
          class="h-12 px-6 touch-manipulation font-medium" 
          href="/dashboard"
        >
          Cancelar
        </Button>
        <Button 
          type="submit" 
          disabled={isSaving}
          class="h-12 px-8 touch-manipulation font-medium shadow-sm"
        >
          {isSaving ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </div>
    </form>
  {/if}
</div>
