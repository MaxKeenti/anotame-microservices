<script lang="ts">
  import logoUrl from '$lib/assets/favicon.svg';
  import { launchpad } from '$lib/config/apps';
  import { launchpadStore } from '$lib/stores/launchpad.svelte';
  import { Button } from '$lib/components/ui/button';
  import { Heading, Text } from '$lib/components/ui/typography';
  import * as m from '$lib/paraglide/messages';

  /** Title block of the home page: the logo, a greeting, and a way into the Launchpad. */
  interface Props {
    /** Name of the signed-in user. */
    name: string;
  }

  let { name }: Props = $props();

  const LaunchpadIcon = launchpad.icon;
</script>

<!-- Glass panel, so the greeting stays readable over any wallpaper. -->
<div class="flex flex-col gap-4 rounded-2xl border border-border/60 bg-background/75 p-4 shadow-sm backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
  <div class="flex min-w-0 items-center gap-4">
    <img src={logoUrl} alt={m['common.appName']()} class="size-14 shrink-0 rounded-2xl shadow-sm" />
    <div class="min-w-0">
      <Heading level={1}>{m['home.page.title']({ name })}</Heading>
      <Text variant="muted">{m['home.page.description']()}</Text>
    </div>
  </div>
  <Button size="touch-lg" variant="outline" class="w-full sm:w-auto" onclick={() => (launchpadStore.open = true)}>
    <LaunchpadIcon aria-hidden="true" />
    {m['home.page.openLaunchpad']()}
  </Button>
</div>
