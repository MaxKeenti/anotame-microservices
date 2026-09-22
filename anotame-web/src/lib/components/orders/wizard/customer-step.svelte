<script lang="ts">
    import * as Card from '$lib/components/ui/card';
    import IconMedallion from '$lib/components/common/icon-medallion.svelte';
    import * as InputGroup from '$lib/components/ui/input-group';
   import { Heading, Text } from '$lib/components/ui/typography';
   import { orderWizardState } from '$lib/services/orders/OrderWizardState.svelte';
   import { apiService, API_SALES } from '$lib/services/api.svelte';
   import { Button } from '$lib/components/ui/button';
   import { Search, User, Plus } from '@lucide/svelte';
   import * as Field from '$lib/components/ui/field';
   import * as Command from '$lib/components/ui/command';
   import { Command as CommandPrimitive } from 'bits-ui';
   import StatePanel from '$lib/components/common/state-panel.svelte';
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
                   const res = await apiService.request<CustomerDto[]>(`${API_SALES}/api/customers/search?query=${encodeURIComponent(query)}`);
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

   interface Props {
     onNext: () => void;
     onBack: () => void;
   }

   let { onNext, onBack }: Props = $props();
   
   // Derived safe reference
   let draft = $derived(orderWizardState.activeDraft);
</script>

<div class="flex flex-col flex-1 min-h-0 gap-6">
    <div class="text-center md:text-left">
        <Heading level={2}>{m['customerStep.title']()}</Heading>
        <p class="text-muted-foreground">{m['customerStep.subtitle']()}</p>
    </div>

    <div class="flex-1 flex flex-col items-center justify-start max-w-2xl mx-auto w-full gap-8 pt-4">
        {#if draft?.customer}
            <Card.Root tone="highlight" class="w-full gap-0 text-center animate-in fade-in zoom-in-95">
                <IconMedallion size="xl" class="mx-auto mb-4"><User /></IconMedallion>
                <Heading level={2} as="h3">{draft?.customer?.firstName} {draft?.customer?.lastName}</Heading>
                <p class="text-muted-foreground">{draft?.customer?.phoneNumber}</p>
                <Text variant="muted">{draft?.customer?.email}</Text>

                <div class="mt-6 flex flex-col sm:flex-row justify-center gap-4">
                    <Button size="step" variant="outline" class="px-6" onclick={clearCustomer}>{m['customerStep.change']()}</Button>
                    <Button size="step" onclick={onNext}>{m['common.continue']()}</Button>
                </div>
            </Card.Root>
        {:else}
            <div class="w-full space-y-6 relative">
                <Command.Root shouldFilter={false} label={m['orders.wizard.searchPlaceholder']()} class="relative overflow-visible rounded-none! bg-transparent p-0">
                    <CommandPrimitive.Input bind:value={query}>
                        {#snippet child({ props })}
                            <InputGroup.Root inputSize="lg">
                                <InputGroup.Input
                                    {...props}
                                    bind:value={query}
                                    placeholder={m['orders.wizard.searchPlaceholder']()}
                                    class="text-lg"
                                    autofocus
                                />
                                <InputGroup.Addon><Search class="size-6" aria-hidden="true" /></InputGroup.Addon>
                            </InputGroup.Root>
                        {/snippet}
                    </CommandPrimitive.Input>

                    {#if query.length > 2}
                        <Command.List class="absolute inset-x-0 top-full z-20 mt-2 max-h-80 rounded-xl border border-border bg-popover p-1 shadow-xl">
                            {#if isSearching}
                                <Command.Loading>
                                    <StatePanel message={m['common.loading']()} spinner size="inline" />
                                </Command.Loading>
                            {:else}
                                <Command.Empty>{m['orders.wizard.noSearchResults']()}</Command.Empty>
                            {/if}
                            {#each results as c (c.id)}
                                <Command.Item value={c.id} onSelect={() => selectCustomer(c)} class="min-h-14 rounded-lg px-4 py-3">
                                    <div class="min-w-0 flex-1">
                                        <div class="text-lg font-bold">{c.firstName} {c.lastName}</div>
                                        <div class="text-sm text-muted-foreground">{c.phoneNumber}</div>
                                    </div>
                                    <span class="font-medium text-primary">{m['customerStep.select']()} &rarr;</span>
                                </Command.Item>
                            {/each}
                        </Command.List>
                    {/if}
                </Command.Root>

                <Field.Separator class="my-4">{m['common.or']()}</Field.Separator>

                <Button size="xl" href="/dashboard/customers" variant="secondary" class="w-full border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 gap-2">
                    <Plus class="w-6 h-6" />
                    {m['customerStep.goCreate']()}
                </Button>
            </div>
        {/if}
    </div>

    {#if !draft?.customer}
        <div class="flex justify-between items-center py-3 sm:py-4 border-t border-border mt-auto">
            <Button size="touch-lg" variant="ghost" onclick={onBack}>{m['common.cancel']()}</Button>
            <Button size="touch-lg" disabled>{m['customerStep.selectPrompt']()}</Button>
        </div>
    {/if}
</div>
