<script lang="ts">
  import type { Snippet } from 'svelte';

  /** Centred card carrying a single message, used by standalone pages. */
  interface Props {
    title: string;
    /** Localized explanation under the title. */
    body: string;
    /** Icon shown in a circle above the title. */
    icon?: Snippet;
    /** Recovery actions. */
    children?: Snippet;
    /** Small trailing note, such as a status code. */
    footnote?: string;
  }

  let { title, body, icon, children, footnote }: Props = $props();
</script>

<div class="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
  {#if icon}
    <div class="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
      {@render icon()}
    </div>
  {/if}

  <h1 class="font-heading text-2xl font-bold text-foreground">{title}</h1>
  <p class="mt-3 text-sm text-muted-foreground">{body}</p>

  {@render children?.()}

  {#if footnote}
    <p class="mt-6 font-mono text-xs text-muted-foreground/70">{footnote}</p>
  {/if}
</div>
