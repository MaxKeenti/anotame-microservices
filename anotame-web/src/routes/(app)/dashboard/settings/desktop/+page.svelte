<script lang="ts">
  import { PageContainer, PageHeader, CheckboxField } from '$lib/components/common';
  import * as Card from '$lib/components/ui/card';
  import WallpaperPicker from '$lib/components/settings/wallpaper-picker.svelte';
  import { windowsStore } from '$lib/desktop/windows.svelte';
  import * as m from '$lib/paraglide/messages';
</script>

<PageContainer width="narrow">
  <PageHeader title={m['nav.desktop.name']()} description={m['desktopSettings.page.description']()} />

  <WallpaperPicker />

  <Card.Root>
    <Card.Header>
      <Card.Title>{m['desktopSettings.windows.title']()}</Card.Title>
      <Card.Description>{m['desktopSettings.windows.description']()}</Card.Description>
    </Card.Header>
    <Card.Content>
      <CheckboxField
        id="desktop-windows"
        label={m['menubar.windows.toggle']()}
        description={m['desktopSettings.windows.hint']()}
        checked={windowsStore.enabled}
        onCheckedChange={(checked) => (windowsStore.enabled = checked)}
      />
    </Card.Content>
  </Card.Root>
</PageContainer>
