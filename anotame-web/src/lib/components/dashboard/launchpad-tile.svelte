<script lang="ts">
  import NavLink from '$lib/components/common/nav-link.svelte';
  import IconMedallion from '$lib/components/common/icon-medallion.svelte';
  import { Heading, Text } from '$lib/components/ui/typography';
  import type { VisibleApp } from '$lib/config/apps';

  /** Large touch target opening an app from the Launchpad. */
  interface Props {
    entry: VisibleApp;
    /** Where the app opens: its last-visited section, or its first. */
    href: string;
    /** Runs on open, e.g. to close the Launchpad overlay. */
    onclick?: () => void;
  }

  let { entry, href, onclick }: Props = $props();

  const Icon = $derived(entry.app.icon);
  // The sections double as the description, so it always matches the user's
  // role; a single-section app would only repeat its name, so it describes that section.
  const description = $derived(
    entry.sections.length === 1
      ? entry.sections[0].getDescription()
      : entry.sections.map((section) => section.getName()).join(' · ')
  );
</script>

<NavLink {href} {onclick} variant="card" class="flex h-full flex-col items-center gap-3 p-4 text-center sm:gap-4 sm:p-6 md:p-8">
  <IconMedallion class="transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
    <Icon />
  </IconMedallion>
  <div>
    <Heading level={2}>{entry.app.getName()}</Heading>
    <!-- Phones get an icon grid, like the macOS Launchpad; the sections show from sm up. -->
    <Text variant="muted" class="mt-2 hidden sm:block">{description}</Text>
  </div>
</NavLink>
