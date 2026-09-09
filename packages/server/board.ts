// A board is one card per item in the collector's run, plus what I decided
// about each. It lives only in memory: restarting ends the sitting, and an
// undisposed card comes back next time because its notification is still
// uncleared.

import type { ActionCard } from "@ait/contract/action-card";
import type { Action } from "@ait/contract/source-item";
import type { SlackItem, SlackRun } from "@ait/contract/slack";
import { createErrand } from "./executors/create-errand.ts";

/** What carries each action out. An action with no executor is refused rather
 *  than accepted and left half done. */
const executors: Record<
  string,
  (item: SlackItem, action: Action) => Promise<void>
> = {
  // Dismissing is the decision itself: nothing outside the board changes.
  dismiss: async () => {},
  "create-errand": createErrand,
};

export function openBoard(run: SlackRun) {
  const cards: ActionCard<SlackItem>[] = run.items.map((item) => ({
    item,
    state: "later",
    decision: null,
    annotation: null,
  }));

  /** If no card is `now`, make the first `later` one now. Items arrive newest
   *  first, so that is the one up, and running this after every change is what
   *  makes finishing or delegating advance the queue. */
  function ensureBoardHasNowCard(): void {
    if (cards.some((card) => card.state === "now")) return;
    const next = cards.find((card) => card.state === "later");
    if (next) next.state = "now";
  }

  ensureBoardHasNowCard();

  return {
    cards,

    /** The card waits while the action is carried out, then lands where the
     *  action says. Handing it back is my turn again, so it holds no decision. */
    async executeAction(id: string, action: Action): Promise<boolean> {
      // None of the three can be reached through the page: an unknown card or
      // action is a bug, and a card that is not mine has already been decided.
      const card = cards.find((c) => c.item.id === id);
      if (!card) {
        console.error(`no such card: ${id}`);
        return false;
      }
      if (card.state !== "now") {
        console.error(`card ${id} is ${card.state}, not now`);
        return false;
      }
      const execute = executors[action.name];
      if (!execute) {
        console.error(`unknown action: ${action.name}`);
        return false;
      }

      // A decision is a fresh attempt, so whatever the last one said is gone.
      card.state = "delegated";
      card.decision = action;
      card.annotation = null;
      ensureBoardHasNowCard();

      try {
        await execute(card.item, action);
      } catch (failure) {
        // Still an accepted decision, so the board goes back with the failure
        // on it.
        const why = failure instanceof Error ? failure.message : String(failure);
        console.error(`${action.name} failed on ${id}:`, failure);
        card.state = "now";
        card.decision = null;
        card.annotation = `${action.name} failed: ${why}`;
        return true;
      }

      card.state = action.resolves ? "done" : "now";
      card.decision = action.resolves ? action : null;
      card.annotation = null;
      ensureBoardHasNowCard();
      return true;
    },
  };
}
