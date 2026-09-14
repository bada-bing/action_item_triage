<script lang="ts">
  import type { Message, User } from "@ait/contract/slack";
  import MessageText from "./MessageText.svelte";
  import Reactions from "./Reactions.svelte";
  import { faceOf } from "./slack-user.ts";
  import { formatDate, formatTime } from "./slack-time.ts";

  let {
    history,
    subjectTs,
    inReplyTo,
    isThread,
    replyCount,
    ref,
    me,
    myGroups,
    emoji,
  }: {
    history: Message[];
    subjectTs: string;
    inReplyTo?: Message;
    isThread: boolean;
    replyCount: number;
    ref: string;
    me: User;
    myGroups: string[];
    emoji: Record<string, string>;
  } = $props();

  let open = $state(false);

  // A thread's true length is the reply count, and the transcript may hold only
  // its end — so the label says which of the two it is rather than counting
  // what happens to be here and calling that the thread.
  const held = $derived(history.length - 1);
  const missing = $derived(isThread ? Math.max(replyCount - held, 0) : 0);
  const label = $derived(
    !isThread
      ? `the exchange · ${history.length} messages`
      : missing
        ? `the newest ${held} of ${replyCount} replies`
        : `the whole thread · ${replyCount} replies`,
  );

  function dayOf(ts: string): string {
    return new Date(Number(ts) * 1000).toDateString();
  }
</script>

{#if inReplyTo && !open}
  <div class="antecedent">
    <!-- Only its time otherwise, which reads as the same day when a thread has
         been running for days. -->
    {#if dayOf(inReplyTo.ts) !== dayOf(subjectTs)}
      <p class="day">{formatDate(inReplyTo.ts)}</p>
    {/if}
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
    {#if missing}
      <p class="elided">
        {missing} earlier {missing === 1 ? "reply" : "replies"} not here —
        <a href={ref} target="_blank" rel="noreferrer">open in Slack</a>
      </p>
    {/if}
    {#each history as message, i (message.ts)}
      {#if i === 0 || dayOf(message.ts) !== dayOf(history[i - 1]!.ts)}
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
    <MessageText text={message.text} {me} {myGroups} {emoji} />
    {#if message.reactions.length}
      <Reactions reactions={message.reactions} {me} {emoji} />
    {/if}
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
  /* The message the card is about, so the eye can find it in a long thread:
     the same ground as the quote above, which is the same message. */
  .line.subject {
    box-shadow: inset 2px 0 0 var(--ink);
    background: var(--subject);
    color: var(--ink);
  }
  /* Said where the missing replies would be, rather than in the label alone. */
  .elided {
    margin: 0 0 2px;
    padding: 2px 6px 2px 10px;
    font-family: var(--mono);
    font-size: 11.5px;
    color: var(--muted);
  }
  .elided a {
    color: inherit;
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
