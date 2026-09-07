<script lang="ts">
  import type { User } from "@ait/contract/slack";
  import { tokenize, type Token } from "./slack-markup.ts";

  let {
    text,
    me,
    emoji,
  }: { text: string; me: User; emoji: Record<string, string> } = $props();

  /** How loudly a mention is drawn, on the same scale the reason chips use.
   *  Anything not addressed to me — a mention I wrote, a channel named in
   *  passing — is generic. */
  function tone(token: Token & { kind: "mention" }): string {
    if (token.target === "group" || token.target === "broadcast") return token.target;
    return token.userId === me.id ? "me" : "generic";
  }
</script>

{#each tokenize(text) as token}
  {#if token.kind === "text"}{token.text}
  {:else if token.kind === "mention"}<span
      class="mention {tone(token)}">{token.label}</span>
  {:else if token.kind === "link"}<a href={token.href} target="_blank"
      rel="noreferrer">{token.label}</a>
  {:else if emoji[token.name]}<img class="emoji" src={emoji[token.name]}
      alt=":{token.name}:" />
  {:else}:{token.name}:{/if}
{/each}

<style>
  .mention.generic {
    font-family: var(--mono);
    font-size: 0.85em;
    color: var(--muted);
  }
  .mention.me {
    font-weight: 600;
    color: var(--accent);
    background: var(--accent-soft);
    border-radius: 4px;
    padding: 0 4px;
  }
  .mention.group {
    font-weight: 600;
    color: var(--group);
    background: var(--group-soft);
    border-radius: 4px;
    padding: 0 4px;
  }
  .mention.broadcast {
    font-weight: 600;
    color: var(--broadcast);
  }
  a {
    color: var(--accent);
  }
  .emoji {
    height: 1.15em;
    vertical-align: -0.2em;
  }
</style>
