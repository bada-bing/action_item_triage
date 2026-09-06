<script lang="ts">
  import type { SlackItem } from "@ait/contract/slack";
  import MessageText from "./MessageText.svelte";
  import { formatDate, formatTime } from "./slack-time.ts";

  let { item, emoji }: { item: SlackItem; emoji: Record<string, string> } = $props();

  const message = $derived(item.content.message);
  const conversation = $derived(item.context.location.conversation);
</script>

<article>
  <header>
    {#if message.author.avatar}
      <img class="face" src={message.author.avatar} alt="" />
    {:else}
      <span class="face initials">{message.author.display.slice(0, 1)}</span>
    {/if}
    <span class="who">{message.author.display}</span>
    <span class="when">{formatDate(message.ts)} {formatTime(message.ts)}</span>
    <a class="where" href={item.meta.ref} target="_blank" rel="noreferrer">
      {conversation.kind === "channel" ? "#" : ""}{conversation.name}
    </a>
  </header>
  <p class="body"><MessageText text={message.text} {emoji} /></p>
</article>

<style>
  article {
    background: var(--card);
    border: 1px solid var(--line);
    border-radius: 8px;
    padding: 0.9rem 1rem;
  }
  header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }
  .face {
    width: 24px;
    height: 24px;
    border-radius: 4px;
    flex: none;
  }
  .initials {
    display: grid;
    place-items: center;
    background: var(--accent-bg);
    color: var(--accent);
    font-size: 0.75rem;
  }
  .who {
    font-weight: 600;
  }
  .when {
    color: var(--dim);
    font-size: 0.8rem;
  }
  .where {
    margin-left: auto;
    color: var(--dim);
    font-size: 0.8rem;
    text-decoration: none;
  }
  .where:hover {
    color: var(--accent);
  }
  .body {
    margin: 0;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
</style>
