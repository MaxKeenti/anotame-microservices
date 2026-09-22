<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { cn } from '$lib/utils';
  import * as m from '$lib/paraglide/messages';

  /** Previous / "page X of Y" / next control under a paged list. */
  interface Props {
    /** Zero-based index of the page being shown. */
    pageIndex: number;
    /** Total number of pages; treated as 1 when the list is empty. */
    pageCount: number;
    onPrevious: () => void;
    onNext: () => void;
    /** Layout classes at the call site, such as top spacing. */
    class?: string;
  }

  let { pageIndex, pageCount, onPrevious, onNext, class: className }: Props = $props();

  const total = $derived(Math.max(1, pageCount));
</script>

<nav
  aria-label={m['common.pagination']({ current: String(pageIndex + 1), total: String(total) })}
  class={cn('flex items-center justify-between px-2 py-1', className)}
>
  <Button variant="outline" size="touch" class="px-5" disabled={pageIndex <= 0} onclick={onPrevious}>
    {m['common.previous']()}
  </Button>
  <span class="text-sm text-muted-foreground">
    {m['common.pagination']({ current: String(pageIndex + 1), total: String(total) })}
  </span>
  <Button
    variant="outline"
    size="touch"
    class="px-5"
    disabled={pageIndex >= total - 1}
    onclick={onNext}
  >
    {m['common.next']()}
  </Button>
</nav>
