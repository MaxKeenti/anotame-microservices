<script lang="ts">
  import type { Snippet } from 'svelte';
  import { StatusBadge } from '$lib/components/common';

  /** Printable card shell shared by the public ticket and handling-ticket pages. */
  interface Props {
    /** Small line above the title: the establishment name, or what the page is. */
    eyebrow: string;
    /** Ticket identifier shown as the page heading. */
    title: string;
    /** Order status rendered as a badge beside the title. */
    status: string;
    /** Ticket body sections. */
    children: Snippet;
  }

  let { eyebrow, title, status, children }: Props = $props();
</script>

<main class="min-h-screen bg-muted/40 px-4 py-6 sm:py-10">
  <article class="mx-auto max-w-xl overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
    <header class="border-b border-border bg-primary px-5 py-6 text-primary-foreground sm:px-8">
      <p class="text-sm font-medium opacity-90">{eyebrow}</p>
      <div class="mt-2 flex flex-wrap items-center justify-between gap-3">
        <h1 class="text-2xl font-bold">{title}</h1>
        <StatusBadge {status} class="bg-background text-foreground" />
      </div>
    </header>

    <div class="space-y-6 p-5 sm:p-8">
      {@render children()}
    </div>
  </article>
</main>
