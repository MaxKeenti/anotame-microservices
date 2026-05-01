<script lang="ts">
  import { onMount } from 'svelte';
  import { apiService, API_OPERATIONS } from '$lib/services/api.svelte';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import * as Card from '$lib/components/ui/card';
  import * as Select from '$lib/components/ui/select';
  import { toast } from 'svelte-sonner';
  import { Store, ReceiptText, Palette } from 'lucide-svelte';
  import { superForm, defaults } from 'sveltekit-superforms';
  import { zod4 } from 'sveltekit-superforms/adapters';
  import { z } from 'zod';
  import * as m from '$lib/paraglide/messages';

  let { data } = $props();

  const settingsSchema = z.object({
    name: z.string().min(1, m["adminSettings.zodNameRequired"]()),
    ownerName: z.string().optional().or(z.literal('')),
    dailyCapacityMinutes: z.number().min(1, m["adminSettings.zodCapacityMin"]()),
    rfc: z.string().optional().or(z.literal('')),
    regime: z.string().optional().or(z.literal('')),
    address: z.string().optional().or(z.literal('')),
    contactPhone: z.string().optional().or(z.literal('')),
    primaryColor: z.string()
      .regex(/^#[0-9A-Fa-f]{6}$/, m["adminSettings.zodColorFormat"]())
      .nullable()
      .optional()
      .or(z.literal('')),
    fontFamily: z.enum(['Inter', 'Outfit', 'Merriweather'])
      .nullable()
      .optional()
      .or(z.literal('')),
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
        };
        await apiService.request(`${API_OPERATIONS}/establishment`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        toast.success(m["adminSettings.saveSuccess"]());
      } catch (err: any) {
        toast.error(err.message || m["adminSettings.saveError"]());
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
          },
        });
      }
    } catch (err: any) {
      toast.error(err.message || m["adminSettings.loadError"]());
    } finally {
      isLoading = false;
    }
  });
</script>

