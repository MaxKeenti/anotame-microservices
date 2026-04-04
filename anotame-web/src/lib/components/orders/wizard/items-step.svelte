<script lang="ts">
   import { orderWizardState } from '$lib/services/orders/OrderWizardState.svelte';
   import ItemSubWizard from './item-sub-wizard.svelte';
   import { Button } from '$lib/components/ui/button';
   import { Plus, Trash2, Edit, Copy } from 'lucide-svelte';
   import { toast } from 'svelte-sonner';

   let { onNext, onBack } = $props<{ onNext: () => void, onBack: () => void }>();

   let isAddingItem = $state(false);
   let editingIndex = $state<number | null>(null);

   let draft = $derived(orderWizardState.activeDraft || {} as any);
   let items = $derived(draft?.items || []);

   let total = $derived(items.reduce((acc, item) => {
       const servicesTotal = (item.services || []).reduce((sAcc, s) => sAcc + s.unitPrice + (s.adjustmentAmount || 0), 0);
       return acc + servicesTotal;
   }, 0));

   function handleSaveItem(item: any) {
       let newItems = [...items];
       if (editingIndex !== null) {
           newItems[editingIndex] = item;
           toast.success("Prenda actualizada", { description: item.garmentName });
       } else {
           newItems.push(item);
           toast.success("Prenda agregada", { description: item.garmentName });
       }
       orderWizardState.updateActiveDraft({ items: newItems });
       isAddingItem = false;
       editingIndex = null;
   }

   function handleEditItem(index: number) {
       editingIndex = index;
       isAddingItem = true;
   }

   function handleDeleteItem(index: number) {
       let newItems = [...items];
       const deletedGarment = newItems[index].garmentName;
       newItems.splice(index, 1);
       orderWizardState.updateActiveDraft({ items: newItems });
       toast.info("Prenda eliminada", { description: deletedGarment });
   }

   function handleDuplicateItem(index: number) {
       const itemToDuplicate = items[index];
       const newItem = {
           ...itemToDuplicate,
           notes: itemToDuplicate.notes ? `${itemToDuplicate.notes} (Copia)` : '(Copia)',
           services: itemToDuplicate.services?.map(s => ({ ...s }))
       };
       let newItems = [...items];
       newItems.splice(index + 1, 0, newItem);
       orderWizardState.updateActiveDraft({ items: newItems });
       toast.success("Prenda duplicada", { description: `${itemToDuplicate.garmentName}` });
   }
</script>

{#if isAddingItem}
   <ItemSubWizard
       initialItem={editingIndex !== null ? items[editingIndex] : undefined}
       onSave={handleSaveItem}
       onCancel={() => {
           isAddingItem = false;
           editingIndex = null;
       }}
   />
{:else}
   <div class="flex flex-col h-full gap-6">
       <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
           <div>
               <h2 class="text-xl font-semibold">Paso 2: Prendas y Servicios</h2>
               <p class="text-muted-foreground">Agrega las prendas que el cliente deja.</p>
           </div>
           <Button onclick={() => isAddingItem = true} size="lg" class="rounded-xl h-14 px-8 w-full sm:w-auto touch-manipulation shadow-md">
               <Plus class="w-5 h-5 mr-2" />
               Agregar Prenda
           </Button>
       </div>

       <div class="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
           {#if items.length === 0}
               <div class="h-64 flex flex-col items-center justify-center border-2 border-dashed border-muted rounded-2xl text-muted-foreground w-full">
                   <p class="text-lg">No hay prendas agregadas.</p>
                   <button
                       class="mt-6 text-primary font-bold text-lg cursor-pointer hover:underline touch-manipulation py-4 px-6 bg-primary/5 rounded-xl transition-colors"
                       onclick={() => isAddingItem = true}
                   >
                       + Agregar la primera prenda
                   </button>
               </div>
           {:else}
               {#each items as item, idx}
                   <div class="bg-card border border-border p-5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm animate-in fade-in slide-in-from-bottom-2">
                       <div class="flex-1">
                           <div class="font-bold text-xl mb-1">{item.garmentName}</div>
                           <div class="text-base text-muted-foreground space-y-1">
                               {#each (item.services || []) as s}
                                   <div class="flex gap-2 items-baseline">
                                       <span>• {s.serviceName}</span>
                                       <span class="font-mono text-sm bg-secondary px-1.5 py-0.5 rounded">
                                           ${(s.unitPrice + (s.adjustmentAmount || 0)).toFixed(2)}
                                           {s.adjustmentAmount ? ` (Adj: ${s.adjustmentAmount})` : ''}
                                       </span>
                                   </div>
                               {/each}
                           </div>
                           {#if item.notes}
                               <div class="text-sm text-muted-foreground mt-3 bg-secondary/50 p-2 rounded-lg border border-border/50 inline-block">
                                   <span class="font-semibold text-foreground mr-1">Nota:</span>{item.notes}
                               </div>
                           {/if}
                       </div>
                       
                       <div class="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center w-full sm:w-auto mt-4 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-t-0 border-border">
                           <div class="font-mono font-bold text-2xl text-primary sm:mb-4">
                               ${(item.services || []).reduce((acc, s) => acc + s.unitPrice + (s.adjustmentAmount || 0), 0).toFixed(2)}
                           </div>
                           <div class="flex gap-2 bg-secondary/30 p-1.5 rounded-xl">
                               <Button variant="ghost" size="icon" class="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground hover:bg-background hover:text-primary rounded-lg touch-manipulation shadow-sm border border-transparent hover:border-border" title="Duplicar" onclick={() => handleDuplicateItem(idx)}>
                                   <Copy class="w-5 h-5 sm:w-6 sm:h-6" />
                               </Button>
                               <Button variant="ghost" size="icon" class="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground hover:bg-background hover:text-primary rounded-lg touch-manipulation shadow-sm border border-transparent hover:border-border" title="Editar" onclick={() => handleEditItem(idx)}>
                                   <Edit class="w-5 h-5 sm:w-6 sm:h-6" />
                               </Button>
                               <Button variant="ghost" size="icon" class="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground hover:bg-background hover:text-destructive rounded-lg touch-manipulation shadow-sm border border-transparent hover:border-destructive/20" title="Eliminar" onclick={() => handleDeleteItem(idx)}>
                                   <Trash2 class="w-5 h-5 sm:w-6 sm:h-6" />
                               </Button>
                           </div>
                       </div>
                   </div>
               {/each}
           {/if}
       </div>

       <div class="border-t border-border pt-6 mt-auto">
           <div class="flex justify-between items-center mb-6 px-2">
               <span class="text-xl font-medium">Total Estimado:</span>
               <span class="text-4xl font-bold font-mono text-primary">${total.toFixed(2)}</span>
           </div>
           <div class="flex flex-col-reverse sm:flex-row gap-4">
               <Button variant="outline" class="w-full sm:w-auto sm:flex-1 h-16 text-lg rounded-xl touch-manipulation" onclick={onBack}>Atrás</Button>
               <Button class="w-full sm:w-auto sm:flex-1 h-16 text-lg rounded-xl shadow-lg touch-manipulation" onclick={onNext} disabled={items.length === 0}>
                   Continuar al Pago
               </Button>
           </div>
       </div>
   </div>
{/if}
