<script lang="ts">
  import { mode, setMode, resetMode } from 'mode-watcher';
  import * as Card from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import SunIcon from "lucide-svelte/icons/sun";
  import MoonIcon from "lucide-svelte/icons/moon";
  import MonitorIcon from "lucide-svelte/icons/monitor";
  
  // Later we can implement i18n toggles here.
</script>

<div class="space-y-6 max-w-3xl mx-auto animate-in fade-in duration-300">
  <div>
    <h1 class="text-3xl font-heading font-bold text-foreground">Preferencias</h1>
    <p class="text-muted-foreground">Configura tu experiencia y visualización del sistema.</p>
  </div>

  <Card.Root>
    <Card.Header>
      <Card.Title>Apariencia</Card.Title>
      <Card.Description>
        Personaliza el tema visual para la aplicación.
      </Card.Description>
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
      <Card.Title>Idioma (Próximamente)</Card.Title>
      <Card.Description>
        Configuración de idioma en progreso mediante Paraglide.
      </Card.Description>
    </Card.Header>
    <Card.Content>
      <p class="text-sm text-muted-foreground">Las traducciones están en desarrollo. El sistema operará temporalmente en Español general.</p>
    </Card.Content>
  </Card.Root>
</div>
