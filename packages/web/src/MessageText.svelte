<script lang="ts">
  import type { User } from "@ait/contract/slack";
  import { tokenize, type Token } from "@ait/contract/slack-markup";

  let {
    text,
    me,
    emoji,
    myGroups,
  }: {
    text: string;
    me: User;
    myGroups: string[];
    emoji: Record<string, string>;
  } = $props();

  /** How loudly a mention is drawn, on the same scale the reason chips use.
   *  Anything not addressed to me — a mention I wrote, a channel named in
   *  passing — is generic. */
  function tone(token: Token & { kind: "mention" }): string {
    if (token.target === "broadcast") return "broadcast";
    if (token.target === "group") {
      return myGroups.includes(token.groupId ?? "") ? "group" : "generic";
    }
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
  /* Still a chip, so it reads as a handle rather than as words — just without
     a hue, because it does not reach me. */
  .mention.generic {
    font-family: var(--mono);
    font-size: 0.85em;
    color: var(--muted);
    background: var(--btn-bg);
    border-radius: 4px;
    padding: 0 4px;
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
    background: var(--btn-bg);
    border-radius: 4px;
    padding: 0 4px;
  }
  a {
    color: var(--accent);
  }
  .emoji {
    height: 1.15em;
    vertical-align: -0.2em;
  }
</style>
