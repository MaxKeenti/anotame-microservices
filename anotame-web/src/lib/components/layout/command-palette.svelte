<script lang="ts">
  import { navigate } from '$lib/desktop/navigate';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import KeyRoundIcon from '@lucide/svelte/icons/key-round';
  import LogOutIcon from '@lucide/svelte/icons/log-out';
  import * as Command from '$lib/components/ui/command';
  import { home, launchpad, openHref, visibleApps } from '$lib/config/apps';
  import { authService } from '$lib/services/auth.svelte';
  import { appSessionStore } from '$lib/stores/app-session.svelte';
  import { commandPaletteStore } from '$lib/stores/command-palette.svelte';
  import { launchpadStore } from '$lib/stores/launchpad.svelte';
  import * as m from '$lib/paraglide/messages';

  /** ⌘K / Ctrl+K search over apps, sections, and quick actions. */
  interface Props {
    /** Opens the credentials dialog for the signed-in user. */
    onOpenProfile: () => void;
  }

  let { onOpenProfile }: Props = $props();

  const entries = $derived(visibleApps(authService.user?.role === 'ADMIN'));
  const HomeIcon = home.icon;
  const LaunchpadIcon = launchpad.icon;

  /** Closes the palette before acting, so a navigation never lands under it. */
  function run(action: () => void) {
    commandPaletteStore.open = false;
    action();
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      commandPaletteStore.toggle();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<Command.Dialog
  bind:open={commandPaletteStore.open}
  title={m['palette.dialog.title']()}
  description={m['palette.dialog.description']()}
>
  <Command.Input placeholder={m['palette.input.placeholder']()} />
  <Command.List class="max-h-96">
    <Command.Empty>{m['palette.empty']()}</Command.Empty>

    <Command.Group heading={m['palette.group.apps']()}>
      <Command.Item value="home" keywords={[home.getName()]} onSelect={() => run(() => navigate(home.href))} class="min-h-11">
        <HomeIcon aria-hidden="true" />
        {home.getName()}
      </Command.Item>
      <Command.Item value="launchpad" keywords={[launchpad.getName()]} onSelect={() => run(() => (launchpadStore.open = true))} class="min-h-11">
        <LaunchpadIcon aria-hidden="true" />
        {launchpad.getName()}
      </Command.Item>
      {#each entries as entry (entry.app.key)}
        {@const Icon = entry.app.icon}
        <Command.Item
          value={`app-${entry.app.key}`}
          keywords={[entry.app.getName()]}
          onSelect={() => run(() => navigate(openHref(entry, appSessionStore.lastSection[entry.app.key])))}
          class="min-h-11"
        >
          <Icon aria-hidden="true" />
          {entry.app.getName()}
        </Command.Item>
      {/each}
    </Command.Group>

    <Command.Separator />

    <Command.Group heading={m['palette.group.sections']()}>
      {#each entries as entry (entry.app.key)}
        {#each entry.sections as section (section.key)}
          {@const Icon = section.icon}
          <Command.Item
            value={`section-${section.key}`}
            keywords={[section.getName(), entry.app.getName(), section.getDescription()]}
            onSelect={() => run(() => navigate(section.href, { fromAppKey: entry.app.key }))}
            class="min-h-11"
          >
            <Icon aria-hidden="true" />
            {section.getName()}
            <Command.Shortcut>{entry.app.getName()}</Command.Shortcut>
          </Command.Item>
        {/each}
      {/each}
    </Command.Group>

    <Command.Separator />

    <Command.Group heading={m['palette.group.actions']()}>
      <Command.Item value="new-order" keywords={[m['palette.action.newOrder']()]} onSelect={() => run(() => navigate('/dashboard/orders/new', { fromAppKey: 'frontDesk' }))} class="min-h-11">
        <PlusIcon aria-hidden="true" />
        {m['palette.action.newOrder']()}
      </Command.Item>
      <Command.Item value="credentials" keywords={[m['nav.menu.editCredentials']()]} onSelect={() => run(onOpenProfile)} class="min-h-11">
        <KeyRoundIcon aria-hidden="true" />
        {m['nav.menu.editCredentials']()}
      </Command.Item>
      <Command.Item value="logout" keywords={[m['nav.menu.logout']()]} onSelect={() => run(() => authService.logout())} class="min-h-11">
        <LogOutIcon aria-hidden="true" />
        {m['nav.menu.logout']()}
      </Command.Item>
    </Command.Group>
  </Command.List>
</Command.Dialog>
