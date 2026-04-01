<script lang="ts">
  import { mode, setMode, resetMode } from 'mode-watcher';
  import * as Card from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import SunIcon from 'lucide-svelte/icons/sun';
  import MoonIcon from 'lucide-svelte/icons/moon';
  import MonitorIcon from 'lucide-svelte/icons/monitor';
  import { paletteStore, type UserPalette } from '$lib/stores/palette.svelte';

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
</script>

<div class="space-y-6 max-w-3xl mx-auto animate-in fade-in duration-300">
  <div>
    <h1 class="text-3xl font-heading font-bold text-foreground">Preferencias</h1>
    <p class="text-muted-foreground">Configura tu experiencia y visualización del sistema.</p>
  </div>

  <Card.Root>
    <Card.Header>
      <Card.Title>Apariencia</Card.Title>
      <Card.Description>Personaliza el tema visual para la aplicación.</Card.Description>
    </Card.Header>
    <Card.Content>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Button
          variant={mode.current === 'light' ? 'default' : 'outline'}
          class="h-24 flex flex-col gap-2 touch-manipulation"
          onclick={() => setMode('light')}
        >
          <SunIcon class="w-6 h-6" />
          Claro
        </Button>
        <Button
          variant={mode.current === 'dark' ? 'default' : 'outline'}
          class="h-24 flex flex-col gap-2 touch-manipulation"
          onclick={() => setMode('dark')}
        >
          <MoonIcon class="w-6 h-6" />
          Oscuro
        </Button>
        <Button
          variant={mode.current === undefined ? 'default' : 'outline'}
          class="h-24 flex flex-col gap-2 touch-manipulation"
          onclick={() => resetMode()}
        >
          <MonitorIcon class="w-6 h-6" />
          Sistema
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
      <Card.Title>Idioma (Próximamente)</Card.Title>
      <Card.Description>Configuración de idioma en progreso mediante Paraglide.</Card.Description>
    </Card.Header>
    <Card.Content>
      <p class="text-sm text-muted-foreground">Las traducciones están en desarrollo. El sistema operará temporalmente en Español general.</p>
    </Card.Content>
  </Card.Root>
</div>
