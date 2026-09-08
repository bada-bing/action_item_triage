<script lang="ts">
  import type { ActionCard } from "@ait/contract/action-card";
  import type { Action } from "@ait/contract/source-item";
  import type { SlackItem, User } from "@ait/contract/slack";
  import MessageText from "./MessageText.svelte";
  import ReasonBadge from "./ReasonBadge.svelte";
  import Proposals from "./Proposals.svelte";
  import Reactions from "./Reactions.svelte";
  import Transcript from "./Transcript.svelte";
  import { faceOf } from "./slack-user.ts";
  import { formatDate, formatTime } from "./slack-time.ts";

  let {
    card,
    decide,
    me,
    myGroups,
    surface,
    emoji,
  }: {
    card: ActionCard<SlackItem>;
    decide: (card_id: string, action: Action) => void;
    me: User;
    myGroups: string[];
    surface: string;
    emoji: Record<string, string>;
  } = $props();

  const item = $derived(card.item);
  const message = $derived(item.content.message);
  const conversation = $derived(item.context.location.conversation);
  // Whoever put this on the board, which for a reaction is not the author.
  const exchange = $derived(item.context.exchange);
  const face = $derived(item.context.reasons[0]!.actor ?? message.author);
  const attributed = $derived(face.id !== message.author.id);

  // A reaction is rarely one person, and the row names only the first.
  const faces = $derived.by(() => {
    if (item.context.reasons[0]!.reason !== "reaction") return [face];
    const seen = new Map<string, User>([[face.id, face]]);
    for (const reaction of message.reactions) {
      for (const user of reaction.users) if (!seen.has(user.id)) seen.set(user.id, user);
    }
    return [...seen.values()];
  });

  const NAMED = 5;

  const facesLabel = $derived.by(() => {
    const names = faces.slice(0, NAMED).map(nameOf);
    const rest = faces.length - names.length;
    const listed =
      names.length === 1
        ? names[0]!
        : `${names.slice(0, -1).join(", ")} & ${names.at(-1)}`;
    return rest > 0 ? `${listed} & ${rest} more` : listed;
  });
  const rows = $derived(item.context.reasons.length);

  function nameOf(user: User): string {
    return user.id === me.id ? "You" : user.display;
  }

  // The card whose turn it is opens by default, until I fold it by hand.
  let foldedByHand = $state<boolean | undefined>();
  const folded = $derived(foldedByHand ?? card.state !== "now");
</script>