<div class="space-y-6 max-w-3xl mx-auto animate-in fade-in duration-300">
  <div>
    <h1 class="text-3xl font-heading font-bold text-foreground">{m["adminSettings.title"]()}</h1>
    <p class="text-muted-foreground">{m["adminSettings.description"]()}</p>
  </div>

  {#if isLoading}
    <div class="h-64 flex items-center justify-center text-muted-foreground border border-border rounded-xl bg-card">
      {m["adminSettings.loading"]()}
    </div>
  {:else}
    <form method="POST" use:enhance class="space-y-6">

      <!-- General Info -->
      <Card.Root>
        <Card.Header>
          <div class="flex items-center gap-2">
            <Store class="w-5 h-5 text-primary" />
            <Card.Title>{m["adminSettings.generalCardTitle"]()}</Card.Title>
          </div>
          <Card.Description>
            {m["adminSettings.generalCardDesc"]()}
          </Card.Description>
        </Card.Header>
        <Card.Content class="space-y-4">
          <div class="space-y-2">
            <label for="est-name" class="text-sm font-medium">{m["adminSettings.nameLabel"]()} <span class="text-destructive">*</span></label>
            <Input
              id="est-name"
              bind:value={$form.name}
              required
              class="h-12"
              placeholder={m["adminSettings.namePlaceholder"]()}
            />
            {#if $errors.name}<span class="text-xs text-destructive">{$errors.name}</span>{/if}
          </div>
          <div class="space-y-2">
            <label for="est-owner" class="text-sm font-medium">{m["adminSettings.ownerLabel"]()}</label>
            <Input
              id="est-owner"
              bind:value={$form.ownerName}
              class="h-12"
              placeholder={m["adminSettings.ownerPlaceholder"]()}
            />
          </div>
          <div class="space-y-2">
            <label for="est-capacity" class="text-sm font-medium">{m["adminSettings.capacityLabel"]()}</label>
            <Input
              id="est-capacity"
              type="number"
              bind:value={$form.dailyCapacityMinutes}
              class="h-12 font-mono"
              placeholder={m["adminSettings.capacityPlaceholder"]()}
            />
            {#if $errors.dailyCapacityMinutes}<span class="text-xs text-destructive">{$errors.dailyCapacityMinutes}</span>{/if}
            <p class="text-xs text-muted-foreground">{m["adminSettings.capacityHint"]()}</p>
          </div>
        </Card.Content>
      </Card.Root>

      <!-- Tax Info -->
      <Card.Root>
        <Card.Header>
          <div class="flex items-center gap-2">
            <ReceiptText class="w-5 h-5 text-primary" />
            <Card.Title>{m["adminSettings.taxCardTitle"]()}</Card.Title>
          </div>
          <Card.Description>
            {m["adminSettings.taxCardDesc"]()}
          </Card.Description>
        </Card.Header>
        <Card.Content class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-2">
              <label for="tax-rfc" class="text-sm font-medium">{m["adminSettings.rfcLabel"]()}</label>
              <Input
                id="tax-rfc"
                bind:value={$form.rfc}
                class="h-12 uppercase"
                placeholder="ABCD123456XYZ"
              />
            </div>
            <div class="space-y-2">
              <label for="tax-regime" class="text-sm font-medium">{m["adminSettings.regimeLabel"]()}</label>
              <Input
                id="tax-regime"
                bind:value={$form.regime}
                class="h-12"
                placeholder={m["adminSettings.regimePlaceholder"]()}
              />
            </div>
          </div>
          <div class="space-y-2">
            <label for="tax-address" class="text-sm font-medium">{m["adminSettings.addressLabel"]()}</label>
            <Input
              id="tax-address"
              bind:value={$form.address}
              class="h-12"
              placeholder={m["adminSettings.addressPlaceholder"]()}
            />
          </div>
          <div class="space-y-2">
            <label for="tax-phone" class="text-sm font-medium">{m["adminSettings.phoneLabel"]()}</label>
            <Input
              id="tax-phone"
              bind:value={$form.contactPhone}
              class="h-12"
              placeholder={m["adminSettings.phonePlaceholder"]()}
            />
          </div>
        </Card.Content>
      </Card.Root>

      <!-- Branding & Theme -->
      <Card.Root>
        <Card.Header>
          <div class="flex items-center gap-2">
            <Palette class="w-5 h-5 text-primary" />
            <Card.Title>{m["adminSettings.brandCardTitle"]()}</Card.Title>
          </div>
          <Card.Description>
            {m["adminSettings.brandCardDesc"]()}
          </Card.Description>
        </Card.Header>
        <Card.Content class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Brand Color Picker -->
            <div class="space-y-2">
              <label for="brand-color" class="text-sm font-medium">{m["adminSettings.colorLabel"]()}</label>
              <div class="flex items-center gap-3">
                <input
                  id="brand-color"
                  type="color"
                  bind:value={$form.primaryColor}
                  class="h-12 w-16 border border-input rounded cursor-pointer"
                />
                <input
                  type="text"
                  bind:value={$form.primaryColor}
                  placeholder="#FF6B6B"
                  class="flex-1 h-12 px-3 border border-input rounded text-xs font-mono"
                />
              </div>
              {#if $errors.primaryColor}
                <span class="text-xs text-destructive">{$errors.primaryColor}</span>
              {/if}
              <p class="text-xs text-muted-foreground">{m["adminSettings.colorHint"]()}</p>
            </div>

            <!-- Font Family Dropdown -->
            <div class="space-y-2">
              <label for="font-family" class="text-sm font-medium">{m["adminSettings.fontLabel"]()}</label>
              <Select.Root
                type="single"
                value={$form.fontFamily || ''}
                onValueChange={(v) => {
                  $form.fontFamily = (v || '') as 'Inter' | 'Outfit' | 'Merriweather' | '';
                }}
              >
                <Select.Trigger id="font-family" class="h-12">
                  {#if $form.fontFamily}
                    {$form.fontFamily === 'Inter' ? m["adminSettings.fontInter"]() : $form.fontFamily === 'Outfit' ? m["adminSettings.fontOutfit"]() : m["adminSettings.fontMerriweather"]()}
                  {:else}
                    <span class="text-muted-foreground">{m["adminSettings.fontPlaceholder"]()}</span>
                  {/if}
                </Select.Trigger>
                <Select.Content>
                  <Select.Item value="Inter">{m["adminSettings.fontInter"]()}</Select.Item>
                  <Select.Item value="Outfit">{m["adminSettings.fontOutfit"]()}</Select.Item>
                  <Select.Item value="Merriweather">{m["adminSettings.fontMerriweather"]()}</Select.Item>
                </Select.Content>
              </Select.Root>
              {#if $errors.fontFamily}
                <span class="text-xs text-destructive">{$errors.fontFamily}</span>
              {/if}
            </div>
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
          {m["adminSettings.cancelButton"]()}
        </Button>
        <Button
          type="submit"
          disabled={isSaving}
          class="h-12 px-8 touch-manipulation font-medium shadow-sm"
        >
          {isSaving ? m["adminSettings.savingButton"]() : m["adminSettings.saveButton"]()}
        </Button>
      </div>
    </form>
  {/if}
</div>
