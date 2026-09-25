<script lang="ts">
  import { untrack, type Component } from 'svelte';
  import { goto, preloadData } from '$app/navigation';
  import { resolveApp } from '$lib/config/apps';
  import { matchWindowRoute } from '$lib/desktop/route-registry';
  import { setWindowRoute } from '$lib/desktop/route-context.svelte';
  import { windowsStore, type AppWindow } from '$lib/desktop/windows.svelte';
  import { StatePanel, ErrorState } from '$lib/components/common';
  import SectionFrame from '$lib/components/common/section-frame.svelte';
  import RouteStack from './route-stack.svelte';
  import type { VisibleApp } from '$lib/config/apps';
  import * as m from '$lib/paraglide/messages';

  /**
   * Mounts a window's route: runs its `load` chain through SvelteKit
   * (`preloadData`, so guards and redirects behave as on a full page), then
   * renders its layouts and page with a window-scoped route handle.
   */
  interface Props {
    win: AppWindow;
    /** The window's app, narrowed to the user's sections, for its navbar. */
    entry: VisibleApp | undefined;
  }

  let { win, entry }: Props = $props();

  type View =
    | { status: 'loading' }
    | { status: 'ready'; stack: Component<any>[]; data: Record<string, any>; params: Record<string, string> }
    | { status: 'error' };

  let view = $state<View>({ status: 'loading' });

  const url = $derived(new URL(win.url, typeof location === 'undefined' ? 'http://localhost' : location.origin));

  /** Where a navigation from inside this window goes. */
  function route(href: string, replace = false): Promise<void> {
    const pathname = new URL(href, url).pathname;
    const target = resolveApp(pathname);
    if (!target) return goto(href);
    if (target.app.key === win.appKey) windowsStore.navigate(win.appKey, href, { replace });
    else windowsStore.open(href);
    return Promise.resolve();
  }

  setWindowRoute({
    get url() {
      return url;
    },
    get params() {
      return view.status === 'ready' ? view.params : {};
    },
    goto: (href, opts) => route(href, opts?.replaceState),
    replaceUrl: (href) => windowsStore.navigate(win.appKey, href, { replace: true, silent: true }),
  });

  $effect(() => {
    // Only `rev` reloads the content; a silent URL rewrite must not remount it.
    void win.rev;
    const href = untrack(() => win.url);
    let cancelled = false;
    view = { status: 'loading' };

    (async () => {
      try {
        const result = await preloadData(href);
        if (cancelled) return;
        if (result.type === 'redirect') {
          await route(result.location, true);
          return;
        }
        const match = matchWindowRoute(new URL(href, location.origin).pathname);
        if (!match || result.status >= 400) {
          view = { status: 'error' };
          return;
        }
        const stack = await match.loadStack();
        if (cancelled) return;
        view = { status: 'ready', stack, data: result.data, params: match.params };
      } catch (err) {
        console.error('Failed to open window route:', err);
        if (!cancelled) view = { status: 'error' };
      }
    })();

    return () => {
      cancelled = true;
    };
  });

  const tabs = $derived(
    entry && entry.sections.length > 1
      ? entry.sections.map((section) => ({ href: section.href, label: section.getName(), icon: section.icon }))
      : []
  );
</script>

<SectionFrame {tabs} ariaLabel={entry?.app.getName() ?? ''} nav={entry?.app.nav}>
  {#if view.status === 'loading'}
    <StatePanel message={m['desktop.window.loading']()} spinner size="page" />
  {:else if view.status === 'error'}
    <ErrorState title={m['desktop.window.errorTitle']()} description={m['desktop.window.errorDescription']()} />
  {:else}
    {#key win.rev}
      <RouteStack stack={view.stack} data={view.data} />
    {/key}
  {/if}
</SectionFrame>
