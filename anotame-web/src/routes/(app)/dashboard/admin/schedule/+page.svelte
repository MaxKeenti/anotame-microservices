<script lang="ts">
  import { onMount } from 'svelte';
  import { useAuthGuard } from '$lib/guards/index.svelte';
  import { apiService, API_OPERATIONS } from '$lib/services/api.svelte';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import * as Card from '$lib/components/ui/card';
  import * as Table from '$lib/components/ui/table';
  import * as Form from '$lib/components/ui/form';
  import { AdaptiveDatePicker, adaptiveConfirm } from '$lib/components/ui/responsive';
  import { toast } from 'svelte-sonner';
  import { CalendarDays, AlertTriangle, Trash2, Loader2 } from 'lucide-svelte';
  import { superForm, defaults } from 'sveltekit-superforms';
  import { zod4 } from 'sveltekit-superforms/adapters';
  import { z } from 'zod';
  import * as Tabs from '$lib/components/ui/tabs';
  import * as m from '$lib/paraglide/messages';

  let activeTab = $state<'weekly' | 'holidays'>('weekly');
  const guard = useAuthGuard(true, '/dashboard');
  let isLoading = $state(true);
  let isHolidaySubmitting = $state(false);

  // Data
  let workDays = $state<any[]>([]);
  let holidays = $state<any[]>([]);

  const DAY_KEYS = [
    'schedule.day.monday',
    'schedule.day.tuesday',
    'schedule.day.wednesday',
    'schedule.day.thursday',
    'schedule.day.friday',
    'schedule.day.saturday',
    'schedule.day.sunday',
  ] as const;

  function getDayName(dayOfWeek: number): string {
    const key = DAY_KEYS[dayOfWeek - 1];
    return key ? m[key]() : m['schedule.day.fallback']();
  }

  const holidaySchema = z.object({
    date: z.string().min(1, m['schedule.zod.dateRequired']()),
    description: z.string().min(1, m['schedule.zod.descRequired']()),
  });

  const holidaySuperform = superForm(defaults(zod4(holidaySchema)), {
    id: 'holiday-form',
    SPA: true,
    validators: zod4(holidaySchema),
    async onUpdate({ form: f }) {
      if (!f.valid) return;
      isHolidaySubmitting = true;
      try {
        await apiService.request(`${API_OPERATIONS}/schedule/holidays`, {
          method: 'POST',
          body: JSON.stringify({ date: f.data.date, description: f.data.description }),
        });
        toast.success(m['schedule.holiday.addSuccess']());
        resetHoliday();
        loadData();
      } catch (err: any) {
        toast.error(err.message || m['schedule.holiday.addError']());
      } finally {
        isHolidaySubmitting = false;
      }
    },
  });

  const {
    form: holidayForm,
    enhance: holidayEnhance,
    reset: resetHoliday,
  } = holidaySuperform;

  async function loadData() {
    isLoading = true;
    try {
      const [daysData, holsData] = await Promise.all([
        apiService.request<any[]>(`${API_OPERATIONS}/schedule/config`),
        apiService.request<any[]>(`${API_OPERATIONS}/schedule/holidays`)
      ]);

      workDays = (daysData || []).sort((a, b) => a.dayOfWeek - b.dayOfWeek);
      holidays = (holsData || []).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } catch (err: any) {
      console.warn('Backend endpoint may not exist yet', err);
      toast.error(m['schedule.load.error']());
    } finally {
      isLoading = false;
    }
  }

  onMount(() => {
    loadData();
  });

  async function saveWeeklySchedule() {
    isLoading = true;
    try {
      await apiService.request(`${API_OPERATIONS}/schedule/config`, {
        method: 'PUT',
        body: JSON.stringify(workDays)
      });
      toast.success(m['schedule.save.success']());
    } catch (err: any) {
      toast.error(err.message || m['schedule.save.error']());
    } finally {
      isLoading = false;
    }
  }

  async function handleDeleteHoliday(id: string, desc: string) {
    const ok = await adaptiveConfirm({
      title: m['schedule.holiday.deleteTitle'](),
      description: m['schedule.holiday.deleteDesc']({ desc })
    });

    if (ok) {
      try {
        await apiService.request(`${API_OPERATIONS}/schedule/holidays/${id}`, { method: 'DELETE' });
        toast.success(m['schedule.holiday.deleteSuccess']());
        loadData();
      } catch (err: any) {
        toast.error(err.message || m['schedule.holiday.deleteError']());
      }
    }
  }
