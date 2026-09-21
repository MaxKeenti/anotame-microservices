<script lang="ts">
  import type { menuItems } from '$lib/config/menu';

  type MenuEntry = (typeof menuItems)[number];

  /** Large touch target linking to a section from the dashboard home grid. */
  interface Props {
    item: MenuEntry;
  }

  let { item }: Props = $props();

  const Icon = $derived(item.icon);
</script>

<a
  href={item.href}
  class="group block rounded-xl outline-none touch-manipulation focus-visible:ring-2 focus-visible:ring-primary"
>
  <div
    class="flex h-full flex-col items-center gap-4 rounded-xl border border-border bg-card p-6 text-center shadow-sm transition-all hover:border-primary/50 hover:shadow-md md:p-8"
  >
    <div
      class="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground"
    >
      <Icon class="h-8 w-8" />
    </div>
    <div>
      <h2 class="font-heading text-xl font-bold">{item.getName()}</h2>
      <p class="mt-2 text-sm text-muted-foreground">{item.getDescription()}</p>
    </div>
  </div>
</a>
