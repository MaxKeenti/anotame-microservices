<script lang="ts">
  import { Heading } from '$lib/components/ui/typography';
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
  import * as Card from '$lib/components/ui/card';
  import { PageHeader, StatePanel } from '$lib/components/common';
  import HelpTopicSection from '$lib/components/help/help-topic-section.svelte';
  import HelpTile from '$lib/components/help/help-tile.svelte';
  import HelpToc from '$lib/components/help/help-toc.svelte';
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

  $effect(() => {
    const current = activeSection;
    if (typeof document === 'undefined') return;

    tick().then(() => {
      const el = document.querySelector<HTMLElement>(`[data-mobile-help-topic="${current}"]`);
      const strip = el?.parentElement;
      if (!el || !strip) return;
      // Scroll only the horizontal pill strip — never let it bubble to the
      // page/main scroll container (that would yank the reader's position).
      const elRect = el.getBoundingClientRect();
      const stripRect = strip.getBoundingClientRect();
      const delta = elRect.left + elRect.width / 2 - (stripRect.left + stripRect.width / 2);
      strip.scrollBy({ left: delta, behavior: 'smooth' });
    });
  });
</script>

<div class="mx-auto max-w-7xl space-y-6 pb-24 animate-in fade-in duration-300">
  <PageHeader
    title={m['help.page.title']()}
    description={m['help.page.description']()}
    icon={CircleHelp}
  />

  <div class="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[18rem_minmax(0,1fr)] lg:items-start">
    <aside class="lg:sticky lg:top-0 space-y-4">
      <Card.Root class="gap-0 p-4">
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
            class="h-11 touch-manipulation"
            onclick={() => category = 'all'}
          >
            {m['help.category.all']()}
          </Button>
          {#each helpCategories as item (item.id)}
            <Button
              variant={category === item.id ? 'default' : 'outline'}
              size="sm"
              class="h-11 touch-manipulation"
              onclick={() => category = item.id}
            >
              {item.label()}
            </Button>
          {/each}
        </div>
      </Card.Root>

      <HelpToc topics={visibleTopics} activeId={activeSection} layout="sidebar" />
    </aside>

    <div class="space-y-6 min-w-0">
      <HelpToc topics={visibleTopics} activeId={activeSection} layout="chips" />

      <Card.Root class="gap-0 p-4" data-help-id="quick-start">
        <Card.Title class="mb-4">
          <Heading level={2} class="flex items-center gap-2">
            <BookOpen class="h-5 w-5 text-primary" />
            {m['help.quick.title']()}
          </Heading>
        </Card.Title>
        <div class="grid gap-3 md:grid-cols-2">
          {#each visibleQuickStarts as item (item.id)}
            <HelpTile title={item.title()} description={item.summary()}>
              <div class="mt-4 flex flex-wrap gap-2">
                {#if item.appHref}
                  <Button href={item.appHref} class="h-11">
                    {m['help.action.openPage']()}
                    <ExternalLink class="ml-2 h-4 w-4" />
                  </Button>
                {/if}
                <Button href={`#${item.topicId}`} variant="outline" class="h-11">
                  {m['help.action.readSteps']()}
                </Button>
              </div>
            </HelpTile>
          {/each}
        </div>
      </Card.Root>

      {#if visibleTopics.length === 0}
        <StatePanel message={m['help.search.noResults']()} class="h-auto p-8" />
      {:else}
        {#each visibleTopics as topic (topic.id)}
          <HelpTopicSection {topic} {isAdmin} />
        {/each}
      {/if}
    </div>
  </div>
</div>
