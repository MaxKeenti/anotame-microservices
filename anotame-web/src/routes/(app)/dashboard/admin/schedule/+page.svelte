<script lang="ts">
  import { getIntlLocale } from '$lib/utils/formatUtils';
  import { Spinner } from '$lib/components/ui/spinner';
  import { onMount } from 'svelte';
  import WorkdayRow from '$lib/components/schedule/workday-row.svelte';
  import { PageHeader, StatePanel, TableFrame, PageContainer } from '$lib/components/common';
  import { useAuthGuard } from '$lib/guards/index.svelte';
  import { apiService, API_OPERATIONS } from '$lib/services/api.svelte';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import * as Card from '$lib/components/ui/card';
  import * as Table from '$lib/components/ui/table';
  import * as Form from '$lib/components/ui/form';
  import { AdaptiveDatePicker, adaptiveConfirm } from '$lib/components/ui/responsive';
  import { toast } from 'svelte-sonner';
  import { CalendarDays, AlertTriangle, Trash2 } from '@lucide/svelte';
  import { superForm, defaults } from 'sveltekit-superforms';
  import { zod4 } from 'sveltekit-superforms/adapters';
  import { z } from 'zod';
  import * as Tabs from '$lib/components/ui/tabs';
  import type { WorkDay, Holiday } from '$lib/types/dtos';
  import * as m from '$lib/paraglide/messages';

  let activeTab = $state<'weekly' | 'holidays'>('weekly');
  const guard = useAuthGuard(true, '/dashboard');
  let isLoading = $state(true);
  let isHolidaySubmitting = $state(false);

  // Data
  let workDays = $state<WorkDay[]>([]);
  let holidays = $state<Holiday[]>([]);

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
        apiService.request<WorkDay[]>(`${API_OPERATIONS}/schedule/config`),
        apiService.request<Holiday[]>(`${API_OPERATIONS}/schedule/holidays`)
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
  <StatePanel message={m['schedule.validating']()} />
{:else if guard.allowed}
<PageContainer width="wide">
  <PageHeader title={m['schedule.page.title']()} />

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
      <StatePanel message={m['schedule.loading']()} />
    {:else}
      <!-- Tab 1: Weekly Schedule -->
      <Tabs.Content value="weekly">
        <Card.Root>
          <Card.Header>
            <Card.Title>{m['schedule.card.weeklyTitle']()}</Card.Title>
            <Card.Description>{m['schedule.card.weeklyDesc']()}</Card.Description>
          </Card.Header>
          <Card.Content class="space-y-2">
            <TableFrame class="divide-y divide-border">
              {#each workDays as _, index}
                <WorkdayRow bind:day={workDays[index]} dayName={getDayName(workDays[index].dayOfWeek)} />
              {/each}
            </TableFrame>

            <div class="flex justify-end pt-6">
              <Button size="touch-lg" onclick={saveWeeklySchedule} disabled={isLoading} class="px-6 shadow-sm">
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
                <Button size="touch-lg" type="submit" disabled={isHolidaySubmitting} class="w-full shadow-sm">
                  {#if isHolidaySubmitting}
                    <Spinner data-icon="inline-start" aria-hidden="true" />
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
                <StatePanel message={m['schedule.holiday.empty']()} size="inset" />
              {:else}
                <TableFrame>
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
                            {new Date(h.date).toLocaleDateString(getIntlLocale(), {
                              weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
                            })}
                          </Table.Cell>
                          <Table.Cell class="p-4 text-muted-foreground">
                            {h.description}
                          </Table.Cell>
                          <Table.Cell class="p-4 text-right">
                            <Button
                              variant="destructive-outline"
                              size="icon-touch"
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
                </TableFrame>
              {/if}
            </Card.Content>
          </Card.Root>
        </div>
      </Tabs.Content>
    {/if}
  </Tabs.Root>
</PageContainer>
{/if}
