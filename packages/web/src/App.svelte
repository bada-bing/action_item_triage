<script lang="ts">
  import type { SlackRun } from "@ait/contract/slack";
  import Card from "./Card.svelte";

  const run: Promise<SlackRun> = fetch("/api/run").then((r) =>
    r.ok ? r.json() : r.json().then((e) => Promise.reject(new Error(e.error))),
  );
</script>

<main>
  {#await run}
    <p class="note">loading…</p>
  {:then run}
    {#each run.items as item (item.id)}
      <Card {item} emoji={run.custom_emoji_map} />
    {/each}
  {:catch error}
    <p class="note">{error.message}</p>
  {/await}
</main>

<style>
  :global(:root) {
    --bg: #fbfbfa;
    --card: #fff;
    --line: #e3e2df;
    --text: #22201d;
    --dim: #8a8781;
    --accent: #3d6fd6;
    --accent-bg: #eaf0fc;
  }
  @media (prefers-color-scheme: dark) {
    :global(:root) {
      --bg: #1a1917;
      --card: #232120;
      --line: #35322f;
      --text: #e8e6e2;
      --dim: #918d87;
      --accent: #86a9ee;
      --accent-bg: #2a3346;
    }
  }
  :global(body) {
    margin: 0;
    background: var(--bg);
    color: var(--text);
    font: 15px/1.5 ui-sans-serif, system-ui, sans-serif;
  }
  main {
    max-width: 720px;
    margin: 0 auto;
    padding: 2rem 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  .note {
    color: var(--dim);
    font-size: 0.85rem;
    margin: 0;
  }
</style>
