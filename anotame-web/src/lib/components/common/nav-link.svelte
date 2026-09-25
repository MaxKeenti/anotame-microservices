<script lang="ts" module>
  import { tv, type VariantProps } from 'tailwind-variants';

  /**
   * Navigation link shapes. The current state is styled from `data-current`,
   * which is set together with `aria-current`, so what is highlighted and what
   * assistive technology announces can never disagree.
   */
  export const navLinkVariants = tv({
    base: 'touch-manipulation outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50',
    variants: {
      variant: {
        /** Segment in a tab track (see SectionTabs); the current tab lifts onto the card surface. */
        tab: "flex min-h-11 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 text-sm font-semibold text-muted-foreground hover:text-foreground data-[current=true]:bg-card data-[current=true]:text-foreground data-[current=true]:shadow-sm [&_svg:not([class*='size-'])]:size-4",
        /** Row in a vertical table of contents. */
        sidebar:
          'flex min-h-11 items-center rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted/70 hover:text-foreground data-[current=true]:bg-primary/10 data-[current=true]:font-semibold data-[current=true]:text-primary',
        /** Pill in a horizontal, scrollable table of contents. */
        chip: 'inline-flex min-h-11 shrink-0 items-center rounded-full border border-border bg-card px-4 text-sm font-medium text-muted-foreground hover:border-primary/50 hover:text-foreground data-[current=true]:border-primary data-[current=true]:bg-primary data-[current=true]:text-primary-foreground',
        /** Large icon-and-label destination in a grid of sections. */
        tile: "group flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-border bg-card p-8 text-center text-muted-foreground transition-all hover:scale-105 hover:border-primary/50 hover:bg-secondary/50 hover:text-foreground active:scale-95 motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:active:scale-100 data-[current=true]:border-primary data-[current=true]:bg-primary/5 data-[current=true]:text-primary data-[current=true]:shadow-sm [&_svg:not([class*='size-'])]:size-12",
        /** A whole card that navigates, such as a dashboard widget or section tile. */
        card: 'group block rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:border-primary/50 hover:shadow-md',
        /** "Skip to content": hidden until it receives keyboard focus. */
        skip: 'sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-100 focus:rounded-md focus:bg-background focus:px-4 focus:py-3 focus:text-sm focus:font-medium',
      },
    },
  });

  export type NavLinkVariant = VariantProps<typeof navLinkVariants>['variant'];
</script>

<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAnchorAttributes } from 'svelte/elements';
  import { cn } from '$lib/utils';

  interface Props extends Omit<HTMLAnchorAttributes, 'class' | 'children'> {
    href: string;
    variant: NonNullable<NavLinkVariant>;
    /**
     * Marks the link as the current destination: `true` or `'page'` for a route,
     * `'location'` for a section within the page.
     */
    current?: boolean | 'page' | 'location';
    /** Layout classes at the call site, such as padding for a larger card. */
    class?: string;
    children: Snippet;
  }

  let { href, variant, current = false, class: className, children, ...restProps }: Props =
    $props();

  const ariaCurrent = $derived(current === true ? 'page' : current || undefined);
</script>

<a
  {href}
  aria-current={ariaCurrent}
  data-current={ariaCurrent ? 'true' : undefined}
  data-slot="nav-link"
  class={cn(navLinkVariants({ variant }), className)}
  {...restProps}
>
  {@render children()}
</a>
