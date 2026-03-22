<script lang="ts">
  import { Button } from '$lib/components/ui/button';
</script>

<div class="space-y-6">
  <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
    <div>
      <h1 class="text-3xl font-heading font-bold text-foreground">Órdenes</h1>
      <p class="text-muted-foreground">Gestionar base de datos de órdenes de servicio.</p>
    </div>
    <Button href="/dashboard/orders/new" class="w-full sm:w-auto h-12 touch-manipulation">+ Nueva Orden</Button>
  </div>

  <div class="p-8 text-center text-muted-foreground bg-card border border-border rounded-xl">
      [Tabla de Órdenes - En desarrollo]
  </div>
</div>
