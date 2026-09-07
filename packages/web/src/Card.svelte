<script lang="ts">
  import type { SlackItem, User } from "@ait/contract/slack";
  import MessageText from "./MessageText.svelte";
  import ReasonBadge from "./ReasonBadge.svelte";
  import { formatDate, formatTime } from "./slack-time.ts";

  let {
    item,
    me,
    surface,
    emoji,
  }: {
    item: SlackItem;
    me: User;
    surface: string;
    emoji: Record<string, string>;
  } = $props();

  const message = $derived(item.content.message);
  const conversation = $derived(item.context.location.conversation);
  const mine = $derived(message.author.id === me.id);
  // What Miki must clear by hand in Slack: one per Activity row that folded in.
  const rows = $derived(item.context.reasons.length);
</script>

<article>
  <div class="why">
    {#each item.context.reasons as reason (reason.raw)}
      <ReasonBadge {reason} author={message.author} {me} />
    {/each}
    <span class="rows">{rows} Slack {rows === 1 ? "row" : "rows"}</span>
    <span class="surface">{surface}</span>
  </div>

  <header>
    {#if message.author.avatar}
      <img class="face" src={message.author.avatar} alt="" />
    {:else}
      <span class="face initials">{message.author.display.slice(0, 1)}</span>
    {/if}
    <div class="who">
      <a class="where" href={item.meta.ref} target="_blank" rel="noreferrer">
        {#if conversation.kind === "channel"}<span class="hash">#</span>{/if}
        {conversation.name}
      </a>
      <span class="name">
        {mine ? "You" : message.author.display}
        <span class="when">{formatDate(message.ts)} {formatTime(message.ts)}</span>
      </span>
    </div>
  </header>

  <blockquote><MessageText text={message.text} {me} {emoji} /></blockquote>
</article>

<style>
  article {
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: 10px;
    padding: 1rem 1.1rem;
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
    background: var(--btn-bg);
    border-radius: 999px;
    padding: 1.5px 8px;
  }
  .surface {
    margin-left: auto;
  }
  header {
    display: flex;
    gap: 0.6rem;
    margin-bottom: 0.7rem;
  }
  .face {
    width: 34px;
    height: 34px;
    border-radius: 6px;
    flex: none;
  }
  .initials {
    display: grid;
    place-items: center;
    background: var(--accent-soft);
    color: var(--accent);
    font-size: 0.9rem;
  }
  .who {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  .where {
    font-family: var(--mono);
    font-size: 12.5px;
    color: var(--ink);
    background: var(--btn-bg);
    border-radius: 5px;
    padding: 2px 7px;
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
  .name {
    font-size: 13px;
    color: var(--muted);
  }
  .when {
    margin-left: 0.4rem;
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
