<script lang="ts">
  import IconMedallion from '$lib/components/common/icon-medallion.svelte';
  import { Heading, Text } from '$lib/components/ui/typography';
  import * as Card from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
  import HelpCallout from './help-callout.svelte';
  import HelpTile from './help-tile.svelte';
  import { helpTerms, helpTopics, helpTroubleItems, type HelpTopic } from '$lib/config/help';
  import * as m from '$lib/paraglide/messages';

  /** One topic of the in-app manual, rendered as an anchored section. */
  interface Props {
    topic: HelpTopic;
    /** Admin readers see the full steps; employees see a condensed summary. */
    isAdmin: boolean;
  }

  let { topic, isAdmin }: Props = $props();

  /** Employees get the shortened summary on topics written for admins. */
  const summary = $derived(
    topic.adminOnly && !isAdmin && topic.employeeSummary ? topic.employeeSummary() : topic.summary()
  );
  const showSteps = $derived(!topic.adminOnly || isAdmin);

  function relatedTitle(id: string): string {
    return helpTopics.find((entry) => entry.id === id)?.title() ?? id;
  }
</script>

<Card.Root
  id={topic.id}
  data-help-section
  data-help-id={topic.id}
  class="scroll-mt-24 gap-0 p-4 sm:p-6 lg:scroll-mt-6"
>
  <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
    <div class="min-w-0">
      <Card.Title><Heading level={2}>{topic.title()}</Heading></Card.Title>
      <Card.Description class="mt-2 text-base text-muted-foreground">{summary}</Card.Description>
    </div>
    {#if topic.appHref && (!topic.adminOnly || isAdmin)}
      <Button size="touch" href={topic.appHref} variant="outline" class="shrink-0">
        {m['help.action.openPage']()}
        <ExternalLinkIcon class="ml-2 h-4 w-4" />
      </Button>
    {/if}
  </div>

  {#if showSteps && topic.steps?.length}
    <ol class="mt-5 space-y-3">
      {#each topic.steps as step, index}
        <li class="grid grid-cols-[2rem_1fr] gap-3">
          <IconMedallion size="sm">{index + 1}</IconMedallion>
          <span class="pt-1 text-sm leading-6 text-foreground">{step()}</span>
        </li>
      {/each}
    </ol>
  {:else if topic.employeeBullets?.length}
    <div class="mt-5">
      <HelpCallout kind="admin">
        <ul class="space-y-2 text-sm leading-6">
          {#each topic.employeeBullets as bullet}
            <li>{bullet()}</li>
          {/each}
        </ul>
      </HelpCallout>
    </div>
  {/if}

  {#if topic.id === 'key-terms'}
    <div class="mt-5 grid gap-3 md:grid-cols-2">
      {#each helpTerms as term (term.id)}
        <HelpTile title={term.term()} description={term.description()} class="p-3" />
      {/each}
    </div>
  {/if}

  {#if topic.id === 'troubleshooting'}
    <div class="mt-5 space-y-3">
      {#each helpTroubleItems as item (item.id)}
        <HelpTile title={item.title()} description={item.resolution()} />
      {/each}
    </div>
  {/if}

  {#if showSteps && topic.callouts?.length}
    <div class="mt-5 space-y-3">
      {#each topic.callouts as callout}
        <HelpCallout kind={callout.kind} text={callout.text()} />
      {/each}
    </div>
  {/if}

  {#if topic.related?.length}
    <div class="mt-5 border-t border-border pt-4">
      <Text variant="label">
        {m['help.related.title']()}
      </Text>
      <div class="mt-2 flex flex-wrap gap-2">
        {#each topic.related as relatedId}
          <a
            href={`#${relatedId}`}
            class="inline-flex min-h-11 items-center rounded-full border border-border px-4 py-1.5 text-sm text-muted-foreground hover:border-primary/50 hover:text-foreground touch-manipulation"
          >
            {relatedTitle(relatedId)}
          </a>
        {/each}
      </div>
    </div>
  {/if}
</Card.Root>
