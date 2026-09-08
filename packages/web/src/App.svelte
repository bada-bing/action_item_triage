<script lang="ts">
  import type { Action } from "@ait/contract/source-item";
  import type { SlackBoard } from "@ait/contract/slack";
  import Card from "./Card.svelte";

  async function get(path: string, init?: RequestInit): Promise<SlackBoard> {
    const response = await fetch(path, init);
    const body = await response.json();
    if (!response.ok) throw new Error(body.error);
    return body;
  }

  let board = $state<SlackBoard | undefined>();

  /** Report the decision; the server returns the board it produced. */
  async function decide(card_id: string, action: Action) {
    board = await get("/api/decision", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ card_id, action }),
    });
  }
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
        {decide}
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
