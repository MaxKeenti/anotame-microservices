<script lang="ts">
  import { mode, setMode, resetMode } from 'mode-watcher';
  import ColorRow from '$lib/components/settings/color-row.svelte';
  import PageSizeOption from '$lib/components/settings/page-size-option.svelte';
  import { HintText, PageContainer } from '$lib/components/common';
  import { Separator } from '$lib/components/ui/separator';
  import { PageHeader } from '$lib/components/common';
  import * as Card from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import * as ToggleGroup from '$lib/components/ui/toggle-group';
  import SunIcon from '@lucide/svelte/icons/sun';
  import MoonIcon from '@lucide/svelte/icons/moon';
  import MonitorIcon from '@lucide/svelte/icons/monitor';
  import GlobeIcon from '@lucide/svelte/icons/globe';
  import { paletteStore, type UserPalette } from '$lib/stores/palette.svelte';
  import { tablePreferences, PAGE_SIZE_OPTIONS } from '$lib/stores/table-preferences.svelte';
  import * as m from '$lib/paraglide/messages';
  import { getLocale, setLocale } from '$lib/paraglide/runtime';
  import { authService } from '$lib/services/auth.svelte';
  import { invalidateAll } from '$app/navigation';
  import { toast } from 'svelte-sonner';

  type ColorKey = keyof UserPalette;

  const colorEntries: { key: ColorKey; label: () => string; defaultHex: string }[] = [
    { key: 'primary',     label: () => m["settings.palette.colorPrimary"](),   defaultHex: '#303030' },
    { key: 'accent',      label: () => m["settings.palette.colorAccent"](),     defaultHex: '#f5f5f5' },
    { key: 'destructive', label: () => m["settings.palette.colorDestructive"](), defaultHex: '#dc2626' },
  ];

  function normalizeHex(raw: string): string | null {
    const clean = raw.trim().replace(/^#/, '');
    return /^[0-9a-fA-F]{6}$/.test(clean) ? `#${clean}` : null;
  }

  function handleInput(key: ColorKey, raw: string) {
    const hex = normalizeHex(raw);
    if (hex) paletteStore.set({ [key]: hex });
    else if (raw === '' || raw === '#') paletteStore.set({ [key]: null });
  }

  function previewColor(key: ColorKey): string {
    return paletteStore.current[key] ?? colorEntries.find((e) => e.key === key)!.defaultHex;
  }

  let changingLocale = $state(false);

  async function handleLocaleChange(newLocale: string) {
    if (newLocale === getLocale()) return;
    changingLocale = true;
    try {
      await authService.changeLocale(newLocale);
      // Paraglide soft swap — update locale without full page reload
      setLocale(newLocale as 'es' | 'en', { reload: false });
      await invalidateAll();
      toast.success(newLocale === 'en' ? m["settings.toast.localeChangedEn"]() : m["settings.toast.localeChangedEs"]());
    } catch (e: any) {
      toast.error(e.message || m["settings.toast.localeError"]());
    } finally {
      changingLocale = false;
    }
  }
</script>

<PageContainer width="narrow">
  <PageHeader
    title={m["settings.page.title"]()}
    description={m["settings.page.description"]()}
  />

  <Card.Root>
    <Card.Header>
      <Card.Title>{m["settings.appearance.title"]()}</Card.Title>
      <Card.Description>{m["settings.appearance.description"]()}</Card.Description>
    </Card.Header>
    <Card.Content>
      <ToggleGroup.Root
        type="single"
        variant="segmented"
        size="tile-lg"
        spacing={4}
        aria-label={m["settings.appearance.title"]()}
        value={mode.current ?? 'system'}
        onValueChange={(v) => {
          if (v === 'system') resetMode();
          else if (v === 'light' || v === 'dark') setMode(v);
        }}
        class="grid w-full grid-cols-1 sm:grid-cols-3"
      >
        <ToggleGroup.Item value="light"><SunIcon />{m["settings.theme.light"]()}</ToggleGroup.Item>
        <ToggleGroup.Item value="dark"><MoonIcon />{m["settings.theme.dark"]()}</ToggleGroup.Item>
        <ToggleGroup.Item value="system"><MonitorIcon />{m["settings.theme.system"]()}</ToggleGroup.Item>
      </ToggleGroup.Root>
    </Card.Content>
  </Card.Root>

  <Card.Root>
    <Card.Header>
      <Card.Title>{m["settings.palette.title"]()}</Card.Title>
      <Card.Description>
        {m["settings.palette.desc"]()}
      </Card.Description>
    </Card.Header>
    <Card.Content class="space-y-4">
      {#each colorEntries as { key, label, defaultHex }}
        <ColorRow
          label={label()}
          preview={previewColor(key)}
          value={paletteStore.current[key] ?? ''}
          placeholder={defaultHex}
          onInput={(v) => handleInput(key, v)}
          onReset={() => paletteStore.set({ [key]: null })}
        />
      {/each}

      {#if paletteStore.hasCustom()}
        <Separator />
        <div>
          <Button variant="outline" size="sm" onclick={() => paletteStore.reset()}>
            {m["settings.palette.restoreAll"]()}
          </Button>
        </div>
      {/if}
    </Card.Content>
  </Card.Root>

  <Card.Root>
    <Card.Header>
      <Card.Title>{m["settings.table.title"]()}</Card.Title>
      <Card.Description>{m["settings.table.desc"]()}</Card.Description>
    </Card.Header>
    <Card.Content class="space-y-3">
      <ToggleGroup.Root
        type="single"
        variant="segmented"
        size="tile-lg"
        spacing={3}
        aria-label={m["settings.table.title"]()}
        value={String(tablePreferences.pageSize)}
        onValueChange={(v) => v && tablePreferences.setPageSize(Number(v))}
        class="grid w-full grid-cols-4"
      >
        {#each PAGE_SIZE_OPTIONS as size (size)}
          <ToggleGroup.Item value={String(size)}>
            <PageSizeOption {size} />
          </ToggleGroup.Item>
        {/each}
      </ToggleGroup.Root>
      <HintText text={m["settings.table.changesApply"]()} />
    </Card.Content>
  </Card.Root>

  <Card.Root>
    <Card.Header>
      <Card.Title>{m["settings.language.title"]()}</Card.Title>
      <Card.Description>{m["settings.language.description"]()}</Card.Description>
    </Card.Header>
    <Card.Content>
      <ToggleGroup.Root
        type="single"
        variant="segmented"
        size="tile-lg"
        spacing={4}
        aria-label={m["settings.language.title"]()}
        disabled={changingLocale}
        value={getLocale()}
        onValueChange={(v) => v && handleLocaleChange(v)}
        class="grid w-full grid-cols-1 sm:grid-cols-2"
      >
        <ToggleGroup.Item value="es"><GlobeIcon />{m["settings.locale.spanish"]()}</ToggleGroup.Item>
        <ToggleGroup.Item value="en"><GlobeIcon />{m["settings.locale.english"]()}</ToggleGroup.Item>
      </ToggleGroup.Root>
    </Card.Content>
  </Card.Root>
</PageContainer>
