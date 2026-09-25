<script lang="ts">
  import SearchIcon from '@lucide/svelte/icons/search';
  import CheckIcon from '@lucide/svelte/icons/check';
  import logoUrl from '$lib/assets/favicon.svg';
  import * as Menubar from '$lib/components/ui/menubar';
  import { Button } from '$lib/components/ui/button';
  import { Kbd } from '$lib/components/ui/kbd';
  import { home, launchpad, openHref, resolveApp, visibleApps } from '$lib/config/apps';
  import { navigate } from '$lib/desktop/navigate';
  import { currentPathname } from '$lib/desktop/location.svelte';
  import { windowsStore, type TileLayout } from '$lib/desktop/windows.svelte';
  import { authService } from '$lib/services/auth.svelte';
  import { appSessionStore } from '$lib/stores/app-session.svelte';
  import { commandPaletteStore } from '$lib/stores/command-palette.svelte';
  import { launchpadStore } from '$lib/stores/launchpad.svelte';
  import { getIntlLocale } from '$lib/utils/formatUtils';
  import * as m from '$lib/paraglide/messages';

  /**
   * macOS-style menu bar across the top of the shell (tablet and up): the logo
   * menu, the current app's sections, a "Go" menu of every app, search, the
   * clock, and the account menu.
   */
  interface Props {
    /** Opens the credentials dialog for the signed-in user. */
    onOpenProfile: () => void;
    /** The screen is wide enough for windows, so offer the toggle. */
    canUseWindows: boolean;
  }

  let { onOpenProfile, canUseWindows }: Props = $props();

  const user = $derived(authService.user);
  const entries = $derived(visibleApps(user?.role === 'ADMIN'));
  const current = $derived(resolveApp(currentPathname()));
  const currentEntry = $derived(entries.find((e) => e.app.key === current?.app.key));

  const focusedWindow = $derived(windowsStore.active ? windowsStore.focused : undefined);

  /** The Window menu's Move & Resize choices, in macOS order. */
  const moveResize: { group: () => string; items: { layout: TileLayout; label: () => string }[] }[] = [
    {
      group: () => m['menubar.window.halves'](),
      items: [
        { layout: 'left', label: () => m['menubar.window.left']() },
        { layout: 'right', label: () => m['menubar.window.right']() },
        { layout: 'top', label: () => m['menubar.window.top']() },
        { layout: 'bottom', label: () => m['menubar.window.bottom']() },
      ],
    },
    {
      group: () => m['menubar.window.quarters'](),
      items: [
        { layout: 'top-left', label: () => m['menubar.window.topLeft']() },
        { layout: 'top-right', label: () => m['menubar.window.topRight']() },
        { layout: 'bottom-left', label: () => m['menubar.window.bottomLeft']() },
        { layout: 'bottom-right', label: () => m['menubar.window.bottomRight']() },
      ],
    },
  ];

  const HomeIcon = home.icon;
  const LaunchpadIcon = launchpad.icon;

  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.userAgent);
  const shortcutKey = isMac ? '⌘' : 'Ctrl';

  let now = $state(new Date());
  $effect(() => {
    const timer = setInterval(() => (now = new Date()), 15_000);
    return () => clearInterval(timer);
  });
  const clock = $derived(
    new Intl.DateTimeFormat(getIntlLocale(), {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(now)
  );
</script>

<header
  class="hidden h-12 shrink-0 items-center justify-between gap-4 border-b border-border/60 bg-background/80 px-2 backdrop-blur-xl md:flex"
>
  <Menubar.Root class="h-auto border-0 bg-transparent p-0 shadow-none">
    <!-- Logo menu, like the Apple menu -->
    <Menubar.Menu>
      <Menubar.Trigger class="min-h-11 px-2" aria-label={m['common.appName']()}>
        <img src={logoUrl} alt="" class="size-6 rounded-md" />
      </Menubar.Trigger>
      <Menubar.Content>
        <Menubar.Item class="min-h-11" onSelect={() => navigate(home.href)}>
          <HomeIcon aria-hidden="true" />
          {home.getName()}
        </Menubar.Item>
        <Menubar.Item class="min-h-11" onSelect={() => (launchpadStore.open = true)}>
          <LaunchpadIcon aria-hidden="true" />
          {launchpad.getName()}
        </Menubar.Item>
        <Menubar.Item class="min-h-11" onSelect={() => (commandPaletteStore.open = true)}>
          <SearchIcon aria-hidden="true" />
          {m['palette.trigger.label']()}
          <Menubar.Shortcut>{shortcutKey} K</Menubar.Shortcut>
        </Menubar.Item>
        {#if canUseWindows}
          <Menubar.Separator />
          <Menubar.CheckboxItem
            class="min-h-11"
            checked={windowsStore.enabled}
            onCheckedChange={(value) => (windowsStore.enabled = value)}
          >
            {m['menubar.windows.toggle']()}
          </Menubar.CheckboxItem>
        {/if}
      </Menubar.Content>
    </Menubar.Menu>

    <!-- The current app, listing its sections -->
    <Menubar.Menu>
      <Menubar.Trigger class="min-h-11 px-3 font-bold">
        {currentEntry ? currentEntry.app.getName() : home.getName()}
      </Menubar.Trigger>
      <Menubar.Content>
        {#if currentEntry}
          {#each currentEntry.sections as section (section.key)}
            {@const Icon = section.icon}
            <Menubar.Item class="min-h-11" onSelect={() => navigate(section.href, { fromAppKey: currentEntry.app.key })}>
              <Icon aria-hidden="true" />
              {section.getName()}
              {#if section.key === current?.section.key}
                <CheckIcon class="ml-auto" aria-hidden="true" />
              {/if}
            </Menubar.Item>
          {/each}
        {:else}
          <Menubar.Item class="min-h-11" onSelect={() => (launchpadStore.open = true)}>
            <LaunchpadIcon aria-hidden="true" />
            {launchpad.getName()}
          </Menubar.Item>
        {/if}
      </Menubar.Content>
    </Menubar.Menu>

    <!-- Every app, like Finder's Go menu -->
    <Menubar.Menu>
      <Menubar.Trigger class="min-h-11 px-3">{m['menubar.go.label']()}</Menubar.Trigger>
      <Menubar.Content>
        {#each entries as entry (entry.app.key)}
          {@const Icon = entry.app.icon}
          <Menubar.Item
            class="min-h-11"
            onSelect={() => navigate(openHref(entry, appSessionStore.lastSection[entry.app.key]))}
          >
            <Icon aria-hidden="true" />
            {entry.app.getName()}
          </Menubar.Item>
        {/each}
      </Menubar.Content>
    </Menubar.Menu>
    <!-- The focused window, like macOS's Window menu; on tablets this is how
         windows are sized, since edge resizing needs a mouse. -->
    {#if windowsStore.active}
      <Menubar.Menu>
        <Menubar.Trigger class="min-h-11 px-3">{m['menubar.window.label']()}</Menubar.Trigger>
        <Menubar.Content>
          {#if focusedWindow}
            {@const key = focusedWindow.appKey}
            <Menubar.Item class="min-h-11" onSelect={() => windowsStore.minimize(key)}>
              {m['desktop.window.minimize']()}
            </Menubar.Item>
            <Menubar.Item class="min-h-11" onSelect={() => windowsStore.toggleMaximize(key)}>
              {m['menubar.window.zoom']()}
            </Menubar.Item>
            <Menubar.Separator />
            <Menubar.Item class="min-h-11" onSelect={() => windowsStore.tile(key, 'fill')}>
              {m['menubar.window.fill']()}
            </Menubar.Item>
            <Menubar.Item class="min-h-11" onSelect={() => windowsStore.tile(key, 'center')}>
              {m['menubar.window.center']()}
            </Menubar.Item>
            <Menubar.Sub>
              <Menubar.SubTrigger class="min-h-11">{m['menubar.window.moveResize']()}</Menubar.SubTrigger>
              <Menubar.SubContent>
                {#each moveResize as section, i (i)}
                  {#if i > 0}<Menubar.Separator />{/if}
                  <Menubar.Label>{section.group()}</Menubar.Label>
                  {#each section.items as item (item.layout)}
                    <Menubar.Item class="min-h-11" onSelect={() => windowsStore.tile(key, item.layout)}>
                      {item.label()}
                    </Menubar.Item>
                  {/each}
                {/each}
              </Menubar.SubContent>
            </Menubar.Sub>
            <Menubar.Separator />
          {/if}
          <Menubar.Item class="min-h-11" onSelect={() => windowsStore.bringAllToFront()}>
            {m['menubar.window.bringAllToFront']()}
          </Menubar.Item>
          {#if focusedWindow}
            {@const key = focusedWindow.appKey}
            <Menubar.Item class="min-h-11" onSelect={() => windowsStore.close(key)}>
              {m['desktop.window.close']()}
            </Menubar.Item>
          {/if}
        </Menubar.Content>
      </Menubar.Menu>
    {/if}
  </Menubar.Root>

  <div class="flex items-center gap-1">
    <Button variant="ghost" size="touch" onclick={() => (commandPaletteStore.open = true)}>
      <SearchIcon aria-hidden="true" />
      {m['palette.trigger.label']()}
      <Kbd>{shortcutKey} K</Kbd>
    </Button>

    <span class="px-2 text-sm text-muted-foreground tabular-nums first-letter:uppercase">{clock}</span>

    <Menubar.Root class="h-auto border-0 bg-transparent p-0 shadow-none">
      <Menubar.Menu>
        <Menubar.Trigger class="min-h-11 px-3">{user?.username || m['common.user']()}</Menubar.Trigger>
        <Menubar.Content align="end">
          <Menubar.Item class="min-h-11" onSelect={onOpenProfile}>
            {m['nav.menu.editCredentials']()}
          </Menubar.Item>
          <Menubar.Separator />
          <Menubar.Item class="min-h-11" variant="destructive" onSelect={() => authService.logout()}>
            {m['nav.menu.logout']()}
          </Menubar.Item>
        </Menubar.Content>
      </Menubar.Menu>
    </Menubar.Root>
  </div>
</header>
