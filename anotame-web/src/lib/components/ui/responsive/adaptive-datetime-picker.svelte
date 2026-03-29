<script lang="ts">
  import * as Popover from '$lib/components/ui/popover';
  import { Calendar } from '$lib/components/ui/calendar';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { useIsMobile } from '$lib/hooks/use-mobile.svelte';
  import { CalendarIcon, Clock } from 'lucide-svelte';
  import {
    CalendarDate,
    type DateValue,
  } from '@internationalized/date';

  let {
    value = $bindable(''),
    onValueChange,
    placeholder = 'Seleccionar fecha y hora...',
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

  // Parse "2026-03-22T18:00" into date and time parts
  let datePart = $derived.by(() => {
    if (!value) return '';
    return value.split('T')[0] || '';
  });

  let timePart = $derived.by(() => {
    if (!value || !value.includes('T')) return '18:00';
    return value.split('T')[1]?.slice(0, 5) || '18:00';
  });

  // Convert date string to CalendarDate
  let calendarValue = $derived.by(() => {
    if (!datePart) return undefined;
    const parts = datePart.split('-');
    if (parts.length !== 3) return undefined;
    return new CalendarDate(parseInt(parts[0]), parseInt(parts[1]), parseInt(parts[2]));
  });

  // Format display text
  let displayText = $derived.by(() => {
    if (!value || !datePart) return '';
    try {
      const date = new Date(datePart + 'T' + timePart);
      return date.toLocaleDateString('es-MX', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }) + ' ' + timePart;
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
    if (!dateValue) return;
    const iso = `${dateValue.year}-${String(dateValue.month).padStart(2, '0')}-${String(dateValue.day).padStart(2, '0')}`;
    const newValue = `${iso}T${timePart}`;
    value = newValue;
    onValueChange?.(newValue);
  }

  function handleTimeChange(e: Event) {
    const target = e.target as HTMLInputElement;
    const newTime = target.value;
    const dateStr = datePart || new Date().toISOString().slice(0, 10);
    const newValue = `${dateStr}T${newTime}`;
    value = newValue;
    onValueChange?.(newValue);
  }
</script>

{#if mobile.current}
  <!-- Mobile: Native datetime-local picker -->
  <Input
    {id}
    type="datetime-local"
    value={value ? value.slice(0, 16) : ''}
    oninput={handleNativeChange}
    class="flex h-12 w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm ring-offset-background touch-manipulation text-center {className}"
  />
{:else}
  <!-- Desktop: Styled Popover with Calendar + Time input -->
  <Popover.Root bind:open>
    <Popover.Trigger>
      {#snippet child({ props })}
        <Button
          {...props}
          {id}
          variant="outline"
          class="h-12 w-full justify-start text-left font-normal text-base {!value ? 'text-muted-foreground' : ''} {className}"
        >
          <CalendarIcon class="mr-2 h-4 w-4 shrink-0" />
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
      <div class="border-t border-border p-3 flex items-center gap-2">
        <Clock class="h-4 w-4 text-muted-foreground shrink-0" />
        <span class="text-sm text-muted-foreground font-medium">Hora:</span>
        <input
          type="time"
          value={timePart}
          onchange={handleTimeChange}
          class="flex-1 h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>
    </Popover.Content>
  </Popover.Root>
{/if}
