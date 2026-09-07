<script lang="ts">
  import type { Reason, User } from "@ait/contract/slack";
  import { chipOf } from "./slack-reason.ts";

  let {
    reason,
    author,
    me,
  }: { reason: Reason; author: User; me: User } = $props();

  const chip = $derived(chipOf(reason.reason));

  // Usually the actor wrote the message and the header already names them. A
  // reaction or an invitation is the case where they differ, and there the
  // actor is the only place the other person appears. Never me: a reminder is
  // one I set, so naming myself as its actor says nothing.
  const actor = $derived(
    reason.actor && reason.actor.id !== author.id && reason.actor.id !== me.id
      ? reason.actor.display
      : null,
  );
</script>

<span class="chip {chip.tone}">
  {chip.label}{#if actor}<span class="actor">{actor}</span>{/if}
</span>

<style>
  .chip {
    font-family: var(--mono);
    font-size: 11px;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    padding: 1.5px 8px;
    border-radius: 999px;
    border: 1px solid var(--line);
    color: var(--muted);
    white-space: nowrap;
  }
  .direct {
    border-color: var(--accent);
    color: var(--accent);
    background: var(--accent-soft);
  }
  .dm {
    border-color: var(--dm);
    color: var(--dm);
    background: var(--dm-soft);
  }
  .group {
    border-color: var(--group);
    color: var(--group);
    background: var(--group-soft);
  }
  /* Somebody typed @channel on purpose, so it is a mention and takes a hue —
     but it named everybody rather than me, so it is never filled. */
  .broadcast {
    border-color: var(--broadcast);
    color: var(--broadcast);
  }
  .reaction {
    border-color: var(--muted);
    color: var(--ink);
  }
  .actor {
    text-transform: none;
    color: var(--ink);
  }
  .actor::before {
    content: " · ";
    color: var(--muted);
  }
</style>
