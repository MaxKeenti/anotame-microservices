<script lang="ts">
  import { onMount } from 'svelte';
  import { FormField, PageHeader, StatePanel } from '$lib/components/common';
  import { apiService, API_OPERATIONS } from '$lib/services/api.svelte';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import * as Card from '$lib/components/ui/card';
  import * as Select from '$lib/components/ui/select';
  import { toast } from 'svelte-sonner';
  import { Store, ReceiptText, Palette, Sliders } from '@lucide/svelte';
  import { superForm, defaults } from 'sveltekit-superforms';
  import { zod4 } from 'sveltekit-superforms/adapters';
  import { z } from 'zod';
  import * as m from '$lib/paraglide/messages';

  let { data } = $props();

  const settingsSchema = z.object({
    name: z.string().min(1, m['adminSettings.zod.nameRequired']()),
    ownerName: z.string().optional().or(z.literal('')),
    dailyCapacityMinutes: z.number().min(1, m['adminSettings.zod.minCapacity']()),
    rfc: z.string().optional().or(z.literal('')),
    regime: z.string().optional().or(z.literal('')),
    address: z.string().optional().or(z.literal('')),
    contactPhone: z.string().optional().or(z.literal('')),
    primaryColor: z.string()
      .regex(/^#[0-9A-Fa-f]{6}$/, m['adminSettings.zod.colorFormat']())
      .nullable()
      .optional()
      .or(z.literal('')),
    fontFamily: z.enum(['Inter', 'Outfit', 'Merriweather'])
      .nullable()
      .optional()
      .or(z.literal('')),
    capacityThresholdGreen: z.number().min(1).max(100).default(50),
    capacityThresholdAmber: z.number().min(1).max(100).default(85),
    atRiskDaysThreshold: z.number().min(1).default(60),
  });

  let isLoading = $state(true);
  let isSaving = $state(false);

  const { form, enhance, errors, reset } = superForm(defaults(zod4(settingsSchema)), {
    id: 'settings-form',
    SPA: true,
    validators: zod4(settingsSchema),
    async onUpdate({ form: f }) {
      if (!f.valid) return;
      isSaving = true;
      try {
        const payload = {
          name: f.data.name,
          ownerName: f.data.ownerName || '',
          dailyCapacityMinutes: f.data.dailyCapacityMinutes,
          taxInfo: JSON.stringify({
            rfc: f.data.rfc || '',
            regime: f.data.regime || '',
            address: f.data.address || '',
            contactPhone: f.data.contactPhone || '',
          }),
          primaryColor: f.data.primaryColor || null,
          fontFamily: f.data.fontFamily || null,
          capacityThresholdGreen: f.data.capacityThresholdGreen,
          capacityThresholdAmber: f.data.capacityThresholdAmber,
          atRiskDaysThreshold: f.data.atRiskDaysThreshold,
        };
        await apiService.request(`${API_OPERATIONS}/establishment`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        toast.success(m['adminSettings.save.success']());
      } catch (err: any) {
        toast.error(err.message || m['adminSettings.save.error']());
      } finally {
        isSaving = false;
      }
    },
  });

  onMount(async () => {
    try {
      const data = await apiService.request<any>(`${API_OPERATIONS}/establishment`);
      if (data) {
        let taxData: any = {};
        try { taxData = data.taxInfo ? JSON.parse(data.taxInfo) : {}; } catch {}
        reset({
          data: {
            name: data.name || '',
            ownerName: data.ownerName || '',
            dailyCapacityMinutes: data.dailyCapacityMinutes ?? 480,
            rfc: taxData.rfc || '',
            regime: taxData.regime || '',
            address: taxData.address || '',
            contactPhone: taxData.contactPhone || '',
            primaryColor: data.primaryColor || '',
            fontFamily: data.fontFamily || '',
            capacityThresholdGreen: data.capacityThresholdGreen ?? 50,
            capacityThresholdAmber: data.capacityThresholdAmber ?? 85,
            atRiskDaysThreshold: data.atRiskDaysThreshold ?? 60,
          },
        });
      }
    } catch (err: any) {
      toast.error(err.message || m['adminSettings.load.error']());
    } finally {
      isLoading = false;
    }
  });
</script>

<div class="space-y-6 max-w-3xl mx-auto animate-in fade-in duration-300">
  <PageHeader
    title={m['adminSettings.page.title']()}
    description={m['adminSettings.page.desc']()}
  />

  {#if isLoading}
    <StatePanel message={m['adminSettings.loading']()} />
  {:else}
    <form method="POST" use:enhance class="space-y-6">

      <!-- General Info -->
      <Card.Root>
        <Card.Header>
          <div class="flex items-center gap-2">
            <Store class="w-5 h-5 text-primary" />
            <Card.Title>{m['adminSettings.general.title']()}</Card.Title>
          </div>
          <Card.Description>
            {m['adminSettings.general.desc']()}
          </Card.Description>
        </Card.Header>
        <Card.Content class="space-y-4">
          <FormField label={m['adminSettings.label.name']()} for="est-name" required error={$errors.name}>
            <Input
              id="est-name"
              bind:value={$form.name}
              required
              class="h-12"
              placeholder={m['adminSettings.placeholder.name']()}
            />
          </FormField>
          <FormField label={m['adminSettings.label.owner']()} for="est-owner">
            <Input
              id="est-owner"
              bind:value={$form.ownerName}
              class="h-12"
              placeholder={m["adminSettings.ownerPlaceholder"]()}
            />
          </FormField>
          <FormField label={m['adminSettings.label.capacity']()} for="est-capacity" error={$errors.dailyCapacityMinutes} hint={m['adminSettings.hint.capacity']()}>
            <Input
              id="est-capacity"
              type="number"
              bind:value={$form.dailyCapacityMinutes}
              class="h-12 font-mono"
              placeholder={m["adminSettings.capacityPlaceholder"]()}
            />
          </FormField>
        </Card.Content>
      </Card.Root>

      <!-- Tax Info -->
      <Card.Root>
        <Card.Header>
          <div class="flex items-center gap-2">
            <ReceiptText class="w-5 h-5 text-primary" />
            <Card.Title>{m['adminSettings.tax.title']()}</Card.Title>
          </div>
          <Card.Description>
            {m['adminSettings.tax.desc']()}
          </Card.Description>
        </Card.Header>
        <Card.Content class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label={m['adminSettings.label.rfc']()} for="tax-rfc">
              <Input
                id="tax-rfc"
                bind:value={$form.rfc}
                class="h-12 uppercase"
                placeholder="ABCD123456XYZ"
              />
            </FormField>
            <FormField label={m['adminSettings.label.regime']()} for="tax-regime">
              <Input
                id="tax-regime"
                bind:value={$form.regime}
                class="h-12"
                placeholder={m["adminSettings.regimePlaceholder"]()}
              />
            </FormField>
          </div>
          <FormField label={m['adminSettings.label.address']()} for="tax-address">
            <Input
              id="tax-address"
              bind:value={$form.address}
              class="h-12"
              placeholder={m['adminSettings.placeholder.address']()}
            />
          </FormField>
          <FormField label={m['adminSettings.label.phone']()} for="tax-phone">
            <Input
              id="tax-phone"
              bind:value={$form.contactPhone}
              class="h-12"
              placeholder={m["adminSettings.phonePlaceholder"]()}
            />
          </FormField>
        </Card.Content>
      </Card.Root>

      <!-- Branding & Theme -->
      <Card.Root>
        <Card.Header>
          <div class="flex items-center gap-2">
            <Palette class="w-5 h-5 text-primary" />
            <Card.Title>{m['adminSettings.brand.title']()}</Card.Title>
          </div>
          <Card.Description>
            {m['adminSettings.brand.desc']()}
          </Card.Description>
        </Card.Header>
        <Card.Content class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Brand Color Picker -->
            <FormField label={m['adminSettings.label.color']()} for="brand-color" hint={m["adminSettings.colorHint"]()} error={$errors.primaryColor}>
              <div class="flex items-center gap-3">
                <Input
                  id="brand-color"
                  type="color"
                  bind:value={$form.primaryColor}
                  class="h-12 w-16 cursor-pointer p-1"
                />
                <Input
                  type="text"
                  bind:value={$form.primaryColor}
                  aria-label={m['settings.label.colorHex']({ name: m['adminSettings.label.color']() })}
                  placeholder="#FF6B6B"
                  class="h-12 flex-1 font-mono text-xs"
                />
              </div>
            </FormField>

            <!-- Font Family Dropdown -->
            <FormField label={m['adminSettings.label.font']()} for="font-family" error={$errors.fontFamily}>
              <Select.Root
                type="single"
                value={$form.fontFamily || ''}
                onValueChange={(v) => {
                  $form.fontFamily = (v || '') as 'Inter' | 'Outfit' | 'Merriweather' | '';
                }}
              >
                <Select.Trigger id="font-family" class="h-12">
                  {#if $form.fontFamily}
                    {$form.fontFamily === 'Inter' ? m['adminSettings.font.inter']() : $form.fontFamily === 'Outfit' ? m['adminSettings.font.outfit']() : m['adminSettings.font.merriweather']()}
                  {:else}
                    {m['adminSettings.placeholder.font']()}
                  {/if}
                </Select.Trigger>
                <Select.Content>
                  <Select.Item value="Inter">{m['adminSettings.font.inter']()}</Select.Item>
                  <Select.Item value="Outfit">{m['adminSettings.font.outfit']()}</Select.Item>
                  <Select.Item value="Merriweather">{m['adminSettings.font.merriweather']()}</Select.Item>
                </Select.Content>
              </Select.Root>
            </FormField>
          </div>
        </Card.Content>
      </Card.Root>

      <!-- Threshold Configuration -->
      <Card.Root>
        <Card.Header>
          <div class="flex items-center gap-2">
            <Sliders class="w-5 h-5 text-primary" />
            <Card.Title>{m['adminSettings.threshold.title']()}</Card.Title>
          </div>
          <Card.Description>
            {m['adminSettings.threshold.desc']()}
          </Card.Description>
        </Card.Header>
        <Card.Content class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField label={m['adminSettings.threshold.label.green']()} for="threshold-green" error={$errors.capacityThresholdGreen} hint={m['adminSettings.threshold.hint.green']()}>
              <Input
                id="threshold-green"
                type="number"
                min="1"
                max="100"
                bind:value={$form.capacityThresholdGreen}
                class="h-12 font-mono"
              />
            </FormField>
            <FormField label={m['adminSettings.threshold.label.amber']()} for="threshold-amber" error={$errors.capacityThresholdAmber} hint={m['adminSettings.threshold.hint.amber']()}>
              <Input
                id="threshold-amber"
                type="number"
                min="1"
                max="100"
                bind:value={$form.capacityThresholdAmber}
                class="h-12 font-mono"
              />
            </FormField>
            <FormField label={m['adminSettings.threshold.label.atRisk']()} for="threshold-atrisk" error={$errors.atRiskDaysThreshold} hint={m['adminSettings.threshold.hint.atRisk']()}>
              <Input
                id="threshold-atrisk"
                type="number"
                min="1"
                bind:value={$form.atRiskDaysThreshold}
                class="h-12 font-mono"
              />
            </FormField>
          </div>
        </Card.Content>
      </Card.Root>

      <div class="flex justify-end gap-4 pt-4">
        <Button
          variant="outline"
          type="button"
          class="h-12 px-6 touch-manipulation font-medium"
          href="/dashboard"
        >
          {m['common.cancel']()}
        </Button>
        <Button
          type="submit"
          disabled={isSaving}
          class="h-12 px-8 touch-manipulation font-medium shadow-sm"
        >
          {isSaving ? m['adminSettings.button.saving']() : m['adminSettings.button.save']()}
        </Button>
      </div>
    </form>
  {/if}
</div>
