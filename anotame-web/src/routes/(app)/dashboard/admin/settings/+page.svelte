<script lang="ts">
  import { onMount } from 'svelte';
  import { apiService, API_OPERATIONS } from '$lib/services/api.svelte';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import * as Card from '$lib/components/ui/card';
  import * as Select from '$lib/components/ui/select';
  import { toast } from 'svelte-sonner';
  import { Store, ReceiptText, Palette } from 'lucide-svelte';
  import { superForm, defaults } from 'sveltekit-superforms';
  import { zod4 } from 'sveltekit-superforms/adapters';
  import { z } from 'zod';

  let { data } = $props();

  const settingsSchema = z.object({
    name: z.string().min(1, 'El nombre es obligatorio'),
    ownerName: z.string().optional().or(z.literal('')),
    dailyCapacityMinutes: z.number().min(1, 'Debe ser al menos 1 minuto'),
    rfc: z.string().optional().or(z.literal('')),
    regime: z.string().optional().or(z.literal('')),
    address: z.string().optional().or(z.literal('')),
    contactPhone: z.string().optional().or(z.literal('')),
    primaryColor: z.string()
      .regex(/^#[0-9A-Fa-f]{6}$/, 'Formato de color hexadecimal inválido #RRGGBB')
      .nullable()
      .optional()
      .or(z.literal('')),
    fontFamily: z.enum(['Inter', 'Outfit', 'Merriweather'])
      .nullable()
      .optional()
      .or(z.literal('')),
  });

  let isLoading = $state(true);
  let isSaving = $state(false);

  const { form, enhance, errors, reset } = superForm(defaults(zod4(settingsSchema)), {
    id: 'settings-form',
    SPA: true,
    validators: zod4(settingsSchema),
    async onUpdate({ form: f }) {
      if (!f.valid) return;
      isSaving = true;
      try {
        const payload = {
          name: f.data.name,
          ownerName: f.data.ownerName || '',
          dailyCapacityMinutes: f.data.dailyCapacityMinutes,
          taxInfo: JSON.stringify({
            rfc: f.data.rfc || '',
            regime: f.data.regime || '',
            address: f.data.address || '',
            contactPhone: f.data.contactPhone || '',
          }),
          primaryColor: f.data.primaryColor || null,
          fontFamily: f.data.fontFamily || null,
        };
        await apiService.request(`${API_OPERATIONS}/establishment`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        toast.success('Configuración guardada exitosamente');
      } catch (err: any) {
        toast.error(err.message || 'Error al guardar la configuración');
      } finally {
        isSaving = false;
      }
    },
  });

  onMount(async () => {
    try {
      const data = await apiService.request<any>(`${API_OPERATIONS}/establishment`);
      if (data) {
        let taxData: any = {};
        try { taxData = data.taxInfo ? JSON.parse(data.taxInfo) : {}; } catch {}
        reset({
          data: {
            name: data.name || '',
            ownerName: data.ownerName || '',
            dailyCapacityMinutes: data.dailyCapacityMinutes ?? 480,
            rfc: taxData.rfc || '',
            regime: taxData.regime || '',
            address: taxData.address || '',
            contactPhone: taxData.contactPhone || '',
            primaryColor: data.primaryColor || '',
            fontFamily: data.fontFamily || '',
          },
        });
      }
    } catch (err: any) {
      toast.error(err.message || 'Error al cargar la configuración');
    } finally {
      isLoading = false;
    }
  });
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
    <form method="POST" use:enhance class="space-y-6">

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
              bind:value={$form.name}
              required
              class="h-12"
              placeholder="Ej. Lavandería CleanExpress"
            />
            {#if $errors.name}<span class="text-xs text-destructive">{$errors.name}</span>{/if}
          </div>
          <div class="space-y-2">
            <label for="est-owner" class="text-sm font-medium">Nombre del Propietario o Encargado</label>
            <Input
              id="est-owner"
              bind:value={$form.ownerName}
              class="h-12"
              placeholder="Opcional"
            />
          </div>
          <div class="space-y-2">
            <label for="est-capacity" class="text-sm font-medium">Capacidad Diaria Manual (Minutos)</label>
            <Input
              id="est-capacity"
              type="number"
              bind:value={$form.dailyCapacityMinutes}
              class="h-12 font-mono"
              placeholder="Ej. 480 para 8 horas"
            />
            {#if $errors.dailyCapacityMinutes}<span class="text-xs text-destructive">{$errors.dailyCapacityMinutes}</span>{/if}
            <p class="text-xs text-muted-foreground">Define el límite de "espacios" (minutos) disponibles por día para programar pedidos.</p>
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
                bind:value={$form.rfc}
                class="h-12 uppercase"
                placeholder="ABCD123456XYZ"
              />
            </div>
            <div class="space-y-2">
              <label for="tax-regime" class="text-sm font-medium">Régimen Fiscal</label>
              <Input
                id="tax-regime"
                bind:value={$form.regime}
                class="h-12"
                placeholder="Ej. PF con Actividad Empresarial"
              />
            </div>
          </div>
          <div class="space-y-2">
            <label for="tax-address" class="text-sm font-medium">Dirección Completa (Para Recibo)</label>
            <Input
              id="tax-address"
              bind:value={$form.address}
              class="h-12"
              placeholder="Calle, Número, Colonia, Ciudad, C.P."
            />
          </div>
          <div class="space-y-2">
            <label for="tax-phone" class="text-sm font-medium">Teléfono / Contacto (Para Recibo)</label>
            <Input
              id="tax-phone"
              bind:value={$form.contactPhone}
              class="h-12"
              placeholder="(123) 456-7890"
            />
          </div>
        </Card.Content>
      </Card.Root>

      <!-- Branding & Theme -->
      <Card.Root>
        <Card.Header>
          <div class="flex items-center gap-2">
            <Palette class="w-5 h-5 text-primary" />
            <Card.Title>Personalización de Marca</Card.Title>
          </div>
          <Card.Description>
            Personaliza el color y la fuente de tu establecimiento.
          </Card.Description>
        </Card.Header>
        <Card.Content class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Brand Color Picker -->
            <div class="space-y-2">
              <label for="brand-color" class="text-sm font-medium">Color de Marca</label>
              <div class="flex items-center gap-3">
                <input
                  id="brand-color"
                  type="color"
                  bind:value={$form.primaryColor}
                  class="h-12 w-16 border border-input rounded cursor-pointer"
                />
                <input
                  type="text"
                  bind:value={$form.primaryColor}
                  placeholder="#FF6B6B"
                  class="flex-1 h-12 px-3 border border-input rounded text-xs font-mono"
                />
              </div>
              {#if $errors.primaryColor}
                <span class="text-xs text-destructive">{$errors.primaryColor}</span>
              {/if}
              <p class="text-xs text-muted-foreground">Formato hexadecimal: #RRGGBB</p>
            </div>

            <!-- Font Family Dropdown -->
            <div class="space-y-2">
              <label for="font-family" class="text-sm font-medium">Tipografía</label>
              <Select.Root
                type="single"
                value={$form.fontFamily || ''}
                onValueChange={(v) => {
                  $form.fontFamily = (v || '') as 'Inter' | 'Outfit' | 'Merriweather' | '';
                }}
              >
                <Select.Trigger id="font-family" class="h-12">
                  {#if $form.fontFamily}
                    {$form.fontFamily === 'Inter' ? 'Inter Variable (Por defecto)' : $form.fontFamily === 'Outfit' ? 'Outfit Variable' : 'Merriweather Variable'}
                  {:else}
                    <span class="text-muted-foreground">Selecciona una fuente...</span>
                  {/if}
                </Select.Trigger>
                <Select.Content>
                  <Select.Item value="Inter">Inter Variable (Por defecto)</Select.Item>
                  <Select.Item value="Outfit">Outfit Variable</Select.Item>
                  <Select.Item value="Merriweather">Merriweather Variable</Select.Item>
                </Select.Content>
              </Select.Root>
              {#if $errors.fontFamily}
                <span class="text-xs text-destructive">{$errors.fontFamily}</span>
              {/if}
            </div>
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
