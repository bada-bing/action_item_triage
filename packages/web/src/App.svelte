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

  /** How long to wait before reaching for a server that went away. */
  const RECONNECT = 1000;

  let board = $state<SlackBoard | undefined>();
  let failure = $state<string | undefined>();

  /** Take the board whole, since an announcement says only that it changed. */
  async function pull() {
    try {
      board = await get("/api/board");
      failure = undefined;
    } catch (e) {
      failure = e instanceof Error ? e.message : String(e);
    }
  }

  /** Pull on opening as much as on an announcement: a socket that has just
   *  connected was deaf to whatever changed before it. */
  function listen() {
    const socket = new WebSocket(`ws://${location.host}/api/events`);
    socket.onopen = pull;
    socket.onmessage = pull;
    socket.onclose = () => {
      if (!board) failure = "no server";
      setTimeout(listen, RECONNECT);
    };
  }

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
      // The anticipated state was a guess about a request that failed.
      await pull();
      failure = e instanceof Error ? e.message : String(e);
    }
  }

  listen();

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
