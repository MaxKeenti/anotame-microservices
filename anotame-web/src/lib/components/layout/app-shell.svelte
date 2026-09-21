<script lang="ts">
  import type { Snippet } from 'svelte';
  import * as m from '$lib/paraglide/messages';

  /** Frame of the authenticated app: skip link, scrolling content, floating dock. */
  interface Props {
    /** Page content. */
    children: Snippet;
    /** Modals and dialogs mounted once for the whole app. */
    overlays?: Snippet;
    /** Floating bottom bar: the dock, or a page's bulk-action bar. */
    dock?: Snippet;
  }

  let { children, overlays, dock }: Props = $props();
</script>

<div class="flex h-dvh flex-col overflow-hidden bg-background text-foreground">
  <a
    href="#main-content"
    class="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-100 focus:rounded-md focus:bg-background focus:px-4 focus:py-3 focus:text-sm focus:font-medium focus:ring-2 focus:ring-ring"
  >
    {m['common.skipToContent']()}
  </a>

  {@render overlays?.()}

  <!-- The bottom padding lives on an inner wrapper, not the scroll
       container: Safari ignores padding-bottom on the scroller itself,
       which let fully-scrolled content hide under the floating dock.
       `flex flex-col min-h-full` makes the wrapper at least a full
       viewport tall so full-height pages (e.g. the order wizard, whose
       footer is pinned with mt-auto) fill via flex instead of h-full —
       that keeps the pb-28 clearance honored so their bottom action bar
       ends up safely above the dock instead of overflowing under it.

       Padding is split into px-*/pt-*/pb-28 on purpose — do NOT collapse
       it back into the `p-*` shorthand. A responsive shorthand (md:p-6,
       lg:p-8) is emitted after the non-responsive pb-28 in Tailwind's
       output, so it silently overrides padding-bottom at >=md and wipes
       out the dock clearance. Keeping pb-28 the only padding-bottom rule
       makes it win at every breakpoint. -->
  <main id="main-content" tabindex="-1" class="w-full flex-1 overflow-y-auto outline-none">
    <div class="mx-auto flex min-h-full w-full max-w-7xl flex-col px-4 pt-4 pb-28 md:px-6 md:pt-6 lg:px-8 lg:pt-8">
      {@render children()}
    </div>
  </main>

  <!-- Floats over content like the macOS dock. -->
  <div class="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-3">
    {@render dock?.()}
  </div>
</div>
