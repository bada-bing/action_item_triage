<script lang="ts">
  import type { SlackBoard } from "@ait/contract/slack";
  import Card from "./Card.svelte";

  async function get(path: string): Promise<SlackBoard> {
    const response = await fetch(path);
    const body = await response.json();
    if (!response.ok) throw new Error(body.error);
    return body;
  }

  let board = $state<SlackBoard | undefined>();
  let failure = $state<string | undefined>();

  get("/api/board")
    .then((b) => (board = b))
    .catch((e) => (failure = e.message));

</script>

<main>
  {#if failure}
    <p class="note">{failure}</p>
  {:else if !board}
    <p class="note">loading…</p>
  {:else}
    {#each board.cards as card (card.item.id)}
      <Card
        {card}
        me={board.me}
        myGroups={board.my_user_groups}
        surface={board.surface}
        emoji={board.custom_emoji_map}
      />
    {/each}
  {/if}
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