{#snippet stack(size: "big" | "small")}
  <span class="stack {size}">
    {#each faces.slice(0, 3) as person, i (person.id)}
      {#if faceOf(person)}
        <img class="face" src={faceOf(person)} alt="" style="z-index: {3 - i}" />
      {:else}
        <span class="face initials" style="z-index: {3 - i}">{person.display.slice(0, 1)}</span>
      {/if}
    {/each}
  </span>
{/snippet}

<article class={card.state}>
  {#if folded}
    <button class="folded" onclick={() => (foldedByHand = false)} aria-label="open">
      <ReasonBadge reason={item.context.reasons[0]!} {face} {me} />
      {@render stack("small")}
      <span class="line-summary">
        {#if conversation.kind === "channel"}<span class="hash">#</span>{/if}{conversation.name}
      </span>
      <span class="surface">{surface}</span>
      <span class="fold">▸</span>
    </button>
  {:else}
    <button class="why" onclick={() => (foldedByHand = true)} aria-label="close">
      {#each item.context.reasons as reason (reason.raw)}
        <ReasonBadge {reason} {face} {me} />
      {/each}
      {#if rows > 1}<span class="rows">{rows} Slack rows</span>{/if}
      <span class="surface">{surface}</span>
      <span class="fold">▾</span>
    </button>

    <header>
      {@render stack("big")}
      <div class="who">
        <div class="line">
          <a class="where" href={item.meta.ref} target="_blank" rel="noreferrer">
            {#if conversation.kind === "channel"}<span class="hash">#</span>{/if}
            {conversation.name}
            {#if item.context.location.thread}
              <span class="sep">›</span><span class="thread">↳ thread</span>
            {/if}
          </a>
          <span class="when">{formatDate(message.ts)} {formatTime(message.ts)}</span>
        </div>
        <span class="name">{facesLabel}</span>
      </div>
    </header>

    <blockquote>
      {#if attributed}<span class="attrib">{nameOf(message.author)}:</span>{/if}
      <MessageText text={message.text} {me} {myGroups} {emoji} />
      {#if message.reactions.length}
        <Reactions reactions={message.reactions} {me} {emoji} />
      {/if}
    </blockquote>

    {#if exchange.history.length > 1 || exchange.in_reply_to}
      <Transcript
        history={exchange.history}
        subjectTs={message.ts}
        inReplyTo={exchange.in_reply_to}
        {myGroups}
        isThread={item.context.location.thread !== null}
        replyCount={exchange.reply_count}
        {me}
        {emoji}
      />
    {/if}

    {#if card.state === "now"}
      <Proposals
        proposals={item.proposals}
        decide={(action) => decide(item.id, action)}
      />
    {/if}
  {/if}
</article>

<style>
  article {
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: 10px;
    padding: 1rem 1.1rem;
  }
  article:has(.folded) {
    padding: 0.6rem 1.1rem;
  }
  /* Each state looks like what it is, so nothing has to label it. */
  article.now {
    border-color: var(--accent);
  }
  /* In flight and not mine: unsettled, hence unsettled edges. */
  article.delegated {
    border-style: dashed;
    border-color: var(--muted);
  }
  article.done {
    opacity: 0.45;
  }
  .folded,
  .why {
    width: 100%;
    background: none;
    border: none;
    padding: 0;
    font: inherit;
    color: inherit;
    text-align: left;
    cursor: pointer;
  }
  .folded {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    min-width: 0;
  }
  .line-summary {
    min-width: 0;
    font-family: var(--mono);
    font-size: 12.5px;
    color: var(--ink);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .fold {
    font-size: 11px;
    line-height: 1;
    color: var(--muted);
    background: var(--btn-bg);
    border: 1px solid var(--line);
    border-radius: 5px;
    padding: 5px 7px;
    flex: none;
  }
  .folded:hover .fold,
  .why:hover .fold {
    color: var(--accent);
    border-color: var(--accent);
  }
  .why {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.4rem;
    margin-bottom: 0.7rem;
  }
  .rows,
  .surface {
    font-family: var(--mono);
    font-size: 11px;
    letter-spacing: 0.04em;
    color: var(--muted);
  }
  .rows {
    background: var(--warn-soft);
    color: var(--warn);
    border-radius: 999px;
    padding: 1.5px 8px;
    font-weight: 500;
  }

  .surface {
    margin-left: auto;
  }
  header {
    display: flex;
    align-items: flex-start;
    gap: 0.6rem;
    margin-bottom: 0.7rem;
  }
  .stack {
    display: flex;
    justify-content: center;
    flex: none;
  }
  /* Fixed at three faces whether or not there are three, so the channel and
     the name start at the same place on every card. */
  .stack.big {
    width: 66px;
  }
  .stack.big .face {
    width: 42px;
    height: 42px;
  }
  .stack.big .face + .face {
    margin-left: -30px;
  }
  .stack.small .face {
    width: 22px;
    height: 22px;
  }
  .stack.small .face + .face {
    margin-left: -12px;
  }
  .stack.small .initials {
    font-size: 0.65rem;
  }
  .face {
    position: relative;
    border-radius: 50%;
    flex: none;
    object-fit: cover;
    border: 2px solid var(--surface);
    box-sizing: border-box;
  }
  .initials {
    display: grid;
    place-items: center;
    background: var(--accent-soft);
    color: var(--accent);
    font-size: 0.9rem;
  }
  .who {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }
  .line {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .where {
    font-family: var(--mono);
    font-size: 12.5px;
    color: var(--ink);
    background: var(--btn-bg);
    border-radius: 5px;
    padding: 4px 10px;
    text-decoration: none;
    align-self: flex-start;
  }
  .where:hover {
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  .hash {
    font-weight: 700;
    opacity: 0.65;
  }
  .sep {
    color: var(--muted);
    margin: 0 4px;
  }
  .thread {
    color: var(--muted);
  }
  .name {
    padding-left: 10px;
    font-size: 13px;
    color: var(--muted);
  }
  .when {
    margin-left: auto;
    font-size: 13px;
    color: var(--muted);
    white-space: nowrap;
  }
  .attrib {
    font-weight: 600;
    color: var(--muted);
    margin-right: 0.3rem;
  }
  blockquote {
    margin: 0;
    padding: 0.7rem 0.9rem;
    border-left: 3px solid var(--ink);
    border-radius: 0 8px 8px 0;
    background: var(--subject);
    font-size: 16px;
    line-height: 1.45;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
</style>
