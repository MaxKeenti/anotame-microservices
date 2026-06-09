<script lang="ts">
  import { tick } from 'svelte';
  import { authService } from '$lib/services/auth.svelte';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import {
    helpCategories,
    helpQuickStarts,
    helpTerms,
    helpTopics,
    helpTroubleItems,
    type CalloutKind,
    type HelpCategory,
    type HelpTopic,
  } from '$lib/config/help';
  import * as m from '$lib/paraglide/messages';
  import {
    AlertTriangle,
    BookOpen,
    CircleHelp,
    ExternalLink,
    Info,
    Search,
    ShieldCheck,
  } from '@lucide/svelte';

  const isAdmin = $derived(authService.user?.role === 'ADMIN');

  let searchQuery = $state('');
  let category = $state<'all' | HelpCategory>('all');
  let activeSection = $state('navigation');

  function normalize(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  function topicSummary(topic: HelpTopic): string {
    if (topic.adminOnly && !isAdmin && topic.employeeSummary) {
      return topic.employeeSummary();
    }
    return topic.summary();
  }

  function topicSearchText(topic: HelpTopic): string {
    const parts = [
      topic.title(),
      topicSummary(topic),
      topic.keywords?.() ?? '',
    ];

    if (!topic.adminOnly || isAdmin) {
      parts.push(...(topic.steps ?? []).map((step) => step()));
      parts.push(...(topic.callouts ?? []).map((callout) => callout.text()));
    } else {
      parts.push(...(topic.employeeBullets ?? []).map((item) => item()));
    }

    if (topic.id === 'key-terms') {
      parts.push(...helpTerms.flatMap((term) => [term.term(), term.description()]));
    }
    if (topic.id === 'troubleshooting') {
      parts.push(...helpTroubleItems.flatMap((item) => [item.title(), item.resolution()]));
    }

    return parts.join(' ');
  }

  function topicMatchesSearch(topic: HelpTopic): boolean {
    const query = normalize(searchQuery.trim());
    if (!query) return true;
    return normalize(topicSearchText(topic)).includes(query);
  }

  let visibleTopics = $derived.by(() => {
    return helpTopics.filter((topic) => {
      if (category !== 'all' && topic.category !== category) return false;
      return topicMatchesSearch(topic);
    });
  });

  let visibleQuickStarts = $derived.by(() => {
    return helpQuickStarts.filter((item) => {
      if (item.adminOnly && !isAdmin) return false;
      if (item.employeeOnly && isAdmin) return false;
      return true;
    });
  });

  function shouldShowSteps(topic: HelpTopic): boolean {
    return !topic.adminOnly || isAdmin;
  }

  function relatedTopicTitle(id: string): string {
    return helpTopics.find((topic) => topic.id === id)?.title() ?? id;
  }

  function calloutLabel(kind: CalloutKind): string {
    if (kind === 'important') return m['help.callout.important']();
    if (kind === 'admin') return m['help.callout.admin']();
    return m['help.callout.tip']();
  }

  function calloutClass(kind: CalloutKind): string {
    if (kind === 'important') return 'border-warning-border bg-warning-background text-warning-background-foreground';
    if (kind === 'admin') return 'border-info-border bg-info-background text-info-background-foreground';
    return 'border-success-border bg-success-background text-success-background-foreground';
  }

  function calloutIcon(kind: CalloutKind) {
    if (kind === 'important') return AlertTriangle;
    if (kind === 'admin') return ShieldCheck;
    return Info;
  }

  let observer: IntersectionObserver | null = null;

  $effect(() => {
    const observedIds = visibleTopics.map((topic) => topic.id).join('|');
    if (!observedIds || typeof IntersectionObserver === 'undefined') return;

    let cancelled = false;
    tick().then(() => {
      if (cancelled) return;
      observer?.disconnect();
      observer = new IntersectionObserver(
        (entries) => {
          const visible = entries
            .filter((entry) => entry.isIntersecting)
            .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
          if (visible[0]) {
            activeSection = visible[0].target.id;
          }
        },
        { root: null, rootMargin: '-20% 0px -65% 0px', threshold: 0.01 }
      );

      for (const topic of visibleTopics) {
        const el = document.getElementById(topic.id);
        if (el) observer.observe(el);
      }
    });

    return () => {
      cancelled = true;
      observer?.disconnect();
    };
  });
</script>

<svelte:head>
  <title>{m['help.page.title']()}</title>
</svelte:head>

<div class="mx-auto max-w-7xl space-y-6 pb-24 animate-in fade-in duration-300">
  <div class="space-y-2">
    <div class="flex items-center gap-3">
      <CircleHelp class="h-8 w-8 text-primary" />
      <h1 class="text-3xl font-heading font-bold text-foreground">{m['help.page.title']()}</h1>
    </div>
    <p class="max-w-3xl text-muted-foreground">{m['help.page.description']()}</p>
  </div>

  <div class="grid gap-4 lg:grid-cols-[18rem_1fr] lg:items-start">
    <aside class="lg:sticky lg:top-0 space-y-4">
      <div class="rounded-xl border border-border bg-card p-4 shadow-sm">
        <label for="help-search" class="sr-only">{m['common.search']()}</label>
        <div class="relative">
          <Search class="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="help-search"
            bind:value={searchQuery}
            placeholder={m['help.search.placeholder']()}
            class="h-12 pl-10 touch-manipulation"
          />
        </div>

        <div class="mt-4 flex flex-wrap gap-2">
          <Button
            variant={category === 'all' ? 'default' : 'outline'}
            size="sm"
            class="h-10 touch-manipulation"
            onclick={() => category = 'all'}
          >
            {m['help.category.all']()}
          </Button>
          {#each helpCategories as item (item.id)}
            <Button
              variant={category === item.id ? 'default' : 'outline'}
              size="sm"
              class="h-10 touch-manipulation"
              onclick={() => category = item.id}
            >
              {item.label()}
            </Button>
          {/each}
        </div>
      </div>

      <nav class="hidden lg:block rounded-xl border border-border bg-card p-3 shadow-sm" aria-label={m['help.toc.title']()}>
        <div class="px-2 pb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
          {m['help.toc.title']()}
        </div>
        <div class="max-h-[calc(100vh-18rem)] space-y-1 overflow-y-auto pr-1">
          {#each visibleTopics as topic (topic.id)}
            <a
              href={`#${topic.id}`}
              class="block rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted/70 {activeSection === topic.id ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:text-foreground'}"
            >
              {topic.title()}
            </a>
          {/each}
        </div>
      </nav>
    </aside>

    <div class="space-y-6 min-w-0">
      <section class="rounded-xl border border-border bg-card p-4 shadow-sm" data-help-id="quick-start">
        <div class="mb-4 flex items-center gap-2">
          <BookOpen class="h-5 w-5 text-primary" />
          <h2 class="text-xl font-bold font-heading">{m['help.quick.title']()}</h2>
        </div>
        <div class="grid gap-3 md:grid-cols-2">
          {#each visibleQuickStarts as item (item.id)}
            <div class="rounded-lg border border-border bg-background p-4">
              <h3 class="font-semibold">{item.title()}</h3>
              <p class="mt-1 text-sm text-muted-foreground">{item.summary()}</p>
              <div class="mt-4 flex flex-wrap gap-2">
                {#if item.appHref}
                  <a
                    href={item.appHref}
                    class="inline-flex h-10 items-center justify-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    {m['help.action.openPage']()}
                    <ExternalLink class="ml-2 h-4 w-4" />
                  </a>
                {/if}
                <a
                  href={`#${item.topicId}`}
                  class="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
                >
                  {m['help.action.readSteps']()}
                </a>
              </div>
            </div>
          {/each}
        </div>
      </section>

      {#if visibleTopics.length === 0}
        <div class="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
          {m['help.search.noResults']()}
        </div>
      {:else}
        {#each visibleTopics as topic (topic.id)}
          <section
            id={topic.id}
            data-help-section
            data-help-id={topic.id}
            class="scroll-mt-6 rounded-xl border border-border bg-card p-5 shadow-sm"
          >
            <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div class="min-w-0">
                <h2 class="text-2xl font-bold font-heading">{topic.title()}</h2>
                <p class="mt-2 text-muted-foreground">{topicSummary(topic)}</p>
              </div>
              {#if topic.appHref && (!topic.adminOnly || isAdmin)}
                <a
                  href={topic.appHref}
                  class="inline-flex h-10 shrink-0 items-center justify-center rounded-md border border-input bg-background px-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
                >
                  {m['help.action.openPage']()}
                  <ExternalLink class="ml-2 h-4 w-4" />
                </a>
              {/if}
            </div>

            {#if shouldShowSteps(topic) && topic.steps?.length}
              <ol class="mt-5 space-y-3">
                {#each topic.steps as step, index}
                  <li class="grid grid-cols-[2rem_1fr] gap-3">
                    <span class="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {index + 1}
                    </span>
                    <span class="pt-1 text-sm leading-6 text-foreground">{step()}</span>
                  </li>
                {/each}
              </ol>
            {:else if topic.employeeBullets?.length}
              <div class="mt-5 rounded-lg border border-info-border bg-info-background p-4 text-info-background-foreground">
                <div class="mb-2 flex items-center gap-2 text-sm font-bold">
                  <ShieldCheck class="h-4 w-4" />
                  {m['help.callout.admin']()}
                </div>
                <ul class="space-y-2 text-sm leading-6">
                  {#each topic.employeeBullets as bullet}
                    <li>{bullet()}</li>
                  {/each}
                </ul>
              </div>
            {/if}

            {#if topic.id === 'key-terms'}
              <div class="mt-5 grid gap-3 md:grid-cols-2">
                {#each helpTerms as term (term.id)}
                  <div class="rounded-lg border border-border bg-background p-3">
                    <h3 class="font-semibold">{term.term()}</h3>
                    <p class="mt-1 text-sm leading-6 text-muted-foreground">{term.description()}</p>
                  </div>
                {/each}
              </div>
            {/if}

            {#if topic.id === 'troubleshooting'}
              <div class="mt-5 space-y-3">
                {#each helpTroubleItems as item (item.id)}
                  <div class="rounded-lg border border-border bg-background p-4">
                    <h3 class="font-semibold">{item.title()}</h3>
                    <p class="mt-1 text-sm leading-6 text-muted-foreground">{item.resolution()}</p>
                  </div>
                {/each}
              </div>
            {/if}

            {#if shouldShowSteps(topic) && topic.callouts?.length}
              <div class="mt-5 space-y-3">
                {#each topic.callouts as callout}
                  {@const Icon = calloutIcon(callout.kind)}
                  <div class="rounded-lg border p-4 text-sm leading-6 {calloutClass(callout.kind)}">
                    <div class="mb-1 flex items-center gap-2 font-bold">
                      <Icon class="h-4 w-4" />
                      {calloutLabel(callout.kind)}
                    </div>
                    <p>{callout.text()}</p>
                  </div>
                {/each}
              </div>
            {/if}

            {#if topic.related?.length}
              <div class="mt-5 border-t border-border pt-4">
                <div class="text-xs font-bold uppercase tracking-wide text-muted-foreground">{m['help.related.title']()}</div>
                <div class="mt-2 flex flex-wrap gap-2">
                  {#each topic.related as relatedId}
                    <a
                      href={`#${relatedId}`}
                      class="rounded-full border border-border px-3 py-1.5 text-sm text-muted-foreground hover:border-primary/50 hover:text-foreground"
                    >
                      {relatedTopicTitle(relatedId)}
                    </a>
                  {/each}
                </div>
              </div>
            {/if}
          </section>
        {/each}
      {/if}
    </div>
  </div>
</div>
