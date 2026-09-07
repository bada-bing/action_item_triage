<script lang="ts">
  import type { Me, Message, User } from "@ait/contract/slack";
  import MessageText from "./MessageText.svelte";
  import { faceOf } from "./slack-user.ts";
  import { formatDate, formatTime } from "./slack-time.ts";

  let {
    history,
    subjectTs,
    inReplyTo,
    isThread,
    replyCount,
    me,
    emoji,
  }: {
    history: Message[];
    subjectTs: string;
    inReplyTo?: Message;
    isThread: boolean;
    replyCount: number;
    me: Me;
    emoji: Record<string, string>;
  } = $props();

  let open = $state(false);

  // A thread's true length is the reply count; an exchange has only what was
  // walked back, so it counts what expanding actually shows.
  const label = $derived(
    isThread
      ? `the whole thread · ${replyCount} replies`
      : `the exchange · ${history.length} messages`,
  );

  function dayOf(ts: string): string {
    return new Date(Number(ts) * 1000).toDateString();
  }
</script>

{#if inReplyTo && !open}
  <div class="antecedent">
    {@render line(inReplyTo, true, true)}
  </div>
{/if}

<button
  class="toggle"
  aria-expanded={open}
  onclick={() => (open = !open)}
>
  {open ? "show less" : `show ${label}`}<span class="caret">▾</span>
</button>

{#if open}
  <div class="lines">
    {#each history as message, i (message.ts)}
      {#if i > 0 && dayOf(message.ts) !== dayOf(history[i - 1]!.ts)}
        <p class="day">{formatDate(message.ts)}</p>
      {/if}
      {@render line(message, message.ts === inReplyTo?.ts, false)}
    {/each}
  </div>
{/if}

{#snippet line(message: Message, answers: boolean, tagged: boolean)}
  <!-- The label only earns its place where the antecedent stands alone. In the
       transcript the sequence says it, and its edge marks it. -->
  {#if answers && tagged}<p class="tag">in reply to</p>{/if}
  <p
    class="line"
    class:answers
    class:subject={message.ts === subjectTs}
    class:mine={message.author.id === me.id}
  >
    {#if faceOf(message.author)}
      <img class="face" src={faceOf(message.author)} alt="" />
    {:else}
      <span class="face initials">{message.author.display.slice(0, 1)}</span>
    {/if}
    <span class="who">{message.author.id === me.id ? "You" : message.author.display}</span>
    <span class="time">{formatTime(message.ts)}</span>
    <MessageText text={message.text} {me} {emoji} />
  </p>
{/snippet}

<style>
  .toggle {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    font-family: var(--mono);
    font-size: 12px;
    font-weight: 500;
    color: var(--muted);
  }
  .toggle:hover {
    color: var(--ink);
  }
  .toggle[aria-expanded="true"] .caret {
    transform: rotate(180deg);
  }
  .caret {
    display: inline-block;
    transition: transform 0.15s;
  }
  /* On its own the antecedent takes no enclosing rule, so its edge lines up
     with the message it answers rather than sitting inside a second one. */
  .antecedent {
    margin: 6px 0;
  }
  .lines {
    border-left: 2px solid var(--line);
    padding-left: 10px;
    margin: 6px 0;
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  /* Every line carries the marker's indent, marked or not, so an edge never
     shifts the face it sits beside. */
  .line {
    margin: 0;
    padding: 2px 6px 2px 10px;
    border-radius: 4px;
    font-size: 12.5px;
    color: var(--muted);
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
  /* Inline, so a wrapped line runs back to the margin rather than indenting
     under the face. */
  .face {
    width: 22px;
    height: 22px;
    border-radius: 4px;
    vertical-align: -6px;
    margin-right: 6px;
  }
  /* Aligns like the image it stands in for, which inline-grid does not. */
  .initials {
    display: inline-block;
    text-align: center;
    line-height: 22px;
    background: var(--accent-soft);
    color: var(--accent);
    font-size: 11px;
  }
  .who {
    font-weight: 600;
    color: var(--ink);
    margin-right: 6px;
  }
  .time {
    margin-right: 6px;
  }
  /* The message the card is about keeps the strongest edge, in ink; the one it
     answers takes the accent, so the two markers cannot be confused. */
  .line.subject {
    box-shadow: inset 2px 0 0 var(--ink);
  }
  .line.answers {
    box-shadow: inset 2px 0 0 var(--accent);
  }
  .line.mine {
    background: var(--btn-bg);
    color: var(--ink);
  }
  /* Above the line rather than inside it, so every face in the transcript
     stays on the same margin. */
  .tag {
    margin: 0 0 1px;
    padding-left: 10px;
    font-family: var(--mono);
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--accent);
  }
  .day {
    margin: 6px 0 2px;
    font-family: var(--mono);
    font-size: 10px;
    letter-spacing: 0.05em;
    color: var(--muted);
  }
</style>
