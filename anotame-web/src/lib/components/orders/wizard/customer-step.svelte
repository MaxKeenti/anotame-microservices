<script lang="ts">
   import { orderWizardState } from '$lib/services/orders/OrderWizardState.svelte';
   import { apiService, API_SALES } from '$lib/services/api.svelte';
   import { Button } from '$lib/components/ui/button';
   import { Input } from '$lib/components/ui/input';
   import { Search, User, Plus } from '@lucide/svelte';
   import { toast } from 'svelte-sonner';
   import * as m from '$lib/paraglide/messages';
   import type { CustomerDto } from '$lib/types/dtos';

   let query = $state('');
   let results = $state<CustomerDto[]>([]);
   let isSearching = $state(false);

   $effect(() => {
       if (query.length > 2) {
           isSearching = true;
           const delay = setTimeout(async () => {
               try {
                   const res = await apiService.request<CustomerDto[]>(`${API_SALES}/api/customers/search?query=${query}`);
                   results = res || [];
               } catch(e) {
                   results = [];
               } finally {
                   isSearching = false;
               }
           }, 300);
           return () => clearTimeout(delay);
       } else {
           results = [];
       }
   });

   function selectCustomer(c: CustomerDto) {
       orderWizardState.updateActiveDraft({ customer: c });
       toast.success(m['customerStep.toast.selected'](), { description: `${c.firstName} ${c.lastName}` });
       query = '';
       results = [];
   }

   function clearCustomer() {
       orderWizardState.updateActiveDraft({ customer: undefined });
   }

   let { onNext, onBack } = $props<{ onNext: () => void, onBack: () => void }>();
   
   // Derived safe reference
   let draft = $derived(orderWizardState.activeDraft);
</script>

<div class="flex flex-col h-full gap-6">
    <div class="text-center md:text-left">
        <h2 class="text-xl font-semibold">{m['customerStep.title']()}</h2>
        <p class="text-muted-foreground">{m['customerStep.subtitle']()}</p>
    </div>

    <div class="flex-1 flex flex-col items-center justify-start max-w-2xl mx-auto w-full gap-8 pt-4">
        {#if draft?.customer}
            <div class="w-full bg-primary/5 border border-primary/20 rounded-xl p-6 text-center animate-in fade-in zoom-in-95">
                <div class="w-20 h-20 bg-primary/20 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                    <User class="w-10 h-10" />
                </div>
                <h3 class="text-2xl font-bold">{draft?.customer?.firstName} {draft?.customer?.lastName}</h3>
                <p class="text-muted-foreground">{draft?.customer?.phoneNumber}</p>
                <p class="text-muted-foreground text-sm">{draft?.customer?.email}</p>

                <div class="mt-6 flex flex-col sm:flex-row justify-center gap-4">
                    <Button variant="outline" class="h-10 sm:h-14 px-6 sm:px-8 text-sm sm:text-lg rounded-xl touch-manipulation" onclick={clearCustomer}>{m['customerStep.change']()}</Button>
                    <Button class="h-10 sm:h-14 px-8 sm:px-12 text-sm sm:text-lg rounded-xl touch-manipulation" onclick={onNext}>{m['common.continue']()}</Button>
                </div>
            </div>
        {:else}
            <div class="w-full space-y-6 relative">
                <div class="relative">
                    <Search class="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-6 h-6" />
                    <Input
                        placeholder={m['orders.wizard.searchPlaceholder']()}
                        class="pl-12 h-16 text-lg rounded-xl shadow-sm"
                        bind:value={query}
                        autofocus
                    />
                    
                    {#if results.length > 0}
                        <div class="absolute top-full mt-2 left-0 right-0 bg-popover border border-border rounded-xl shadow-xl z-20 max-h-80 overflow-y-auto">
                            {#each results as c (c.id)}
                                <Button
                                    variant="ghost"
                                    class="w-full h-auto text-left py-5 px-4 hover:bg-secondary border-b border-border flex items-center justify-between group transition-colors rounded-none font-normal touch-manipulation"
                                    onclick={() => selectCustomer(c)}
                                >
                                    <div class="text-left">
                                        <div class="font-bold text-lg group-hover:text-primary">{c.firstName} {c.lastName}</div>
                                        <div class="text-sm text-muted-foreground">{c.phoneNumber}</div>
                                    </div>
                                    <div class="opacity-0 lg:group-hover:opacity-100 text-primary font-medium">{m['customerStep.select']()} &rarr;</div>
                                </Button>
                            {/each}
                        </div>
                    {/if}
                </div>

                <div class="text-center text-muted-foreground py-4">- O -</div>

                <Button href="/dashboard/customers" variant="secondary" class="w-full h-16 text-lg rounded-xl border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 gap-2 touch-manipulation">
                    <Plus class="w-6 h-6" />
                    {m['customerStep.goCreate']()}
                </Button>
            </div>
        {/if}
    </div>

    {#if !draft?.customer}
        <div class="flex justify-between items-center py-3 sm:py-4 border-t border-border mt-auto">
            <Button variant="ghost" class="h-9 sm:h-12 px-4 sm:px-6 text-sm sm:text-base touch-manipulation" onclick={onBack}>{m['common.cancel']()}</Button>
            <Button disabled class="h-9 sm:h-12 px-4 sm:px-6 text-sm sm:text-base rounded-xl">{m['customerStep.selectPrompt']()}</Button>
        </div>
    {/if}
</div>
