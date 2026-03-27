<script lang="ts">
  import * as Popover from '$lib/components/ui/popover';
  import { Calendar } from '$lib/components/ui/calendar';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { useIsMobile } from '$lib/hooks/use-mobile.svelte';
  import { CalendarIcon } from 'lucide-svelte';
  import {
    CalendarDate,
    type DateValue,
  } from '@internationalized/date';

  let {
    value = $bindable(''),
    onValueChange,
    placeholder = 'Seleccionar fecha...',
    id = '',
    class: className = '',
  }: {
    value?: string;
    onValueChange?: (value: string) => void;
    placeholder?: string;
    id?: string;
    class?: string;
  } = $props();

  const mobile = useIsMobile();
  let open = $state(false);

  // Convert ISO date string ("2026-03-22") to CalendarDate for the Calendar component
  let calendarValue = $derived.by(() => {
    if (!value) return undefined;
    const parts = value.split('-');
    if (parts.length !== 3) return undefined;
    return new CalendarDate(parseInt(parts[0]), parseInt(parts[1]), parseInt(parts[2]));
  });

  // Format display text for the trigger button
  let displayText = $derived.by(() => {
    if (!value) return '';
    try {
      const date = new Date(value + 'T00:00:00');
      return date.toLocaleDateString('es-MX', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return value;
    }
  });

  function handleNativeChange(e: Event) {
    const target = e.target as HTMLInputElement;
    value = target.value;
    onValueChange?.(target.value);
  }

  function handleCalendarChange(dateValue: DateValue | undefined) {
    if (!dateValue) {
      value = '';
      onValueChange?.('');
      return;
    }
    const iso = `${dateValue.year}-${String(dateValue.month).padStart(2, '0')}-${String(dateValue.day).padStart(2, '0')}`;
    value = iso;
    onValueChange?.(iso);
    open = false;
  }
</script>

{#if mobile.current}
  <!-- Mobile: Native date input for OS picker -->
  <Input
    {id}
    type="date"
    value={value}
    oninput={handleNativeChange}
    class="flex h-12 w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm ring-offset-background touch-manipulation {className}"
  />
{:else}
  <!-- Desktop: Styled Popover + Calendar -->
  <Popover.Root bind:open>
    <Popover.Trigger>
      {#snippet child({ props })}
        <Button
          {...props}
          {id}
          variant="outline"
          class="h-12 w-full justify-start text-left font-normal text-base {!value ? 'text-muted-foreground' : ''} {className}"
        >
          <CalendarIcon class="mr-2 h-4 w-4" />
          {displayText || placeholder}
        </Button>
      {/snippet}
    </Popover.Trigger>
    <Popover.Content class="w-auto p-0" align="start">
      <Calendar
        type="single"
        value={calendarValue}
        onValueChange={handleCalendarChange}
        initialFocus
      />
    </Popover.Content>
  </Popover.Root>
{/if}
