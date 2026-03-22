<script lang="ts">
  import * as Select from "$lib/components/ui/select";
  
  let { 
    value = $bindable(), 
    options = [], 
    placeholder = 'Seleccionar...', 
    id = "" 
  }: { 
    value: string, 
    options: {value: string, label: string}[], 
    placeholder?: string, 
    id?: string 
  } = $props();

  let selectedLabel = $derived(value ? (options.find(o => o.value === value)?.label || placeholder) : placeholder);
</script>

<!-- Mobile Native OS Select -->
<select
  {id}
  bind:value
  class="flex md:hidden h-12 w-full items-center justify-between rounded-md border border-input px-3 py-2 text-base shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 touch-manipulation bg-background"
>
  <option value="">{placeholder}</option>
  {#each options as opt}
    <option value={opt.value}>{opt.label}</option>
  {/each}
</select>

<!-- Desktop Styled Shadcn Select -->
<div class="hidden md:block w-full">
  <Select.Root type="single" bind:value={value}>
    <Select.Trigger class="w-full h-12 text-base text-left font-normal bg-background">
      {selectedLabel}
    </Select.Trigger>
    <Select.Content>
      <Select.Item value="" label={placeholder} />
      {#each options as opt}
        <Select.Item value={opt.value} label={opt.label} />
      {/each}
    </Select.Content>
  </Select.Root>
</div>
