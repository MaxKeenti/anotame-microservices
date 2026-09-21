<script lang="ts">
    import { formatCurrency } from '$lib/utils/formatUtils';
    import * as Empty from '$lib/components/ui/empty';
    import * as Item from '$lib/components/ui/item';
    import * as ButtonGroup from '$lib/components/ui/button-group';
    import { Badge } from '$lib/components/ui/badge';
   import { Heading, Text } from '$lib/components/ui/typography';
   import { orderWizardState, type DraftOrderItem, type DraftOrder } from '$lib/services/orders/OrderWizardState.svelte';
   import ItemSubWizard from './item-sub-wizard.svelte';
   import { Button } from '$lib/components/ui/button';
   import { Plus, Trash2, Edit, Copy } from '@lucide/svelte';
   import { toast } from 'svelte-sonner';
   import * as m from '$lib/paraglide/messages';

   interface Props {
     onNext: () => void;
     onBack: () => void;
   }

   let { onNext, onBack }: Props = $props();

   let isAddingItem = $state(false);
   let editingIndex = $state<number | null>(null);

   let draft = $derived(orderWizardState.activeDraft as DraftOrder | null);
   let items = $derived(draft?.items || ([] as DraftOrderItem[]));

   let total = $derived(items.reduce((acc: number, item: DraftOrderItem) => {
       const servicesTotal = (item.services || []).reduce((sAcc: number, s) => sAcc + s.unitPrice + (s.adjustmentAmount || 0), 0);
       return acc + servicesTotal;
   }, 0));

   function handleSaveItem(item: DraftOrderItem) {
       let newItems = [...items];
       if (editingIndex !== null) {
           newItems[editingIndex] = item;
           toast.success(m['itemsStep.toast.garmentUpdated'](), { description: item.garmentName });
       } else {
           newItems.push(item);
           toast.success(m['itemsStep.toast.garmentAdded'](), { description: item.garmentName });
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
       toast.info(m['itemsStep.toast.garmentRemoved'](), { description: deletedGarment });
   }

   function handleDuplicateItem(index: number) {
       const itemToDuplicate = items[index];
       const newItem: DraftOrderItem = {
           ...itemToDuplicate,
           notes: itemToDuplicate.notes ? `${itemToDuplicate.notes} ${m['itemsStep.copySuffix']()}` : m['itemsStep.copySuffix'](),
           services: (itemToDuplicate.services || []).map(s => ({ ...s }))
       };
       let newItems = [...items];
       newItems.splice(index + 1, 0, newItem);
       orderWizardState.updateActiveDraft({ items: newItems });
       toast.success(m['itemsStep.toast.garmentDuplicated'](), { description: `${itemToDuplicate.garmentName}` });
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
   <div class="flex flex-col flex-1 min-h-0 gap-6">
       <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
           <div>
               <Heading level={2}>{m['itemsStep.title']()}</Heading>
               <p class="text-muted-foreground">{m['itemsStep.subtitle']()}</p>
           </div>
           <Button onclick={() => isAddingItem = true} size="xl" class="rounded-xl px-8 w-full sm:w-auto shadow-md">
               <Plus class="w-5 h-5 mr-2" />
               {m['itemsStep.addGarment']()}
           </Button>
       </div>

       <div class="flex-1 space-y-4">
           {#if items.length === 0}
               <Empty.Root class="h-64 border-2 text-muted-foreground">
                   <Empty.Title class="text-lg font-normal">{m['itemsStep.empty']()}</Empty.Title>
                   <Empty.Content>
                       <Button variant="ghost" size="xl" class="bg-primary/5 font-bold text-primary" onclick={() => isAddingItem = true}>
                           {m['itemsStep.addFirst']()}
                       </Button>
                   </Empty.Content>
               </Empty.Root>
           {:else}
               {#each items as item, idx}
                   <Item.Root variant="outline" class="animate-in fade-in slide-in-from-bottom-2 items-start bg-card p-5 shadow-sm">
                       <Item.Content class="min-w-0 basis-full sm:basis-0">
                           <Item.Title class="line-clamp-none flex-wrap text-xl font-bold">
                               {item.garmentName}
                               {#if item.source === 'CUSTOM'}
                                   <Badge variant="brand">{m['orders.custom.badge']()}</Badge>
                               {/if}
                           </Item.Title>
                           <ul class="space-y-1 text-base text-muted-foreground">
                               {#each (item.services || []) as s}
                                   <li>
                                       <div class="flex flex-wrap items-baseline gap-2">
                                           <span>• {s.serviceName}</span>
                                           {#if s.source === 'CUSTOM'}
                                               <Badge variant="brand">{m['orders.custom.badge']()}</Badge>
                                           {/if}
                                           <Badge variant="secondary" class="font-mono">
                                               {formatCurrency(s.unitPrice + (s.adjustmentAmount || 0))}
                                               {s.adjustmentAmount ? ` (${m['orders.wizard.adjustmentShort']()} ${formatCurrency(s.adjustmentAmount)})` : ''}
                                           </Badge>
                                       </div>
                                       {#if s.instructions}
                                           <p class="pl-4 text-sm">{s.instructions}</p>
                                       {/if}
                                   </li>
                               {/each}
                           </ul>
                           {#if item.notes}
                               <Item.Description class="line-clamp-none">
                                   <span class="mr-1 font-semibold text-foreground">{m['itemsStep.noteLabel']()}</span>{item.notes}
                               </Item.Description>
                           {/if}
                       </Item.Content>

                       <Item.Actions class="w-full justify-between border-t border-border pt-4 sm:w-auto sm:flex-col sm:items-end sm:border-t-0 sm:pt-0">
                           <Text variant="metric" size="md" as="span" class="text-primary">
                               {formatCurrency((item.services || []).reduce((acc: number, s) => acc + s.unitPrice + (s.adjustmentAmount || 0), 0))}
                           </Text>
                           <ButtonGroup.Root>
                               <Button variant="outline" size="icon-touch" aria-label={m['common.duplicate']()} title={m['common.duplicate']()} onclick={() => handleDuplicateItem(idx)}>
                                   <Copy class="size-5" />
                               </Button>
                               <Button variant="outline" size="icon-touch" aria-label={m['common.edit']()} title={m['common.edit']()} onclick={() => handleEditItem(idx)}>
                                   <Edit class="size-5" />
                               </Button>
                               <Button variant="destructive-outline" size="icon-touch" aria-label={m['common.delete']()} title={m['common.delete']()} onclick={() => handleDeleteItem(idx)}>
                                   <Trash2 class="size-5" />
                               </Button>
                           </ButtonGroup.Root>
                       </Item.Actions>
                   </Item.Root>
               {/each}
           {/if}
       </div>

       <div class="border-t border-border pt-3 sm:pt-6 mt-auto">
           <!-- Desktop: total row then full-width buttons -->
           <div class="hidden sm:flex justify-between items-center mb-6 px-2">
               <span class="text-xl font-medium">{m['itemsStep.totalEstimated']()}</span>
               <span class="text-4xl font-bold font-mono text-primary">{formatCurrency(total)}</span>
           </div>
           <div class="hidden sm:flex gap-4">
               <Button variant="outline" class="flex-1 h-16 text-lg rounded-xl" onclick={onBack}>{m['orders.detail.back']()}</Button>
               <Button class="flex-1 h-16 text-lg rounded-xl shadow-lg" onclick={onNext} disabled={items.length === 0}>
                   {m['itemsStep.continueToPayment']()}
               </Button>
           </div>
           <!-- Mobile: single compact row — back | total | continue -->
           <div class="flex sm:hidden items-center gap-2">
               <Button size="touch" variant="outline" class="px-3 text-sm rounded-xl flex-shrink-0" onclick={onBack}>{m['orders.detail.back']()}</Button>
               <div class="flex-1 flex flex-col items-center leading-tight">
                   <span class="text-xs text-muted-foreground">{m['orders.wizard.total']()}</span>
                   <Text variant="metric" size="sm" as="span" class="text-primary">{formatCurrency(total)}</Text>
               </div>
               <Button size="touch" class="px-3 text-sm rounded-xl shadow-lg flex-shrink-0" onclick={onNext} disabled={items.length === 0}>
                   {m['common.continue']()}
               </Button>
           </div>
       </div>
   </div>
{/if}
