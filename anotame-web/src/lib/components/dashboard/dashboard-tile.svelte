<script lang="ts">
  import NavLink from '$lib/components/common/nav-link.svelte';
  import IconMedallion from '$lib/components/common/icon-medallion.svelte';
  import { Heading, Text } from '$lib/components/ui/typography';
  import type { menuItems } from '$lib/config/menu';

  type MenuEntry = (typeof menuItems)[number];

  /** Large touch target linking to a section from the dashboard home grid. */
  interface Props {
    item: MenuEntry;
  }

  let { item }: Props = $props();

  const Icon = $derived(item.icon);
</script>

<NavLink href={item.href} variant="card" class="flex h-full flex-col items-center gap-4 p-6 text-center md:p-8">
  <IconMedallion class="transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
    <Icon />
  </IconMedallion>
  <div>
    <Heading level={2}>{item.getName()}</Heading>
    <Text variant="muted" class="mt-2">{item.getDescription()}</Text>
  </div>
</NavLink>