</script>

{#if guard.checking}
  <div class="h-64 flex items-center justify-center text-muted-foreground border border-border rounded-xl bg-card">
    {m['schedule.validating']()}
  </div>
{:else if guard.allowed}
<div class="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-300">
  <div class="flex justify-between items-center">
    <h1 class="text-3xl font-heading font-bold text-foreground">{m['schedule.page.title']()}</h1>
  </div>

  <Tabs.Root bind:value={activeTab} class="space-y-6">
    <Tabs.List class="shadow-sm border border-border/50">
      <Tabs.Trigger value="weekly" class="px-6 font-bold flex items-center gap-2">
        <CalendarDays class="w-4 h-4" />
        {m['schedule.tab.weekly']()}
      </Tabs.Trigger>
      <Tabs.Trigger value="holidays" class="px-6 font-bold flex items-center gap-2">
        <AlertTriangle class="w-4 h-4" />
        {m['schedule.tab.holidays']()}
      </Tabs.Trigger>
    </Tabs.List>

    {#if isLoading && workDays.length === 0}
      <div class="h-64 flex items-center justify-center text-muted-foreground border border-border rounded-xl bg-card">
        {m['schedule.loading']()}
      </div>
    {:else}
      <!-- Tab 1: Weekly Schedule -->
      <Tabs.Content value="weekly">
        <Card.Root>
          <Card.Header>
            <Card.Title>{m['schedule.card.weeklyTitle']()}</Card.Title>
            <Card.Description>{m['schedule.card.weeklyDesc']()}</Card.Description>
          </Card.Header>
          <Card.Content class="space-y-2">
            <div class="border rounded-md divide-y divide-border">
              {#each workDays as day, index}
                <div class="flex flex-col sm:flex-row sm:items-center gap-4 p-4 hover:bg-muted/10 transition-colors">
                  <div class="w-40 font-medium capitalize text-foreground flex items-center">
                    <label class="flex items-center gap-3 cursor-pointer touch-manipulation">
                      <input
                        type="checkbox"
                        class="checkbox-custom"
                        bind:checked={day.open}
                      />
                      {getDayName(day.dayOfWeek)}
                    </label>
                  </div>

                  <div class="flex-1 flex flex-wrap items-center gap-3">
                    {#if day.open}
                      <div class="flex items-center gap-3 bg-card border rounded-lg p-2">
                        <Input
                          type="time"
                          bind:value={day.openTime}
                          class="w-32 h-10 shadow-none border-0 bg-transparent text-center px-0 font-mono text-base focus-visible:ring-0"
                        />
                        <span class="text-muted-foreground text-sm font-medium">{m['schedule.label.to']()}</span>
                        <Input
                          type="time"
                          bind:value={day.closeTime}
                          class="w-32 h-10 shadow-none border-0 bg-transparent text-center px-0 font-mono text-base focus-visible:ring-0"
                        />
                      </div>
                    {:else}
                      <span class="text-muted-foreground text-sm px-4 py-2 bg-muted/50 rounded-lg">{m['schedule.label.closed']()}</span>
                    {/if}
                  </div>
                </div>
              {/each}
            </div>

            <div class="flex justify-end pt-6">
              <Button onclick={saveWeeklySchedule} disabled={isLoading} class="h-12 px-6 shadow-sm">
                {isLoading ? m['common.loading']() : m['schedule.button.saveWeekly']()}
              </Button>
            </div>
          </Card.Content>
        </Card.Root>
      </Tabs.Content>

      <!-- Tab 2: Exceptions -->
      <Tabs.Content value="holidays">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">

          <!-- Add Form -->
          <Card.Root class="md:col-span-1 h-fit">
            <Card.Header>
              <Card.Title>{m['schedule.holiday.newTitle']()}</Card.Title>
            </Card.Header>
            <Card.Content>
              <form method="POST" use:holidayEnhance class="space-y-4">
                <Form.Field form={holidaySuperform} name="date">
                  {#snippet children({ constraints })}
                    <Form.Label>{m['schedule.holiday.dateLabel']()}</Form.Label>
                    <AdaptiveDatePicker
                      id="hol-date"
                      bind:value={$holidayForm.date}
                      min={new Date().toISOString().slice(0, 10)}
                      placeholder={m['schedule.holiday.dateLabel']()}
                    />
                    <Form.FieldErrors />
                  {/snippet}
                </Form.Field>
                <Form.Field form={holidaySuperform} name="description">
                  {#snippet children({ constraints })}
                    <Form.Control>
                      {#snippet children({ props })}
                        <Form.Label>{m['schedule.holiday.descLabel']()}</Form.Label>
                        <Input
                          {...props}
                          {...constraints}
                          id="hol-desc"
                          placeholder={m['schedule.holiday.descPlaceholder']()}
                          bind:value={$holidayForm.description}
                          class="h-12"
                        />
                      {/snippet}
                    </Form.Control>
                    <Form.FieldErrors />
                  {/snippet}
                </Form.Field>
                <Button type="submit" disabled={isHolidaySubmitting} class="w-full h-12 shadow-sm">
                  {#if isHolidaySubmitting}
                    <Loader2 class="w-4 h-4 mr-2 animate-spin" />
                    {m['schedule.holiday.adding']()}
                  {:else}
                    {m['schedule.holiday.addButton']()}
                  {/if}
                </Button>
              </form>
            </Card.Content>
          </Card.Root>

          <!-- List Table -->
          <Card.Root class="md:col-span-2">
            <Card.Header>
              <Card.Title>{m['schedule.holiday.listTitle']()}</Card.Title>
              <Card.Description>{m['schedule.holiday.listDesc']()}</Card.Description>
            </Card.Header>
            <Card.Content>
              {#if holidays.length === 0}
                <div class="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg bg-muted/10">
                  <AlertTriangle class="w-8 h-8 mx-auto mb-3 opacity-50" />
                  <p>{m['schedule.holiday.empty']()}</p>
                </div>
              {:else}
                <div class="border rounded-md overflow-x-auto">
                  <Table.Root class="min-w-100">
                    <Table.Header class="bg-secondary/20">
                      <Table.Row>
                        <Table.Head class="p-4 w-40">{m['schedule.holiday.colDate']()}</Table.Head>
                        <Table.Head class="p-4">{m['schedule.holiday.colDesc']()}</Table.Head>
                        <Table.Head class="p-4 text-right">{m['schedule.holiday.colActions']()}</Table.Head>
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      {#each holidays as h}
                        <Table.Row class="hover:bg-muted/30">
                          <Table.Cell class="p-4 font-medium tabular-nums">
                            {new Date(h.date).toLocaleDateString('es-ES', {
                              weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
                            })}
                          </Table.Cell>
                          <Table.Cell class="p-4 text-muted-foreground">
                            {h.description}
                          </Table.Cell>
                          <Table.Cell class="p-4 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              class="text-destructive hover:bg-destructive/10 hover:text-destructive h-9 touch-manipulation"
                              onclick={() => h.id && handleDeleteHoliday(h.id, h.description)}
                            >
                              <Trash2 class="w-4 h-4" />
                              <span class="sr-only">{m['common.delete']()}</span>
                            </Button>
                          </Table.Cell>
                        </Table.Row>
                      {/each}
                    </Table.Body>
                  </Table.Root>
                </div>
              {/if}
            </Card.Content>
          </Card.Root>
        </div>
      </Tabs.Content>
    {/if}
  </Tabs.Root>
</div>
{/if}
