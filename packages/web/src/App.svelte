<script lang="ts">
  import type { Action } from "@ait/contract/source-item";
  import type { SlackBoard } from "@ait/contract/slack";
  import Card from "./Card.svelte";

  async function get(path: string): Promise<SlackBoard> {
    const response = await fetch(path);
    const body = await response.json();
    if (!response.ok) throw new Error(body.error);
    return body;
  }

  /** A command, which answers with an acknowledgment rather than a board. */
  async function post(path: string, body: unknown): Promise<void> {
    const response = await fetch(path, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error((await response.json()).error);
  }

  let board = $state<SlackBoard | undefined>();
  let failure = $state<string | undefined>();

  /** Report the decision and show it as delegated, which is all the reply
   *  confirms: the card is the executor's now, and where it ends up is a
   *  change the page hears about separately. */
  async function decide(card_id: string, action: Action) {
    const card = board?.cards.find((c) => c.item.id === card_id);
    if (card) {
      card.state = "delegated";
      card.decision = action;
      card.annotation = null;
    }
    try {
      await post("/api/decision", { card_id, action });
    } catch (e) {
      // The anticipated state is now a guess about a request that failed.
      failure = e instanceof Error ? e.message : String(e);
      board = await get("/api/board");
    }
  }

  get("/api/board")
    .then((b) => (board = b))
    .catch((e) => (failure = e.message));

</script>

<main>
  {#if failure}
    <p class="note">{failure}</p>
  {/if}
  {#if !board}
    {#if !failure}<p class="note">loading…</p>{/if}
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
