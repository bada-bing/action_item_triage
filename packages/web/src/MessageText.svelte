<script lang="ts">
  import { tokenize } from "./slack-markup.ts";

  let { text, emoji }: { text: string; emoji: Record<string, string> } = $props();
</script>

{#each tokenize(text) as token}
  {#if token.kind === "text"}{token.text}
  {:else if token.kind === "mention"}<span class="mention">{token.label}</span>
  {:else if token.kind === "link"}<a href={token.href} target="_blank"
      rel="noreferrer">{token.label}</a>
  {:else if emoji[token.name]}<img class="emoji" src={emoji[token.name]}
      alt=":{token.name}:" />
  {:else}:{token.name}:{/if}
{/each}

<style>
  .mention {
    color: var(--accent);
    background: var(--accent-bg);
    border-radius: 3px;
    padding: 0 2px;
  }
  a {
    color: var(--accent);
  }
  .emoji {
    height: 1.15em;
    vertical-align: -0.2em;
  }
</style>
