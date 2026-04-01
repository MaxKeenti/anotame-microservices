<script lang="ts">
  import * as Select from '$lib/components/ui/select';
  import { useIsMobile } from '$lib/hooks/use-mobile.svelte';

  let {
    value = $bindable(''),
    onValueChange,
    placeholder = 'Seleccionar...',
    items = [],
    id = '',
    class: className = '',
    allowClear = false,
    clearText = 'Ninguno'
  }: {
    value?: string;
    onValueChange?: (value: string) => void;
    placeholder?: string;
    items: { value: string; label: string }[];
    id?: string;
    class?: string;
    allowClear?: boolean;
    clearText?: string;
  } = $props();

  const mobile = useIsMobile();

  function handleNativeChange(e: Event) {
    const target = e.target as HTMLSelectElement;
    value = target.value;
    onValueChange?.(target.value);
  }

  function handleSelectChange(v: string | undefined) {
    value = v ?? '';
    onValueChange?.(value);
  }
</script>

{#if mobile.current}
  <!-- Mobile: Native <select> for OS wheel picker -->
  <select
    {id}
    bind:value
    onchange={handleNativeChange}
    class="flex h-12! w-full items-center justify-between rounded-md border border-input px-3 py-2 text-base shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 touch-manipulation bg-background {className}"
  >
    <option value="">{placeholder}</option>
    {#if allowClear && value}
      <option value="">{clearText}</option>
    {/if}
    {#each items as item (item.value)}
      <option value={item.value}>{item.label}</option>
    {/each}
  </select>
{:else}
  <!-- Desktop: Styled shadcn Select -->
  <Select.Root type="single" value={value} onValueChange={handleSelectChange}>
    <Select.Trigger {id} class="flex h-12! w-full text-base font-normal {className}">
      {#if value}
        {@const selected = items.find(i => i.value === value)}
        {selected?.label ?? placeholder}
      {:else}
        <span class="text-muted-foreground">{placeholder}</span>
      {/if}
    </Select.Trigger>
    <Select.Content>
      {#if allowClear && value !== '' && value !== undefined}
        <Select.Item value="">{clearText}</Select.Item>
      {/if}
      {#each items as item (item.value)}
        <Select.Item value={item.value}>{item.label}</Select.Item>
      {/each}
    </Select.Content>
  </Select.Root>
{/if}
