<script lang="ts">
  import NavLink from '$lib/components/common/nav-link.svelte';
  import type { Snippet } from 'svelte';
  import * as m from '$lib/paraglide/messages';

  /** Frame of the authenticated app: skip link, menu bar, scrolling content, floating dock. */
  interface Props {
    /** Page content. */
    children: Snippet;
    /** Modals and dialogs mounted once for the whole app. */
    overlays?: Snippet;
    /** Bar pinned above the content, like the macOS menu bar. */
    menubar?: Snippet;
    /** Window layer floating over the content area (desktop mode). */
    desktop?: Snippet;
    /** Background behind the content area, such as the desktop wallpaper. */
    wallpaper?: Snippet;
    /** Floating bottom bar: the dock, or a page's bulk-action bar. */
    dock?: Snippet;
  }

  let { children, overlays, menubar, desktop, wallpaper, dock }: Props = $props();
</script>

<div class="flex h-dvh flex-col overflow-hidden bg-background text-foreground">
  <NavLink href="#main-content" variant="skip">
    {m['common.skipToContent']()}
  </NavLink>

  {@render overlays?.()}

  {@render menubar?.()}

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
  <div class="relative flex min-h-0 flex-1 flex-col">
    {#if wallpaper}
      <div class="absolute inset-0 overflow-hidden" aria-hidden="true">
        {@render wallpaper()}
      </div>
    {/if}

    <main id="main-content" tabindex="-1" class="relative w-full flex-1 overflow-y-auto outline-none">
      <div class="mx-auto flex min-h-full w-full max-w-7xl flex-col px-4 pt-4 pb-28 md:px-6 md:pt-6 lg:px-8 lg:pt-8">
        {@render children()}
      </div>
    </main>

    {@render desktop?.()}
  </div>

  <!-- Floats over content like the macOS dock. -->
  <div class="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-3">
    {@render dock?.()}
  </div>
</div>
