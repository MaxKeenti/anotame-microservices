<script lang="ts">
  import { mode, setMode, resetMode } from 'mode-watcher';
  import * as Card from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import SunIcon from 'lucide-svelte/icons/sun';
  import MoonIcon from 'lucide-svelte/icons/moon';
  import MonitorIcon from 'lucide-svelte/icons/monitor';
  import GlobeIcon from 'lucide-svelte/icons/globe';
  import { paletteStore, type UserPalette } from '$lib/stores/palette.svelte';
  import { tablePreferences, PAGE_SIZE_OPTIONS } from '$lib/stores/table-preferences.svelte';
  import * as m from '$lib/paraglide/messages';
  import { getLocale, setLocale } from '$lib/paraglide/runtime';
  import { authService } from '$lib/services/auth.svelte';
  import { invalidateAll } from '$app/navigation';
  import { toast } from 'svelte-sonner';

  type ColorKey = keyof UserPalette;

  const colorEntries: { key: ColorKey; label: string; defaultHex: string }[] = [
    { key: 'primary',     label: 'Principal',   defaultHex: '#303030' },
    { key: 'accent',      label: 'Acento',      defaultHex: '#f5f5f5' },
    { key: 'destructive', label: 'Destructivo',  defaultHex: '#dc2626' },
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
      toast.success(newLocale === 'en' ? 'Language changed to English' : 'Idioma cambiado a Español');
    } catch (e: any) {
      toast.error(e.message || 'Error al cambiar idioma');
    } finally {
      changingLocale = false;
    }
  }
</script>

<div class="space-y-6 max-w-3xl mx-auto animate-in fade-in duration-300">
  <div>
    <h1 class="text-3xl font-heading font-bold text-foreground">{m["settings.page.title"]()}</h1>
    <p class="text-muted-foreground">{m["settings.page.description"]()}</p>
  </div>

  <Card.Root>
    <Card.Header>
      <Card.Title>{m["settings.appearance.title"]()}</Card.Title>
      <Card.Description>{m["settings.appearance.description"]()}</Card.Description>
    </Card.Header>
    <Card.Content>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Button
          variant={mode.current === 'light' ? 'default' : 'outline'}
          class="h-24 flex flex-col gap-2 touch-manipulation"
          onclick={() => setMode('light')}
        >
          <SunIcon class="w-6 h-6" />
          {m["settings.theme.light"]()}
        </Button>
        <Button
          variant={mode.current === 'dark' ? 'default' : 'outline'}
          class="h-24 flex flex-col gap-2 touch-manipulation"
          onclick={() => setMode('dark')}
        >
          <MoonIcon class="w-6 h-6" />
          {m["settings.theme.dark"]()}
        </Button>
        <Button
          variant={mode.current === undefined ? 'default' : 'outline'}
          class="h-24 flex flex-col gap-2 touch-manipulation"
          onclick={() => resetMode()}
        >
          <MonitorIcon class="w-6 h-6" />
          {m["settings.theme.system"]()}
        </Button>
      </div>
    </Card.Content>
  </Card.Root>

  <Card.Root>
    <Card.Header>
      <Card.Title>Paleta de colores</Card.Title>
      <Card.Description>
        Personaliza los colores principales. Ingresa un valor hexadecimal (#rrggbb). Deja vacío para usar el color predeterminado.
      </Card.Description>
    </Card.Header>
    <Card.Content class="space-y-4">
      {#each colorEntries as { key, label, defaultHex }}
        <div class="flex items-center gap-3">
          <div
            class="w-8 h-8 rounded-full border border-border shrink-0"
            style="background-color: {previewColor(key)}"
          ></div>
          <span class="w-28 text-sm font-medium shrink-0">{label}</span>
          <input
            type="text"
            class="flex-1 h-9 px-3 border border-input rounded-md bg-background text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder={defaultHex}
            value={paletteStore.current[key] ?? ''}
            oninput={(e) => handleInput(key, e.currentTarget.value)}
          />
          {#if paletteStore.current[key]}
            <Button
              variant="ghost"
              size="sm"
              class="shrink-0"
              onclick={() => paletteStore.set({ [key]: null })}
            >
              Restaurar
            </Button>
          {/if}
        </div>
      {/each}

      {#if paletteStore.hasCustom()}
        <div class="pt-2 border-t border-border">
          <Button variant="outline" size="sm" onclick={() => paletteStore.reset()}>
            Restaurar todos los colores
          </Button>
        </div>
      {/if}
    </Card.Content>
  </Card.Root>

  <Card.Root>
    <Card.Header>
      <Card.Title>Tabla</Card.Title>
      <Card.Description>Ajusta cuántas filas se muestran por página en todas las tablas.</Card.Description>
    </Card.Header>
    <Card.Content class="space-y-3">
      <div class="grid grid-cols-4 gap-3">
        {#each PAGE_SIZE_OPTIONS as size (size)}
          <Button
            variant={tablePreferences.pageSize === size ? 'default' : 'outline'}
            class="h-24 flex flex-col gap-2 touch-manipulation"
            onclick={() => tablePreferences.setPageSize(size)}
          >
            <span class="text-2xl font-bold">{size}</span>
            <span class="text-sm">filas</span>
          </Button>
        {/each}
      </div>
      <p class="text-xs text-muted-foreground">Los cambios aplican al recargar la tabla.</p>
    </Card.Content>
  </Card.Root>

  <Card.Root>
    <Card.Header>
      <Card.Title>{m["settings.language.title"]()}</Card.Title>
      <Card.Description>{m["settings.language.description"]()}</Card.Description>
    </Card.Header>
    <Card.Content>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Button
          variant={getLocale() === 'es' ? 'default' : 'outline'}
          class="h-24 flex flex-col gap-2 touch-manipulation"
          disabled={changingLocale}
          onclick={() => handleLocaleChange('es')}
        >
          <GlobeIcon class="w-6 h-6" />
          Español (México)
        </Button>
        <Button
          variant={getLocale() === 'en' ? 'default' : 'outline'}
          class="h-24 flex flex-col gap-2 touch-manipulation"
          disabled={changingLocale}
          onclick={() => handleLocaleChange('en')}
        >
          <GlobeIcon class="w-6 h-6" />
          English
        </Button>
      </div>
    </Card.Content>
  </Card.Root>
</div>
