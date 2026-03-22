<script lang="ts">
  import { Input } from "$lib/components/ui/input";
  import * as Popover from "$lib/components/ui/popover";
  import { Calendar } from "$lib/components/ui/calendar";
  import { buttonVariants } from "$lib/components/ui/button";
  import { cn } from "$lib/utils";
  import { CalendarIcon } from "lucide-svelte";
  import { parseDate, DateFormatter, getLocalTimeZone, type DateValue } from "@internationalized/date";

  let { value = $bindable(""), id = "", placeholder = "Seleccionar fecha" }: { value: string, id?: string, placeholder?: string } = $props();

  const df = new DateFormatter("es-MX", { dateStyle: "long" });

  let dateValue = $derived.by(() => {
    try {
      return value ? parseDate(value) : undefined;
    } catch {
      return undefined;
    }
  });

  function handleDateChange(v: unknown) {
    // bits-ui in shadcn 0.40/1.x might type this correctly or as string depending on version,
    // assuming v is DateValue.
    if (v) {
        value = (v as DateValue).toString(); // format: YYYY-MM-DD
    } else {
        value = "";
    }
  }
</script>

<!-- Mobile Native Date -->
<Input
  {id}
  type="date"
  bind:value
  class="flex md:hidden h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-base shadow-sm ring-offset-background touch-manipulation"
/>

<!-- Desktop Shadcn Popover Calendar -->
<div class="hidden md:block w-full">
  <Popover.Root>
    <Popover.Trigger
      class={cn(
        buttonVariants({ variant: "outline" }),
        "w-full h-12 justify-start text-left font-normal bg-background text-base",
        !value && "text-muted-foreground"
      )}
    >
      <CalendarIcon class="mr-2 h-4 w-4" />
      {value && dateValue ? df.format(dateValue.toDate(getLocalTimeZone())) : placeholder}
    </Popover.Trigger>
    <Popover.Content class="w-auto p-0" align="start">
      <Calendar 
        type="single" 
        value={dateValue as any} 
        onValueChange={handleDateChange} 
        initialFocus 
      />
    </Popover.Content>
  </Popover.Root>
</div>
