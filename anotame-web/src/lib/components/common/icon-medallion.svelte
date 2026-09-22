<script lang="ts" module>
  import { tv, type VariantProps } from 'tailwind-variants';

  /** Circular tinted backdrop for a feature or status icon. */
  export const iconMedallionVariants = tv({
    base: 'flex shrink-0 items-center justify-center rounded-full [&_svg]:pointer-events-none [&_svg]:shrink-0',
    variants: {
      tone: {
        primary: 'bg-primary/10 text-primary',
        muted: 'bg-muted text-muted-foreground',
        destructive: 'bg-destructive/10 text-destructive',
        surface: 'bg-background text-primary shadow-sm',
      },
      size: {
        sm: 'size-8 text-sm font-bold [&_svg:not([class*=size-])]:size-4',
        md: 'size-14 [&_svg:not([class*=size-])]:size-7',
        lg: 'size-16 [&_svg:not([class*=size-])]:size-8',
        xl: 'size-20 [&_svg:not([class*=size-])]:size-11',
        '2xl': 'size-28 [&_svg:not([class*=size-])]:size-16',
      },
    },
    defaultVariants: { tone: 'primary', size: 'lg' },
  });

  export type IconMedallionTone = VariantProps<typeof iconMedallionVariants>['tone'];
  export type IconMedallionSize = VariantProps<typeof iconMedallionVariants>['size'];
</script>

<script lang="ts">
  import type { Snippet } from 'svelte';
  import { cn } from '$lib/utils';

  interface Props {
    tone?: IconMedallionTone;
    size?: IconMedallionSize;
    /** Layout classes at the call site, such as centring or a hover transition. */
    class?: string;
    /** The icon, or a short label such as a step number. */
    children: Snippet;
  }

  let { tone = 'primary', size = 'lg', class: className, children }: Props = $props();
</script>

<div class={cn(iconMedallionVariants({ tone, size }), className)} aria-hidden="true">
  {@render children()}
</div>
