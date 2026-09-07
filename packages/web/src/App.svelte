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
      <Card {item} me={run.me} surface={run.surface} emoji={run.custom_emoji_map} />
    {/each}
  {:catch error}
    <p class="note">{error.message}</p>
  {/await}
</main>

<style>
  main {
    max-width: 780px;
    margin: 0 auto;
    padding: 2rem 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  .note {
    color: var(--muted);
    font-size: 0.85rem;
    margin: 0;
  }
</style>
